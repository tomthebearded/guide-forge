# M10 · Step 11 of 18 — The artist master table
> Nav: [← The alphabet bar](10_alphabet-bar.md) · [Overview](00_overview.md) · [The library page →](12_library-page.md)

> **This step touches 3 files, committed together:** `features/library/artist-table/artist-table.ts` + `.html` +
> `.scss` — one dumb table component, so all three in one commit.

## Glossary for this step
> **inline origin picker** — the per-row country dropdown (the M6 `CountryPicker`) that sets an artist's origin
> right in the table, no navigation. Emitting its change writes the manual override back through the store → globe.

## Why / design
`ArtistTable` renders the filtered/sorted `ArtistRow[]` from the store and emits the user's intent — it holds no
state. Each row shows: name (opens the detail), the inline `CountryPicker`, liked-track count, listening hours,
a follow toggle, last-reviewed date, and hide/unhide. Its outputs map 1:1 to `LibraryStore` methods (the page
wires them, step 12):

- **`open`** → navigate to the artist detail.
- **`toggleFollow`** → optimistic follow write-back (step 08 → globe).
- **`hide` / `unhide`** → prefs.
- **`sortBy`** → re-sort (clicking the active column flips direction — the store owns that logic).
- **`setCountry`** → the inline picker's `{ id, code }`.

> **Recurring model — dumb IO ([conventions](../foundation/conventions.md)):** signal `input()`s in, `output()`s
> out; `@if`/`@for`/`@switch`, never the legacy directives. The header sort buttons show the active column's
> direction caret from the `sortKey` / `sortDir` inputs — no local sort state.
>
> **New concept — [`CountryPicker`](../MILESTONE_6_hover-panel-fixups/08_country-picker.md):** the M6 shared
> component (`app-country-picker`) that renders a searchable country dropdown with a flag; it takes a `code`
> input and a `countries` list and emits `codeChange`. Reused here so the table needn't reinvent it.

The `following` tri-state matters: `undefined` (not yet checked) **disables** the toggle so you can't act on
unknown state; `true`/`false` render `how_to_reg` / `person_add_alt`. Field/CSS names are cosmetic; the output
names + the `CountryPicker` contract are load-bearing.

## Do this
1. Create the three `artist-table` files under `src/app/features/library/artist-table/`.
2. Export the `ArtistCountryAssignment` interface (`{ id, code }`) — the page binds `setCountry` against it.
3. Import `CountryPicker`, `Country` (M6), and `ArtistRow` / `ArtistSortKey` / `SortDir` from the store (step 08),
   plus `DatePipe` for the last-reviewed column.

## Code
### `src/app/features/library/artist-table/artist-table.ts`
```ts
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Country } from '../../../core/models/country';
import { CountryPicker } from '../../../shared/components/country-picker/country-picker';
import { ArtistRow, ArtistSortKey, SortDir } from '../library-store';

/** One artist's inline country assignment from the master table. */
export interface ArtistCountryAssignment {
  id: string;
  code: string;
}

/** Artist master table. Dumb: rows + sort state in, intent out. */
@Component({
  selector: 'app-artist-table',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTooltipModule, CountryPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './artist-table.html',
  styleUrl: './artist-table.scss',
})
export class ArtistTable {
  readonly rows = input<ArtistRow[]>([]);
  readonly countries = input<Country[]>([]);
  readonly sortKey = input<ArtistSortKey>('name');
  readonly sortDir = input<SortDir>('asc');

  readonly open = output<string>();
  readonly toggleFollow = output<string>();
  readonly hide = output<string>();
  readonly unhide = output<string>();
  readonly sortBy = output<ArtistSortKey>();
  readonly setCountry = output<ArtistCountryAssignment>();

  /** Rounded listening hours for the "Hours" column (blank under ~0.05 h so it isn't noise). */
  protected hours(durationMs: number): string {
    const h = durationMs / 3_600_000;
    return h < 0.05 ? '—' : h.toFixed(1);
  }
}
```

