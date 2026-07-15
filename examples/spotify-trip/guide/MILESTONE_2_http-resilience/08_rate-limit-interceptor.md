# M2 · Step 08 of 12 — The rate-limit interceptor (the single chokepoint)
> Nav: [← Rate limiters](07_rate-limiters.md) · [Overview](00_overview.md) · [Wire it up →](09_wire-interceptor.md)

## Glossary for this step
> 📚 New concept — **[functional HTTP interceptor](https://angular.dev/guide/http/interceptors)** (`HttpInterceptorFn`):
> a function `(req, next) => Observable<HttpEvent>` that Angular runs around **every** HTTP request. Call
> `next(req)` to pass the request down the chain; wrap it to add behaviour before (here: wait for a gate slot)
> and after (here: record success / react to a 429). Modern Angular uses functions, not class interceptors.

## Why / design
This is where the gate stops being inert. The interceptor is the **single chokepoint** every rate-limited
request flows through:

1. **Match or pass through.** `RateLimiters.match(req.url)` returns the host's gate + label, or `null`. No match
   → `return next(req)` untouched (auth, GeoJSON).
2. **Acquire before sending.** `from(gate.acquire()).pipe(switchMap(() => next(req)))` — the request literally
   isn't dispatched until the gate hands out a slot. `acquire()` is a `Promise<void>`; `from(...)` turns it into
   an observable and `switchMap` swaps in the actual request once it resolves. This one line is what serializes
   + spaces + caps every call to the host.
3. **On response, `succeeded()`.** Fire-and-forget (`void gate.succeeded()`) — it only does schedule bookkeeping
   (clear the 429 streak, AIMD +1 growth); the response passes through unchanged.
4. **On a 429, `trip()` and toast once.** `trip()` is async (it takes the cross-tab lock), so we wrap it in
   `from(...)` too. It returns `true` **only on the leading edge** of a fresh episode — so the toast fires
   *once per episode*, not once per queued request during a ban. Then we rethrow the original 429 unchanged, so
   nothing downstream (or `withRetry`, which ignores 429) behaves differently.

The recurring model, reinforced: **the gate is the only pacer.** Clients never sleep or throttle; this
interceptor does it for all of them, and it's the *only* place `trip()`/`succeeded()` are called.

> **Interceptor order matters** (you'll wire it next step): auth is *outer*, rate-limit is *inner*. A 401
> refresh-and-retry (M1) re-enters the gate so the retry still respects an active cooldown, while a 429 trips
> the gate before auth ever sees it.

## Do this
1. In `src/app/core/api/`, create `rate-limit-interceptor.ts` with the code below. It's a `const` of type
   `HttpInterceptorFn` — export name **`rateLimitInterceptor`** is load-bearing (step 09 registers it by name).
2. It `inject()`s `RateLimiters` (step 07) and `Toast` (the M1 shared snackbar wrapper) — `inject()` works
   inside a functional interceptor because Angular runs it in an injection context.
3. Note the toast message string is cosmetic; the **`error.status === 429`** check and the leading-edge toast
   guard are load-bearing (they're what make "one toast per episode" true).

## Code
### `src/app/core/api/rate-limit-interceptor.ts`
```ts
import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, tap, throwError } from 'rxjs';

import { Toast } from '../../shared/toast';
import { RateLimiters } from './rate-limiters';

/**
 * Paces **every** call to **every** rate-limited API through that host's global gate: each request
 * `await`s a slot that is spaced, capped per rolling window, and held back during any active 429
 * cooldown (see {@link RateLimitGate}). Spotify (Liked-Songs paging, the per-id track/album/genre
 * fan-outs, the player poll, artist photos), Wikidata (country resolution), and MusicBrainz (the
 * name-search fallback) each back off on their own schedule, so a burst can never saturate a host's
 * rolling rate-limit window and earn a ban. A successful response ends that host's 429 streak; the
 * first 429 of a fresh episode surfaces one toast. URLs with no configured gate — Spotify auth and
 * the local GeoJSON asset — pass straight through.
 */
export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const matched = inject(RateLimiters).match(req.url);
  if (matched === null) {
    return next(req);
  }

  const toast = inject(Toast);
  const { gate, label } = matched;

  // Wait for the gate to release a send slot — the single chokepoint that serializes + caps every
  // request to this host so concurrent fan-outs can't overrun its rolling rate-limit window.
  return from(gate.acquire()).pipe(
    switchMap(() => next(req)),
    tap((event) => {
      if (event.type === HttpEventType.Response) {
        // Fire-and-forget: succeeded() only persists schedule bookkeeping (streak reset + AIMD growth).
        void gate.succeeded();
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 429) {
        const header = error.headers.get('Retry-After');
        // trip() is async (it takes the cross-tab lock); surface the toast only on the leading edge
        // of a fresh episode, then rethrow the original 429 so upstream handling is unchanged.
        return from(gate.trip(header !== null ? Number(header) : null)).pipe(
          switchMap((firstOfEpisode) => {
            if (firstOfEpisode) {
              toast.error(`${label} is rate-limiting the app — please try again in a while.`);
            }
            return throwError(() => error);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
```

## Done when (this step)
- [ ] The file compiles with no unused imports. `npm run build` is clean. (No behaviour change yet — the
  interceptor isn't registered until the next step.)

## If it breaks
- **`NG0203: inject() must be called from an injection context`** → you called `inject()` somewhere other than
  the top of the interceptor function body. Keep both `inject()` calls where shown.
- **`Toast` not found** → the import is `from '../../shared/toast'` (the M1 snackbar wrapper). If M1 didn't
  create it, add it before continuing — the interceptor needs it for the 429 toast.
- **Every response logs a `succeeded()`-related error** → make sure it's `void gate.succeeded()` inside `tap`,
  not `await`ed; it must not block or transform the response.
