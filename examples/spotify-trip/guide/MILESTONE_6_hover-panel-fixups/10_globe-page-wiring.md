# M6 · Step 10 of 11 — Wire the globe page
> Nav: [← unplaced-artists](09_unplaced-artists.md) · [Overview](00_overview.md) · [Verify M6 →](11_verify.md)

This step **rewrites 3 files, committed together**: `globe-page.ts`, `.html`, `.scss` (the M5 page). The page is
the **smart** component — it owns the `GlobeStore`, feeds every dumb child its slice, and turns each child's
`output` into a store call. This is where the milestone comes together.

## Why / design
Everything so far has been dumb components with no store. The page is the one place they connect:

- **Hover** — the canvas emits `countryHover` `{code, x, y}`; `onHover` anchors the card to the cursor (flipping
  it above/below, capping its scroll height to the free space) and sets `hoveredCode`. `hoveredArtists` reads
  `store.artistsByCountry().get(code)` and feeds the `country-hover` card.
- **Legend + heat toggle** — the toggle buttons call `store.setHeatMode(...)`; the legend's caption/unit/max are
  `computed()`s that adapt to `store.heatMode()` (converting the ms max to whole hours in hours mode).
- **Leaderboards** — `statBoards` maps the store's three aggregate maps to `StatBoard`s and top-10s them.
- **Fixups** — the `unplaced-artists` panel's `(place)` calls `store.setCountry(...)` (sticky), `(hide)` calls
  `store.hideUnplaced(...)`; the `countries` picker options come from `GeoData.countries()`.
- **Log terminal** — shown whenever `store.isResolving()`, streaming `log.entries()`.

We **keep M5's HUD** (the Load/Recalculate button + counts) — the source relocates scan controls to an Actions
page, but that's **M9**; until then the HUD is how you trigger a scan.

> **Scope note.** The final source page also wires the settings panel, flight/trip-log/journey-stats, the
> genre/era filters, the timeline scrubber, view-options, and save-image. All of those are **M7–M9** — omitted
> here. This is the M6 intermediate page.

## Do this
1. Replace `globe-page.ts` with the version below. Note the country name lookup is memoized
   (`countryByCode` computed) so leaderboard rows don't re-scan the country list on every recompute.
2. Replace `globe-page.html` with the version below. The whole globe UI is gated on `store.phase() === 'globe'`
   (always true for the Liked-Songs source); the `@else` renders the dormant `scan-list` (step 06).
3. Replace `globe-page.scss` with the version below (M5's styles + the new `.stack-bl`, `.heat-toggle`,
   `.stats`, `.hover`, `.fixups`, `.hud__link`).
4. Load-bearing: `[heat]="store.heat()"` on the canvas, `(place)="store.setCountry($event.artistId,
   $event.code)"` on the fixup panel, and the `--artists-max` style binding on the hover card. Positions
   (top-left HUD, bottom-left legend, bottom-right stats) are cosmetic.

## Code
### `src/app/features/globe/globe-page/globe-page.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { GeoData } from '../../../core/geo/geo-data';
import { LogStore } from '../../../core/logging/log-store';
import { Country } from '../../../core/models/country';
import { CountryHover } from '../country-hover/country-hover';
import { CountryStat, CountryStats, StatBoard } from '../country-stats/country-stats';
import { CountryHoverEvent, GlobeCanvas } from '../globe-canvas/globe-canvas';
import { GlobeStore } from '../globe-store';
import { HeatLegend } from '../heat-legend/heat-legend';
import { LogTerminal } from '../log-terminal/log-terminal';
import { ScanList } from '../scan-list/scan-list';
import { UnplacedArtists } from '../unplaced-artists/unplaced-artists';

