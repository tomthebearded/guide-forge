# M6 · Step 08 of 11 — The `country-picker` autocomplete
> Nav: [← globe-store grow](07_globe-store-grow.md) · [Overview](00_overview.md) · [unplaced-artists →](09_unplaced-artists.md)

This step touches **3 files, committed together**: `country-picker.ts`, `.html`, `.scss`. It lives in
**`src/app/shared/components/country-picker/`** (shared — the picker is reused elsewhere later), not under
`features/globe`.

## Glossary for this step
> **`mat-autocomplete`** — Angular Material's text input with a filterable dropdown of options. See the [Material autocomplete docs](https://material.angular.dev/components/autocomplete/overview).
> **`toSignal`** — bridges an RxJS Observable into a signal so a reactive-forms `valueChanges` stream can drive `computed()`s. Used here at the one async edge, per [conventions](../foundation/conventions.md#language--framework-specifics-angular-21-zoneless).

## Why / design
To fix an unplaced artist, the user needs to choose from ~200 countries. A plain `<select>` is miserable; a
**searchable** autocomplete (type "germ" → Germany) is the right control. This is a reusable **dumb** control:
it takes the current `code` and the `countries` list, and emits `codeChange` when the user picks one. It owns
one reactive `FormControl` for the typed text, filters the list with a `computed()`, and shows a flag beside
every option (and in the trigger prefix).

The one subtlety is the two-way display sync: an `effect()` mirrors the committed `code` input back into the
field's text **without re-emitting** (`{ emitEvent: false }`), so when the parent sets a country the trigger
shows its name — but selecting an option is what emits `codeChange`.

## Do this
1. Create `src/app/shared/components/country-picker/` and the three files below.
2. Import the Material modules it uses (`MatAutocompleteModule`, `MatFormFieldModule`, `MatInputModule`,
   `MatIconModule`, `MatTooltipModule`), `ReactiveFormsModule`, the `Country` model, and `CountryFlag`.
   Material was installed in M0 (`ng add @angular/material`) — no new dependency.
3. The `FormControl<string | Country>` holds **either** free-typed text (while filtering) **or** the selected
   `Country` (after a pick). `displayWith` renders a picked `Country` as its `.name` and leaves typed text as-is.
4. `codeChange` emits the **ISO code string**, not the `Country` object — that's the contract callers (step 09)
   depend on. The selector `app-country-picker` is load-bearing.
5. `panelWidth="320"` and the `.country-panel` `::ng-deep` `white-space: nowrap` keep flag + full country name
   on one line — cosmetic, keep them.
   > **`::ng-deep` is officially deprecated** but has no drop-in replacement yet, and it's still the pragmatic
   > way to reach *inside* an Angular Material component's own DOM (the autocomplete panel is rendered in an
   > overlay outside this component's styles). We scope it tightly under `.country-panel` so it can't leak. If
   > Angular ever removes it, move these rules to the global `styles.scss` instead. [Docs](https://angular.dev/guide/components/styling#ng-deep).

## Code
### `src/app/shared/components/country-picker/country-picker.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { startWith } from 'rxjs';

import { Country } from '../../../core/models/country';
import { CountryFlag } from '../../../features/globe/country-flag/country-flag';

/**
 * Searchable country picker on `mat-autocomplete`: type to filter by name, with a flag + name shown
 * both in every option and (via the prefix + committed text) in the trigger. Reusable dumb control —
 * takes the current `code` + the `countries` list, emits `codeChange` on selection.
 */
@Component({
  selector: 'app-country-picker',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    CountryFlag,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './country-picker.html',
  styleUrl: './country-picker.scss',
})
export class CountryPicker {
  /** Currently-selected ISO alpha-2, or null when unset. */
  readonly code = input<string | null>(null);
  readonly countries = input<Country[]>([]);
  readonly label = input('Origin');
  readonly codeChange = output<string>();

  /** Holds either free-typed text (while filtering) or the selected {@link Country} (post-pick). */
  protected readonly control = new FormControl<string | Country>('', { nonNullable: true });

  private readonly value = toSignal(this.control.valueChanges.pipe(startWith('')), {
    initialValue: '' as string | Country,
  });

  /** Countries whose name contains the current query (all when the query is empty / a selection). */
  protected readonly filtered = computed<Country[]>(() => {
    const v = this.value();
    const query = typeof v === 'string' ? v.trim().toLowerCase() : '';
    const list = this.countries();
    return query === '' ? list : list.filter((c) => c.name.toLowerCase().includes(query));
  });

  constructor() {
    // Mirror the committed `code` (and the async-loaded list) into the field's display text without
    // re-emitting, so the trigger shows the selected country's name when the parent sets it.
    effect(() => {
      const code = this.code();
      const match = this.countries().find((c) => c.code === code) ?? null;
      this.control.setValue(match ?? '', { emitEvent: false });
    });
  }

  /** Render a selected country as its name; a raw typed string stays as-is. */
  protected readonly display = (value: string | Country | null): string =>
    value === null || typeof value === 'string' ? (value ?? '') : value.name;

  protected onSelected(event: MatAutocompleteSelectedEvent): void {
    const country = event.option.value as Country;
    this.codeChange.emit(country.code);
  }
}
```

### `src/app/shared/components/country-picker/country-picker.html`
```html
<mat-form-field appearance="outline" subscriptSizing="dynamic" class="picker">
  <mat-label>{{ label() }}</mat-label>
  @if (code(); as code) {
    <app-country-flag matPrefix [code]="code" />
  } @else {
    <mat-icon matPrefix>public</mat-icon>
  }
  <input
    matInput
    type="text"
    placeholder="Search a country"
    [formControl]="control"
    [matAutocomplete]="auto"
    matTooltip="Type to search, then pick this artist's country of origin"
  />
  <mat-autocomplete
    #auto
    [displayWith]="display"
    [panelWidth]="320"
    class="country-panel"
    (optionSelected)="onSelected($event)"
  >
    @for (country of filtered(); track country.code) {
      <mat-option [value]="country">
        <app-country-flag [code]="country.code" />
        <span class="cname">{{ country.name }}</span>
      </mat-option>
    } @empty {
      <mat-option disabled>No match</mat-option>
    }
  </mat-autocomplete>
</mat-form-field>
```

### `src/app/shared/components/country-picker/country-picker.scss`
```scss
.picker {
  width: 100%;
}

// Flag + name sit inline in the trigger prefix and every option.
app-country-flag {
  margin-right: 0.4rem;
  vertical-align: middle;
}

.cname {
  vertical-align: middle;
}

// Keep option rows on one line so flag + full country name never truncate in the panel.
::ng-deep .country-panel .mat-mdc-option {
  white-space: nowrap;
}
```

## Done when (this step)
- [ ] `npm run build` → compiles clean (Material modules resolve; no `any`).
- [ ] Once wired (step 09/10), typing "ger" narrows the dropdown to Germany etc., each row shows a flag +
      name, and picking one fills the trigger with that country's name.

## If it breaks
- **`No provider for ...` / Material styles missing** → `ng add @angular/material` (M0) didn't run, or its
  theme import was removed from `styles.scss`. Re-check M0.
- **The dropdown is empty** → the parent passed an empty `countries` array; the page loads it from
  `GeoData.countries()` (step 10) — that promise may not have resolved yet, or the GeoJSON asset is missing.
- **Picking an option does nothing** → `codeChange` isn't bound by the parent, or `onSelected` isn't wired to
  `(optionSelected)`.
