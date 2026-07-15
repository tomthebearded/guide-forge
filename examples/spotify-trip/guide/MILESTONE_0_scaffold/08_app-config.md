# M0 · Step 08 of 15 — Wire the app providers
> Nav: [← Generate the palette](07_theme-color.md) · [Overview](00_overview.md) · [Environment & client-id →](09_environments.md)

## Glossary for this step
> **provider** — an entry in the app's dependency-injection config that tells Angular how to supply a service or feature (routing, HTTP, animations). Registered once in `app.config.ts`.
> **change detection (CD)** — Angular's process of checking what changed and updating the DOM. **Zoneless** CD runs only when a signal it read changes. See [glossary](../foundation/glossary.md#change-detection-cd).

## Why / design
`app.config.ts` is the app's single wiring point — the standalone-bootstrap equivalent of the old root
`NgModule`. We register exactly the M0 providers and nothing more:

- **`provideZonelessChangeDetection()`** — the whole reason there's no `zone.js`. CD fires on signal changes only.
- **`provideBrowserGlobalErrorListeners()`** — routes uncaught errors/rejections through Angular's error handler
  (useful from day one).
- **`provideRouter(routes)`** — the router, fed the route table from `app.routes.ts` (built in step 11).
- **`provideHttpClient()`** — the HTTP client, **with no interceptors yet**. The `authInterceptor` (M1) and
  `rateLimitInterceptor` (M2) are added here later; leaving them out now keeps M0 honest.
- **`provideAnimationsAsync()`** — Material's animation provider (lazy-loaded), from step 06's `ng add`.

> This file **grows in M1/M2**: `provideHttpClient()` gains `withInterceptors([authInterceptor, rateLimitInterceptor])`.
> Don't add that now — there are no interceptors to reference yet.

## Do this
1. Open `src/app/app.config.ts` (the scaffold generated it) and replace its contents with the block below. If
   the zoneless prompt in step 02 worked, `provideZonelessChangeDetection()` is already there — this just makes
   the full provider set explicit and adds `provideHttpClient()`.
2. Note what's **absent on purpose**: no `withInterceptors(...)`, no store providers, no `APP_INITIALIZER`. All
   later.

## Code
### `src/app/app.config.ts`
```ts
import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // No interceptors yet: authInterceptor is added in M1, rateLimitInterceptor in M2.
    provideHttpClient(),
    provideAnimationsAsync(),
  ],
};
```

## Done when (this step)
- [ ] `npm run build` → completes with no errors (all provider imports resolve).
- [ ] `src/app/app.config.ts` contains `provideZonelessChangeDetection()` and a bare `provideHttpClient()` (no
      `withInterceptors`).

## If it breaks
- **`Cannot find module './app.routes'`**: the scaffold's `app.routes.ts` exists but exports `routes` — it does
  by default; if you renamed it, restore the `export const routes`.
- **`provideAnimationsAsync is not a function` / bad import path**: it comes from
  `@angular/platform-browser/animations/async` — check the import path exactly.
- **Runtime warning about `zone.js` / NgZone**: something still imports `zone.js`. Confirm `main.ts` has no
  `import 'zone.js'` and `provideZonelessChangeDetection()` is present.
