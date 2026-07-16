# M8 · Step 09 of 12 — `JourneyStats` (the passport) component
> Nav: [← TripLog](08_trip-log.md) · [Overview](00_overview.md) · [Persist the overlay prefs →](10_view-prefs-cache.md)

This step touches **3 files, committed together**: `journey-stats.ts` + `.html` + `.scss`.

## Glossary for this step
> **great-circle distance** — the shortest distance between two points on a sphere (the "as the crow flies" path
> over the globe's surface), in km. The passport sums it across the trip's hops using the haversine helper
> `greatCircleKm` from `geo-data.ts` (M4). The page does the summing; this component just *displays* the totals.

## Why / design
`JourneyStats` is the compact "passport": distance flown, distinct countries, distinct continents, songs, and
(when any) unknown-origin count. It's a **dumb** component with one required input — a `JourneyTotals` object the
page computes (step 12). It exports the `JourneyTotals` interface so the page can build it.

It only formats: `formatDistance` prints `1,240 km` up to four digits, then `1.2k km` so the card never overflows
on a long trip, and `plural` picks the right label. Keeping the arithmetic in the page and the formatting here is
the usual dumb-component split.

## Do this
1. Create `src/app/features/globe/journey-stats/journey-stats.ts` — export `JourneyTotals`, build the `rows`
   computed, add the `formatDistance`/`plural` helpers.
2. Create `journey-stats.html` — a titled list of icon + value + label rows.
3. Create `journey-stats.scss` — the pinned passport card.

## Code
### `src/app/features/globe/journey-stats/journey-stats.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Running totals for the current trip — distance flown and where it has reached. */
export interface JourneyTotals {
  /** Total great-circle distance flown across all legs, in km. */
  distanceKm: number;
  /** Distinct countries visited (known origins only). */
  countries: number;
  /** Distinct continents touched. */
  continents: number;
  /** Songs played this trip (every stop, including unknown origins). */
  songs: number;
  /** Songs whose artist origin couldn't be placed — they drift over open water. */
  unknown: number;
}

interface StatRow {
  icon: string;
  value: string;
  label: string;
}

/** Compact "passport" of the trip's distance, countries, and continents. Dumb: one input. */
@Component({
  selector: 'app-journey-stats',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './journey-stats.html',
  styleUrl: './journey-stats.scss',
})
export class JourneyStats {
  readonly stats = input.required<JourneyTotals>();

  protected readonly rows = computed<StatRow[]>(() => {
    const s = this.stats();
    const rows: StatRow[] = [
      { icon: 'flight_takeoff', value: formatDistance(s.distanceKm), label: 'flown' },
      {
        icon: 'public',
        value: `${s.countries}`,
        label: plural(s.countries, 'country', 'countries'),
      },
      {
        icon: 'travel_explore',
        value: `${s.continents}`,
        label: plural(s.continents, 'continent', 'continents'),
      },
      { icon: 'music_note', value: `${s.songs}`, label: plural(s.songs, 'song', 'songs') },
    ];
    if (s.unknown > 0) {
      rows.push({ icon: 'help_outline', value: `${s.unknown}`, label: 'unknown' });
    }
    return rows;
  });
}

/** "1,240 km" up to four digits, then "1.2k km" so the card never overflows on a long trip. */
function formatDistance(km: number): string {
  const rounded = Math.round(km);
  if (rounded < 10_000) {
    return `${rounded.toLocaleString()} km`;
  }
  return `${(rounded / 1000).toFixed(rounded < 100_000 ? 1 : 0)}k km`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
```

### `src/app/features/globe/journey-stats/journey-stats.html`
```html
<section class="journey">
  <h2 class="title">
    <mat-icon>luggage</mat-icon>
    Passport
  </h2>

  <ul class="rows">
    @for (row of rows(); track row.label) {
      <li class="row">
        <mat-icon class="icon">{{ row.icon }}</mat-icon>
        <span class="value">{{ row.value }}</span>
        <span class="label">{{ row.label }}</span>
      </li>
    }
  </ul>
</section>
```

### `src/app/features/globe/journey-stats/journey-stats.scss`
```scss
.journey {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 12rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font: var(--mat-sys-title-small);
  color: var(--neon-teal);

  mat-icon {
    font-size: 1.2rem;
    width: 1.2rem;
    height: 1.2rem;
  }
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.icon {
  flex: 0 0 auto;
  align-self: center;
  font-size: 1.05rem;
  width: 1.05rem;
  height: 1.05rem;
  color: color-mix(in srgb, var(--neon-cyan) 80%, transparent);
}

.value {
  font: var(--mat-sys-title-small);
  color: var(--mat-sys-on-surface);
  font-variant-numeric: tabular-nums;
}

.label {
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}
```

## Done when (this step)
- [ ] `npm run build` clean. The component compiles (nothing feeds it until step 12).
- [ ] Rendered later with totals like `{distanceKm: 12500, countries: 4, continents: 2, songs: 6, unknown: 1}`,
      it shows `12.5k km flown`, `4 countries`, `2 continents`, `6 songs`, `1 unknown`.

## If it breaks
- **`stats` is `undefined`** at runtime → it's `input.required`; the page must bind `[stats]` (step 12). The page
  only renders it when `journeyTotals().songs > 0`, so it's never bound to nothing.
- **`mat-icon` shows text, not a glyph** → the Material Icons font isn't loaded (M0 concern); the icon names
  (`flight_takeoff`, `luggage`, …) are valid Material symbols.

---
> Nav: [← TripLog](08_trip-log.md) · [Overview](00_overview.md) · [Persist the overlay prefs →](10_view-prefs-cache.md)
