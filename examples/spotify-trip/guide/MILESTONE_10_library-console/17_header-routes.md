# M10 · Step 17 of 18 — Header Library link + the four `/library*` routes
> Nav: [← The library-wide tidy page](16_library-tidy.md) · [Overview](00_overview.md) · [Verify the milestone →](18_verify.md)

> **This step touches 2 files, committed together:** `shared/components/header/header.html` (add the **Library**
> nav link) and `app.routes.ts` (add the four lazy `/library*` routes). This is the wiring that finally makes the
> console reachable.

## Why / design
Two small edits connect everything built in this milestone to the app chrome:

1. **The header** gains a **Library** nav link between **Actions** and **Log out** — same shape as the others
   (icon + `[disabled]="syncing()"` so nav locks during boot-sync). M9 already added the `RouterLinkActive` +
   `MatIconModule` imports and the `syncing` signal to `header.ts`, so **only `header.html` changes**.
2. **The routes** gain four lazy `loadComponent` routes, each guarded `[authGuard, bootSyncGuard]` (must be
   logged in **and** not mid-boot) — matching `/globe` and `/actions`:
   - `library` → `LibraryPage` (the master table)
   - `library/tracks` → `LikedSongs`
   - `library/tidy` → `LibraryTidy`
   - `library/artist/:id` → `ArtistTidy`

> **Recurring model — lazy routes + guard order ([conventions](../foundation/conventions.md)):** every feature
> route is a lazy `loadComponent` (M4 convention), and `canActivate: [authGuard, bootSyncGuard]` runs the guards
> in array order. The `:id` param on `library/artist/:id` is **load-bearing** — `ArtistTidy` reads it via
> `toSignal(route.paramMap)` (step 14). All four routes must sit **before** the `**` wildcard, or it swallows them.

## Do this
1. In `src/app/shared/components/header/header.html`, add the **Library** link (icon `queue_music`) between the
   **Actions** link and the **Log out** button, inside the existing `@if (hasSession())` block.
2. In `src/app/app.routes.ts`, add the four `/library*` routes after the `actions` route and before the `**`
   wildcard. The component class names (`LibraryPage`, `LikedSongs`, `LibraryTidy`, `ArtistTidy`) must match the
   exports from steps 12 / 15 / 16 / 14.
3. `header.ts` and `header.scss` are unchanged from M9 — no edit needed.

## Code
### `src/app/shared/components/header/header.html`
> The visible brand text stays **"EarthViewMusic"** (the source project's display name) — purely cosmetic. If
> you renamed it in [M1/05](../MILESTONE_1_spotify-auth-pkce/05_login-page.md), keep using your own name here;
> only the internal `evm.*` keys and the export `FORMAT = 'earthviewmusic'` are load-bearing and must not change.
```html
<mat-toolbar class="header">
  <a class="brand" routerLink="/globe">EarthViewMusic</a>
  @if (hasSession()) {
    <app-player-bar class="player" />
  }
  <span class="spacer"></span>
  <nav class="nav">
    @if (hasSession()) {
      <a
        mat-button
        routerLink="/globe"
        routerLinkActive="active"
        [disabled]="syncing()"
        title="Back to the globe"
      >
        <mat-icon>public</mat-icon>
        Globe
      </a>
      <a
        mat-button
        routerLink="/actions"
        routerLinkActive="active"
        [disabled]="syncing()"
        title="Scan &amp; manage your data"
      >
        <mat-icon>storage</mat-icon>
        Actions
      </a>
      <a
        mat-button
        routerLink="/library"
        routerLinkActive="active"
        [disabled]="syncing()"
        title="Browse &amp; tidy your liked songs"
      >
        <mat-icon>queue_music</mat-icon>
        Library
      </a>
      <button mat-button (click)="logout()">Log out</button>
    }
  </nav>
</mat-toolbar>
```

### `src/app/app.routes.ts`
```ts
import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { bootSyncGuard } from './core/pipeline/boot-sync-guard';

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
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
  },
  {
    path: 'actions',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/actions/actions-page/actions-page').then((m) => m.ActionsPage),
  },
  {
    path: 'library',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/library/library-page/library-page').then((m) => m.LibraryPage),
  },
  {
    path: 'library/tracks',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/library/liked-songs/liked-songs').then((m) => m.LikedSongs),
  },
  {
    path: 'library/tidy',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/library/library-tidy/library-tidy').then((m) => m.LibraryTidy),
  },
  {
    path: 'library/artist/:id',
    canActivate: [authGuard, bootSyncGuard],
    loadComponent: () =>
      import('./features/library/artist-tidy/artist-tidy').then((m) => m.ArtistTidy),
  },
  { path: '**', redirectTo: 'globe' },
];
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — all four lazy imports resolve to the
      component exports.
- [ ] Serve, log in → the header shows **Globe · Actions · Library · Log out**; clicking **Library** navigates to
      `/library` and the link reads bold/active.
- [ ] Directly visiting `http://127.0.0.1:4200/library/tidy` while logged in loads the tidy page (not a redirect
      to `/globe`); `http://127.0.0.1:4200/library/artist/<some-id>` loads the detail view.

## If it breaks
- **`/library` redirects to `/globe`** → a `**` wildcard sits **above** the library routes (it swallows
  everything after it) — the four routes must come before the wildcard.
- **`/library/tracks` loads the master page, not the tracks list** → the `library` route was given `children`
  or a trailing wildcard; keep the four as **flat, sibling** routes with distinct `path` strings.
- **Library link disabled forever** → `syncing` is `BootSync.busy` (only true during boot); if stuck true, a
  boot-sync `finally` didn't clear it (M9 step 06), not a header problem.
- **`m.LibraryPage is undefined`** → the `loadComponent` `.then((m) => m.X)` name must match the exported class
  (`LibraryPage` / `LikedSongs` / `LibraryTidy` / `ArtistTidy`) — a typo yields a lazy-load runtime error.
