# Milestone 4 · Step 02 of 4 — Add `HttpClient` + generate environments
> Nav: [← Create the Ionic app](01_ionic-start.md) · [Overview](00_overview.md) · [Dev proxy →](03_proxy.md)

> **This step touches 4 files, committed together:** `src/main.ts` (edit), two new
> `src/environments/*.ts` files (generated), and `angular.json` (`ng generate environments` inserts a
> `fileReplacements` block into the build target's `development` config).

## Why / design
The scaffold's `main.ts` provides Ionic and the router but **not** `HttpClient` — Angular's HTTP service isn't
available until you add `provideHttpClient()`. We add it now so the M5 service can inject `HttpClient`. We also
generate environment files to hold the API base URL in one place (`'/api'` — the proxy forwards it to the
backend), so no component hard-codes the backend address.

## Do this
1. **Generate the environment files** (from `frontend/`):
   ```bash
   ng generate environments
   ```
   This creates `src/environments/environment.ts` and `src/environments/environment.development.ts` and wires
   the dev/prod file-replacement into `angular.json`.
2. **Set the API base in both files** to `'/api'`. Replace each file's contents with the version below. The
   key name `apiUrl` is **load-bearing** — the M5 service reads `environment.apiUrl`.
3. **Add `provideHttpClient()` to `src/main.ts`** — the import and the one new provider line (shown complete
   below). Leave the existing Ionic/router providers exactly as they are.

## Code
```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: '/api',
};
```

```typescript
// frontend/src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: '/api',
};
```

```typescript
// frontend/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
  ],
});
```

Both `apiUrl`s are `'/api'` here because dev uses the proxy; if you deployed, the production `environment.ts`
would point at the real API URL instead.

## Done when (this step)
- [ ] `src/environments/environment.ts` and `environment.development.ts` exist, each exporting `apiUrl: '/api'`.
- [ ] `main.ts` imports and lists `provideHttpClient()`.
- [ ] `ionic serve` still shows the Blank page with no console errors (nothing visually changed yet).

## If it breaks
- **`ng generate environments` says "unknown command"** — run it from inside `frontend/` (it needs the Angular
  workspace).
- **Later: `NullInjectorError: No provider for HttpClient`** — `provideHttpClient()` is missing from `main.ts`;
  this step adds it.
