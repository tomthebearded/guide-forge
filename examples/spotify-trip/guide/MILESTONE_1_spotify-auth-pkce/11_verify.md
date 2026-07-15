# M1 · Verify — Spotify login (PKCE)
> Nav: [← Header: Log out](10_header-logout.md) · [Overview](00_overview.md) · [M2 — HTTP resilience layer →](../MILESTONE_2_http-resilience/00_overview.md)

## Done-when gate (the real test — check every box by hand)
Serve with `npm start` (`ng serve --host 127.0.0.1 --port 4200`) and use `http://127.0.0.1:4200`.

- [ ] **Authorize redirect** — on `/login`, click **Log in with Spotify** → the browser navigates to
  `https://accounts.spotify.com/authorize?...`; the query string contains `response_type=code`,
  `code_challenge_method=S256`, a `code_challenge`, a `state`, and your `client_id`.
- [ ] **Round-trip to `/globe`** — approve on Spotify → you return to `http://127.0.0.1:4200/callback?code=…&state=…`,
  see "Finishing sign-in…" briefly, then land on `/globe` (M0 placeholder), URL `/globe`.
- [ ] **Tokens persisted** — devtools → Application → Local Storage → key **`evm.spotify.tokens`** exists; its
  JSON has a non-empty `accessToken`, a `refreshToken` string, and a numeric `expiresAt`.
- [ ] **Reload stays logged in** — refresh `/globe` → no bounce; you remain on `/globe`.
- [ ] **Guard blocks logged-out** — delete `evm.spotify.tokens`, reload, visit `/globe` → URL redirects to
  `/login`.
- [ ] **Logout** — logged in, click **Log out** in the header → `evm.spotify.tokens` is removed and URL becomes
  `/login`; the Log out button disappears.
- [ ] **Denied consent** — start login and click *Cancel* on Spotify → back on `/login` with an error toast.
- [ ] **Tooling clean** — `npm run format:check`, `npm run lint`, `npm run build` all pass with no errors.

## Files after this milestone (complete — the checkpoint)

### `src/app/core/auth/pkce.ts`
```ts
const VERIFIER_BYTES = 64;
const STATE_BYTES = 16;

export function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(VERIFIER_BYTES)));
}

export function generateState(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(STATE_BYTES)));
}

export async function challengeFromVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
```

### `src/app/core/auth/token-store.ts`
```ts
import { computed, Injectable, signal } from '@angular/core';

/** Spotify OAuth tokens as held in memory + persisted across reloads. */
export interface SpotifyTokens {
  accessToken: string;
  /** Spotify returns a refresh token with PKCE; null until the first exchange. */
  refreshToken: string | null;
  /** Absolute expiry as epoch milliseconds (derived from `expires_in`). */
  expiresAt: number;
}

const STORAGE_KEY = 'evm.spotify.tokens';
/** Treat tokens expiring within this window as already stale, to pre-empt 401s. */
const EXPIRY_SKEW_MS = 30_000;

/**
 * Single source of truth for Spotify auth tokens. Hydrates from localStorage on
 * construction and re-persists on every change so a page reload stays logged in.
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly _tokens = signal<SpotifyTokens | null>(load());

  readonly tokens = this._tokens.asReadonly();
  readonly accessToken = computed(() => this._tokens()?.accessToken ?? null);
  readonly refreshToken = computed(() => this._tokens()?.refreshToken ?? null);

  /**
   * True only when a token exists and has not (nearly) expired. NOTE: this reads `Date.now()`, which
   * is not a signal — the computed only re-evaluates when `_tokens` changes, so its value reflects
   * expiry as of the last token mutation, not the passage of time. Treat it as a point-in-time check
   * (login/refresh/guard admission), never as a continuously-accurate "is the token live right now".
   * For "should this feature run while a session lasts", prefer {@link hasSession} + lazy refresh.
   */
  readonly isAuthenticated = computed(() => {
    const tokens = this._tokens();
    return tokens !== null && tokens.expiresAt - EXPIRY_SKEW_MS > Date.now();
  });

  /**
   * True while a session exists at all — even with an expired access token the interceptor can still
   * refresh it lazily. Mirrors the route guard's admission check, so the header shows the app chrome
   * (player, view switch, links) whenever you're allowed onto a protected page, instead of looking
   * logged out the moment the access token lapses.
   */
  readonly hasSession = computed(() => this._tokens() !== null);

  set(tokens: SpotifyTokens): void {
    this._tokens.set(tokens);
    persist(tokens);
  }

  clear(): void {
    this._tokens.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function load(): SpotifyTokens | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSpotifyTokens(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persist(tokens: SpotifyTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function isSpotifyTokens(value: unknown): value is SpotifyTokens {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['accessToken'] === 'string' &&
    (candidate['refreshToken'] === null || typeof candidate['refreshToken'] === 'string') &&
    typeof candidate['expiresAt'] === 'number'
  );
}
```

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

