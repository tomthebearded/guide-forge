# M1 · Step 08 of 10 — The auth interceptor: bearer + 401 refresh-and-retry
> Nav: [← The callback page](07_callback-page.md) · [Overview](00_overview.md) · [The auth guard →](09_auth-guard.md)

> **This step touches 2 files, committed together:** it creates `core/auth/auth-interceptor.ts` and wires it
> into `app.config.ts`. An interceptor does nothing until it's registered, so the two go in one commit.

## Glossary for this step
> **`HttpInterceptorFn`** — a *functional* HTTP interceptor: a plain function `(req, next) => Observable` that
> sees every outgoing request and can modify it or its response. See
> [Angular interceptors](https://angular.dev/guide/http/interceptors).
> **bearer token** — the access token sent as `Authorization: Bearer <token>`; how a Spotify API call proves
> who you are.

## Why / design
This interceptor does two things for **Spotify API calls only**:

1. **Attach the bearer.** If the request URL starts with `environment.spotify.apiBaseUrl`
   (`https://api.spotify.com/v1`) and we have an access token, clone the request with
   `Authorization: Bearer <token>`.
2. **Recover from a 401 once.** If a Spotify call returns `401` *and* we hold a refresh token, call
   `auth.refresh()` (the de-duped one from step 04), retry the request with the fresh token, and — if the
   refresh itself fails — log out, toast "session expired", and route to `/login`.

> 📚 **New concept — scope the interceptor by URL.** A functional interceptor sees *every* HTTP request the
> app makes, including the later Wikidata / MusicBrainz calls. Those must **never** get a
> Spotify bearer. The guard `if (!req.url.startsWith(environment.spotify.apiBaseUrl)) return next(req);` bails
> out early for any non-Spotify URL, passing it through untouched. Note this also lets the **token endpoint**
> (`accounts.spotify.com/api/token`) through unauthenticated — correct, since the token exchange has no bearer
> yet. Recurring model: **an interceptor is app-wide; narrow its effect by inspecting the request.**

> 📚 **New concept — one refresh, one logout, even under concurrent 401s.** Because `auth.refresh()` is
> in-flight-de-duped (step 04), a burst of 401s shares a single refresh. If that refresh fails, only the
> **first** reaction should log out + toast — otherwise the others stack duplicate "session expired" toasts.
> `auth.logout()` clears the refresh token, so guarding the reaction on `tokenStore.refreshToken() !== null`
> makes it run **exactly once**.

The RxJS shape (audience: RxJS = rusty, one-line reminders): `catchError` intercepts the 401; `from(...)`
turns the refresh `Promise` into an observable; `switchMap` swaps in the retried request; an inner
`catchError` handles a failed refresh. This interceptor deliberately has **no retry/backoff and no rate-limit
awareness** — that's M2. A `429` here is simply re-thrown (it isn't a 401), which is exactly what M2's gate
wants.

## Do this
1. In `src/app/core/auth/`, create **`auth-interceptor.ts`** and paste the code below. Export it as a `const
   authInterceptor: HttpInterceptorFn` (the name is **load-bearing** — `app.config.ts` imports it by name).
2. Inject dependencies **inside** the function with `inject()` — functional interceptors run in an injection
   context, so `inject(TokenStore)` etc. work at call time.
3. Open **`src/app/app.config.ts`** and register the interceptor via
   `provideHttpClient(withInterceptors([authInterceptor]))`. Add **only** `authInterceptor` — the rate-limit
   interceptor joins this array in **M2** (order will matter then: auth outer, rate-limit inner).

## Code
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
### `src/app/app.config.ts` (state as of this step)
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

## Done when (this step)
- [ ] `npm run build` compiles → **no TypeScript errors**.
- [ ] The app still logs in end-to-end (nothing regressed by registering the interceptor).

> **Why the gate is build-only here:** an `HttpInterceptorFn` only runs when the app makes an authed HTTP call
> through `HttpClient`, and no feature makes one yet (the first is M2's Liked-summary call). So there's no
> attach/refresh/401 behavior to observe at this step — the interceptor's real workout (a live authed call and
> a forced 401 → refresh) is **M2's** gate. Build-clean + login-still-works is all you can assert now.

## If it breaks
- **Every request gets a Spotify bearer (or non-Spotify calls 401 later)** → the `startsWith` guard is wrong
  or missing; it must compare against `environment.spotify.apiBaseUrl` exactly.
- **`NG0203: inject() must be called from an injection context`** → you moved `inject()` out of the
  interceptor function body; functional interceptors provide the context, so keep the `inject()` calls inside.
- **Duplicate "session expired" toasts** → you dropped the `tokenStore.refreshToken() !== null` guard in the
  inner `catchError`; it's what makes the logout reaction fire once.
