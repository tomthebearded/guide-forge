# M7 · Step 07 of 8 — Embed `<app-player-bar>` in the header
> Nav: [← The player-bar component](06_player-bar.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)

> **This step touches 3 files, committed together:** `header.ts`, `header.html`, `header.scss` — a small edit
> to the M1 header. The files are short, so each is shown **complete** below.

## Why / design
The header (`Header`, from M1) is the app shell. Wiring `<app-player-bar>` into it is what finally *injects*
`PlayerStore` — which starts the poll (step 03's `effect()` reacts to `hasSession()`), so from here the header
tracks live playback.

The bar shows only when there's a session (`@if (hasSession())`), matching the Log-out button and the route
guard: a logged-out header stays bare. Everything else in the M1 header (brand, spacer, Log out) is unchanged.

> This is the *only* change to the header this milestone. The `/library` and `/actions` nav links and the
> boot-sync lock are later milestones (M9/M10); don't add them here.

## Do this
1. In `src/app/shared/components/header/header.ts`, **import `PlayerBar`** and add it to the component
   `imports` array.
2. In `header.html`, add `<app-player-bar>` right after the brand, guarded by `@if (hasSession())`.
3. In `header.scss`, add a `.player` rule so the bar sits with a little left margin and can shrink
   (`min-width: 0` lets its ellipsis truncation work inside the flex toolbar).

## Code
### `src/app/shared/components/header/header.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

import { SpotifyAuth } from '../../../core/auth/spotify-auth';
import { TokenStore } from '../../../core/auth/token-store';
import { PlayerBar } from '../../../features/player/player-bar/player-bar';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatToolbarModule, MatButtonModule, PlayerBar],
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

.player {
  margin-left: 1.5rem;
  min-width: 0;
}

.spacer {
  flex: 1 1 auto;
}
```

## Done when (this step)
- [ ] `npm run build` and `npm run lint` → clean.
- [ ] With `npm start` running and logged in, the header shows the player controls (shuffle / previous /
  play / next) after the brand. With **no** track playing anywhere, the label reads *"Nothing playing"* in
  italics. In DevTools → Network you now see a `GET https://api.spotify.com/v1/me/player` roughly every 3 s
  (thinning to ~9 s while idle).

## If it breaks
- **`'app-player-bar' is not a known element`** → `PlayerBar` missing from the header's `imports` array (step 1
  above). Standalone components must be imported where they're used.
- **No `/me/player` polling in Network** → the header didn't render the bar (check `hasSession()` is `true`,
  i.e. you're logged in), so nothing injected `PlayerStore`.
- **The bar pushes the Log-out button off-screen on a narrow window** → the `.player { min-width: 0 }` rule and
  the bar's own `max-width: 16rem` (step 06) are what keep the label truncating; confirm both are present.
- **Circular import warning** → the header imports from `features/player`, which is fine; just don't import the
  header back into the player.

---
> Nav: [← The player-bar component](06_player-bar.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)