### `src/app/core/auth/auth-interceptor.ts`
```ts
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Toast } from '../../shared/toast';
import { SpotifyAuth } from './spotify-auth';
import { TokenStore } from './token-store';

/**
 * Attaches the Spotify bearer token to Spotify API requests and, on a 401, refreshes
 * the token once and retries. A failed refresh logs the user out and routes to /login.
 * Only Spotify API calls are touched — Wikidata / MusicBrainz pass through untouched.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.spotify.apiBaseUrl)) {
    return next(req);
  }

  const tokenStore = inject(TokenStore);
  const auth = inject(SpotifyAuth);
  const router = inject(Router);
  const toast = inject(Toast);

  const token = tokenStore.accessToken();
  const authReq = token !== null ? withBearer(req, token) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const refreshable =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        tokenStore.refreshToken() !== null;
      if (!refreshable) {
        return throwError(() => error);
      }

      return from(auth.refresh()).pipe(
        switchMap((fresh) => next(withBearer(req, fresh))),
        catchError((refreshError: unknown) => {
          // Concurrent 401s share one refresh; only the first failure should log out + toast, else
          // the others stack duplicate "session expired" toasts. logout() clears the refresh token,
          // so guarding on it makes the reaction run exactly once.
          if (tokenStore.refreshToken() !== null) {
            auth.logout();
            toast.error('Your session expired. Please log in again.');
            void router.navigate(['/login']);
          }
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
```

### `src/app/core/auth/auth-guard.ts`
```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { TokenStore } from './token-store';

/**
 * Guards routes that need Spotify auth. Allows access when a usable token exists, or when
 * a refresh token is present (the interceptor will refresh lazily); otherwise → /login.
 */
export const authGuard: CanActivateFn = () => {
  const tokenStore = inject(TokenStore);
  const router = inject(Router);

  if (tokenStore.isAuthenticated() || tokenStore.refreshToken() !== null) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

### `src/app/shared/toast.ts`
```ts
import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { firstValueFrom, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  error(message: string): void {
    this.open(message, { duration: 6000, panelClass: 'toast-error' });
  }

  info(message: string): void {
    this.open(message, { duration: 4000 });
  }

  /**
   * Show a message with an action button (e.g. "Undo"). Resolves `true` if the action was clicked
   * before the toast auto-dismissed, `false` otherwise.
   */
  async action(message: string, actionLabel: string, durationMs = 7000): Promise<boolean> {
    const ref = this.snackBar.open(message, actionLabel, {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: durationMs,
    });
    return firstValueFrom(ref.onAction().pipe(map(() => true)), { defaultValue: false });
  }

  private open(message: string, config: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Dismiss', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      ...config,
    });
  }
}
```

### `src/app/features/auth/login-page/login-page.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SpotifyAuth } from '../../../core/auth/spotify-auth';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  protected readonly auth = inject(SpotifyAuth);

  protected login(): void {
    void this.auth.beginLogin();
  }
}
```

### `src/app/features/auth/login-page/login-page.html`
```html
<section class="page">
  <h1 class="title">EarthViewMusic</h1>
  <p class="tagline">See where your favourite music comes from, lit up across the globe.</p>

  <button mat-flat-button class="login-btn" [disabled]="!auth.isConfigured" (click)="login()">
    <mat-icon>public</mat-icon>
    Log in with Spotify
  </button>

  @if (!auth.isConfigured) {
    <p class="hint">
      Set your Spotify Client ID in <code>environment.development.ts</code> to enable login.
    </p>
  }
