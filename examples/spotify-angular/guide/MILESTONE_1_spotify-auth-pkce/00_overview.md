# Milestone 1 — Spotify login (PKCE)
> Core · milestone 1 of 12 · prev: [Scaffold & tooling](../MILESTONE_0_scaffold/00_overview.md) · next: [HTTP resilience layer](../MILESTONE_2_http-resilience/00_overview.md)

## Goal
Click **"Log in with Spotify"**, authorize on Spotify's own page, get bounced back to `/callback`, and land
**logged-in on a protected `/globe`**. This milestone implements OAuth **Authorization Code + PKCE** end to
end, entirely in the browser with **no client secret**:

- `core/auth/pkce.ts` — the PKCE crypto primitives (code verifier, SHA-256 code challenge, `state`, all
  base64url-encoded).
- `core/auth/token-store.ts` — the single source of truth for tokens: signals + `localStorage` (key
  `evm.spotify.tokens`), hydrated on construction so a reload stays logged in.
- `core/auth/spotify-auth.ts` — `beginLogin` / `buildAuthorizeUrl` / `exchangeCode` / `refresh` (with
  in-flight de-dupe + a proactive-refresh timer).
- `core/auth/auth-interceptor.ts` — a functional HTTP interceptor that attaches the bearer to **Spotify API
  calls only** and, on a `401`, refreshes once and retries; a failed refresh logs out, toasts, and routes to
  `/login`.
- `core/auth/auth-guard.ts` — a `CanActivateFn` protecting `/globe`.
- `features/auth/login-page` + `features/auth/callback-page` — the two screens of the round-trip.
- Wiring: `authInterceptor` into `app.config.ts`; the `callback` route + `authGuard` on `/globe` in
  `app.routes.ts`; a session-aware **Log out** button in the header.

## Scope discipline
This milestone does **not**:
- **Fetch any Spotify data** beyond the token exchange itself — no `/me`, no Liked Songs. (Data streaming is
  **M3**.)
- **Pace or retry requests** — auth endpoints pass through unpaced; the adaptive **rate-limit interceptor** and
  `withRetry` are **M2**. `app.config.ts` gets `authInterceptor` only.
- **Render the globe** — `/globe` stays M0's placeholder page; three.js is **M4**.
- **Add the `bootSync` guard or the library/actions routes** — those arrive in later milestones. `/globe` gets
  `authGuard` only.

If a step here tempts you to page data, add a second interceptor, or draw anything on the globe, stop — that
belongs to a later rung.

## Prerequisite
**M0 complete and its gate green:** the zoneless Angular 21 shell serves on `http://127.0.0.1:4200` with the
Material 3 "Deep Space Teal" theme; `/login` and `/globe` route to placeholder pages; `environment.ts` /
`environment.development.ts` + the gitignored `spotify-client-id.ts` exist; `npm run format:check`, `npm run
lint`, and `npm run build` are clean. You also need a **Spotify app registered** per the README, with the
redirect URI `http://127.0.0.1:4200/callback` added in the dashboard, and your own account added as a user
(Dev-Mode apps are capped at 25 manually-allowlisted users — see `foundation/stack.md`).

## Steps at a glance

**Sitting 1 — PKCE primitives & token store (01–02)**
1. [PKCE primitives — verifier, challenge, state](01_pkce-primitives.md)
2. [The token store — signals + `localStorage`](02_token-store.md)

**Sitting 2 — Authorize + callback round-trip (03–07)**
3. [Environment: Spotify auth config (scopes + URLs)](03_environment-auth-config.md)
4. [The `SpotifyAuth` service — authorize, exchange, refresh](04_spotify-auth-service.md)
5. [The login page](05_login-page.md)
6. [The `Toast` service (shared prerequisite)](06_toast-service.md)
7. [The callback page + the `callback` route](07_callback-page.md)

**Sitting 3 — Interceptor, guard & logout (08–10)**
8. [The auth interceptor — bearer + 401 refresh-and-retry](08_auth-interceptor.md)
9. [The auth guard — protect `/globe`](09_auth-guard.md)
10. [Header: the session-aware Log out button](10_header-logout.md)

Then [**Verify** the whole PKCE round-trip](11_verify.md).

## Design / decisions folded in
- **PKCE, taught from scratch** (audience: OAuth/PKCE = *New*). Step 01 carries the deep-dive: why a public
  browser app can't hold a secret, and how the verifier/challenge pair replaces one. See
  [glossary: PKCE](../foundation/glossary.md) and the
  [Spotify PKCE tutorial](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow).
- **Signals-as-state, `localStorage`-as-persistence** (audience: modern Angular + localStorage = *New*). The
  token store is the milestone's first real store: readonly signals out, `localStorage` write on every change,
  hydrate on construction. This read/write/validate pattern (validate on load with a type guard) recurs for
  every `evm.*` cache later. See [conventions](../foundation/conventions.md).
- **One refresh, shared across callers.** `SpotifyAuth.refresh()` memoizes an in-flight promise so a burst of
  concurrent `401`s triggers a *single* token refresh, not one per request. Same idea underlies the proactive
  refresh timer.
- **The interceptor only touches Spotify.** It guards on `req.url.startsWith(environment.spotify.apiBaseUrl)`
  so Wikidata / MusicBrainz calls (later milestones) never get a Spotify bearer. Interceptor
  ordering (auth outer, rate-limit inner) is set up in **M2**.
