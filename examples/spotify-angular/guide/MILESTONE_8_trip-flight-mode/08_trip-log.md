# M8 · Step 08 of 12 — `TripLog` component
> Nav: [← Grow the canvas](07_globe-canvas-flight.md) · [Overview](00_overview.md) · [JourneyStats →](09_journey-stats.md)

This step touches **3 files, committed together**: `trip-log.ts` + `.html` + `.scss` (one dumb component).

## Why / design
`TripLog` is the visible passport page: the destination currently playing on top (flag only, "Now playing"),
then the finished stops beneath — each with its country flag, the band that played, its photo, and the arrival
time. It's a **dumb** component: `input()`s only (`current: FlightTarget | null`, `history: readonly TripStop[]`);
`FlightStore` owns the data and the page feeds it (step 12).

It flattens both inputs into one `LogRow[]` `computed` so the template renders a single list: the current target
becomes a row with `when: null` ("Now playing"), and each history stop becomes a row with a formatted arrival
time. An unknown-origin row shows a `?` badge — and when the artist id is known, that badge links to the artist
page so you can go fix the origin there (that route lands in M10; it's a live link from then on).

Reuses the shared `CountryFlag` component (M6) for the flag.

## Do this
1. Create `src/app/features/globe/trip-log/trip-log.ts` — the dumb component with the `rows` computed.
2. Create `trip-log.html` — the current-on-top list, each row: photo (or a music-note placeholder), band + when,
   and a flag / `?` badge.
3. Create `trip-log.scss` — the pinned card with a scrolling stop list (scrolls after ~5 stops).

## Code
### `src/app/features/globe/trip-log/trip-log.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { CountryFlag } from '../country-flag/country-flag';
import { FlightTarget, TripStop } from '../flight-target';

/** One line in the trip log — the current destination (`when` null) or a finished stop. */
interface LogRow {
  key: string;
  artistId: string | null;
  countryCode: string | null;
  label: string;
  imageUrl: string | null;
  /** Arrival date/time for finished stops; null for the destination currently being played. */
  when: string | null;
}

/** Date + time a song finished, e.g. "11 Jun, 14:32". */
const ARRIVAL_FORMAT = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Trip log for Trip mode: the destination currently playing (flag only, no time) on top, then the
 * stops already reached — each with its country flag, the band that played, its photo, and the
 * arrival time (when that song finished). Dumb: inputs only; {@link FlightStore} owns the data.
 */
@Component({
  selector: 'app-trip-log',
  imports: [MatIconModule, CountryFlag, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trip-log.html',
  styleUrl: './trip-log.scss',
})
export class TripLog {
  readonly current = input<FlightTarget | null>(null);
  readonly history = input<readonly TripStop[]>([]);

  protected readonly rows = computed<LogRow[]>(() => {
    const rows: LogRow[] = [];
    const cur = this.current();
    if (cur !== null) {
      rows.push({
        key: 'current',
        artistId: cur.artistId,
        countryCode: cur.countryCode,
        label: cur.label,
        imageUrl: cur.imageUrl,
        when: null,
      });
    }
    for (const stop of this.history()) {
      rows.push({
        key: `${stop.trackId}-${stop.arrivedAt}`,
        artistId: stop.artistId,
        countryCode: stop.countryCode,
        label: stop.label,
        imageUrl: stop.imageUrl,
        when: ARRIVAL_FORMAT.format(stop.arrivedAt),
      });
    }
    return rows;
  });
}
```

### `src/app/features/globe/trip-log/trip-log.html`
```html
<section class="log">
  <h2 class="title">
    <mat-icon>route</mat-icon>
    Trip log
  </h2>

  @if (rows().length === 0) {
    <p class="empty">Play a song to start your trip.</p>
  } @else {
    <ol class="stops">
      @for (row of rows(); track row.key) {
        <li class="stop" [class.current]="row.when === null">
          @if (row.imageUrl !== null) {
            <img class="photo" [src]="row.imageUrl" [alt]="row.label" width="40" height="40" />
          } @else {
            <span class="photo placeholder"><mat-icon>music_note</mat-icon></span>
          }

          <div class="info">
            <span class="band" [title]="row.label">{{ row.label }}</span>
            <span class="when">
              @if (row.when === null) {
                Now playing
              } @else {
                {{ row.when }}
              }
            </span>
          </div>

          @if (row.countryCode !== null) {
            <app-country-flag [code]="row.countryCode" />
          } @else if (row.artistId !== null) {
            <a
              class="flag-unknown link"
              [routerLink]="['/library/artist', row.artistId]"
              title="Origin unknown — open the artist page to set it"
            >
              ?
            </a>
          } @else {
            <span class="flag-unknown" title="Origin unknown">?</span>
          }
        </li>
      }
    </ol>
  }
</section>
```

### `src/app/features/globe/trip-log/trip-log.scss`
```scss
.log {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 17rem;
  max-height: min(70vh, 34rem);
  padding: 0.9rem 1rem;
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

.empty {
  margin: 0;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

.stops {
  list-style: none;
  // Pull out to the card's padding so the now-playing highlight can bleed to the edge, then re-inset
  // the rows — every row stays aligned with the title while the scrollport clips flush to the edge.
  margin: 0 -0.5rem;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  // Never scroll sideways; scroll vertically only once the trip passes five stops. Five 40px rows +
  // their four 0.5rem gaps, plus the now-playing row's padding.
  max-height: calc(5 * 40px + 4 * 0.5rem + 0.8rem);
  overflow-x: hidden;
  overflow-y: auto;
}

.stop {
  display: flex;
  align-items: center;
  gap: 0.6rem;

  // The destination currently playing stands out from the reached stops.
  &.current {
    padding: 0.4rem 0.5rem;
    // Bleed to the scrollport edge (matches `.stops` padding, so it never overflows horizontally).
    margin: -0.1rem -0.5rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--neon-cyan) 14%, transparent);
  }
}

.photo {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid color-mix(in srgb, var(--neon-teal) 35%, transparent);
}

.photo.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--space-void) 60%, transparent);
  color: var(--mat-sys-on-surface-variant);

  mat-icon {
    font-size: 1.2rem;
    width: 1.2rem;
    height: 1.2rem;
  }
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.band {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--mat-sys-on-surface);
}

.when {
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.flag-unknown {
  flex: 0 0 auto;
  width: 32px;
  text-align: center;
  color: var(--mat-sys-on-surface-variant);
  font-weight: 600;
}

// Unknown origin with a known artist: the badge links to the artist page to set the country.
a.flag-unknown.link {
  text-decoration: none;
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--neon-cyan) 45%, transparent);
  color: var(--neon-cyan);
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, var(--neon-cyan) 16%, transparent);
  }
}
```

## Done when (this step)
- [ ] `npm run build` clean. The component compiles (it's dumb — nothing feeds it until step 12).
- [ ] Rendered later, an empty history + no current shows *"Play a song to start your trip."*; a current target
      shows a highlighted **Now playing** row on top.

## If it breaks
- **`app-country-flag` unknown element** → `CountryFlag` (M6) missing from this component's `imports`.
- **Clicking a `?` badge logs `NG04002` / no route** → expected until M10 adds `/library/artist/:id`; the badge
  link is intentionally forward-looking.
- **Rows don't update when a song changes** → `rows` must be a `computed` reading `current()` + `history()`;
  a plain field wouldn't react.

---
> Nav: [← Grow the canvas](07_globe-canvas-flight.md) · [Overview](00_overview.md) · [JourneyStats →](09_journey-stats.md)
