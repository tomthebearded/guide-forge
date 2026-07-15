# M1 · Step 02 of 10 — The token store: signals + `localStorage`
> Nav: [← PKCE primitives](01_pkce-primitives.md) · [Overview](00_overview.md) · [Environment auth config →](03_environment-auth-config.md)

## Glossary for this step
> **signal** — Angular's reactive state primitive: a getter you *call* (`tokens()`) that tracks who reads it
> and notifies them on write. See [glossary](../foundation/glossary.md).
> **computed** — a derived, read-only signal that recalculates when the signals it reads change.
> **zoneless change detection** — this app runs with no `zone.js`; Angular repaints only when a signal a
> template reads changes, so **state must live in signals** to be reactive. See
> [glossary](../foundation/glossary.md).

## Why / design
`TokenStore` is the app's **single source of truth for auth tokens** and the first real *store* you build. It
follows a pattern every `evm.*` cache reuses later:

> 📚 **New concept — the persisted-signal store.** State is held in a **`signal`**; on construction the store
> **hydrates** from `localStorage`, and on every change it **re-persists**. Because reads go through signals,
> any template or `computed` that reads a token repaints automatically under zoneless CD — and because writes
> hit `localStorage`, a full page reload restores the same state. The load path **validates** with a type
> guard (`isSpotifyTokens`) and falls back to `null` on anything malformed, so a corrupt or stale storage
> value can never crash boot. Signals docs: [angular.dev/guide/signals](https://angular.dev/guide/signals).

The recurring mental model: **signals are the live state; `localStorage` is the durable mirror; validate on the
way in.** You'll see it again for `evm.likedIndex`, `evm.appearance`, and friends.

Two derived flags matter for later steps and deserve care:
- **`isAuthenticated`** — a *point-in-time* check. It reads `Date.now()`, which is **not** a signal, so the
  `computed` only re-evaluates when `_tokens` changes — its value reflects expiry *as of the last token
  mutation*, not the passing of time. Use it for admission checks (guard, login), never as a live "is the
  token valid this instant" flag.
- **`hasSession`** — true whenever *any* token exists, even an expired access token (the interceptor can still
  refresh it lazily). The guard admits on `hasSession`-style logic; the header shows app chrome based on it.

The storage key **`evm.spotify.tokens`** is **load-bearing** — it must match exactly across every step and
milestone (it's how a reload finds your tokens). `EXPIRY_SKEW_MS` (30 s) treats a near-expiry token as already
stale, to pre-empt 401s.

## Do this
This step creates **one file**: `src/app/core/auth/token-store.ts`.

1. In `src/app/core/auth/`, create **`token-store.ts`** and paste the code below.
2. `@Injectable({ providedIn: 'root' })` makes it a **root singleton** — one instance for the whole app
   (mandatory: every consumer must share the same tokens).
3. Expose **readonly** signals only (`tokens`, `accessToken`, `refreshToken`, `isAuthenticated`, `hasSession`);
   mutation goes through `set()` / `clear()`. Keep `_tokens` private.
4. `set()` writes the signal **and** persists; `clear()` resets the signal **and** removes the key. Both
   halves are mandatory — drop the persist and a reload logs you out; drop the signal write and the UI won't
   react.
5. Leave `STORAGE_KEY`, `EXPIRY_SKEW_MS`, and the `isSpotifyTokens` guard exactly as shown.

## Code
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

## Done when (this step)
- [ ] `npm run build` compiles with `token-store.ts` present → **no TypeScript errors**.
- [ ] In devtools console with no token yet: `localStorage.getItem('evm.spotify.tokens')` → **`null`**
  (nothing is stored until the first exchange in step 07).

## If it breaks
- **Lint error: property accessed via string index (`candidate['accessToken']`)** → that bracket form is
  intentional under `noPropertyAccessFromIndexSignature`; keep the brackets, don't switch to dot access.
- **Type error `Property 'asReadonly' does not exist`** → you typed `signal(...)` without the generic or
  imported the wrong `signal`; import `computed, Injectable, signal` from `@angular/core`.
- **Reload logs you out even after a token is stored** → `set()` isn't calling `persist()`, or the key string
  drifted from `evm.spotify.tokens`. The key must match exactly.
