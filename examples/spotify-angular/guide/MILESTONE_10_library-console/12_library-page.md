# M10 · Step 12 of 18 — The library page
> Nav: [← The artist master table](11_artist-table.md) · [Overview](00_overview.md) · [The two relink dialogs →](13_relink-dialogs.md)

> **This step touches 3 files, committed together:** `features/library/library-page/library-page.ts` + `.html` +
> `.scss` — the smart master page that composes the alphabet bar + table.

## Glossary for this step
> **smart (container) page** — the component that owns the store and wires the dumb children (alphabet bar,
> table) to it: it reads `LibraryStore` signals into the template and forwards their outputs to store methods.
> **first-run banner** — the empty-state shown when no library has been scanned yet: a "Scan my library" button
> that kicks the globe pipeline, with a spinner while it runs.

## Why / design
`LibraryPage` is the `/library` route — the master view. It:

1. Calls **`store.initMaster()`** in the constructor to hydrate the caches + restore the globe dataset, so the
   page shows data on a cold open ([D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles)) without a rescan.
2. Loads the **country list** from `GeoData` for the table's inline origin picker.
3. Shows the **first-run banner** when `!store.hasData()` (scan or scanning), else the console: sub-nav to
   `/library/tracks` + `/library/tidy`, a search box, the status-filter chips, the alphabet bar, a toolbar with
   the show-hidden toggle, and the `ArtistTable`.
4. Navigates to `/library/artist/:id` on `open`.

> **Recurring model — one store per feature ([conventions](../foundation/conventions.md)):** the page holds no
> library state; every binding reads a `LibraryStore` signal and every event calls a store method. The only local
> state is the `countries` list (a view concern) and the static `filters` chip config.

The status filters (`all` / `unreviewed` / `unfollowed` / `no-origin`) are a **worklist** — each narrows to
artists that still need attention. Their `key` values are load-bearing (they're the `ArtistStatusFilter` union
from step 08); the labels/hints are cosmetic.

## Do this
1. Create the three `library-page` files under `src/app/features/library/library-page/`.
2. In the constructor, call `this.store.initMaster()` and load `GeoData().countries()` into the `countries`
   signal. **Don't** eagerly fetch following for the whole list — that's per-artist (loaded on artist open); the
   comment explains why.
3. Wire every `ArtistTable` output to a store method and the alphabet bar to `selectLetter`. The `routerLink`s to
   `/library/tracks` and `/library/tidy` are the sub-nav (routes land in step 17).

## Code
### `src/app/features/library/library-page/library-page.ts`
```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';

import { GeoData } from '../../../core/geo/geo-data';
import { Country } from '../../../core/models/country';
import { AlphabetBar } from '../alphabet-bar/alphabet-bar';
import { ArtistTable } from '../artist-table/artist-table';
import { ArtistStatusFilter, LibraryStore } from '../library-store';

/** Master view: search + filters → alphabet → sortable artist table, with a first-run scan banner. */
@Component({
  selector: 'app-library-page',
  imports: [
    AlphabetBar,
    ArtistTable,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './library-page.html',
  styleUrl: './library-page.scss',
})
export class LibraryPage {
  protected readonly store = inject(LibraryStore);
  private readonly router = inject(Router);

  /** Country options for the master table's inline origin picker. */
  protected readonly countries = signal<Country[]>([]);

  /** Worklist filters for the chip row, each with a tooltip explaining what it narrows to. */
  protected readonly filters: readonly { key: ArtistStatusFilter; label: string; hint: string }[] =
    [
      { key: 'all', label: 'All', hint: 'Show every artist in your library' },
      {
        key: 'unreviewed',
        label: 'Needs review',
        hint: "Only artists you haven't marked as reviewed yet",
      },
      {
        key: 'unfollowed',
        label: 'Not following',
        hint: "Only artists you don't follow on Spotify — a follow-up worklist",
      },
      {
        key: 'no-origin',
        label: 'No origin',
        hint: "Only artists with no country set — these don't colour the globe",
      },
    ];

  constructor() {
    this.store.initMaster();
    void inject(GeoData)
      .countries()
      .then((c) => this.countries.set(c));
    // Following status is per-artist data, so it's fetched only when an artist's page is opened
    // (see LibraryStore.openArtist) — never eagerly for the whole list, which would fire one
    // /me/following/contains request per 50 artists across the entire library on page load.
  }

  protected open(id: string): void {
    void this.router.navigate(['/library/artist', id]);
  }

  protected onSearch(event: Event): void {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }
}
```

