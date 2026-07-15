# M1 · Step 05 of 10 — The login page
> Nav: [← The SpotifyAuth service](04_spotify-auth-service.md) · [Overview](00_overview.md) · [The Toast service →](06_toast-service.md)

> **This step touches 3 files, committed together:** `login-page.ts`, `login-page.html`, `login-page.scss` —
> the standalone component's three parts. It **replaces** M0's placeholder login page at the same path, so the
> existing `login` route (M0) keeps working unchanged.

## Glossary for this step
> **standalone component** — a component that declares its own `imports` (no NgModule); the default in modern
> Angular. See [glossary](../foundation/glossary.md).
> **`ChangeDetectionStrategy.OnPush`** — repaint this component only when its inputs or the signals its
> template reads change; mandatory house style for a zoneless app.

## Why / design
The login page is a **dumb screen**: one button that calls `SpotifyAuth.beginLogin()`. It reads the service's
`isConfigured` flag to disable the button (and show a hint) when no client id is set, so a reader who hasn't
pasted their Client ID gets a clear message instead of a broken redirect.

House-style reminders (audience: classic Angular = rusty, modern Angular = new):
- **Separate `.html` + `.scss`** via `templateUrl` / `styleUrl` — no inline templates (mandatory).
- **`inject()`** for DI, `OnPush` always, **`@if`** (new control flow) — never `*ngIf`.
- The component exposes `auth` as `protected` so the template can read `auth.isConfigured`; the click handler
  is `protected login()`.

The `<h1>` text (**"EarthViewMusic"**) is **cosmetic** — it's the source project's display name, and this is
where the on-screen brand switches from M0's placeholder **"Spotify Trip"** to it. Rename it to your own
project name if you like; nothing keys off it. (The load-bearing identifiers in this milestone are the storage
keys and the redirect URI, not UI copy — see [conventions](../foundation/conventions.md).)

> **Keep the brand consistent.** Whatever visible name you settle on, use it in all three spots: this login
> `<h1>`, the header brand (step 10), **and** `src/index.html`'s `<title>` — which M0 set to `Spotify Trip`, so
> update it to match or the browser tab will disagree with the on-screen brand. (`spotify-trip` stays the
> guide/package/repo name; only the *display* copy changes here.)

## Do this
1. Open `src/app/features/auth/login-page/` (M0 created it as a placeholder). Replace the contents of all three
   files with the code below.
2. `login-page.ts`: import `MatButtonModule` + `MatIconModule` (Material button + the `public` globe icon);
   inject `SpotifyAuth`; `login()` calls `void this.auth.beginLogin()` (void because it's fire-and-forget — it
   redirects the whole page away).
3. `login-page.html`: the button is `[disabled]="!auth.isConfigured"` and `(click)="login()"`. The `@if
   (!auth.isConfigured)` block shows the setup hint — **illustrative** copy, reword freely.
4. `login-page.scss`: cosmetic styling using the M0 theme's CSS custom properties (`--neon-teal`,
   `--glow-shadow`, `--mat-sys-*`). Adjust to taste — none of it is load-bearing.

## Code
### `src/app/features/auth/login-page/login-page.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SpotifyAuth } from '../../../core/auth/spotify-auth';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  protected readonly auth = inject(SpotifyAuth);

  protected login(): void {
    void this.auth.beginLogin();
  }
}
```
### `src/app/features/auth/login-page/login-page.html`
```html
<section class="page">
  <h1 class="title">EarthViewMusic</h1>
  <p class="tagline">See where your favourite music comes from, lit up across the globe.</p>

  <button mat-flat-button class="login-btn" [disabled]="!auth.isConfigured" (click)="login()">
    <mat-icon>public</mat-icon>
    Log in with Spotify
  </button>

  @if (!auth.isConfigured) {
    <p class="hint">
      Set your Spotify Client ID in <code>environment.development.ts</code> to enable login.
    </p>
  }
</section>
```
### `src/app/features/auth/login-page/login-page.scss`
```scss
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 70vh;
  padding: 2rem;
  text-align: center;
}

.title {
  margin: 0;
  font-size: clamp(2.5rem, 6vw, 4rem);
  letter-spacing: 0.04em;
  color: var(--neon-teal);
  text-shadow: var(--glow-shadow);
}

.tagline {
  margin: 0;
  max-width: 32rem;
  color: var(--mat-sys-on-surface-variant);
}

.login-btn {
  margin-top: 1rem;
  box-shadow: var(--glow-shadow);
}

.hint {
  margin: 0;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}
```

## Done when (this step)
- [ ] `npm start`, open `http://127.0.0.1:4200/login` → you see the **"EarthViewMusic"** title and an enabled
  **"Log in with Spotify"** button (enabled because your Client ID is set).
- [ ] Clicking the button navigates the browser to `https://accounts.spotify.com/authorize?...` — the URL
  query contains `code_challenge_method=S256`, `response_type=code`, and your `client_id`. (Approving there
  won't fully work yet — the `callback` route lands in step 07.)

## If it breaks
- **Button is disabled + hint shows** → `environment.spotify.clientId` is empty; paste your Client ID into
  `spotify-client-id.ts` (step 03 / M0).
- **`'mat-icon' is not a known element`** → you forgot to add `MatIconModule` to the component `imports`.
- **Blank page / `styleUrl` not found** → filename mismatch; the component uses `login-page.html` /
  `login-page.scss` exactly (kebab-case, suffix-less).
