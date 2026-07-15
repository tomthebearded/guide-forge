# M6 · Step 04 of 11 — The `country-stats` leaderboards
> Nav: [← country-hover](03_country-hover.md) · [Overview](00_overview.md) · [log-terminal →](05_log-terminal.md)

This step touches **3 files, committed together**: `country-stats.ts`, `.html`, `.scss`.

## Why / design
Where the hover card answers "who's from *this* country," the leaderboards answer "which countries dominate my
library." `country-stats` renders **side-by-side ranked columns** — top countries by artist count, by liked
tracks, and by listening hours. It's another **dumb** component: it takes a `boards` array and renders it. The
page (step 10) computes each board from the store's aggregates and sorts to a top-10.

> **Mental model reinforced — one source of aggregates.** The three boards, the hover card, the legend, and the
> globe heat all descend from M5's single `aggregates` computed (`tracksByCountry`, `durationByCountry`,
> `artistsByCountry`). Because they read the *same* maps, a country's rank in the tracks board and its colour on
> the globe are guaranteed to agree. This is why the store owns aggregation and components stay dumb.
>
> **A note on hours precision (intentional).** The raw metric is milliseconds; only its *display* rounding
> differs by view. The **leaderboard** shows one decimal (`Math.round(ms / 360_000) / 10`) so closely-ranked
> countries stay distinguishable in a top-10; the **hover card** and **legend max** show whole hours
> (`ms / 3_600_000`) where a single figure reads cleaner. Same underlying number — don't "unify" them.

The component exports two interfaces the page (and later steps) reuse: `CountryStat` (one row: code + name +
value) and `StatBoard` (a captioned, optionally unit-suffixed list of pre-sorted rows).

## Do this
1. Create `src/app/features/globe/country-stats/` and the three files below.
2. Import `CountryFlag` in `imports`.
3. `boards` is `input.required<StatBoard[]>()` — the page always supplies it. Each board carries an optional
   `unit` (`'♪'` for tracks, `'h'` for hours; **omitted** for plain artist counts) shown after each value.
4. The rows are rendered **in the order given** — this component does **not** sort. Sorting + top-10 slicing is
   the page's job (step 10), so the store's aggregate maps stay the single source of ordering.
5. The `app-country-flag` rule scales the shared flag down to a compact list size — cosmetic; keep it.

## Code
### `src/app/features/globe/country-stats/country-stats.ts`
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CountryFlag } from '../country-flag/country-flag';

/** A country and its ranked metric (artist count, Σ liked tracks, or Σ liked hours). */
export interface CountryStat {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  value: number;
}

/** One ranked leaderboard: a caption, an optional value unit, and pre-sorted rows. */
export interface StatBoard {
  caption: string;
  /** Suffix shown after each value (e.g. '♪', 'h'); omitted for plain counts. */
  unit?: string;
  rows: CountryStat[];
}

/**
 * Side-by-side country leaderboards (top artists, tracks, listening hours). Dumb: inputs only;
 * the page computes and sorts each board from the store's per-country aggregates.
 */
@Component({
  selector: 'app-country-stats',
  imports: [CountryFlag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './country-stats.html',
  styleUrl: './country-stats.scss',
})
export class CountryStats {
  readonly boards = input.required<StatBoard[]>();
}
```

### `src/app/features/globe/country-stats/country-stats.html`
```html
<section class="stats">
  @for (board of boards(); track board.caption) {
    <div class="col">
      <h3 class="caption">{{ board.caption }}</h3>
      <ol class="list">
        @for (country of board.rows; track country.code) {
          <li class="row">
            <span class="rank">{{ $index + 1 }}</span>
            <app-country-flag [code]="country.code" />
            <span class="name">{{ country.name }}</span>
            <span class="value">
              {{ country.value }}
              @if (board.unit) {
                <span class="unit">{{ board.unit }}</span>
              }
            </span>
          </li>
        }
      </ol>
    </div>
  }
</section>
```

### `src/app/features/globe/country-stats/country-stats.scss`
```scss
.stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem 1.25rem;
  max-width: 90vw;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.caption {
  margin: 0;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font: var(--mat-sys-body-small);
}

.rank {
  width: 1rem;
  text-align: center;
  color: var(--mat-sys-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

app-country-flag {
  // Shrink the shared flag to a compact list size.
  font-size: 0;
  transform: scale(0.6);
  transform-origin: left center;
  margin-right: -0.8rem;
}

.name {
  flex: 1;
  min-width: 6rem;
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value {
  color: var(--neon-teal);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.unit {
  margin-left: 0.15rem;
  font-weight: 400;
  opacity: 0.7;
}
```

## Done when (this step)
- [ ] `npm run build` → compiles clean.
- [ ] Once wired (step 10), three columns appear bottom-right: `Top countries · artists`,
      `Top countries · tracks` (values end in `♪`), `Top countries · hours` (values end in `h`), each up to 10
      rows with a small flag and rank.

## If it breaks
- **`boards is required` build error** → the page must always bind `[boards]`; there's no default. See step 10.
- **All three columns show identical values** → the page passed the same aggregate to all three; check the
  `statBoards` computed maps each board to `artistsByCountry` / `tracksByCountry` / `durationByCountry`
  respectively (step 10).
