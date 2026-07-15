# M0 · Step 12 of 15 — The app shell + header
> Nav: [← The route skeleton](11_routes.md) · [Overview](00_overview.md) · [Register a Spotify app →](13_spotify-dashboard.md)

> **This step touches the root component + a header component (six files), committed together:**
> `app.ts`/`.html`/`.scss` and `shared/components/header/header.ts`/`.html`/`.scss`.

## Glossary for this step
> **`<router-outlet>`** — the placeholder element where the router renders whichever routed component matches the current URL.
> **`RouterLink` / `RouterLinkActive`** — directives for in-app navigation: `routerLink` sets the target path (no full page reload); `routerLinkActive` adds a CSS class when that link's route is active.

## Why / design
The shell is the frame every page renders inside: a **header** on top and a `<router-outlet>` below it. In M0
it's minimal — a branded toolbar with two nav links and the outlet. The root `App` component here is stripped to
essentials; the source's `App` also owns the boot-sync + globe restore + a log-terminal overlay, but those
depend on stores that don't exist yet.

> `App` **grows in M3/M5**: it gains the boot-sync `effect()` (restore saved data + run the sequential sync on
> login) and the sync-overlay log terminal. `app.scss` will regain a `.sync-overlay` block then. **Not now** —
> there are no stores to wire.

The header lives at `src/app/shared/components/header/` per the [folder map](../foundation/conventions.md). Its
selector **`app-header`** and the class name **`Header`** are load-bearing (the shell imports `Header`).

## Do this
1. Create the header at `src/app/shared/components/header/` — three files. It's a `mat-toolbar` with the app
   brand and two `routerLink`s (`/globe`, `/login`). `routerLinkActive` highlights the current one.
2. Replace `src/app/app.ts`, `src/app/app.html`, and `src/app/app.scss` with the blocks below. `App` imports
   `RouterOutlet` and `Header`; the template is header-then-outlet. The `.content` `min-height` subtracts the
   `64px` toolbar height so a page fills the viewport below the header.

## Code
### `src/app/shared/components/header/header.ts`
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatButtonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
```
### `src/app/shared/components/header/header.html`
```html
<mat-toolbar class="app-header">
  <a class="brand" routerLink="/globe">Spotify Trip</a>
  <span class="spacer"></span>
  <nav>
    <a mat-button routerLink="/globe" routerLinkActive="active">Globe</a>
    <a mat-button routerLink="/login" routerLinkActive="active">Log in</a>
  </nav>
</mat-toolbar>
```
### `src/app/shared/components/header/header.scss`
```scss
.app-header {
  display: flex;
  align-items: center;
  background: var(--space-surface);
  box-shadow: var(--glow-shadow);
}

.brand {
  font-weight: 500;
  text-decoration: none;
  color: var(--mat-sys-primary);
}

.spacer {
  flex: 1 1 auto;
}

nav .active {
  color: var(--mat-sys-primary);
}
```
### `src/app/app.ts`
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
```
### `src/app/app.html`
```html
<app-header />
<main class="content">
  <router-outlet />
</main>
```
### `src/app/app.scss`
```scss
.content {
  display: block;
  min-height: calc(100dvh - 64px);
}
```

## Done when (this step)
- [ ] `npm start` → every page shows the dark **Spotify Trip** toolbar on top with **Globe** / **Log in** links.
- [ ] Clicking **Log in** in the header navigates to `/login` (URL changes, no full reload) and the link
      highlights; clicking **Globe** returns to `/globe`.

## If it breaks
- **`'app-header' is not a known element`**: `App`'s `imports` array is missing `Header` — add it.
- **`'mat-toolbar' is not a known element`**: `MatToolbarModule` isn't in the header's `imports`.
- **Clicking a link reloads the whole page**: you used a plain `href` instead of `routerLink` — links must use
  `routerLink` for in-app navigation.
- **Content hides under the toolbar or leaves a gap**: the `64px` in `app.scss`'s `min-height` must match the
  toolbar height — the default `mat-toolbar` is `64px`.
