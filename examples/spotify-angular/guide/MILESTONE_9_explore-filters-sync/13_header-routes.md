# M9 · Step 13 of 14 — Header nav + routes: `/actions` + the busy-lock
> Nav: [← The Actions page](12_actions-page.md) · [Overview](00_overview.md) · [App root: boot on open →](14_app-boot.md)

> **This step touches 4 files, committed together:** `shared/components/header/header.ts` + `.html` + `.scss`
> (add the Actions nav link, the boot busy-lock, and the `.nav .active` style) and `app.routes.ts` (add the
> `/actions` route + apply `bootSyncGuard`).

## Why / design
Two wiring jobs:

1. **The header** gains a **Globe** and **Actions** nav link, and locks navigation while the boot sync runs. It
   injects `BootSync.busy` as `syncing` and binds `[disabled]="syncing()"` on the nav links — matching the route
   guard + the app-root overlay, so the three lock mechanisms agree (a user can't click into a half-synced page).
2. **The routes** gain the lazy `/actions` route, and both `/globe` and `/actions` get the `bootSyncGuard`
   *after* `authGuard`. The guard returns `false` while `busy()`, so a route change is blocked mid-boot.

**Scope note:** the source header also has a **Library** link (`/library`); those pages + routes are **M10**,
so neither the link nor any `/library*` route is added here. Only `/actions`.

**Recurring model:** guards run in array order — `[authGuard, bootSyncGuard]` means "must be logged in **and**
not mid-boot"; routes stay lazy `loadComponent` (M4 convention).

## Do this
1. In `src/app/shared/components/header/header.ts`, add `RouterLinkActive` + `MatIconModule` to imports, inject
   `BootSync` as `syncing = inject(BootSync).busy`.
2. In `.../header.html`, add the Globe + Actions nav links (icons + `[disabled]="syncing()"`), keeping the Log
   out button. Do **not** add a Library link.
3. In `src/app/app.routes.ts`, add the `/actions` route and apply `[authGuard, bootSyncGuard]` to `/globe` and
   `/actions`. In `.../header.scss`, add the `.nav .active` rule.

## Code
### `src/app/shared/components/header/header.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { SpotifyAuth } from '../../../core/auth/spotify-auth';
import { TokenStore } from '../../../core/auth/token-store';
import { BootSync } from '../../../core/pipeline/boot-sync';
import { PlayerBar } from '../../../features/player/player-bar/player-bar';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    PlayerBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(SpotifyAuth);
  private readonly router = inject(Router);

  /** A session exists (matching the route guard) — drives whether the app chrome shows. */
  protected readonly hasSession = inject(TokenStore).hasSession;

  /** The boot sync is reconciling — nav is locked to match the route guard + overlay. */
  protected readonly syncing = inject(BootSync).busy;

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
```

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
      <button mat-button (click)="logout()">Log out</button>
    }
  </nav>
</mat-toolbar>
```

### `src/app/shared/components/header/header.scss`
```scss
.header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand {
  color: var(--neon-teal);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-decoration: none;
}

.player {
  margin-left: 1.5rem;
  min-width: 0;
}

.spacer {
  flex: 1 1 auto;
}

// The active nav link (Globe / Actions) reads bolder.
.nav .active {
  font-weight: 600;
}
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
  // `/library*` routes arrive with the M10 library console.
  { path: '**', redirectTo: 'globe' },
];
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors.
- [ ] Serve, log in → the header shows **Globe** + **Actions** links (with icons) + **Log out**; clicking
      **Actions** navigates to `/actions` and the link reads bold/active.
- [ ] Directly visiting `http://127.0.0.1:4200/actions` while logged in loads the Actions page (not a redirect).

## If it breaks
- **`bootSyncGuard` type error** → it's a `CanActivateFn` (step 06); it goes in the `canActivate` array, not
  `canActivateChild`.
- **Actions link disabled forever** → `syncing` is `BootSync.busy` (only true during the *boot* sequence). If
  it's stuck true, a boot-sync `finally` didn't clear `_boot` (step 06) — check `wrap()`.
- **`/actions` 404s / redirects to globe** → the route must sit **before** the `**` wildcard; a wildcard above
  it swallows everything.

---
> Nav: [← The Actions page](12_actions-page.md) · [Overview](00_overview.md) · [App root: boot on open →](14_app-boot.md)
