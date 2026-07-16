# M2 · Step 11 of 12 — Show "You have N liked songs"
> Nav: [← Spotify client](10_spotify-client.md) · [Overview](00_overview.md) · [Verify →](12_verify.md)

> **This step touches three files, committed together:** `globe-page.ts`, `globe-page.html`, and
> `globe-page.scss` under `src/app/features/globe/globe-page/`. It **edits** the placeholder page M0 created and
> M1 guarded — it stays a placeholder; the real three.js globe replaces it in **M4**.

## Why / design
The resilience layer is invisible until something uses it. This step makes the guarded `/globe` page call the
minimal `SpotifyApi` and render the count — the milestone's observable payoff and the S1 health check.

The Angular shape (reinforcing the New-topic patterns from M0):

- **Smart page owns the call.** `GlobePage` `inject()`s `SpotifyApi` and calls it in `ngOnInit`. Per
  [conventions](../foundation/conventions.md#structure--architecture-feature-first), pages talk to `core/api`
  clients; dumb components never do HTTP.
- **State is signals; the template reads them.** `likedCount` is a `signal<number | null>` (`null` = loading);
  `loadFailed` is a `signal<boolean>`. In a **zoneless** app, setting a signal is what triggers change
  detection — there's no `zone.js` to notice the `await`. `OnPush` + signals is the whole reactivity story.
- **New control flow.** The template uses `@if`/`@else if`/`@else`, never `*ngIf`.
- **Fire both calls at once** with `Promise.all`. That's deliberate: two concurrent requests let the gate's
  `minSpacingMs` show up as a visible ≥600 ms gap between them in the Network tab (the milestone's spacing
  gate). `getMe()` is the health check; `getLikedTracksSummary()` gives the number we display.

## Do this
1. Open `src/app/features/globe/globe-page/globe-page.ts` and replace its body with the version below. The class
   name **`GlobePage`** and selector **`app-globe-page`** are load-bearing (the route's `loadComponent` and any
   parent template use them) — keep them.
2. Replace `globe-page.html` with the template below (three states: error, loading, loaded).
3. Replace `globe-page.scss` with the minimal centered layout below (cosmetic — restyle freely).
4. Field names (`likedCount`, `loadFailed`, `spotifyApi`) are cosmetic; rename if you like.

## Code
### `src/app/features/globe/globe-page/globe-page.ts`
```ts
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { SpotifyApi } from '../../../core/api/spotify-api';

@Component({
  selector: 'app-globe-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage implements OnInit {
  private readonly spotifyApi = inject(SpotifyApi);

  /** null while loading; the total once the summary returns. Drives the placeholder text. */
  protected readonly likedCount = signal<number | null>(null);
  /** Set when a smoke call fails, so the page shows a message instead of a stuck "Loading…". */
  protected readonly loadFailed = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      // Fire both smoke calls at once: getMe() is the health check; the gate spaces them ≥600 ms apart
      // (visible in the Network tab), and getLikedTracksSummary() gives the count we render.
      const [, summary] = await Promise.all([
        this.spotifyApi.getMe(),
        this.spotifyApi.getLikedTracksSummary(),
      ]);
      this.likedCount.set(summary.total);
    } catch {
      this.loadFailed.set(true);
    }
  }
}
```

### `src/app/features/globe/globe-page/globe-page.html`
```html
<section class="globe-placeholder">
  <h1>spotify-angular</h1>

  @if (loadFailed()) {
    <p class="status status--error">Couldn't reach Spotify — check the console and reload.</p>
  } @else if (likedCount() === null) {
    <p class="status">Loading your library…</p>
  } @else {
    <p class="status">You have {{ likedCount() }} liked songs.</p>
  }
</section>
```

### `src/app/features/globe/globe-page/globe-page.scss`
```scss
.globe-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  gap: 0.5rem;
  text-align: center;
}

.status {
  font-size: 1.25rem;
  opacity: 0.85;

  &--error {
    color: var(--mat-sys-error, #ffb4ab);
  }
}
```

## Done when (this step)
- [ ] `npm start`, log in, open `http://127.0.0.1:4200/globe` → it shows **"Loading your library…"** briefly,
  then **"You have N liked songs."** with your real count (or `0`).

## If it breaks
- **Stuck on "Loading your library…"** → a call threw but was swallowed; open the console. Common causes: not
  logged in (401 → M1 issue), or the request is still held by the gate (wait a second).
- **"Couldn't reach Spotify"** → 401 (token) or 403. A 403 on `/me/tracks` usually means the `user-library-read`
  scope is missing — check M1's `environment.spotify.scopes`.
- **The count never updates even though the request succeeded (200 in Network)** → you mutated a plain field
  instead of a signal, or forgot `OnPush`+signal. Setting `likedCount.set(...)` is what drives the zoneless
  repaint.

---
> Nav: [← Spotify client](10_spotify-client.md) · [Overview](00_overview.md) · [Verify →](12_verify.md)
