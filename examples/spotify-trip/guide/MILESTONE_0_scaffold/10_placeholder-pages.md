# M0 · Step 10 of 15 — Placeholder login & globe pages
> Nav: [← Environment & client-id](09_environments.md) · [Overview](00_overview.md) · [The route skeleton →](11_routes.md)

> **This step touches two components (six files), committed together:** the `login-page` and the `globe-page`,
> each with its `.ts`/`.html`/`.scss`. They're the two routed placeholders the M0 route table needs.

## Glossary for this step
> **signal** — Angular's reactive state primitive: a getter you call (`clicks()`) that tracks reads and notifies dependents on write. In a zoneless app, writing a signal is what triggers re-render. See [glossary](../foundation/glossary.md#signal).

## Why / design
The route table (next step) lazy-loads two pages. They're **inert placeholders** — the real login (PKCE, M1)
and the real globe (three.js, M4) come later. But we make the globe placeholder earn its keep: it holds a
**signal-driven counter** whose label repaints on click. That's the M0 gate's proof that **zoneless change
detection works** — no `zone.js`, yet a signal write updates the DOM.

These follow the [house style](../foundation/conventions.md): suffix-less names
(`globe-page.ts → class GlobePage`), `ChangeDetectionStrategy.OnPush`, separate `.html`/`.scss`, `app-…`
selectors. The class names `LoginPage` and `GlobePage` are **load-bearing** — the route table imports them by
name in step 11.

> 📚 New concept — why a signal proves zoneless works: in classic Angular, `zone.js` would notice the click and
> re-check the tree. Here there's no zone — Angular only re-renders because the template *reads* `clicks()` and
> the click *writes* it. Signals are the whole change-detection engine now. Docs:
> [angular.dev/guide/signals](https://angular.dev/guide/signals).

## Do this
1. Create the **login page** at `src/app/features/auth/login-page/` — three files. The button is inert (the real
   PKCE login is M1); a one-liner tells the reader that.
2. Create the **globe page** at `src/app/features/globe/globe-page/` — three files. It uses `signal(0)` and a
   `mat-flat-button`; clicking increments the counter. The `mat-flat-button` also proves the theme is applied —
   it renders in the pastel-mint **primary** color.

## Code
### `src/app/features/auth/login-page/login-page.ts`
```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {}
```
### `src/app/features/auth/login-page/login-page.html`
```html
<section class="login">
  <h1>Spotify Trip</h1>
  <p>Log in to color a 3D globe by where your favourite artists come from.</p>
  <!-- Inert in M0 — the real PKCE login flow is wired in M1. -->
  <button mat-flat-button disabled>Log in with Spotify</button>
</section>
```
### `src/app/features/auth/login-page/login-page.scss`
```scss
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: calc(100dvh - 64px);
  text-align: center;
  padding: 2rem;
}
```
### `src/app/features/globe/globe-page/globe-page.ts`
```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-globe-page',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  /** Placeholder state — proves zoneless CD repaints on a signal write. Removed when M4 adds the real globe. */
  protected readonly clicks = signal(0);

  protected increment(): void {
    this.clicks.update((n) => n + 1);
  }
}
```
### `src/app/features/globe/globe-page/globe-page.html`
```html
<section class="placeholder">
  <h1>Globe</h1>
  <p>The 3D globe arrives in M4. For now, this button proves zoneless change detection works.</p>
  <button mat-flat-button (click)="increment()">Clicked {{ clicks() }} times</button>
</section>
```
### `src/app/features/globe/globe-page/globe-page.scss`
```scss
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: calc(100dvh - 64px);
  text-align: center;
  padding: 2rem;
}
```

## Done when (this step)
- [ ] `npm run build` → compiles both components with no template/type errors.
- [ ] `src/app/features/auth/login-page/login-page.ts` exports `class LoginPage`, and
      `src/app/features/globe/globe-page/globe-page.ts` exports `class GlobePage`.

## If it breaks
- **`'mat-flat-button' is not a known ... ` template error**: `MatButtonModule` isn't in the component's
  `imports` array — add it.
- **Lint fails on the selector**: the selector must be `app-login-page` / `app-globe-page` (kebab-case, `app-`
  prefix) — the ESLint rule from step 04 enforces it.
- **`clicks` reported unused**: the template must call `clicks()` (with parentheses — signals are getters) inside
  the button label.
