# M1 · Step 04 of 10 — The `SpotifyAuth` service: authorize, exchange, refresh
> Nav: [← Environment auth config](03_environment-auth-config.md) · [Overview](00_overview.md) · [The login page →](05_login-page.md)

## Glossary for this step
> **authorization code** — the short-lived code Spotify puts in the `?code=` callback query; you swap it (plus
> the verifier) for tokens. See the
> [Spotify PKCE tutorial](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow).
> **access token / refresh token** — the access token authorizes API calls (~1 h); the refresh token mints new
> access tokens without re-login.
> **in-flight de-dupe** — memoizing one running `Promise` so N concurrent callers share a single network call.
> **`effect()`** — an Angular API that re-runs a side-effect whenever the signals it reads change; here it
> re-arms the proactive-refresh timer on every token change. See [glossary](../foundation/glossary.md).

## Why / design
`SpotifyAuth` is the orchestrator of the whole flow. It has four jobs:

1. **`beginLogin()`** — invent a fresh verifier + `state`, stash them in `sessionStorage`, then redirect the
   browser to Spotify's authorize URL carrying the **challenge** (never the verifier).
2. **`buildAuthorizeUrl()`** — assemble that URL from `environment.spotify` (response_type=code,
   `code_challenge_method=S256`, the challenge, the state, the space-joined scopes).
3. **`exchangeCode()`** — POST the `?code` + the stashed verifier to the token endpoint, get tokens, persist.
4. **`refresh()`** — swap the refresh token for a fresh access token, **de-duped** so concurrent 401s cause one
   refresh.

Two subtleties are the heart of this file:

> 📚 **New concept — verifier in `sessionStorage`, not the URL.** `beginLogin` writes the verifier and state to
> **`sessionStorage`** (keys `evm.spotify.pkce_verifier` / `evm.spotify.auth_state`) *before* redirecting. Only
> the *challenge* (the hash) and the *state* travel to Spotify. When the browser returns to `/callback`, the
> callback page reads the verifier back out to complete the exchange. `sessionStorage` (not `localStorage`) is
> deliberate: it's scoped to the tab and cleared when the tab closes, so a half-finished login can't leak
> across sessions. Those two keys are **load-bearing** — the callback reads the exact same strings.

> 📚 **New concept — one refresh for many callers (in-flight de-dupe).** When an access token expires, a burst
> of API calls can all 401 at once. If each triggered its own refresh, you'd fire N refreshes and thrash
> Spotify. Instead `refresh()` memoizes the running promise: `this.refreshInFlight ??= requestRefresh().finally(
> () => (this.refreshInFlight = null))`. The `??=` assigns only if it's currently `null`, so the **first**
> caller starts the refresh and every caller during that window awaits the **same** promise; `.finally` clears
> the slot so the next expiry can refresh again. Hold this model — the interceptor (step 08) relies on it.

The **proactive-refresh timer** is a nicety ported from the source: an `effect()` re-arms a `setTimeout` on
every token change to refresh ~60 s *before* expiry, so the app rarely has to fall back on a reactive 401.
`PROACTIVE_REFRESH_SKEW_MS` (60 s) is deliberately larger than the token store's 30 s expiry skew. A failed
proactive refresh is swallowed — the reactive 401 path (step 08) still covers it.

The `SpotifyTokenDto → SpotifyTokens` mapper (`toSpotifyTokens`) converts Spotify's snake_case payload
(`access_token`, `expires_in`) to our domain shape and turns the relative `expires_in` (seconds) into an
absolute `expiresAt` (epoch ms). On **refresh**, Spotify may omit a fresh refresh token — we keep the existing
one (`refresh_token: dto.refresh_token ?? refreshToken`). Recurring model: **DTO at the network edge, domain
everywhere else.**

## Do this
This step creates **one file**: `src/app/core/auth/spotify-auth.ts`.

1. In `src/app/core/auth/`, create **`spotify-auth.ts`** and paste the code below.
2. Inject `HttpClient` and `TokenStore` with `inject()` (mandatory house style — no constructor injection).
3. The constructor's only job is `effect(() => this.scheduleProactiveRefresh(this.tokenStore.tokens()))` — the
   effect reads the `tokens` signal, so it re-arms whenever tokens change.
4. Token requests are **form-encoded** (`application/x-www-form-urlencoded`), not JSON — that's what Spotify's
   token endpoint expects. `FORM_HEADERS` sets it; keep it.
5. `isConfigured` is `true` when a client id is present — the login page reads it to enable its button.

