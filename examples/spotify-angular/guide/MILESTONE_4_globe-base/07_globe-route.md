# M4 · Step 07 of 8 — Wire the `/globe` route
> Nav: [← Globe page](06_globe-page.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)

You edit `src/app/app.routes.ts` (created in M0, grows every milestone) to add a **lazy** route for the globe
page. This is what makes the page reachable — and, just as importantly, destroyable, which is how you'll prove
the renderer disposes cleanly.

## Glossary for this step
> **lazy route (`loadComponent`)** — a route that imports its component on demand (`() => import(...)`), so three.js + three-globe (a big chunk) only download when the user actually visits `/globe`. Classic-Angular reminder; [docs](https://angular.dev/guide/routing/common-router-tasks#lazy-loading).

## Why / design
Loading the whole three.js stack into the initial bundle would bloat first paint for a user who logs in and
never opens the globe. A lazy `loadComponent` route defers it. Lazy routing also gives us a clean
**destroy** boundary. When the router leaves `/globe`, the cleanup cascades in order:
1. the router destroys `GlobePage`;
2. that destroys its child `GlobeCanvas`;
3. `GlobeCanvas`'s `DestroyRef.onDestroy` callback fires;
4. which calls `renderer.dispose()`.

That cascade is exactly the M4 disposal gate.

> **`app.routes.ts` grows across milestones.** It already holds routes from M0 (shell — including a
> `globe` route pointing at the placeholder page) and M1 (`callback` + an `authGuard` on `globe`). This step
> doesn't add a new route — the `globe` route already exists; it *becomes real* now that `GlobePage` is the
> actual three.js page instead of the M0 placeholder. Don't retype the array or add a second `globe` entry.

## Do this
1. **Open `src/app/app.routes.ts`.** Find the exported `routes: Routes` array (from M0/M1).
2. **Confirm the globe route is already there** and matches the object below. The **path string `globe` is
   load-bearing** (it's the URL `/globe` you navigate to and away from in the verify step); the arrow
   function's shape is fixed, and the imported symbol `GlobePage` must match the class you created in step 06.
   ```ts
   // already present in the `routes` array since M0 (authGuard added in M1) — verify, don't duplicate
   {
     path: 'globe',
     canActivate: [authGuard],
     loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
   },
   ```
   - The import path has **no `.ts` extension** and points at the file (suffix-less), and `.then((m) => m.GlobePage)` selects the named export.
   - If you don't find a `globe` route at all, something went wrong in M0/M1 — add the object above rather than a second copy. Only a wildcard `**` must stay last, if you have one.
3. **Confirm you have a route to navigate *back* to** — your home/landing route (the one M3 uses to render the
   live liked-track count). You'll bounce between it and `/globe` to test disposal. If you don't have a link,
   the browser address bar works.

## Code
> No full-file block here: `app.routes.ts` is a shared file that grows every milestone, so only its M4 addition
> is shown above (per the guide's "files grow across milestones" rule). Its complete current state is checked
> against your build, not reproduced from earlier milestones' contents.

## Done when (this step)
- [ ] `npm run build` → compiles clean, and the build output lists a **lazy chunk** for the globe page (e.g. a
      separate `chunk-*.js` / `globe-page` entry), confirming it's code-split.
- [ ] With `ng serve --host 127.0.0.1 --port 4200` running, opening `http://127.0.0.1:4200/globe` loads the
      globe page (see step 08 for the full visual gate).

## If it breaks
- **`Cannot find module './features/globe/globe-page/globe-page'`** → the import path is wrong or has a `.ts`
  extension. It's relative to `src/app/` and extension-less.
- **`/globe` shows a blank page, console `NG04002` (no route match)** → the route object didn't land inside the
  exported `routes` array, or a `**` wildcard route sits before it. Move the wildcard last.
- **Navigating to `/globe` reloads the whole app instead of client-routing** → use a `routerLink` /
  `router.navigate`, not an `<a href>` full-page load, so the SPA lifecycle (and later, disposal) runs.

---
> Nav: [← Globe page](06_globe-page.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)
