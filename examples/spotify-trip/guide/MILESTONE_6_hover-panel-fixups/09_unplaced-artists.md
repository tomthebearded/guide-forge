# M6 · Step 09 of 11 — The `unplaced-artists` fixup list
> Nav: [← country-picker](08_country-picker.md) · [Overview](00_overview.md) · [globe-page wiring →](10_globe-page-wiring.md)

This step touches **3 files, committed together**: `unplaced-artists.ts`, `.html`, `.scss`, in
`src/app/features/globe/unplaced-artists/`.

## Why / design
This is the list of artists the resolver **couldn't place** — the ones you fix by hand. Each row shows the
artist name, a web-search shortcut (Google, pre-seeded with origin-finding keywords), a "hide" button, and —
the point of the milestone — an inline `country-picker`. Picking a country emits `place`, which the page turns
into `store.setCountry(...)` (step 07): the artist gets its country, colours the globe immediately, drops out
of this list, and sticks across reloads.

> ⚠️ **M6 reconstruction — the inline picker.** In the *final* source, `unplaced-artists` dropped its inline
> picker: fixups moved to the M10 **library** master table (filter it to "No origin"). Since that table doesn't
> exist yet, M6 keeps the per-row picker so the fixup actually works — the component's own SCSS still carries
> the `.picker` and `app-country-flag` rules from when it had it. We wire `countries` in and a `place` output
> out. This is the one component we don't port byte-for-byte; it's flagged in the [overview](00_overview.md#design--decisions-folded-in)
> and re-simplified in M10.

It stays a **dumb** component: `artists` + `countries` in, `hide` + `place` out. The page owns the store.

## Do this
1. Create `src/app/features/globe/unplaced-artists/` and the three files below.
2. Import `MatIconModule`, `MatTooltipModule`, the `ArtistOrigin` and `Country` models, and the `CountryPicker`
   (step 08).
3. Add two inputs and two outputs:
   - `artists = input<ArtistOrigin[]>([])` — the unplaced list (the page passes `store.unplaced()`).
   - `countries = input<Country[]>([])` — the picker options (the page passes its loaded country list).
   - `hide = output<string>()` — emits the artist id to dismiss.
   - `place = output<{ artistId: string; code: string }>()` — emits the chosen fixup.
4. In the template, each row ends with `<app-country-picker>` whose `(codeChange)` emits
   `place.emit({ artistId: artist.id, code: $event })`. `searchUrl` builds the Google query — cosmetic keywords,
   any wording works.
5. The selector `app-unplaced-artists` is load-bearing; `place`/`hide`/`artists`/`countries` names are the
   contract the page binds in step 10.

## Code
### `src/app/features/globe/unplaced-artists/unplaced-artists.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ArtistOrigin } from '../../../core/models/artist-origin';
import { Country } from '../../../core/models/country';
import { CountryPicker } from '../../../shared/components/country-picker/country-picker';

/**
 * Lists artists whose country couldn't be resolved, each with an inline country picker to place it by
 * hand (→ `place`), a web-search shortcut, and a hide button (→ `hide`). Dumb: inputs in, outputs out;
 * the page turns `place` into the store's sticky `setCountry`.
 */
@Component({
  selector: 'app-unplaced-artists',
  imports: [MatIconModule, MatTooltipModule, CountryPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unplaced-artists.html',
  styleUrl: './unplaced-artists.scss',
})
export class UnplacedArtists {
  readonly artists = input<ArtistOrigin[]>([]);
  readonly countries = input<Country[]>([]);
  readonly hide = output<string>();
  readonly place = output<{ artistId: string; code: string }>();

  /** Google search pre-seeded with origin-finding keywords for an unplaced artist. */
  protected searchUrl(name: string): string {
    const query = `${name} band artist origin country nationality where from`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
}
```

### `src/app/features/globe/unplaced-artists/unplaced-artists.html`
```html
<section class="panel">
  <h2 class="title">Couldn't place {{ artists().length }}</h2>
  <p class="hint">Pick a country for an artist to place it on the globe — the choice sticks.</p>
  <ul class="list">
    @for (artist of artists(); track artist.id) {
      <li class="row">
        <span class="name" [title]="artist.name">{{ artist.name }}</span>
        <a
          class="icon-btn"
          [href]="searchUrl(artist.name)"
          target="_blank"
          rel="noopener noreferrer"
          matTooltip="Search the web for this artist's origin"
        >
          <mat-icon>search</mat-icon>
        </a>
        <button
          type="button"
          class="icon-btn"
          matTooltip="Hide from this list"
          (click)="hide.emit(artist.id)"
        >
          <mat-icon>visibility_off</mat-icon>
        </button>
        <app-country-picker
          class="picker"
          [countries]="countries()"
          (codeChange)="place.emit({ artistId: artist.id, code: $event })"
        />
      </li>
    }
  </ul>
</section>
```

### `src/app/features/globe/unplaced-artists/unplaced-artists.scss`
```scss
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-violet) 30%, transparent);
  overflow: hidden;
}

.title {
  margin: 0;
  font-size: 1rem;
  color: var(--neon-violet);
}

.hint {
  margin: 0;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

// Rows flow into as many columns as the width allows, then scroll if the list is very long.
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
  gap: 0.25rem 1.25rem;
  max-height: 60vh;
  overflow-y: auto;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0;
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Compact search-link / hide controls between the name and the country picker.
.icon-btn {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
    background: color-mix(in srgb, var(--neon-violet) 22%, transparent);
  }

  mat-icon {
    font-size: 1.1rem;
    width: 1.1rem;
    height: 1.1rem;
  }
}

.picker {
  width: 9rem;
  flex: none;
}

// Flag next to each country name in the picker dropdown (and the selected value).
app-country-flag {
  margin-right: 0.5rem;
  vertical-align: middle;
  transform: scale(0.7);
  transform-origin: left center;
}
```

## Done when (this step)
- [ ] `npm run build` → compiles clean (`CountryPicker`, `Country`, `ArtistOrigin` all resolve).
- [ ] Once wired (step 10), the panel lists each unplaced artist with a name, a search icon, a hide icon, and a
      country picker; picking a country emits `place` (verified end-to-end in step 11).

## If it breaks
- **`app-country-picker` not a known element** → `CountryPicker` missing from `imports`, or the import path is
  wrong (`../../../shared/components/country-picker/country-picker`).
- **The picker dropdown is empty in every row** → the page didn't pass `[countries]`, or `GeoData.countries()`
  hasn't resolved yet (step 10).
- **Picking a country doesn't remove the row** → the page isn't calling `store.setCountry` from `(place)`, so
  `failed` never clears; check step 10's binding.
