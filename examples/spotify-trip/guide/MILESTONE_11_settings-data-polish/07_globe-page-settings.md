# M11 · Step 07 of 10 — Host the panel + wire palette / day / marker + "Save image"
> Nav: [← The settings panel](06_settings-panel.md) · [Overview](00_overview.md) · [View-options "Save image" →](08_view-options-save-image.md)

> **This step touches 3 files, committed together:** `features/globe/globe-page/globe-page.ts` + `.html` +
> `.scss` — the smart owner that mounts the gear panel and feeds the store's appearance into the canvas.

## Why / design
The globe page is where appearance becomes visible. Four edits, all additive over the M9 page (which keeps its
D8 heat-mode toggle + legend, filters, timeline, hover, journey — unchanged):

1. **Inject the store, host the panel.** `settings = inject(SettingsStore)` and `<app-settings-panel>` in the
   template. The panel edits the store; the page reads it.
2. **Feed the canvas.** Bind `[palette]="settings.palette()"`, `[dayMode]="settings.dayMode()"`, and
   `[markerIcon]="settings.markerIcon()"` — all three are **new** bindings. M8/M9 flew a fixed plane with no
   marker binding at all; the picker (and the store signal behind it) arrive in this milestone.
3. **Grab the canvas for capture.** `canvas = viewChild(GlobeCanvas)` so `saveImage()` can call its `capture()`.
4. **`saveImage()`** — snapshot to a PNG, name it after the newest liked date (`store.dateRange().newest`, M9),
   and click a synthetic `<a download>`. Triggered by the view-options fab (step 08) — the page owns the action.

## Do this
1. Replace `globe-page.ts` — add `viewChild` to the `@angular/core` import; add `SettingsPanel` (imports array)
   + `SettingsStore`; add the `settings`, `canvas` members and `saveImage()`. (M8/M9's page had no `markerIcon`
   field or binding — nothing to remove.)
2. Replace `globe-page.html` — add `<app-settings-panel class="settings" />`, the three canvas bindings, and
   `(saveImage)="saveImage()"` on `<app-view-options>`.
3. Replace `globe-page.scss` — add the `.settings` position (paired left of the view-options fab).

