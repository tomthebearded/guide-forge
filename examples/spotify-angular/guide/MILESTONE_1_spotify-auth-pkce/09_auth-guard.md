# M1 · Step 09 of 10 — The auth guard: protect `/globe`
> Nav: [← The auth interceptor](08_auth-interceptor.md) · [Overview](00_overview.md) · [Header: Log out →](10_header-logout.md)

> **This step touches 2 files, committed together:** it creates `core/auth/auth-guard.ts` and applies it to the
> `globe` route in `app.routes.ts`. The guard and its wiring are one feature.

## Glossary for this step
> **`CanActivateFn`** — a *functional* route guard: a function returning `true`, `false`, or a `UrlTree`
> (a redirect). Angular runs it before activating the route. See
> [Angular route guards](https://angular.dev/guide/routing/route-guards).
> **`UrlTree`** — a parsed target URL; returning one from a guard redirects there instead of blocking.

## Why / design
`/globe` should be reachable **only** when you're logged in. The guard admits on the same condition the token
store exposes for admission: **a usable token OR a refresh token present**. The refresh-token branch matters —
an access token can lapse while a session is still valid, and the interceptor (step 08) will refresh it lazily
on the first call, so we shouldn't bounce the user to `/login` just because the *access* token expired.

> **Reminder (classic Angular).** A `CanActivateFn` returning a `UrlTree` (`router.createUrlTree(['/login'])`)
> is the modern redirect idiom — cleaner than injecting the router and calling `navigate` from inside a guard.

The admission logic mirrors `TokenStore`:
`tokenStore.isAuthenticated() || tokenStore.refreshToken() !== null`. Recall `isAuthenticated()` is a
point-in-time check (step 02); the `refreshToken` fallback is what keeps a lapsed-access-token session on the
page. The export name **`authGuard`** is load-bearing — `app.routes.ts` imports it by name.

Do **not** add the `bootSyncGuard` to `/globe` — that guard belongs to a later milestone (it reconciles cached
data before the globe loads) and doesn't exist yet.

## Do this
1. In `src/app/core/auth/`, create **`auth-guard.ts`** and paste the code below.
2. Open **`src/app/app.routes.ts`** and add `canActivate: [authGuard]` to the **`globe`** route, and the
   import at the top. Leave `login`, `callback`, the redirects, and the wildcard untouched.

## Code
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
### `src/app/app.routes.ts` (state as of this step — `globe` now guarded)
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

## Done when (this step)
- [ ] **Logged out** (in devtools, delete `evm.spotify.tokens`, then reload), navigate to
  `http://127.0.0.1:4200/globe` → the URL immediately becomes `/login` and the login page shows.
- [ ] **Logged in**, navigate to `/globe` → the globe placeholder renders and the URL stays `/globe`; a reload
  keeps you there (no bounce).

## If it breaks
- **Always redirected to `/login`, even logged in** → the guard's condition is inverted, or `evm.spotify.tokens`
  isn't actually stored (check step 07's exchange). Confirm `tokenStore.refreshToken()` is non-null in console.
- **Never redirected, even logged out** → `canActivate: [authGuard]` isn't on the `globe` route, or you edited
  the wrong route object. It must sit on `path: 'globe'`.
- **`NG0203` in the guard** → `inject()` must stay inside the `authGuard` function body.

---
> Nav: [← The auth interceptor](08_auth-interceptor.md) · [Overview](00_overview.md) · [Header: Log out →](10_header-logout.md)
