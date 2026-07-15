# M8 · Step 12 of 12 — Wire it all into the globe page
> Nav: [← ViewOptions](11_view-options.md) · [Overview](00_overview.md) · [Verify the milestone →](13_verify.md)

This step touches **3 files, committed together**: `globe-page.ts` + `.html` + `.scss`. It's where the flight
data, the overlays, and the persisted toggles all meet — on top of M6's globe page (HUD, hover card,
leaderboards, heat-mode toggle, fixups all kept).

## Why / design
The page is the smart component that owns the overlays and feeds the dumb ones:
- **Feed the flight into the canvas.** Inject `FlightStore`, expose `flightTarget = flight.target` and
  `tripHistory = flight.history`, and bind `[flightTarget]` and `[flightVisible]="showFlight()"` on
  `<app-globe-canvas>`. (The marker-icon picker + its `[markerIcon]` binding land in M11.)
- **Compute the passport.** `journeyTotals` walks the trip chronologically (history reversed + the now-playing
  destination), summing `greatCircleKm` between consecutive *known, distinct* countries and counting distinct
  countries/continents/songs/unknowns. Centroids + continents come from the GeoJSON (loaded in the constructor).
- **Persist the overlay toggles.** Load `ViewPrefsCache` into five signals in the constructor, and an `effect()`
  saves them back on any change — the D5 "independent persisted toggles" mechanism.
- **Show the overlays.** Trip log (top-left, under the M6 HUD), passport (bottom-left, above the legend), and the
  view-options fab (bottom-right). Each panel is gated by its `show*` signal; leaderboards + legend now also
  respect `showStats`/`showLegend`.

> Kept from M6 unchanged: the scan HUD (**it stays here until M9 moves it to the Actions page**), the hover
> card, the heat-mode toggle (D8), the leaderboards, and the fixup panel. No filters/timeline/settings-panel —
> those are M9/M11.

## Do this
1. Replace `globe-page.ts` with the version below (M6's page + `FlightStore`, centroids/continents, view-prefs,
   `journeyTotals`, and `hideAll`).
2. Replace `globe-page.html`: bind the flight inputs on the canvas; wrap the HUD + trip log in a top-left stack;
   add the passport above the legend; gate leaderboards/legend on their toggles; add the view-options fab.
3. Replace `globe-page.scss`: make `.hud` a static child of a new `.stack-tl`; add `.view-options`, and move
   `.stats` up so it clears the fab.