## Code
### `src/app/features/globe/globe-page/globe-page.ts`
```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { ViewPrefsCache } from '../../../core/cache/view-prefs-cache';
import { countryCentroids, GeoData, greatCircleKm, LatLng } from '../../../core/geo/geo-data';
import { LogStore } from '../../../core/logging/log-store';
import { Country } from '../../../core/models/country';
import { SettingsPanel } from '../../settings/settings-panel/settings-panel';
import { SettingsStore } from '../../settings/settings-store';
import { CountryHover } from '../country-hover/country-hover';
import { CountryStat, CountryStats, StatBoard } from '../country-stats/country-stats';
import { EraFilter } from '../era-filter/era-filter';
import { FlightStore } from '../flight-store';
import { GenreFilter } from '../genre-filter/genre-filter';
import { CountryHoverEvent, GlobeCanvas } from '../globe-canvas/globe-canvas';
import { GlobeStore } from '../globe-store';
import { HeatLegend } from '../heat-legend/heat-legend';
import { JourneyStats, JourneyTotals } from '../journey-stats/journey-stats';
import { LogTerminal } from '../log-terminal/log-terminal';
import { ScanList } from '../scan-list/scan-list';
import { TimelineScrubber } from '../timeline-scrubber/timeline-scrubber';
import { TripLog } from '../trip-log/trip-log';
import { ViewOptions } from '../view-options/view-options';

@Component({
  selector: 'app-globe-page',
  imports: [
    GlobeCanvas,
    ScanList,
    HeatLegend,
    ViewOptions,
    SettingsPanel,
    CountryHover,
    CountryStats,
    TripLog,
    JourneyStats,
    GenreFilter,
    EraFilter,
    TimelineScrubber,
    LogTerminal,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  protected readonly store = inject(GlobeStore);
  /** Live progress lines for the loading-terminal overlay (a scan launched from Actions / boot). */
  protected readonly log = inject(LogStore);
  /** Live appearance settings (colours, day/studio lighting, flight marker) fed into the canvas. */
  protected readonly settings = inject(SettingsStore);
  /** The globe canvas, for the "save image" snapshot. */
  private readonly canvas = viewChild(GlobeCanvas);
  private readonly flight = inject(FlightStore);
  /** Drives the plane animation from live Spotify playback. */
  protected readonly flightTarget = this.flight.target;
  /** Finished stops for the trip log (newest first). */
  protected readonly tripHistory = this.flight.history;

  /** Countries for name lookups, loaded once from the GeoJSON. */
  protected readonly countries = signal<Country[]>([]);
  /** Country centroids + continents, loaded from the GeoJSON for the Trip-mode journey stats. */
  private readonly centroids = signal<ReadonlyMap<string, LatLng>>(new Map());
  private readonly continents = signal<ReadonlyMap<string, string>>(new Map());

  // --- Overlay visibility (persisted; D5 — independent toggles, not a mode switch) ---
  private readonly viewPrefs = inject(ViewPrefsCache);
  protected readonly showStats = signal(true);
  protected readonly showLegend = signal(true);
  /** The flight overlay (plane + route + follow camera). When off it keeps flying, just hidden. */
  protected readonly showFlight = signal(true);
  protected readonly showTripLog = signal(true);
  protected readonly showJourney = signal(true);
  /** The heat-filter bar (genre picker + release-era chips). */
  protected readonly showFilters = signal(true);
  /** The timeline scrubber that replays the map's fill-in over time. */
  protected readonly showTimeline = signal(true);

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

  // --- Heat legend (heat-mode toggle, D8; caption also notes any active filter) ---
  protected readonly legendCaption = computed(() => {
    const metric = this.store.heatMode() === 'hours' ? 'hours' : 'tracks';
    const base = metric === 'hours' ? 'Hours per country' : 'Tracks per country';
    const parts: string[] = [];
    const genre = this.store.genreFilter();
    if (genre !== null) {
      parts.push(genre);
    }
    const decades = this.store.eraDecades();
    if (decades !== null) {
      parts.push(
        [...decades]
          .sort((a, b) => a - b)
          .map((d) => `${String(d % 100).padStart(2, '0')}s`)
          .join('/'),
      );
    }
    const asOf = this.store.asOfMonth();
    if (asOf !== null) {
      parts.push(`through ${asOf}`);
    }
    return parts.length === 0 ? base : `${parts.join(' · ')} · ${metric} per country`;
  });
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

  /**
   * Running totals for the Trip-mode passport. The chronological stop sequence is the history
   * (newest-first) reversed, with the now-playing destination appended as the latest stop; distance
   * sums the great-circle hops between consecutive *known, distinct* countries.
   */
  protected readonly journeyTotals = computed<JourneyTotals>(() => {
    const current = this.flightTarget();
    const stops = [...this.tripHistory()].reverse();
    const codes = stops.map((s) => s.countryCode);
    if (current !== null) {
      codes.push(current.countryCode);
    }

    const centroids = this.centroids();
    const continents = this.continents();
    const countries = new Set<string>();
    const seenContinents = new Set<string>();
    let distanceKm = 0;
    let unknown = 0;
    let prev: LatLng | null = null;
    let prevCode: string | null = null;

    for (const code of codes) {
      if (code === null) {
        unknown++;
        continue;
      }
      countries.add(code);
      const continent = continents.get(code);
      if (continent !== undefined) {
        seenContinents.add(continent);
      }
      const here = centroids.get(code) ?? null;
      if (here !== null && prev !== null && code !== prevCode) {
        distanceKm += greatCircleKm(prev, here);
      }
      if (here !== null) {
        prev = here;
        prevCode = code;
      }
    }

    return {
      distanceKm,
      countries: countries.size,
      continents: seenContinents.size,
      songs: codes.length,
      unknown,
    };
  });

  constructor() {
    // Load the country list (name lookups) + centroids/continents (journey stats) from the GeoJSON.
    const geoData = inject(GeoData);
    void geoData.countries().then((countries) => this.countries.set(countries));
    void geoData.features().then((features) => this.centroids.set(countryCentroids(features)));
    void geoData.continents().then((continents) => this.continents.set(continents));

    // Load overlay-visibility prefs, then persist any change back (D5).
    const prefs = this.viewPrefs.load();
    this.showStats.set(prefs.showStats);
    this.showLegend.set(prefs.showLegend);
    this.showFlight.set(prefs.showFlight);
    this.showTripLog.set(prefs.showTripLog);
    this.showJourney.set(prefs.showJourney);
    this.showFilters.set(prefs.showFilters);
    this.showTimeline.set(prefs.showTimeline);
    effect(() =>
      this.viewPrefs.save({
        showStats: this.showStats(),
        showLegend: this.showLegend(),
        showFlight: this.showFlight(),
        showTripLog: this.showTripLog(),
        showJourney: this.showJourney(),
        showFilters: this.showFilters(),
        showTimeline: this.showTimeline(),
      }),
    );

    // Hiding the scrubber returns the heat to the live view — otherwise a scrubbed-back month would
    // stay frozen on the globe with no visible control to release it.
    effect(() => {
      if (!this.showTimeline()) {
        this.store.setAsOfMonth(null);
      }
    });

    // Drop any stale hover when leaving the globe view (the canvas is destroyed then).
    effect(() => {
      if (this.store.phase() !== 'globe') {
        this.hoveredCode.set(null);
      }
    });
    // NOTE: restoring saved data + the boot-sync refresh live in the app root (App), so they run on
    // any landing route — not just when the globe page mounts. (M9, step 14.)
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

  /** Hide every overlay for a bare-globe view. */
  protected hideAll(): void {
    this.showStats.set(false);
    this.showLegend.set(false);
    this.showFlight.set(false);
    this.showTripLog.set(false);
    this.showJourney.set(false);
    this.showFilters.set(false);
    this.showTimeline.set(false);
  }

  /** Snapshot the globe to a PNG and trigger a download (named after the newest liked date). */
  protected saveImage(): void {
    const dataUrl = this.canvas()?.capture();
    if (!dataUrl) {
      return;
    }
    const stamp = (this.store.dateRange().newest ?? '').slice(0, 10) || 'globe';
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `earthviewmusic-${stamp}.png`;
    link.click();
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
  <app-globe-canvas
    class="globe"
    [heat]="store.heat()"
    [flightTarget]="flightTarget()"
    [flightVisible]="showFlight()"
    [palette]="settings.palette()"
    [dayMode]="settings.dayMode()"
    [markerIcon]="settings.markerIcon()"
    (countryHover)="onHover($event)"
  />

  <app-settings-panel class="settings" />

  <!-- Top-centre: heat filters — genre (where) + release-era decades (when). -->
  @if (
    showFilters() &&
    store.hasData() &&
    (store.availableGenres().length > 0 || store.availableDecades().length > 1)
  ) {
    <div class="filters">
      @if (store.availableGenres().length > 0) {
        <app-genre-filter
          [genres]="store.availableGenres()"
          [selected]="store.genreFilter()"
          (genreChange)="store.setGenre($event)"
        />
      }
      @if (store.availableDecades().length > 1) {
        <app-era-filter
          [decades]="store.availableDecades()"
          [selected]="store.eraDecades()"
          (selectionChange)="store.setEraDecades($event)"
        />
      }
    </div>
  }

  <!-- Bottom-centre: timeline scrubber — replays how the map filled in over the months. -->
  @if (showTimeline() && store.hasData() && store.timelineMonths().length > 1) {
    <app-timeline-scrubber
      class="timeline"
      [months]="store.timelineMonths()"
      (monthChange)="store.setAsOfMonth($event)"
    />
  }

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

  <!-- Top-left: the trip log (scan controls + couldn't-place list now live on the Actions page). -->
  <div class="stack-tl">
    @if (showTripLog()) {
      <app-trip-log [current]="flightTarget()" [history]="tripHistory()" />
    }
  </div>

  <!-- Bottom-left: journey passport → heat-mode toggle (D8) → legend. -->
  <div class="stack-bl">
    @if (showJourney() && journeyTotals().songs > 0) {
      <app-journey-stats [stats]="journeyTotals()" />
    }

    @if (store.heat().size > 0) {
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
      @if (showLegend()) {
        <app-heat-legend [max]="legendMax()" [caption]="legendCaption()" [unit]="legendUnit()" />
      }
    }
  </div>

  <!-- Bottom-right: leaderboards, above the view-options fab. -->
  @if (showStats() && store.heat().size > 0) {
    <app-country-stats class="stats" [boards]="statBoards()" />
  }

  <!-- Overlay-visibility fab (bottom-right corner). -->
  <app-view-options
    class="view-options"
    [showStats]="showStats()"
    [showLegend]="showLegend()"
    [showFlight]="showFlight()"
    [showTripLog]="showTripLog()"
    [showJourney]="showJourney()"
    [showFilters]="showFilters()"
    [showTimeline]="showTimeline()"
    (toggleStats)="showStats.set($event)"
    (toggleLegend)="showLegend.set($event)"
    (toggleFlight)="showFlight.set($event)"
    (toggleTripLog)="showTripLog.set($event)"
    (toggleJourney)="showJourney.set($event)"
    (toggleFilters)="showFilters.set($event)"
    (toggleTimeline)="showTimeline.set($event)"
    (saveImage)="saveImage()"
    (hideAll)="hideAll()"
  />
} @else {
  <app-scan-list
    class="scan"
    [artists]="store.artists()"
    [phase]="store.phase()"
    [resolving]="store.isResolving()"
    (done)="store.showGlobe()"
  />
}

<!-- Loading terminal: a blocking overlay streaming a scan's progress (launched from Actions / boot). -->
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

// Top-left column: the trip log (scan HUD moved to the Actions page in M9).
.stack-tl {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  max-width: 17rem;
}

// Top-centre: heat filters (genre picker + era chips). Centred and capped so it never collides with
// the top-left trip log; wraps to stack on narrow viewports.
.filters {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 1rem;
  max-width: min(46rem, calc(100vw - 2rem));
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

// Bottom-centre: the timeline scrubber. Kept clear of the bottom-left journey/legend stack and the
// bottom-right stats/fab; shrinks its own track on narrow viewports.
.timeline {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  max-width: calc(100vw - 2rem);
}

// Bottom-left column: journey passport → heat-mode toggle → legend.
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

// Segmented tracks/hours toggle (guide extension, D8).
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

// Leaderboards sit above the view-options fab (bottom-right) so both share the corner.
.stats {
  position: absolute;
  bottom: 4.5rem;
  right: 1rem;
  z-index: 1;
}

.view-options {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 2;
}

// The gear panel: pair with the view-options fab, one fab-width to its left in the bottom-right corner.
.settings {
  position: absolute;
  bottom: 1rem;
  right: 4.75rem;
  z-index: 2;
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
- [ ] `npm run build` → clean. Open `/globe`: a **gear fab** sits just left of the visibility fab (bottom-right).
      Click it → the appearance panel opens.
- [ ] Change **Globe ocean** and drag a **Heat** swatch → the sphere + heat ramp recolour **instantly**; toggle
      **Day mode** → the globe shifts to a lit-hemisphere/night look; pick a marker → the flying icon changes on
      the next arc. Reload → all choices persist (`localStorage['evm.appearance']`).

## If it breaks
- **`app-settings-panel` is not a known element** → `SettingsPanel` missing from the component `imports` array.
- **Globe doesn't recolour when a swatch moves** → the canvas `[palette]` binding is missing, or step 04's
  `palette` effect/flush wasn't added.
- **`this.canvas() is undefined` in `saveImage`** → `viewChild(GlobeCanvas)` returns `undefined` while on the
  scan phase (no canvas mounted); guard with `?.` as shown and only save from the globe phase.
- **Gear overlaps the visibility fab** → both are `bottom: 1rem` in the corner; the gear's `right: 4.75rem`
  offsets it one fab-width left — keep the two distinct `right` values.