- **`localStorage` keys are load-bearing.** `evm.spotify.tokens` (token store) and the `sessionStorage` keys
  `evm.spotify.pkce_verifier` / `evm.spotify.auth_state` must match the source exactly — see
  [conventions: load-bearing names](../foundation/conventions.md).

## Done-when gate
- [ ] On `http://127.0.0.1:4200/login`, clicking **Log in with Spotify** navigates the browser to
  `accounts.spotify.com/authorize?...` with `code_challenge_method=S256` in the query string.
- [ ] Approving on Spotify returns to `http://127.0.0.1:4200/callback?code=...&state=...`, which shows
  "Finishing sign-in…" briefly, then lands you on `/globe` (M0's placeholder).
- [ ] After login, `localStorage` has key **`evm.spotify.tokens`** whose JSON has non-empty `accessToken`, a
  `refreshToken` string, and a numeric `expiresAt`; **reloading `/globe` keeps you logged in** (no bounce to
  `/login`).
- [ ] While logged out (clear `evm.spotify.tokens`, reload), visiting `/globe` **redirects to `/login`**; the
  URL bar ends at `/login`.
- [ ] Clicking **Log out** in the header removes `evm.spotify.tokens` from `localStorage` and navigates to
  `/login`.
- [ ] `npm run format:check`, `npm run lint`, and `npm run build` are all clean.

## Handoff
### Recap
We built the whole browser-side OAuth PKCE flow: crypto primitives, a persisted token store, the auth service
(authorize → exchange → refresh), the login and callback screens, a Spotify-only bearer interceptor with a
one-shot 401 refresh-and-retry, a route guard, and a logout control — all wired into the M0 shell.

### Done so far (cumulative)
- **M0 — Scaffold & tooling:** zoneless Angular 21 project `spotify-angular`; Material 3 "Deep Space Teal"
  theme; strict-TS + Prettier + ESLint + npm scripts (`format:check` / `lint` / `build` / `start`);
  feature-first folder tree (`core/` `features/` `shared/`); `app.config.ts` (zoneless / router / http /
  animations, no interceptors); `app.routes.ts` skeleton (`login`, `globe` placeholders + redirects); app
  shell (header stub + `<router-outlet>`); `environment.ts` / `environment.development.ts` + gitignored
  `spotify-client-id.ts` (+ `.example`); README with Spotify dashboard registration steps.
- **M1 — Spotify login (PKCE):** PKCE primitives (`pkce.ts`); persisted `TokenStore`; `SpotifyAuth`
  (authorize / exchange / refresh + proactive refresh); `login-page` + `callback-page`; shared `Toast`;
  functional `authInterceptor`; `authGuard`; environment Spotify auth config; `authInterceptor` wired in
  `app.config.ts`; `callback` route + `authGuard` on `/globe`; header Log-out button. **You can log in,
  reload and stay logged in, be blocked from `/globe` when logged out, and log out.**

### Artifacts now in the project
Created this milestone:
- `src/app/core/auth/pkce.ts`
- `src/app/core/auth/token-store.ts`
- `src/app/core/auth/spotify-auth.ts`
- `src/app/core/auth/auth-interceptor.ts`
- `src/app/core/auth/auth-guard.ts`
- `src/app/shared/toast.ts`
- `src/app/features/auth/login-page/{login-page.ts, login-page.html, login-page.scss}` (replaced M0 placeholder)
- `src/app/features/auth/callback-page/{callback-page.ts, callback-page.html, callback-page.scss}`

Modified this milestone:
- `src/environments/environment.development.ts` + `src/environments/environment.ts` (Spotify auth config)
- `src/app/app.config.ts` (registered `authInterceptor`)
- `src/app/app.routes.ts` (`callback` route + `authGuard` on `/globe`)
- `src/app/shared/components/header/{header.ts, header.html, header.scss}` (Log-out button)

### Decisions / open issues
- **Tokens live in `localStorage` in the clear.** Fine for a public PKCE app with no secret; noted, not a bug.
- **No pacing yet.** Auth endpoints are unpaced; the adaptive rate-limit gate + retry land in **M2** — the
  first place we call a *data* endpoint (`/me`) and need resilience.
- **`isAuthenticated` is a point-in-time check**, not a live "is the token valid right now" (it reads
  `Date.now()`, which isn't a signal). The guard admits on `isAuthenticated() || refreshToken !== null`; the
  interceptor's lazy refresh covers a lapsed access token. See the `token-store.ts` doc comments.

### Next milestone
**[M2 — HTTP resilience layer](../MILESTONE_2_http-resilience/00_overview.md):** an adaptive AIMD rate-limit
interceptor (*AIMD* — a self-tuning rate limiter that eases up while calls succeed and backs off hard on a
`429`; you build it in [M2 step 04](../MILESTONE_2_http-resilience/04_rate-limit-gate.md)) + `withRetry`,
proving a paced, retried authenticated `/me` call surfaces *"You have N liked
songs"* on the globe placeholder. One-line Done-when: a real Spotify call succeeds through the auth +
rate-limit interceptors, requests are visibly spaced, and a forced 429 trips a cooldown toast.

---
> Core · milestone 1 of 12 · prev: [Scaffold & tooling](../MILESTONE_0_scaffold/00_overview.md) · next: [HTTP resilience layer](../MILESTONE_2_http-resilience/00_overview.md)