@Component({
  selector: 'app-globe-page',
  imports: [
    GlobeCanvas,
    CountryHover,
    CountryStats,
    HeatLegend,
    LogTerminal,
    ScanList,
    UnplacedArtists,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  protected readonly store = inject(GlobeStore);
  /** Live progress lines for the loading-terminal overlay. */
  protected readonly log = inject(LogStore);

  /** Countries for the fixup picker, loaded once from the GeoJSON. */
  protected readonly countries = signal<Country[]>([]);
  /** Whether the couldn't-place fixup panel is open. */
  protected readonly showFixups = signal(false);

  // --- Hover card state ---
  /** ISO alpha-2 of the country under the pointer, fed by the globe canvas. */
  protected readonly hoveredCode = signal<string | null>(null);
  /** Cursor position (canvas px) where the current country was entered — anchors the hover card. */
  protected readonly hoverPos = signal({ x: 0, y: 0 });
  /** Place the card below the cursor when there's more room there than above, so it never clips. */
  protected readonly hoverBelow = signal(false);
  /** Max height (px) for the card's artist list, sized to the free space on the chosen side. */
  protected readonly hoverListMax = signal(240);
  /** Pending card dismissal — deferred so the pointer can travel from globe onto the card. */
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly hoveredArtists = computed(() => {
    const code = this.hoveredCode();
    return code === null ? [] : (this.store.artistsByCountry().get(code) ?? []);
  });
  protected readonly hoveredCountryName = computed(() => {
    const code = this.hoveredCode();
    return code === null ? '' : this.countryName(code);
  });

  // --- Heat legend (adapts to the heat mode; the toggle is a guide extension) ---
  protected readonly legendCaption = computed(() =>
    this.store.heatMode() === 'hours' ? 'Hours per country' : 'Tracks per country',
  );
  protected readonly legendUnit = computed(() => (this.store.heatMode() === 'hours' ? 'h' : '♪'));
  /** The hot end of the legend scale, converted to whole hours in 'hours' mode. */
  protected readonly legendMax = computed(() =>
    this.store.heatMode() === 'hours'
      ? Math.round(this.store.maxHeat() / 3_600_000)
      : this.store.maxHeat(),
  );

  /** Top-10 country leaderboards by artists, liked tracks, and liked-music hours. */
  protected readonly statBoards = computed<StatBoard[]>(() => {
    const byArtists = [...this.store.artistsByCountry().entries()].map(([code, artists]) => ({
      code,
      name: this.countryName(code),
      value: artists.length,
    }));
    const byTracks = [...this.store.tracksByCountry().entries()].map(([code, value]) => ({
      code,
      name: this.countryName(code),
      value,
    }));
    const byHours = [...this.store.durationByCountry().entries()].map(([code, ms]) => ({
      code,
      name: this.countryName(code),
      // ms → hours, one decimal place.
      value: Math.round(ms / 360_000) / 10,
    }));
    return [
      { caption: 'Top countries · artists', rows: top10(byArtists) },
      { caption: 'Top countries · tracks', unit: '♪', rows: top10(byTracks) },
      { caption: 'Top countries · hours', unit: 'h', rows: top10(byHours) },
    ];
  });

  constructor() {
    // Restore the persisted dataset synchronously — NO network. A reload recolours instantly; the
    // scan runs only on demand (the HUD button).
    this.store.restore();
    // Load the country list for the fixup picker (async; the picker copes with an empty list).
    const geoData = inject(GeoData);
    void geoData.countries().then((countries) => this.countries.set(countries));
    // Drop any stale hover when leaving the globe view (the canvas is destroyed then).
    effect(() => {
      if (this.store.phase() !== 'globe') {
        this.hoveredCode.set(null);
      }
    });
  }

  /** Scan Liked Songs and resolve countries. The store picks full-vs-incremental from its own state. */
  protected load(): void {
    void this.store.recalculate();
  }

  /**
   * Globe hover changed. A country anchors and shows the card; leaving a country (null) defers the
   * dismissal so the pointer can cross the gap onto the card — `cancelHide` (card mouseenter) keeps
   * it open. The anchor only moves on a country change, so the card stays put to be hovered.
   */
  protected onHover(event: CountryHoverEvent): void {
    if (event.code === null) {
      this.scheduleHide();
      return;
    }
    this.cancelHide();
    // Keep the card on-screen horizontally; translateX(-50%) centres it on this x.
    const half = 192;
    const x = Math.min(Math.max(event.x, half), window.innerWidth - half);
    this.hoverPos.set({ x, y: event.y });

    // Flip the card to whichever side of the cursor has more room, then cap its scroll list to that
    // side's free height so it grows to fit and only scrolls when it genuinely can't.
    const above = event.y;
    const below = window.innerHeight - event.y;
    const placeBelow = below > above;
    const RESERVED = 130; // card header + summary + paddings + 14px cursor gap + edge margin
    this.hoverBelow.set(placeBelow);
    this.hoverListMax.set(Math.max(120, (placeBelow ? below : above) - RESERVED));

    this.hoveredCode.set(event.code);
  }

  protected scheduleHide(): void {
    this.cancelHide();
    this.hideTimer = setTimeout(() => this.hoveredCode.set(null), 220);
  }

  protected cancelHide(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  /** code → country, rebuilt only when the country list changes — so name lookups aren't a linear
   * scan repeated for every leaderboard row on each `statBoards` recompute. */
  private readonly countryByCode = computed(
    () => new Map(this.countries().map((c) => [c.code, c])),
  );

  private countryName(code: string): string {
    return this.countryByCode().get(code)?.name ?? code;
  }
}

/** Highest-value 10, sorted descending. */
function top10(stats: CountryStat[]): CountryStat[] {
  return [...stats].sort((a, b) => b.value - a.value).slice(0, 10);
}
```

### `src/app/features/globe/globe-page/globe-page.html`
```html
@if (store.phase() === 'globe') {
  <app-globe-canvas class="globe" [heat]="store.heat()" (countryHover)="onHover($event)" />

  <!-- Top-left HUD: scan trigger + counts. (Moves to the Actions page in M9.) -->
  <div class="hud">
    <button type="button" class="hud__btn" (click)="load()" [disabled]="store.isResolving()">
      @if (store.isResolving()) {
        Scanning…
      } @else if (store.hasData()) {
        Recalculate
      } @else {
        Load my music
      }
    </button>

    @if (store.hasData() || store.isResolving()) {
      <dl class="hud__stats">
        <div><dt>Resolved</dt><dd>{{ store.resolvedCount() }}</dd></div>
        <div><dt>Unplaced</dt><dd>{{ store.failedCount() }}</dd></div>
        <div><dt>Pending</dt><dd>{{ store.pendingCount() }}</dd></div>
        <div><dt>Artists</dt><dd>{{ store.total() }}</dd></div>
      </dl>

      @if (store.dateRange().oldest !== null) {
        <p class="hud__range">
          {{ store.dateRange().oldest?.slice(0, 10) }} → {{ store.dateRange().newest?.slice(0, 10) }}
        </p>
      }

      @if (store.unplaced().length > 0) {
        <button type="button" class="hud__link" (click)="showFixups.set(!showFixups())">
          {{ showFixups() ? 'Hide' : 'Fix' }} {{ store.unplaced().length }} unplaced
        </button>
      }
    } @else {
      <p class="hud__hint">Load your Liked Songs to colour the globe by artist country.</p>
    }
  </div>

  <!-- Hover card, anchored to the cursor. -->
  @if (hoveredCode() !== null && hoveredArtists().length > 0) {
    <app-country-hover
      class="hover"
      [class.below]="hoverBelow()"
      [style.left.px]="hoverPos().x"
      [style.top.px]="hoverPos().y"
      [style.--artists-max]="hoverListMax() + 'px'"
      [countryCode]="hoveredCode() ?? ''"
      [countryName]="hoveredCountryName()"
      [artists]="hoveredArtists()"
      (mouseenter)="cancelHide()"
      (mouseleave)="scheduleHide()"
    />
  }

  <!-- Bottom-left: heat-mode toggle (guide extension) above the legend. -->
  @if (store.heat().size > 0) {
    <div class="stack-bl">
      <div class="heat-toggle" role="group" aria-label="Heat metric">
        <button
          type="button"
          [class.active]="store.heatMode() === 'tracks'"
          (click)="store.setHeatMode('tracks')"
        >
          ♪ Tracks
        </button>
        <button
          type="button"
          [class.active]="store.heatMode() === 'hours'"
          (click)="store.setHeatMode('hours')"
        >
          h Hours
        </button>
      </div>
      <app-heat-legend [max]="legendMax()" [caption]="legendCaption()" [unit]="legendUnit()" />
    </div>
  }

  <!-- Bottom-right: leaderboards. -->
  @if (store.heat().size > 0) {
    <app-country-stats class="stats" [boards]="statBoards()" />
  }

  <!-- Fixup overlay: couldn't-place list + inline picker → sticky setCountry. -->
  @if (showFixups() && store.unplaced().length > 0) {
    <app-unplaced-artists
      class="fixups"
      [artists]="store.unplaced()"
      [countries]="countries()"
      (place)="store.setCountry($event.artistId, $event.code)"
      (hide)="store.hideUnplaced($event)"
    />
  }
} @else {
  <app-scan-list
    class="scan"
    [artists]="store.artists()"
    [phase]="store.phase()"
    [resolving]="store.isResolving()"
    (done)="store.showGlobe()"
  />
}

<!-- Loading terminal: a blocking, semi-transparent overlay streaming what's being loaded. Keeps a
     live spinner and prevents any action on the controls beneath until the scan finishes. -->
@if (store.isResolving()) {
  <app-log-terminal
    [entries]="log.entries()"
    [resolvedCount]="store.resolvedCount()"
    [pendingCount]="store.pendingCount()"
    [failedCount]="store.failedCount()"
    [total]="store.total()"
  />
}
```

### `src/app/features/globe/globe-page/globe-page.scss`
```scss
:host {
  display: block;
  position: relative;
  // Fill the viewport below the 64px toolbar so the globe sits in full-bleed space.
  height: calc(100dvh - 64px);
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #0b1626 0%, var(--space-void, #070b14) 70%);
}

.globe,
.scan {
  display: block;
  width: 100%;
  height: 100%;
}

.hud {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 16rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.6rem;
  color: #e8f1ff;
  background: rgba(11, 22, 38, 0.72);
  backdrop-filter: blur(6px);
  font: 500 0.9rem/1.3 system-ui, sans-serif;
}

.hud__btn {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: 0;
  border-radius: 0.4rem;
  background: #1db954; // Spotify green — cosmetic
  color: #04210f;
  font: inherit;
  font-weight: 700;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.hud__stats {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.3rem 0.9rem;

  div {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  dt {
    opacity: 0.7;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
}

.hud__range {
  margin: 0;
  opacity: 0.65;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.hud__hint {
  margin: 0;
  opacity: 0.75;
}

// Text-style button that opens the fixup panel.
.hud__link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--neon-violet, #c39bff);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

// Bottom-left column: heat-mode toggle over the legend.
.stack-bl {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
}

// Segmented tracks/hours toggle (guide extension).
.heat-toggle {
  display: inline-flex;
  border-radius: 0.6rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  backdrop-filter: blur(8px);

  button {
    padding: 0.35rem 0.75rem;
    border: 0;
    background: transparent;
    color: var(--mat-sys-on-surface-variant);
    font: var(--mat-sys-body-small);
    cursor: pointer;

    &.active {
      background: color-mix(in srgb, var(--neon-teal) 22%, transparent);
      color: var(--mat-sys-on-surface);
      font-weight: 700;
    }
  }
}

.stats {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 1;
}

// Fixup overlay: centred sheet above the other controls; the panel handles its own scroll.
.fixups {
  position: absolute;
  top: 5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  width: min(48rem, calc(100vw - 2rem));
}

.hover {
  position: absolute;
  // left/top are bound to the cursor position (canvas px); sit just above the cursor by default.
  z-index: 3;
  transform: translate(-50%, calc(-100% - 14px));
  // Hoverable: the user moves onto the card to scroll it and click artist links.
  pointer-events: auto;
}

// Near the top edge, flip below the cursor so the card never clips off-screen.
.hover.below {
  transform: translate(-50%, 14px);
}
```

## Done when (this step)
- [ ] `npm run format:check && npm run lint && npm run build` → all clean
      (`Application bundle generation complete`).
- [ ] `ng serve --host 127.0.0.1 --port 4200`, log in, open `/globe`, click **Load my music** → the globe
      colours, the legend + toggle appear bottom-left, the leaderboards bottom-right, and hovering a country
      shows its card. (Full gate in step 11.)

## If it breaks
- **`store.setHeatMode is not a function`** → step 07's edits didn't land; re-check `globe-store.ts`.
- **The fixup panel button never appears** → `store.unplaced()` is empty (every artist resolved), or the scan
  hasn't run. It only shows when there are unplaced artists.
- **Hover card flickers / won't stay open** → the `(mouseenter)="cancelHide()"` / `(mouseleave)="scheduleHide()"`
  bindings on `<app-country-hover>` are missing, or `.hover { pointer-events: auto }` was dropped.
- **`legendMax()` shows a giant number in hours mode** → you bound `[max]="store.maxHeat()"` directly instead
  of `legendMax()`; hours mode must divide by `3_600_000`.