</section>
```

### `src/app/features/auth/login-page/login-page.scss`
```scss
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 70vh;
  padding: 2rem;
  text-align: center;
}

.title {
  margin: 0;
  font-size: clamp(2.5rem, 6vw, 4rem);
  letter-spacing: 0.04em;
  color: var(--neon-teal);
  text-shadow: var(--glow-shadow);
}

.tagline {
  margin: 0;
  max-width: 32rem;
  color: var(--mat-sys-on-surface-variant);
}

.login-btn {
  margin-top: 1rem;
  box-shadow: var(--glow-shadow);
}

.hint {
  margin: 0;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}
```

### `src/app/features/auth/callback-page/callback-page.ts`
```ts
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

import { SpotifyAuth } from '../../../core/auth/spotify-auth';
import { Toast } from '../../../shared/toast';

@Component({
  selector: 'app-callback-page',
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './callback-page.html',
  styleUrl: './callback-page.scss',
})
export class CallbackPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(SpotifyAuth);
  private readonly toast = inject(Toast);

  ngOnInit(): void {
    void this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const denied = params.get('error');
    const code = params.get('code');
    const state = params.get('state');
    const session = this.auth.consumePkceSession();

    if (denied !== null) {
      return this.fail(`Spotify denied the request: ${denied}.`);
    }
    if (code === null || state === null) {
      return this.fail('The callback is missing its authorization code.');
    }
    if (session === null) {
      return this.fail('Your login session expired. Please try again.');
    }
    if (state !== session.state) {
      return this.fail('Sign-in could not be verified. Please try again.');
    }

    try {
      await this.auth.exchangeCode(code, session.verifier);
      await this.router.navigate(['/globe']);
    } catch {
      await this.fail('Could not complete sign-in with Spotify. Please try again.');
    }
  }

  private async fail(message: string): Promise<void> {
    this.toast.error(message);
    await this.router.navigate(['/login']);
  }
}
```

### `src/app/features/auth/callback-page/callback-page.html`
```html
<section class="page">
  <mat-progress-spinner mode="indeterminate" [diameter]="48" />
  <p class="message">Finishing sign-in…</p>
</section>
```

### `src/app/features/auth/callback-page/callback-page.scss`
```scss
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 70vh;
  padding: 2rem;
  text-align: center;
}

.message {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
}
```

### `src/environments/environment.development.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: false,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'http://127.0.0.1:4200/callback', // Spotify forbids `localhost`; loopback IP is allowed
    scopes: [
      'user-read-private',
      'user-top-read',
      'user-follow-read',
      'user-follow-modify',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBaseUrl: 'https://api.spotify.com/v1',
    // grows in M2: a `rateLimit` block for the adaptive gate.
  },
  // grows in M2/M5: `musicbrainz`, `wikidata`, `restCountries` host config.
};
```

### `src/environments/environment.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: true,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'https://REPLACE_WITH_DEPLOYED_HOST/callback', // deployment is out of scope for this guide
    scopes: [
      'user-read-private',
      'user-top-read',
      'user-follow-read',
      'user-follow-modify',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBaseUrl: 'https://api.spotify.com/v1',
    // grows in M2: a `rateLimit` block for the adaptive gate.
  },
  // grows in M2/M5: `musicbrainz`, `wikidata`, `restCountries` host config.
};
```

### `src/app/app.config.ts`
```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // authInterceptor attaches the bearer to Spotify API calls and does the 401 refresh-and-retry.
    // The rate-limit interceptor joins this array in M2 (order: auth outer, rate-limit inner).
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