### `src/app/features/library/artist-table/artist-table.html`
```html
@if (rows().length === 0) {
  <p class="empty">No artists here.</p>
} @else {
  <table class="artists">
    <thead>
      <tr>
        <th scope="col">
          <button
            type="button"
            class="sort"
            matTooltip="Sort by artist name (click again to reverse)"
            (click)="sortBy.emit('name')"
          >
            Artist
            @if (sortKey() === 'name') {
              <mat-icon class="dir">{{
                sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward'
              }}</mat-icon>
            }
          </button>
        </th>
        <th scope="col" class="center" matTooltip="Resolved country of origin — colours the globe">
          Origin
        </th>
        <th scope="col" class="num">
          <button
            type="button"
            class="sort"
            matTooltip="Sort by number of liked tracks (click again to reverse)"
            (click)="sortBy.emit('tracks')"
          >
            Liked
            @if (sortKey() === 'tracks') {
              <mat-icon class="dir">{{
                sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward'
              }}</mat-icon>
            }
          </button>
        </th>
        <th scope="col" class="num">
          <button
            type="button"
            class="sort"
            matTooltip="Sort by total listening hours of liked tracks (click again to reverse)"
            (click)="sortBy.emit('hours')"
          >
            Hours
            @if (sortKey() === 'hours') {
              <mat-icon class="dir">{{
                sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward'
              }}</mat-icon>
            }
          </button>
        </th>
        <th scope="col" class="center">Following</th>
        <th scope="col">
          <button
            type="button"
            class="sort"
            matTooltip="Sort by when you last marked the artist reviewed (click again to reverse)"
            (click)="sortBy.emit('reviewed')"
          >
            Last reviewed
            @if (sortKey() === 'reviewed') {
              <mat-icon class="dir">{{
                sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward'
              }}</mat-icon>
            }
          </button>
        </th>
        <th scope="col" class="center" aria-label="Actions"></th>
      </tr>
    </thead>
    <tbody>
      @for (row of rows(); track row.id) {
        <tr [class.is-hidden]="row.hidden">
          <td>
            <button
              type="button"
              class="name"
              matTooltip="Open this artist to tidy their discography, relink or dedupe tracks, and set their origin"
              (click)="open.emit(row.id)"
            >
              {{ row.name }}
            </button>
          </td>
          <td class="origin-cell">
            <app-country-picker
              [code]="row.countryCode"
              [countries]="countries()"
              label="Origin"
              (codeChange)="setCountry.emit({ id: row.id, code: $event })"
            />
          </td>
          <td class="num">{{ row.trackCount }}</td>
          <td class="num muted">{{ hours(row.durationMs) }}</td>
          <td class="center">
            <button
              mat-icon-button
              [disabled]="row.following === undefined"
              [matTooltip]="
                row.following ? 'Following — click to unfollow' : 'Not following — click to follow'
              "
              (click)="toggleFollow.emit(row.id)"
            >
              <mat-icon>{{ row.following ? 'how_to_reg' : 'person_add_alt' }}</mat-icon>
            </button>
          </td>
          <td>{{ row.reviewedAt ? (row.reviewedAt | date: 'mediumDate') : '—' }}</td>
          <td class="center">
            @if (row.hidden) {
              <button mat-button (click)="unhide.emit(row.id)">Unhide</button>
            } @else {
              <button mat-icon-button matTooltip="Hide this artist" (click)="hide.emit(row.id)">
                <mat-icon>visibility_off</mat-icon>
              </button>
            }
          </td>
        </tr>
      }
    </tbody>
  </table>
}
```

### `src/app/features/library/artist-table/artist-table.scss`
```scss
:host {
  display: block;
}

.empty {
  opacity: 0.6;
  padding: 1rem 0;
}

.artists {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  th,
  td {
    text-align: left;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid var(--mat-sys-outline-variant, rgba(255, 255, 255, 0.12));
  }

  th {
    font-weight: 600;
    opacity: 0.75;
    font-size: 0.85rem;
  }

  .num {
    text-align: right;
    width: 5rem;
  }

  .center {
    text-align: center;
    width: 6rem;
  }

  td.muted {
    opacity: 0.6;
  }

  .no-origin {
    font-size: 1.1rem;
    width: 1.1rem;
    height: 1.1rem;
    opacity: 0.35;
    vertical-align: middle;
  }

  // Inline country picker column — keep it compact so the table stays scannable.
  .origin-cell {
    width: 12rem;

    app-country-picker {
      display: block;
      max-width: 12rem;
    }
  }

  // Clickable sort headers — inherit the header look, add a hover cue + a direction caret.
  .sort {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-weight: 600;
    color: inherit;
    cursor: pointer;

    &:hover {
      opacity: 1;
      color: var(--mat-sys-primary, #4dd0c7);
    }

    .dir {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }
  }

  // Right-aligned numeric headers put the caret on the correct side.
  .num .sort {
    flex-direction: row-reverse;
  }

  tbody tr:hover {
    background: var(--mat-sys-surface-container-high, rgba(255, 255, 255, 0.05));
  }

  tr.is-hidden {
    opacity: 0.5;
  }
}

.name {
  background: none;
  border: none;
  padding: 0;
  color: var(--mat-sys-primary, #4dd0c7);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the table compiles; `CountryPicker`
      and the store's row/sort types resolve.
- [ ] Rendered on the page (step 12): each row shows name + origin picker + counts + a follow icon + reviewed
      date; an artist whose `following` is `undefined` has a **disabled** follow button.

## If it breaks
- **`app-country-picker` renders nothing / errors** → import the M6 `CountryPicker` into the component `imports`
  and pass a non-empty `countries` list (the page loads it from `GeoData`, step 12).
- **The sort caret never appears** → the header buttons compare `sortKey()` to a literal (`'name'` etc.); a typo
  there means the `@if` never matches. The caret direction reads `sortDir()`.
- **`DatePipe` not found in template** → add `DatePipe` to the component `imports` (standalone components declare
  their own pipes).
