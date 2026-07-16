# M2 · Step 09 of 12 — Wire the interceptor into the app
> Nav: [← The interceptor](08_rate-limit-interceptor.md) · [Overview](00_overview.md) · [Spotify client →](10_spotify-client.md)

## Why / design
An interceptor does nothing until it's registered. M1 wired `authInterceptor` into `provideHttpClient`; now you
add `rateLimitInterceptor` to the same array — **after** `authInterceptor`. The order is load-bearing:

- `withInterceptors([authInterceptor, rateLimitInterceptor])` runs **auth outer, rate-limit inner**.
- On a **401**, auth (outer) refreshes the token and retries; because rate-limit is *inner*, that retry
  re-enters the gate and still respects an active cooldown (it can't sneak past one).
- On a **429**, the rate-limit interceptor (inner) trips the gate *before* auth (outer) ever sees the error —
  which is what we want, since 429 is the gate's job, not auth's.

Auth only touches Spotify *API* calls; the rate-limit interceptor paces every configured host. Auth endpoints
and local assets pass through both.

## Do this
1. Open `src/app/app.config.ts` (created in M1).
2. Add the import `import { rateLimitInterceptor } from './core/api/rate-limit-interceptor';` alongside the
   existing `authInterceptor` import.
3. In the `withInterceptors([...])` array, add `rateLimitInterceptor` **after** `authInterceptor`. Change
   nothing else — `provideZonelessChangeDetection()`, the router, and animations stay exactly as M1 left them.
   The full file below is short, so it's shown complete.

## Code
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
import { rateLimitInterceptor } from './core/api/rate-limit-interceptor';
import { authInterceptor } from './core/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // auth is outer, rate-limit inner: a 401 refresh-and-retry re-enters the rate-limit gate (the
    // retry would otherwise bypass an active cooldown), while a 429 still trips the gate before auth
    // sees it. The rate-limit interceptor paces every configured host (Spotify / Wikidata /
    // MusicBrainz); auth only touches Spotify API calls. Auth endpoints + local assets pass through.
    provideHttpClient(withInterceptors([authInterceptor, rateLimitInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

## Done when (this step)
- [ ] `npm run build` is clean, and on the running app a request to `https://api.spotify.com/v1/*` (once step 11
  makes one) is visibly delayed by the gate in the Network tab — proving the interceptor is in the chain.

## If it breaks
- **Requests aren't paced** → `rateLimitInterceptor` isn't in the `withInterceptors` array, or you added a
  *second* `provideHttpClient` (there must be exactly one). Check the array has both interceptors, in order.
- **401 refresh loops or bypasses the cooldown** → the order is reversed. It must be
  `[authInterceptor, rateLimitInterceptor]` — auth first (outer), rate-limit second (inner).

---
> Nav: [← The interceptor](08_rate-limit-interceptor.md) · [Overview](00_overview.md) · [Spotify client →](10_spotify-client.md)