### `src/app/app.routes.ts`
```ts
import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'globe' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./features/auth/callback-page/callback-page').then((m) => m.CallbackPage),
  },
  {
    path: 'globe',
    canActivate: [authGuard],
    loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
  },
  { path: '**', redirectTo: 'globe' },
];
```

### `src/app/shared/components/header/header.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

import { SpotifyAuth } from '../../../core/auth/spotify-auth';
import { TokenStore } from '../../../core/auth/token-store';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatToolbarModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(SpotifyAuth);
  private readonly router = inject(Router);

  /** A session exists (matching the route guard) — drives whether the app chrome shows. */
  protected readonly hasSession = inject(TokenStore).hasSession;

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
```

### `src/app/shared/components/header/header.html`
```html
<mat-toolbar class="header">
  <a class="brand" routerLink="/globe">EarthViewMusic</a>
  <span class="spacer"></span>
  @if (hasSession()) {
    <button mat-button (click)="logout()">Log out</button>
  }
</mat-toolbar>
```

### `src/app/shared/components/header/header.scss`
```scss
.header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand {
  color: var(--neon-teal);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-decoration: none;
}

.spacer {
  flex: 1 1 auto;
}
```

## What you have now (cumulative)
A zoneless Angular 21 app (Material 3 "Deep Space Teal") that serves on `http://127.0.0.1:4200` with a working
**Spotify OAuth PKCE login**: click Log in → authorize on Spotify → land logged-in on a guarded `/globe`;
tokens persist in `localStorage` (`evm.spotify.tokens`) so a reload stays logged in; `/globe` redirects to
`/login` when logged out; a header **Log out** clears tokens and returns to `/login`. The `authInterceptor`
attaches the bearer to Spotify API calls and does a one-shot 401 refresh-and-retry (its full workout comes in
M2). No data is fetched yet, and requests are unpaced — that's next.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| `INVALID_CLIENT` / "Invalid redirect URI" on Spotify's page | Dashboard redirect URI ≠ `http://127.0.0.1:4200/callback`, or you used `localhost`. Register the exact loopback URI and serve on `127.0.0.1`. |
| Login button disabled + "Set your Spotify Client ID" hint | `spotify-client-id.ts` missing/empty → copy `spotify-client-id.example.ts`, paste your dashboard Client ID. |
| Callback always toasts "Your login session expired" | `sessionStorage` verifier gone — you finished login in a different tab than you started. Start & finish in the same tab. |
| Token POST 400 `invalid_grant` | `code_verifier`/`redirect_uri` at exchange ≠ what authorize used. Both must match exactly (steps 03–04). |
| Token POST 415 / unsupported content type | Dropped `FORM_HEADERS` or sent `HttpParams` instead of `body.toString()` — the token endpoint needs form encoding. |
| `crypto.subtle is undefined` | Not a secure context — serve on `127.0.0.1` (or `https`), never a bare LAN IP. |
| Reload logs you out | `evm.spotify.tokens` not persisted (key drift) or `set()` not calling `persist()`. |
| `/globe` never redirects when logged out | `canActivate: [authGuard]` not on the `globe` route. |
| `403` when Spotify login says the user isn't allowed | Dev-Mode app: add your account under Users & Access in the dashboard (25-user cap). |
| Duplicate "session expired" toasts | Missing `refreshToken() !== null` guard in the interceptor's inner `catchError`. |

## Next
Continue to **[M2 — HTTP resilience layer](../MILESTONE_2_http-resilience/00_overview.md)** — an adaptive AIMD
rate-limit interceptor + `withRetry`, proving a paced, retried authenticated `/me` call surfaces *"You have N
liked songs"* on the globe placeholder.
