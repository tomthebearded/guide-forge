# M0 · Step 11 of 15 — The M0 route skeleton
> Nav: [← Placeholder pages](10_placeholder-pages.md) · [Overview](00_overview.md) · [The app shell + header →](12_shell.md)

## Glossary for this step
> **lazy route (`loadComponent`)** — a route that imports its component only when first visited, so it isn't in the initial bundle. The `() => import(...).then((m) => m.GlobePage)` form is the standalone-component way to do it.

## Why / design
The route table maps URLs to the placeholder pages. For M0 it's deliberately tiny: default to `/globe`, expose
`/login`, and send anything unknown back to `/globe`. Classic Angular routing — you've seen this shape; the one
modern note is that each route **lazy-loads** its standalone component with `loadComponent`.

> This file **grows in M1** (and later): M1 adds the **`callback`** route (its path + the redirect URI
> `http://127.0.0.1:4200/callback` are load-bearing and must match Spotify exactly) and puts an **`authGuard`**
> on `/globe`; M9/M10 add the `actions` and `library/*` routes. **Do not** add guards or a `callback` route now —
> there's no auth to guard yet, and adding an unused guard would cross into M1's scope.

## Do this
1. Open `src/app/app.routes.ts` (the scaffold created it, probably with an empty `routes` array) and replace its
   contents with the block below.
2. The route **paths** (`''`, `login`, `globe`, `**`) are load-bearing — the header links and later guards use
   them. The class names in the dynamic imports (`LoginPage`, `GlobePage`) must match step 10 exactly.

## Code
### `src/app/app.routes.ts`
```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'globe' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'globe',
    loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
  },
  // M1 adds: the `callback` route (redirect URI http://127.0.0.1:4200/callback) + an authGuard on `globe`.
  // M9/M10 add: `actions` and `library/*` routes.
  { path: '**', redirectTo: 'globe' },
];
```

## Done when (this step)
- [ ] `npm start`, open `http://127.0.0.1:4200/` → it redirects to `/globe` and shows the Globe placeholder.
- [ ] Open `http://127.0.0.1:4200/login` → shows the Log-in placeholder.
- [ ] Open `http://127.0.0.1:4200/nope` → redirects to `/globe`.

## If it breaks
- **Blank page + console `Cannot find module './features/...'`**: an import path or class name doesn't match
  step 10 — the path is relative to `app.routes.ts` and the `.then((m) => m.GlobePage)` name must match the
  exported class.
- **`/` shows nothing**: the `pathMatch: 'full'` on the empty-path redirect is required — without it the
  redirect can loop or fail.

---
> Nav: [← Placeholder pages](10_placeholder-pages.md) · [Overview](00_overview.md) · [The app shell + header →](12_shell.md)
