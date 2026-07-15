# M9 · Step 07 of 14 — The genre filter
> Nav: [← BootSync + the nav guard](06_boot-sync.md) · [Overview](00_overview.md) · [The release-era filter →](08_era-filter.md)

> **This step touches 3 files, committed together:** `features/globe/genre-filter/genre-filter.ts` + `.html` +
> `.scss` — a dumb component (a Material `mat-select`) that emits the chosen genre.

## Glossary for this step
> **dumb component** — a presentational component with no store access: it takes its data via `input()` and
> reports user actions via `output()`. The page owns the state; the component just renders + emits. All the M9
> controls are dumb; the globe page (step 11) is the smart owner.

## Why / design
The genre filter is a single-select dropdown over the genre tags the scan enriched (`availableGenres` from
step 04). It's deliberately dumb: it takes `genres` (the options, each with a count) + the current `selected`
genre, and emits `genreChange` — the page turns that into `store.setGenre(...)`. Keeping it stateless means the
persisted/derived truth lives in one place (the store), and the control can't drift out of sync.

**Recurring model (Material 3):** `mat-select` inside a `mat-form-field appearance="outline"`. We bind
`[value]` and listen to `(selectionChange)` rather than using a form control — the value is owned upstream, so
one-way binding + an event is simpler than two-way. `panelClass` names the dropdown panel for styling.

## Do this
1. Create the three `genre-filter` files. The `GenreOption` interface (`{ genre, count }`) is **exported** — the
   page's `store.availableGenres()` returns exactly this shape, so both sides share the type.
2. The selector `app-genre-filter` keeps the `app-` prefix (house style). Emitting `null` = "All genres".

## Code
### `src/app/features/globe/genre-filter/genre-filter.ts`
```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

/** One selectable genre tag plus how many placed artists carry it. */
export interface GenreOption {
  genre: string;
  count: number;
}

/**
 * Picker that filters the globe heat to a single genre tag (or "All genres"). Dumb: the page owns
 * the available genres and the current selection; this just emits the chosen genre (or null).
 */
@Component({
  selector: 'app-genre-filter',
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './genre-filter.html',
  styleUrl: './genre-filter.scss',
})
export class GenreFilter {
  readonly genres = input<readonly GenreOption[]>([]);
  readonly selected = input<string | null>(null);
  readonly genreChange = output<string | null>();
}
```

### `src/app/features/globe/genre-filter/genre-filter.html`
```html
<mat-form-field appearance="outline" subscriptSizing="dynamic">
  <mat-label>Genre</mat-label>
  <mat-select
    [value]="selected()"
    (selectionChange)="genreChange.emit($event.value)"
    panelClass="genre-filter-panel"
  >
    <mat-option [value]="null">All genres</mat-option>
    @for (option of genres(); track option.genre) {
      <mat-option [value]="option.genre">{{ option.genre }} · {{ option.count }}</mat-option>
    }
  </mat-select>
</mat-form-field>
```

### `src/app/features/globe/genre-filter/genre-filter.scss`
```scss
:host {
  display: block;
}

mat-form-field {
  width: 11rem;
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the component compiles.
- [ ] It has no consumer yet (wired in step 11), so there's nothing to click. Rendered proof — the dropdown lists
      "All genres" + each enriched genre with its count, and picking one recolours the globe — is in
      [step 15](15_verify.md).

## If it breaks
- **`mat-select` unknown element** → `MatSelectModule` (and `MatFormFieldModule`) must be in the component
  `imports` array; both ship with Angular Material (M0).
- **`GenreOption` type mismatch at the call site (step 11)** → the store's `availableGenres()` returns
  `{ genre, count }[]`; import `GenreOption` from this file rather than redeclaring it.
