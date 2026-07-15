# M3 · Step 07 of 07 — Stream the likes onto the page
> Nav: [← The `LikedIndex` store](06_liked-index.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)

> This step reworks **three files, committed together** — the `/globe` placeholder from M2:
> `features/globe/globe-page/globe-page.ts`, `globe-page.html`, `globe-page.scss`.

## Glossary for this step
> **`for await…of`** — the loop that consumes an async generator: it awaits each `yield`ed page in turn, so the
> loop body runs once per page as pages resolve. See
> [MDN: `for await...of`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for-await...of).

## Why / design
Everything below the API is built; this step wires it to the screen and closes the milestone gate. The page
does three things:

1. **On init, `hydrate()` — no network.** The constructor calls `likedIndex.hydrate()`, which reads the
   snapshot from `localStorage` synchronously. A reload therefore shows your saved count/list **instantly**,
   and the scan runs *only* when you click the button. This is the "reload restores instantly, no auto-refetch"
   guarantee.
2. **On click, stream and commit per page.** `loadLikes()` runs `beginFull()`, then a `for await` loop pulls
   pages from `streamLikedTracks()`, `add`s each track, tracks the newest `addedAt`, and `commit`s **after
   every page**. Because `commit` sets the `count` signal, the number on screen ticks up 50 at a time.
3. **Render clean models only.** The template binds `IndexedTrack` fields (`track.name`, `track.albumName`) —
   proving the DTO→domain wall holds: **no `…Dto` shape reaches the component.**

> **Why is the list a computed on `revision()`?** `all()` returns a plain array, which Angular can't track. The
> `tracks` computed reads `likedIndex.revision()` first, so each `commit` (which bumps `revision`) tells it to
> recompute — the list grows in lockstep with the count. It slices to the first 200 for a light DOM; the
> **count** (`likedIndex.count()`) always shows the true total.

Scope note: this likes view is a **transitional placeholder**. M4 replaces this page's body with the three.js
globe canvas and M5 turns the very same scan into globe heat — but `LikedIndex` and its cache stay exactly as
built here.

## Do this
1. Replace `globe-page.ts`, `globe-page.html`, and `globe-page.scss` with the code below (M2's summary view is
   retired).
2. `loadLikes` is guarded by `if (this.scanning()) return;` so a double-click can't launch two scans. Leave it.
3. `newest` is tracked as the max `addedAt` seen; since pages arrive newest-first it's set on the very first
   track, but the `>` comparison is defensive — leave it. `commit(newest)` inside the loop is **mandatory**:
   it's the per-page persist.
4. Class/selector names are **load-bearing** where they cross files: the component `selector` stays
   `app-globe-page`; the route (M0/M1) points at this component. CSS class names in the template/`.scss` are
   cosmetic.

## Code
### `src/app/features/globe/globe-page/globe-page.ts`
```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { SpotifyApi } from '../../../core/api/spotify-api';
import { IndexedTrack } from '../../../core/models/indexed-track';
import { LikedIndex } from '../../../core/pipeline/liked-index';

@Component({
  selector: 'app-globe-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  private readonly spotify = inject(SpotifyApi);
  protected readonly likedIndex = inject(LikedIndex);

  /** True while a streaming scan is in flight — drives the button label + spinner. */
  protected readonly scanning = signal(false);
  /** Set after a failed scan — shown as an inline error. */
  protected readonly error = signal<string | null>(null);

  /** Liked tracks to render, newest-first (first 200). Reads `revision()` so it recomputes per page. */
  protected readonly tracks = computed<IndexedTrack[]>(() => {
    this.likedIndex.revision();
    return [...this.likedIndex.all()]
      .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
      .slice(0, 200);
  });

  constructor() {
    // Restore the persisted index synchronously — NO network. A reload shows saved likes instantly;
    // the scan runs only on demand.
    this.likedIndex.hydrate();
  }

  /** Stream Liked Songs newest-first, committing (and persisting) the index after every page. */
  protected async loadLikes(): Promise<void> {
    if (this.scanning()) {
      return;
    }
    this.scanning.set(true);
    this.error.set(null);
    try {
      this.likedIndex.beginFull();
      let newest: string | null = null;
      for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          this.likedIndex.add(track);
          if (newest === null || track.addedAt > newest) {
            newest = track.addedAt;
          }
        }
        // Per-page watermark commit: a reload mid-scan keeps everything fetched so far.
        this.likedIndex.commit(newest);
      }
    } catch {
      this.error.set('Could not load your Liked Songs — check your connection and try again.');
    } finally {
      this.scanning.set(false);
    }
  }
}
```

### `src/app/features/globe/globe-page/globe-page.html`
```html
<section class="likes">
  <header class="likes__head">
    <h1>Your Liked Songs</h1>

    <p class="likes__count">
      @if (likedIndex.hasData() || scanning()) {
        <strong>{{ likedIndex.count() }}</strong> tracks
        @if (scanning()) {
          <span class="likes__status">· loading…</span>
        }
      } @else {
        Not loaded yet.
      }
    </p>

    <button type="button" class="likes__btn" (click)="loadLikes()" [disabled]="scanning()">
      @if (scanning()) {
        Loading…
      } @else if (likedIndex.hasData()) {
        Recalculate
      } @else {
        Load my Liked Songs
      }
    </button>
  </header>

  @if (error(); as message) {
    <p class="likes__error" role="alert">{{ message }}</p>
  }

  @if (tracks().length > 0) {
    <ol class="likes__list">
      @for (track of tracks(); track track.id) {
        <li class="likes__item">
          <span class="likes__name">{{ track.name }}</span>
          <span class="likes__album">{{ track.albumName }}</span>
        </li>
      }
    </ol>
  } @else if (!scanning()) {
    <p class="likes__empty">Load your library to watch your Liked Songs stream in, newest first.</p>
  }
</section>
```

### `src/app/features/globe/globe-page/globe-page.scss`
```scss
.likes {
  max-width: 42rem;
  margin: 0 auto;
  padding: 2rem 1rem;

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.75rem 1rem;
  }

  &__count {
    margin: 0;
    opacity: 0.85;

    strong {
      font-size: 1.4rem;
    }
  }

  &__status {
    opacity: 0.7;
  }

  &__btn {
    margin-left: auto;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }
  }

  &__error {
    color: #ff6b6b;
  }

  &__list {
    margin: 1.5rem 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.04);
  }

  &__album {
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 45%;
  }

  &__empty {
    margin-top: 1.5rem;
    opacity: 0.7;
  }
}
```

## Done when (this step)
- [ ] `npm start`, log in, open `/globe`, click **Load my Liked Songs** → the count rises page-by-page
      (`50` → `100` → …) and the list grows with the newest track at the top.
- [ ] When the scan ends, the count equals your real Liked Songs total and the button now reads
      **Recalculate**.
- [ ] Reload the page → the same count and list reappear immediately with the Network panel showing **no**
      `GET /me/tracks` request.

## If it breaks
- **The count jumps straight to the total in one step (no ticking)** → you're rendering
  `getLikedTracksSummary()` (M2), not the stream. The count must come from `likedIndex.count()`, updated by
  `commit()` inside the `for await` loop.
- **The list never updates though the count does** → the `tracks` computed isn't reading `likedIndex.revision()`
  first; without it, `all()` (a plain array) isn't tracked and the list is frozen.
- **`NG0...` template error on `@for`** → every `@for` needs a `track` expression; keep `track track.id`
  (track ids are unique).
- **Reload triggers a `/me/tracks` fetch** → the constructor is calling `loadLikes()` instead of `hydrate()`.
  Only `hydrate()` runs on init; the network runs on the button only.
