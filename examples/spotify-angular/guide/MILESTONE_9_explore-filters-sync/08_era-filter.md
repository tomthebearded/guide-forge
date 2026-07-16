# M9 · Step 08 of 14 — The release-era filter
> Nav: [← The genre filter](07_genre-filter.md) · [Overview](00_overview.md) · [The timeline scrubber →](09_timeline-scrubber.md)

> **This step touches 3 files, committed together:** `features/globe/era-filter/era-filter.ts` + `.html` +
> `.scss` — a dumb chip-list that toggles release decades in/out of the filter.

## Glossary for this step
> **release era / decade** — the decade a track was *released* (from its album's `release_date`), bucketed to
> the decade-start year (1990, 2000, …). The era filter restricts the heat to tracks in the chosen decade(s),
> so the globe recolours by *when* the music was made — this is one of the two **temporal filters** that flips
> the store to its per-track pass (step 04).

## Why / design
Multiple decades can be active at once (you might want both `80s` and `90s`), so this is a **multi-select chip
list**, not a dropdown. It's dumb: `decades` (the options with counts, from `store.availableDecades()`),
`selected` (the current set), and `selectionChange` emitting the **new set** — or `null` when the last chip is
cleared / "All eras" is clicked. The page turns that into `store.setEraDecades(...)`.

Emitting a `ReadonlySet<number> | null` (rather than mutating in place) keeps the component pure — it builds a
fresh `Set` on each toggle so the page's `input` reference actually changes and OnPush re-renders.

**Recurring model (Material 3):** `mat-chip-listbox` with `multiple`; each `mat-chip-option` reflects
`[selected]` and toggles on `(click)`. A dedicated "All eras" chip clears the filter.

## Do this
1. Create the three `era-filter` files. `DecadeOption` (`{ decade, count }`) is **exported** and matches
   `store.availableDecades()`.
2. `label(decade)` renders the short chip text: `1990 → "90s"`, `2000 → "00s"` (the leading `String(d % 100)`
   is zero-padded).

## Code
### `src/app/features/globe/era-filter/era-filter.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

/** One selectable release decade plus how many placed liked tracks fall in it. */
export interface DecadeOption {
  /** Decade-start year, e.g. 1990. */
  decade: number;
  count: number;
}

/**
 * Chips that filter the globe heat to one or more release decades — recolouring the map by *when*
 * the music was made. Dumb: the page owns the available decades and current selection; this emits
 * the new decade set (or null when nothing / "All" is chosen).
 */
@Component({
  selector: 'app-era-filter',
  imports: [MatChipsModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './era-filter.html',
  styleUrl: './era-filter.scss',
})
export class EraFilter {
  readonly decades = input<readonly DecadeOption[]>([]);
  readonly selected = input<ReadonlySet<number> | null>(null);
  readonly selectionChange = output<ReadonlySet<number> | null>();

  /** True when no decade is picked — the "All eras" chip is active and the heat spans every era. */
  protected readonly allActive = computed(() => {
    const set = this.selected();
    return set === null || set.size === 0;
  });

  protected isSelected(decade: number): boolean {
    return this.selected()?.has(decade) ?? false;
  }

  /** Toggle a decade in/out of the selection, emitting null once the last one is cleared. */
  protected toggle(decade: number): void {
    const next = new Set(this.selected() ?? []);
    if (next.has(decade)) {
      next.delete(decade);
    } else {
      next.add(decade);
    }
    this.selectionChange.emit(next.size === 0 ? null : next);
  }

  protected clear(): void {
    this.selectionChange.emit(null);
  }

  /** 1990 → "90s", 2000 → "00s" — the short chip label. */
  protected label(decade: number): string {
    return `${String(decade % 100).padStart(2, '0')}s`;
  }
}
```

### `src/app/features/globe/era-filter/era-filter.html`
```html
<mat-chip-listbox aria-label="Filter heat by release decade" multiple>
  <mat-chip-option [selected]="allActive()" (click)="clear()">All eras</mat-chip-option>
  @for (option of decades(); track option.decade) {
    <mat-chip-option
      [selected]="isSelected(option.decade)"
      (click)="toggle(option.decade)"
      [matTooltip]="option.count + ' tracks'"
    >
      {{ label(option.decade) }}
    </mat-chip-option>
  }
</mat-chip-listbox>
```

### `src/app/features/globe/era-filter/era-filter.scss`
```scss
:host {
  display: block;
}

mat-chip-listbox {
  // Keep the chip row tight so it sits cleanly beside the genre picker in the filters bar.
  --mdc-chip-container-height: 2rem;
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the component compiles.
- [ ] No consumer yet (wired in step 11). Rendered proof — clicking a decade chip re-ramps the globe to that
      era's tracks, "All eras" clears it — is in [step 15](15_verify.md).

## If it breaks
- **`mat-chip-option` unknown element** → `MatChipsModule` must be in `imports`.
- **Clicking a chip does nothing** → the emitted value must be a **new** `Set` (OnPush won't re-render on an
  in-place `.add`/`.delete` of the same reference); `toggle` builds `new Set(...)` for exactly this reason.

---
> Nav: [← The genre filter](07_genre-filter.md) · [Overview](00_overview.md) · [The timeline scrubber →](09_timeline-scrubber.md)
