# M10 · Step 16 of 18 — The library-wide tidy page
> Nav: [← The all-liked-songs page](15_liked-songs.md) · [Overview](00_overview.md) · [Header link + routes →](17_header-routes.md)

> **This step touches 3 files, committed together:** `features/library/library-tidy/library-tidy.{ts,html,scss}` —
> the `/library/tidy` view that scans every artist for relink + duplicate work.

## Glossary for this step
> **streaming scan** — a long pass that reports partial results as it goes, rather than blocking until done. The
> store pushes each artist's findings into a signal the moment they resolve, so the page fills in live behind a
> progress bar.

## Why / design
`LibraryTidy` is the whole-library counterpart to the per-artist detail: it runs `store.scanLibraryTidy()`, which
walks every liked artist, fetches (cached) each discography, analyses it, and streams the artists that have
outstanding relinks/duplicates into `store.tidyResults`. The page renders each result with **Relink all** and
per-group **Remove duplicates** — both reversible via the store's Undo toast — and refreshes that artist's entry
from cache after an action (dropping it when nothing's left).

> **Recurring model — the store owns the work, the page renders progress.** All scan state (`tidyRunning`,
> `tidyProgress`, `tidyResults`, `tidyScanned`, the totals) lives on `LibraryStore` as signals; this component is
> a thin renderer + three button handlers. The scan is sequential and gentle on the API (discographies cache), so
> a re-run after the first is cheap.

Nothing new here beyond wiring the store — the heavy lifting (the engine, the caching, the reversible actions)
is already built. This is the payoff view.

## Do this
1. Create the three `library-tidy` files under `src/app/features/library/library-tidy/`.
2. The constructor calls `store.initMaster()` (so a direct `/library/tidy` open has data). The scan button calls
   `scanLibraryTidy` (labelled **Scan library** first, **Rescan library** after).
3. Wire **Relink all** → `store.tidyRelinkAll(result.artistId)` and **Remove N other(s)** →
   `store.tidyRemoveDuplicates(result.artistId, group)`. Both disable on `store.busy()`.

## Code
### `src/app/features/library/library-tidy/library-tidy.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { DuplicateGroup } from '../../../core/models/library-analysis';
import { ArtistTidyResult, LibraryStore } from '../library-store';

/** Library-wide tidy: scans every artist's discography for relink + duplicate work and resolves it. */
@Component({
  selector: 'app-library-tidy',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './library-tidy.html',
  styleUrl: './library-tidy.scss',
})
export class LibraryTidy {
  protected readonly store = inject(LibraryStore);

  constructor() {
    this.store.initMaster();
  }

  protected year(releaseDate: string): string {
    return releaseDate.slice(0, 4);
  }

  protected scan(): void {
    void this.store.scanLibraryTidy();
  }

  protected relinkAll(result: ArtistTidyResult): void {
    void this.store.tidyRelinkAll(result.artistId);
  }

  protected removeDuplicates(result: ArtistTidyResult, group: DuplicateGroup): void {
    void this.store.tidyRemoveDuplicates(result.artistId, group);
  }
}
```

### `src/app/features/library/library-tidy/library-tidy.html`
```html
<section class="tidy">
  <header class="head">
    <div class="titles">
      <h1>Find duplicates &amp; relinks</h1>
      <p class="sub">
        Scans every artist's discography for songs you've liked on an older release (relink) or on
        more than one album (duplicates), across your whole library.
      </p>
    </div>
    <a mat-stroked-button routerLink="/library" matTooltip="Back to the artist list">
      <mat-icon>arrow_back</mat-icon> Artists
    </a>
  </header>

  @if (!store.hasData()) {
    <div class="empty">
      <mat-icon class="big">auto_fix_high</mat-icon>
      <p>No library scanned yet. Scan your Liked Songs from the Artists page first.</p>
      <a mat-flat-button color="primary" routerLink="/library">Go to Library</a>
    </div>
  } @else {
    <div class="controls">
      <button
        mat-flat-button
        color="primary"
        [disabled]="store.tidyRunning()"
        (click)="scan()"
        matTooltip="Fetches each artist's discography (cached after the first run)"
      >
        <mat-icon>travel_explore</mat-icon>
        {{ store.tidyScanned() ? 'Rescan library' : 'Scan library' }}
      </button>
      @if (store.tidyScanned() && !store.tidyRunning()) {
        <span class="summary">
          {{ store.tidyRelinkTotal() }} to relink · {{ store.tidyDuplicateTotal() }} duplicate
          group(s) · {{ store.tidyResults().length }} artist(s)
        </span>
      }
    </div>

    @if (store.tidyRunning()) {
      <div class="progress">
        <mat-progress-bar
          mode="determinate"
          [value]="(store.tidyProgress().done / (store.tidyProgress().total || 1)) * 100"
        />
        <span class="muted">
          Scanning {{ store.tidyProgress().done }} / {{ store.tidyProgress().total }} artists… found
          {{ store.tidyResults().length }} so far
        </span>
      </div>
    }

    @for (result of store.tidyResults(); track result.artistId) {
      <div class="artist">
        <div class="artist-head">
          <a
            class="name"
            [routerLink]="['/library/artist', result.artistId]"
            matTooltip="Open this artist to review each change in detail"
            >{{ result.name }}</a
          >
          <span class="chips">
            @if (result.relinks.length > 0) {
              <span class="chip relink">{{ result.relinks.length }} to relink</span>
            }
            @if (result.duplicates.length > 0) {
              <span class="chip dup">{{ result.duplicates.length }} duplicate(s)</span>
            }
          </span>
        </div>

        @if (result.relinks.length > 0) {
          <div class="block">
            <div class="block-head">
              <h3>Relink to newer release</h3>
              <button
                mat-flat-button
                color="primary"
                matTooltip="Move every one of these likes onto the newest available release — reversible via the Undo toast"
                [disabled]="store.busy()"
                (click)="relinkAll(result)"
              >
                <mat-icon>moving</mat-icon> Relink all ({{ result.relinks.length }})
              </button>
            </div>
            <ul class="list">
              @for (s of result.relinks; track s.liked.id) {
                <li>
                  <span class="song">{{ s.liked.name }}</span>
                  <span class="muted">
                    {{ s.liked.albumName }} → {{ s.target.album.name }} ({{
                      year(s.target.album.releaseDate)
                    }})
                  </span>
                </li>
              }
            </ul>
          </div>
        }

        @if (result.duplicates.length > 0) {
          <div class="block">
            <div class="block-head"><h3>Duplicates — liked on multiple albums</h3></div>
            @for (g of result.duplicates; track g.recordingKey) {
              <div class="dup-row">
                <span class="song">{{ g.name }}</span>
                <span class="muted"
                  >keep {{ g.keep.albumName }} ({{ year(g.keep.releaseDate) }})</span
                >
                <button
                  mat-button
                  matTooltip="Keep the newest copy and remove the other liked copies — reversible via the Undo toast"
                  [disabled]="store.busy()"
                  (click)="removeDuplicates(result, g)"
                >
                  Remove {{ g.copies.length - 1 }} other(s)
                </button>
              </div>
            }
          </div>
        }
      </div>
    } @empty {
      @if (store.tidyScanned() && !store.tidyRunning()) {
        <div class="clean">
          <mat-icon>check_circle</mat-icon>
          <p>Nothing to tidy — no duplicates or relinkable tracks found. Nice library!</p>
        </div>
      }
    }
  }
</section>
```

### `src/app/features/library/library-tidy/library-tidy.scss`
```scss
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
}