## Code
### `src/app/core/auth/spotify-auth.ts`
```ts
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { effect, inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { challengeFromVerifier, generateCodeVerifier, generateState } from './pkce';
import { SpotifyTokens, TokenStore } from './token-store';

const VERIFIER_KEY = 'evm.spotify.pkce_verifier';
const STATE_KEY = 'evm.spotify.auth_state';

const FORM_HEADERS = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

/**
 * Refresh this long before the access token expires, so a fresh one is in hand before any call needs
 * it (and before {@link TokenStore.isAuthenticated} flips). Larger than that store's 30s expiry skew.
 */
const PROACTIVE_REFRESH_SKEW_MS = 60_000;

export interface PkceSession {
  verifier: string;
  state: string;
}

/** Raw Spotify token endpoint payload. */
interface SpotifyTokenDto {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

@Injectable({ providedIn: 'root' })
export class SpotifyAuth {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(TokenStore);

  /** Shared so concurrent 401s trigger a single refresh, not one per request. */
  private refreshInFlight: Promise<string> | null = null;
  /** Pending proactive-refresh timer, re-armed on every token change. */
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isConfigured = environment.spotify.clientId.length > 0;

  constructor() {
    // Pre-empt expiry: whenever the token changes, arm a timer to refresh it just before it lapses,
    // so the player poll and any API call always have a live token instead of relying on a 401 to
    // trigger a lazy refresh (which would stall the next request and, on idle, never fire at all).
    effect(() => this.scheduleProactiveRefresh(this.tokenStore.tokens()));
  }

  /** Begin login: stash a fresh PKCE verifier + state, then redirect to Spotify. */
  async beginLogin(): Promise<void> {
    const verifier = generateCodeVerifier();
    const state = generateState();
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);

    const challenge = await challengeFromVerifier(verifier);
    window.location.assign(this.buildAuthorizeUrl(challenge, state));
  }

  buildAuthorizeUrl(codeChallenge: string, state: string): string {
    const { authorizeUrl, clientId, redirectUri, scopes } = environment.spotify;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state,
      scope: scopes.join(' '),
    });
    return `${authorizeUrl}?${params.toString()}`;
  }

  consumePkceSession(): PkceSession | null {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    const state = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    return verifier !== null && state !== null ? { verifier, state } : null;
  }

  /** Exchange the authorization code for tokens and persist them. Throws on failure. */
  async exchangeCode(code: string, verifier: string): Promise<void> {
    const { tokenUrl, clientId, redirectUri } = environment.spotify;
    const body = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', redirectUri)
      .set('client_id', clientId)
      .set('code_verifier', verifier);

    const dto = await firstValueFrom(
      this.http.post<SpotifyTokenDto>(tokenUrl, body.toString(), { headers: FORM_HEADERS }),
    );
    this.tokenStore.set(toSpotifyTokens(dto));
  }

  /** Refresh the access token, returning the new one. De-duped across callers. */
  refresh(): Promise<string> {
    this.refreshInFlight ??= this.requestRefresh().finally(() => (this.refreshInFlight = null));
    return this.refreshInFlight;
  }

  logout(): void {
    this.tokenStore.clear();
  }

  /**
   * (Re)arm the single proactive-refresh timer for the current token. Cleared and re-scheduled on
   * every token change; a failed proactive refresh is swallowed — the reactive 401 path still covers
   * it. An already-(near-)expired token refreshes immediately (clamped to 0).
   */
  private scheduleProactiveRefresh(tokens: SpotifyTokens | null): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (tokens === null || tokens.refreshToken === null) {
      return;
    }
    const delay = Math.max(0, tokens.expiresAt - PROACTIVE_REFRESH_SKEW_MS - Date.now());
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      void this.refresh().catch(() => undefined);
    }, delay);
  }

  private async requestRefresh(): Promise<string> {
    const refreshToken = this.tokenStore.refreshToken();
    if (refreshToken === null) {
      throw new Error('No refresh token available.');
    }

    const { tokenUrl, clientId } = environment.spotify;
    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
      .set('client_id', clientId);

    const dto = await firstValueFrom(
      this.http.post<SpotifyTokenDto>(tokenUrl, body.toString(), { headers: FORM_HEADERS }),
    );
    // Spotify may omit a fresh refresh token on refresh — keep the existing one if so.
    const tokens = toSpotifyTokens({ ...dto, refresh_token: dto.refresh_token ?? refreshToken });
    this.tokenStore.set(tokens);
    return tokens.accessToken;
  }
}

function toSpotifyTokens(dto: SpotifyTokenDto): SpotifyTokens {
  return {
    accessToken: dto.access_token,
    refreshToken: dto.refresh_token ?? null,
    expiresAt: Date.now() + dto.expires_in * 1000,
  };
}
```

## Done when (this step)
- [ ] `npm run build` compiles with `spotify-auth.ts` present → **no TypeScript errors**.

> **Why the gate is build-only:** this step only *defines* the auth service — nothing calls it yet, so there's
> no runtime behavior to observe. Its first real workout is the **next step**, when the login page's button
> drives `beginLogin()` and bounces you to Spotify. Build-clean (imports resolve, types check) is all you can
> assert here.

## If it breaks
- **`NG0203: inject() must be called from an injection context`** → you called `inject()` in a method instead
  of a field initializer/constructor. Keep `http`/`tokenStore` as field initializers.
- **Token POST returns 400 `invalid_grant`** → the `code_verifier` sent to `exchangeCode` doesn't match the
  challenge Spotify stored (wrong/expired verifier), or `redirect_uri` here differs from the one used at
  authorize. Both must match the authorize step exactly.
- **Token POST returns 415 / "unsupported content type"** → you dropped `FORM_HEADERS`; the token endpoint
  needs `application/x-www-form-urlencoded`, and the body must be `body.toString()`, not the `HttpParams`
  object.

---
> Nav: [← Environment auth config](03_environment-auth-config.md) · [Overview](00_overview.md) · [The login page →](05_login-page.md)
