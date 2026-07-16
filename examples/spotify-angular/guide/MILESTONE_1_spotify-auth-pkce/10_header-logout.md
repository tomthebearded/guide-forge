# M1 · Step 10 of 10 — Header: the session-aware Log out button
> Nav: [← The auth guard](09_auth-guard.md) · [Overview](00_overview.md) · [Verify →](11_verify.md)

> **This step touches 3 files, committed together:** `header.ts`, `header.html`, `header.scss` — it grows M0's
> header **stub** into a session-aware chrome with a **Log out** button. The full header (nav links, player
> bar) fills in across later milestones; M1 adds only the logout affordance.

## Glossary for this step
> **`RouterLink`** — Angular's declarative navigation directive (`routerLink="/globe"`) — a reminder from
> classic Angular.
> **`hasSession`** — the `TokenStore` signal (step 02): true whenever any token exists. Drives whether the
> app chrome shows.

## Why / design
The M1 Done-when requires an **observable, user-initiated logout** — "click Log out → tokens cleared →
redirected to `/login`". The natural home for that control is the app header, which M0 stubbed. So this step
adds the minimum: show a **Log out** button whenever `hasSession()` is true, wired to the exact source
handler — `auth.logout()` (clears the token store) followed by `router.navigate(['/login'])`.

> **Why this step exists.** M1's source-file list didn't include the header, but the milestone's logout gate
> has to be triggerable by hand. Rather than fake it, we grow the real header the way the source does — just
> the logout slice now, with nav links / player bar deferred to their owning milestones. This is a
> **gate-required** addition, flagged as such.

`hasSession` (not `isAuthenticated`) drives visibility so the chrome doesn't flicker to "logged out" the moment
an access token lapses — same reasoning as the guard's refresh-token fallback (step 09). The brand text and
styling are **cosmetic** (the brand reads **"EarthViewMusic"** here — the source display name adopted in step
05; keep it consistent with the login `<h1>` and `index.html`'s `<title>`); only the logout wiring is
load-bearing for the gate.

> **Note the header shrinks here.** M0's stub carried two placeholder nav links (**Globe**, **Log in**) that
> M0's gate exercised. This rewrite **intentionally drops them** — login now flows through the login page and
> guard, so the M1 header is just brand + **Log out**. The full nav (Globe/Actions links, player bar) grows back
> in later milestones (M7/M9).

## Do this
1. Open `src/app/shared/components/header/` (M0's stub) and replace the three files with the code below.
2. `header.ts`: inject `SpotifyAuth`, `Router`, and `TokenStore`; expose `hasSession` (read the store's signal
   directly) and a `logout()` method. Import `MatToolbarModule` + `MatButtonModule` + `RouterLink`.
3. `header.html`: an `@if (hasSession()) { … }` block wrapping the **Log out** `<button (click)="logout()">`.
   The brand link stays always-visible.
4. `header.scss`: minimal toolbar layout (a flex spacer pushes the button right). Cosmetic — restyle freely.

## Code
### `src/app/shared/components/header/header.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

import { SpotifyAuth } from '../../../core/auth/spotify-auth';
import { TokenStore } from '../../../core/auth/token-store';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatToolbarModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(SpotifyAuth);
  private readonly router = inject(Router);

  /** A session exists (matching the route guard) — drives whether the app chrome shows. */
  protected readonly hasSession = inject(TokenStore).hasSession;

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
```
### `src/app/shared/components/header/header.html`
```html
<mat-toolbar class="header">
  <a class="brand" routerLink="/globe">EarthViewMusic</a>
  <span class="spacer"></span>
  @if (hasSession()) {
    <button mat-button (click)="logout()">Log out</button>
  }
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

.spacer {
  flex: 1 1 auto;
}
```

## Done when (this step)
- [ ] **Logged in**, the header shows a **Log out** button. Click it → `evm.spotify.tokens` disappears from
  Local Storage and the URL becomes `/login`.
- [ ] **Logged out**, the header shows the brand only — **no Log out button** (the `@if (hasSession())` hides
  it).

## If it breaks
- **Log out button never appears** → `hasSession()` is false because no tokens are stored (complete a login
  first), or you bound to `isAuthenticated` instead of `hasSession`.
- **Clicking Log out clears tokens but doesn't navigate** → `logout()` calls `auth.logout()` but not
  `router.navigate(['/login'])`; both lines are required (the service's `logout()` only clears state).
- **`'app-player-bar' is not a known element` or unresolved imports** → you pasted the *final* source header
  (which imports later-milestone components). Use the minimal M1 version above.

---
> Nav: [← The auth guard](09_auth-guard.md) · [Overview](00_overview.md) · [Verify →](11_verify.md)