.tidy {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  .sub {
    margin: 0.25rem 0 0;
    max-width: 44rem;
    opacity: 0.7;
  }
}

.empty,
.clean {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 3rem 1rem;
  border: 1px dashed var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.18));
  border-radius: 12px;

  .big {
    font-size: 3rem;
    width: 3rem;
    height: 3rem;
    opacity: 0.6;
  }

  p {
    margin: 0;
    max-width: 36rem;
    opacity: 0.85;
  }
}

.clean mat-icon {
  color: var(--mat-sys-primary, #4dd0c7);
  font-size: 2.5rem;
  width: 2.5rem;
  height: 2.5rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;

  .summary {
    opacity: 0.75;
    font-size: 0.9rem;
  }
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .muted {
    opacity: 0.65;
    font-size: 0.85rem;
  }
}

.artist {
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.12));
  border-radius: 10px;
  padding: 0.75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.artist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;

  .name {
    color: var(--mat-sys-primary, #4dd0c7);
    font-weight: 600;
    font-size: 1.05rem;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .chips {
    display: flex;
    gap: 0.4rem;
  }
}

.chip {
  font-size: 0.78rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.08));

  &.relink {
    color: #ffce6b;
  }

  &.dup {
    color: #ff8a80;
  }
}

.block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;

    h3 {
      margin: 0;
      font-size: 0.95rem;
      opacity: 0.85;
    }
  }
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.9rem;
  }
}

.dup-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.song {
  font-weight: 500;
}

.muted {
  opacity: 0.65;
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the page compiles against the
      store's tidy signals.
- [ ] Via `/library/tidy` (step 17): **Scan library** shows a determinate progress bar (*"Scanning X / Y
      artists…"*) and streams in per-artist cards with relink/duplicate chips; when clean, the *"Nothing to tidy
      — … Nice library!"* state shows.

## If it breaks
- **Scan button does nothing / instantly "done"** → `scanLibraryTidy` iterates `globe.artists()` filtered to
  `trackCount > 0`; with no scanned globe dataset there are no artists — run a library scan first (the empty
  state guards this with `!store.hasData()`).
- **Progress bar divides by zero / stays at 0** → the `(done / (total || 1)) * 100` guard handles an empty total;
  keep the `|| 1`.
- **A resolved artist's card lingers after fixing everything** → `refreshTidyArtist` (in the store) drops an
  entry once its relinks + duplicates are both empty; it runs after each tidy action.

---
> Nav: [← The all-liked-songs page](15_liked-songs.md) · [Overview](00_overview.md) · [Header link + routes →](17_header-routes.md)