### `src/app/features/library/library-page/library-page.html`
```html
<section class="library">
  <header class="head">
    <h1>Library</h1>
    <p class="sub">
      Tidy up your liked songs — relink old album versions, drop duplicates, build playlists.
    </p>
  </header>

  @if (!store.hasData()) {
    <div class="first-run">
      @if (store.scanning()) {
        <mat-spinner [diameter]="36" />
        <p>
          Scanning your Liked Songs… this runs once and can take a few minutes for a big library.
        </p>
      } @else {
        <mat-icon class="big">library_music</mat-icon>
        <p>Scan your Liked Songs to enable this page. It also refreshes your globe.</p>
        <button
          mat-flat-button
          color="primary"
          matTooltip="Read your Liked Songs from Spotify and resolve each artist's country — also refreshes the globe"
          (click)="store.scan()"
        >
          <mat-icon>sync</mat-icon> Scan my library
        </button>
      }
    </div>
  } @else {
    <nav class="subnav">
      <a
        mat-stroked-button
        routerLink="/library/tracks"
        matTooltip="Browse every liked track in one searchable, sortable list"
      >
        <mat-icon>library_music</mat-icon> All liked songs
      </a>
      <a
        mat-stroked-button
        routerLink="/library/tidy"
        matTooltip="Scan your whole library for songs liked on an older release or on more than one album"
      >
        <mat-icon>auto_fix_high</mat-icon> Find duplicates & relinks
      </a>
    </nav>

    <div class="controls">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          type="search"
          placeholder="Search artists"
          matTooltip="Filter the list by artist name — searches across every letter"
          [value]="store.search()"
          (input)="onSearch($event)"
        />
      </mat-form-field>
      <div class="filters">
        @for (f of filters; track f.key) {
          <button
            type="button"
            class="seg"
            [class.active]="store.statusFilter() === f.key"
            [matTooltip]="f.hint"
            (click)="store.setStatusFilter(f.key)"
          >
            {{ f.label }}
          </button>
        }
      </div>
    </div>

    <app-alphabet-bar
      [available]="store.availableLetters()"
      [selected]="store.selectedLetter()"
      (selectLetter)="store.selectLetter($event)"
    />

    <div class="toolbar">
      @if (store.search().trim()) {
        <span class="hint">Searching all artists for “{{ store.search().trim() }}”.</span>
      } @else if (store.selectedLetter(); as letter) {
        <span class="hint">Showing artists under “{{ letter }}”.</span>
      } @else {
        <span class="hint">Pick a letter, search, or filter your artists.</span>
      }
      @if (store.hiddenCount() > 0 || store.showHidden()) {
        <button
          mat-button
          matTooltip="Artists you've hidden are kept out of the list — toggle to reveal or re-hide them"
          (click)="store.toggleShowHidden()"
        >
          <mat-icon>{{ store.showHidden() ? 'visibility_off' : 'visibility' }}</mat-icon>
          {{ store.showHidden() ? 'Hide hidden' : 'Show hidden (' + store.hiddenCount() + ')' }}
        </button>
      }
    </div>

    <app-artist-table
      [rows]="store.visibleRows()"
      [countries]="countries()"
      [sortKey]="store.sortKey()"
      [sortDir]="store.sortDir()"
      (open)="open($event)"
      (toggleFollow)="store.toggleFollow($event)"
      (hide)="store.hide($event)"
      (unhide)="store.unhide($event)"
      (sortBy)="store.setSort($event)"
      (setCountry)="store.setCountry($event.id, $event.code)"
    />
  }
</section>
```

### `src/app/features/library/library-page/library-page.scss`
```scss
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
}

.library {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.head {
  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  .sub {
    margin: 0.25rem 0 0;
    opacity: 0.7;
  }
}

.first-run {
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

.subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;

  .search {
    flex: 1 1 16rem;
    max-width: 24rem;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
}

// Chip-style segmented filter buttons (mirrors the artist-tidy `.seg` look).
.seg {
  background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.18));
  border-radius: 999px;
  padding: 0.3rem 0.85rem;
  font: inherit;
  font-size: 0.85rem;
  color: inherit;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;

  &:hover {
    border-color: var(--mat-sys-primary, #4dd0c7);
  }

  &.active {
    background: var(--mat-sys-primary, #4dd0c7);
    border-color: var(--mat-sys-primary, #4dd0c7);
    color: var(--mat-sys-on-primary, #00201c);
    font-weight: 600;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2.25rem;

  .hint {
    opacity: 0.65;
    font-size: 0.9rem;
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the page composes `AlphabetBar` +
      `ArtistTable` and resolves `GeoData` + `LibraryStore`.
- [ ] With **no** prior scan, the page shows the *"Scan your Liked Songs to enable this page"* banner + a **Scan
      my library** button. With a prior scan, it shows the search box, the four filter chips, the alphabet bar,
      and the populated table. (Clickable end-to-end once the route lands in step 17.)

## If it breaks
- **Blank page / `No provider for GeoData`** → `GeoData` is the M4 service; confirm the import path
  `../../../core/geo/geo-data` and that M4 is in place.
- **The origin pickers are empty dropdowns** → `countries()` resolved late or empty; it's populated from
  `GeoData().countries()` in the constructor — check that promise isn't rejecting.
- **The first-run banner shows even though you scanned before** → `initMaster()` didn't hydrate `LikedIndex`
  (its `hasData` drives the banner) — confirm `store.initMaster()` runs in the constructor.

---
> Nav: [← The artist master table](11_artist-table.md) · [Overview](00_overview.md) · [The two relink dialogs →](13_relink-dialogs.md)