## Code
### `src/app/features/globe/globe-page/globe-page.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { ViewPrefsCache } from '../../../core/cache/view-prefs-cache';
import { countryCentroids, GeoData, greatCircleKm, LatLng } from '../../../core/geo/geo-data';
import { LogStore } from '../../../core/logging/log-store';
import { Country } from '../../../core/models/country';
import { CountryHover } from '../country-hover/country-hover';
import { CountryStat, CountryStats, StatBoard } from '../country-stats/country-stats';
import { FlightStore } from '../flight-store';
import { CountryHoverEvent, GlobeCanvas } from '../globe-canvas/globe-canvas';
import { GlobeStore } from '../globe-store';
import { HeatLegend } from '../heat-legend/heat-legend';
import { JourneyStats, JourneyTotals } from '../journey-stats/journey-stats';
import { LogTerminal } from '../log-terminal/log-terminal';
import { ScanList } from '../scan-list/scan-list';
import { TripLog } from '../trip-log/trip-log';
import { UnplacedArtists } from '../unplaced-artists/unplaced-artists';
import { ViewOptions } from '../view-options/view-options';

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
    TripLog,
    JourneyStats,
    ViewOptions,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  protected readonly store = inject(GlobeStore);
  /** Live progress lines for the loading-terminal overlay. */
  protected readonly log = inject(LogStore);
  private readonly flight = inject(FlightStore);
  /** Drives the plane animation from live Spotify playback. */
  protected readonly flightTarget = this.flight.target;
  /** Finished stops for the trip log (newest first). */
  protected readonly tripHistory = this.flight.history;

  /** Countries for the fixup picker, loaded once from the GeoJSON. */
  protected readonly countries = signal<Country[]>([]);
  /** Country centroids + continents, loaded from the GeoJSON for the Trip-mode journey stats. */
  private readonly centroids = signal<ReadonlyMap<string, LatLng>>(new Map());
  private readonly continents = signal<ReadonlyMap<string, string>>(new Map());
  /** Whether the couldn't-place fixup panel is open. */
  protected readonly showFixups = signal(false);

  // --- Overlay visibility (persisted; D5 — independent toggles, not a mode switch) ---
  private readonly viewPrefs = inject(ViewPrefsCache);
  protected readonly showStats = signal(true);
  protected readonly showLegend = signal(true);
  /** The flight overlay (plane + route + follow camera). When off it keeps flying, just hidden. */
  protected readonly showFlight = signal(true);
  protected readonly showTripLog = signal(true);
  protected readonly showJourney = signal(true);

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

  // --- Heat legend (adapts to the heat mode; the toggle is a guide extension, D8) ---
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
    // Restore the persisted dataset synchronously — NO network. A reload recolours instantly; the
    // scan runs only on demand (the HUD button). (Boot-sync moves this to app root in M9.)
    this.store.restore();
    // Load the country list (fixup picker) + centroids/continents (journey stats) from the GeoJSON.
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
    effect(() =>
      this.viewPrefs.save({
        showStats: this.showStats(),
        showLegend: this.showLegend(),
        showFlight: this.showFlight(),
        showTripLog: this.showTripLog(),
        showJourney: this.showJourney(),
      }),
    );

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

  /** Hide every overlay for a bare-globe view. */
  protected hideAll(): void {
    this.showStats.set(false);
    this.showLegend.set(false);
    this.showFlight.set(false);
    this.showTripLog.set(false);
    this.showJourney.set(false);
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
  <app-globe-canvas
    class="globe"
    [heat]="store.heat()"
    [flightTarget]="flightTarget()"
    [flightVisible]="showFlight()"
    (countryHover)="onHover($event)"
  />

  <!-- Top-left column: scan HUD (moves to the Actions page in M9) over the trip log. -->
  <div class="stack-tl">
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

    @if (showTripLog()) {
      <app-trip-log [current]="flightTarget()" [history]="tripHistory()" />
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

  <!-- Bottom-left column: journey passport over the heat-mode toggle + legend. -->
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
    (toggleStats)="showStats.set($event)"
    (toggleLegend)="showLegend.set($event)"
    (toggleFlight)="showFlight.set($event)"
    (toggleTripLog)="showTripLog.set($event)"
    (toggleJourney)="showJourney.set($event)"
    (hideAll)="hideAll()"
  />

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

// Top-left column: the scan HUD over the trip log. Each child hides independently; the column
// collapses around whatever's left so they never overlap.
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

.hud {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
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
- [ ] `npm run build` clean. On `/globe` with data loaded, playing a song flies/circles the plane; the **Trip
      log** (top-left, under the HUD) and **Passport** (bottom-left, above the legend) fill in; the
      **view-options** fab (bottom-right) toggles each overlay.
- [ ] Toggling **Flight** off hides the plane but the leg keeps advancing; back on, it resumes at the live point.
      Reload → the toggle state persists (`evm.viewPrefs`).

## If it breaks
- **`app-trip-log`/`app-journey-stats`/`app-view-options` unknown element** → missing from the `imports` array.
- **Plane never moves** → `[flightTarget]="flightTarget()"` not bound, or `FlightStore` never runs its effect
  (nothing injected it) — it's injected here, which instantiates the root singleton.
- **Passport stays at 0 km** → `centroids`/`continents` didn't load (GeoJSON asset missing, M4), or
  `journeyTotals` isn't reading `flightTarget()`/`tripHistory()`.
- **HUD and trip log overlap** → `.hud` still has `position: absolute`; in M8 it's a static child of `.stack-tl`.
- **Toggles don't persist** → the `effect()` that calls `viewPrefs.save(...)` was dropped, or a `show*` signal
  isn't read inside it (so the effect doesn't depend on it).
