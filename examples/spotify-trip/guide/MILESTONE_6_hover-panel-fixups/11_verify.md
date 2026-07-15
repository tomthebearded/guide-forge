# M6 · Verify — Hover/select panel + fixups 🔎
> Nav: [← globe-page wiring](10_globe-page-wiring.md) · [Overview](00_overview.md) · [The live player →](../MILESTONE_7_live-player/00_overview.md)

Run the pre-flight quality bar, then work the gate by hand. When it passes, spend a minute actually exploring
and fixing your globe before moving on.

## Done-when gate (the real test — check every box by hand)
Run `npm run format:check`, `npm run lint`, `npm run build` first — all clean (`Application bundle generation
complete`, no lint errors). Then `ng serve --host 127.0.0.1 --port 4200`, log in, open `/globe`, and click
**Load my music** (or reload if you already have data):

- [ ] **Hover → card.** Hover a coloured country → a light pastel card appears anchored to the cursor showing
      that country's **flag**, its **name**, a ranked scrollable list of the **artists placed there** (`1 <name>
      42♪`), and a footer like `12 artists · 240 liked tracks · 63 h`. Moving the pointer onto the card keeps it
      open (you can scroll it and click a name).
- [ ] **Leaderboards.** Bottom-right, three columns: **Top countries · artists**, **· tracks** (values end
      `♪`), **· hours** (values end `h`), each a ranked top-10 with small flags. The tracks board's #1 country
      is the hottest on the globe.
- [ ] **Heat-mode toggle recolours.** In the bottom-left toggle, click **h Hours** → the globe re-ramps by
      per-country listening hours, the legend caption reads `Hours per country`, and its max ends in `h`. Click
      **♪ Tracks** → it returns to `Tracks per country` / `♪`. The globe visibly recolours each time.
- [ ] **Manual fixup is immediate.** Click **Fix N unplaced** in the HUD → the couldn't-place panel opens. Pick
      a country for an artist → that country **immediately** gets (or deepens) its colour on the globe, and the
      artist disappears from the list (`Couldn't place N` decrements).
- [ ] **Fixup is sticky across reload.** Fully reload `/globe` (no scan) → the manually-placed country stays
      coloured. In the console: `JSON.parse(localStorage['evm.origins']).artists.find(a => a.name === '<that
      artist>').manual` → `true`.
- [ ] **Manual wins over auto.** Click **Recalculate**, let it finish → the manually-set artist keeps its
      chosen country (the resolver never overwrites a `manual` artist); its `countryCode` in `evm.origins` is
      unchanged.
- [ ] **Hide works.** In the fixup panel, click an artist's **hide** (eye) icon → it leaves the list and stays
      gone after reload (`hidden: true` persisted).
- [ ] **Log terminal reflects progress.** During a scan, a centred terminal overlays a dimmed globe, streaming
      lines (`Wikidata: placed 34 of 50 artists`, `MusicBrainz: <name> → US`) that auto-scroll, with a live
      spinner and a `N placed · N pending · N unplaced · N artists` footer; it disappears when the scan ends.

## Files after this milestone (complete — the checkpoint)

### `src/app/features/globe/country-flag/country-flag.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** A themed country flag (flagcdn image) for an ISO 3166-1 alpha-2 code. Dumb component. */
@Component({
  selector: 'app-country-flag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './country-flag.html',
  styleUrl: './country-flag.scss',
})
export class CountryFlag {
  readonly code = input.required<string>();

  protected readonly src = computed(
    () => `https://flagcdn.com/w40/${this.code().toLowerCase()}.png`,
  );
}
```

### `src/app/features/globe/country-flag/country-flag.html`
```html
<img class="flag" [src]="src()" [alt]="code()" width="32" height="24" loading="lazy" />
```

### `src/app/features/globe/country-flag/country-flag.scss`
```scss
:host {
  display: inline-flex;
  line-height: 0;
}

.flag {
  width: 2rem;
  height: 1.5rem;
  object-fit: cover;
  border-radius: 0.25rem;
  border: 1px solid color-mix(in srgb, var(--neon-teal) 45%, transparent);
  box-shadow: 0 1px 3px rgb(0 0 0 / 35%);
  // Real national flags are bold; soften them so they sit in the pastel theme.
  filter: saturate(0.6) contrast(0.92) brightness(1.02);
}
```

### `src/app/features/globe/heat-legend/heat-legend.ts`
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Gradient legend for the globe heat ramp (cold → hot), labelled with the busiest country's weight. */
@Component({
  selector: 'app-heat-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './heat-legend.html',
  styleUrl: './heat-legend.scss',
})
export class HeatLegend {
  /** The busiest country's value — the hot end of the scale. */
  readonly max = input(0);
  /** Heading describing the active heat metric. */
  readonly caption = input('Tracks per country');
  /** Suffix shown after the max value (e.g. '♪', 'h'). */
  readonly unit = input('♪');
}
```

### `src/app/features/globe/heat-legend/heat-legend.html`
```html
<section class="legend">
  <span class="caption">{{ caption() }}</span>
  <div class="bar"></div>
  <div class="scale">
    <span>1</span>
    <span>{{ max() }}{{ unit() }}</span>
  </div>
</section>
```

### `src/app/features/globe/heat-legend/heat-legend.scss`
```scss
.legend {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 12rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.caption {
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

// Matches the renderer's cold → mid → hot land ramp (same CSS custom properties).
.bar {
  height: 0.6rem;
  border-radius: 0.3rem;
  background: linear-gradient(
    to right,
    var(--globe-land-cold),
    var(--globe-land-mid),
    var(--globe-land-hot)
  );
}

.scale {
  display: flex;
  justify-content: space-between;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}
```

### `src/app/features/globe/country-hover/country-hover.ts`
```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ArtistOrigin } from '../../../core/models/artist-origin';
import { CountryFlag } from '../country-flag/country-flag';

/**
 * Hover card for the focused country: its flag + name, every resolved artist (sorted by liked-track
 * count, scrollable when long) linking to its in-app artist page with a Spotify shortcut beside the
 * name, and a summary. Dumb: inputs only; the page feeds it the hovered country's pre-sorted artist
 * list and anchors it to the cursor.
 */
@Component({
  selector: 'app-country-hover',
  imports: [CountryFlag, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './country-hover.html',
  styleUrl: './country-hover.scss',
})
export class CountryHover {
  readonly countryCode = input.required<string>();
  readonly countryName = input.required<string>();
  /** All resolved artists from this country, sorted by trackCount descending. */
  readonly artists = input.required<ArtistOrigin[]>();

  protected readonly totalTracks = computed(() =>
    this.artists().reduce((sum, artist) => sum + artist.trackCount, 0),
  );

  /** Whole hours of liked music from this country (Σ track runtime, rounded). */
  protected readonly totalHours = computed(() =>
    Math.round(this.artists().reduce((sum, artist) => sum + artist.durationMs, 0) / 3_600_000),
  );

  /** Public Spotify artist page for a Spotify artist id. */
  protected artistUrl(id: string): string {
    return `https://open.spotify.com/artist/${id}`;
  }
}
```

### `src/app/features/globe/country-hover/country-hover.html`
```html
<div class="card">
  <header class="head">
    <app-country-flag [code]="countryCode()" />
    <h2 class="country">{{ countryName() }}</h2>
  </header>
  <ol class="artists">
    @for (artist of artists(); track artist.id) {
      <li class="row">
        <span class="rank">{{ $index + 1 }}</span>
        <a class="name" [routerLink]="['/library/artist', artist.id]" [title]="artist.name">
          {{ artist.name }}
        </a>
        <a
          class="spotify"
          [href]="artistUrl(artist.id)"
          target="_blank"
          rel="noopener noreferrer"
          [attr.aria-label]="'Open ' + artist.name + ' on Spotify'"
          title="Open on Spotify"
        >
          <svg class="spotify-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"
            />
          </svg>
        </a>
        <span class="count">{{ artist.trackCount }}<span class="unit">♪</span></span>
      </li>
    }
  </ol>
  <p class="summary">
    {{ artists().length }} artists · {{ totalTracks() }} liked tracks · {{ totalHours() }} h
  </p>
</div>
```

### `src/app/features/globe/country-hover/country-hover.scss`
```scss
:host {
  display: block;
  // Light pastel card (blue + grey), so its own slate-on-pale palette overrides the dark theme.
  --card-bg: #dbe7f1; // pastel light blue
  --card-border: #9bb8d2; // soft azure-grey
  --card-ink: #3a4654; // pastel slate — primary text
  --card-ink-soft: #6b7886; // muted grey — secondary text
  --card-accent: #3f6e93; // muted blue — counts / name
}

.card {
  width: min(22rem, 85vw);
  padding: 0.9rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--card-border) 70%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 12px rgb(0 0 0 / 25%);
  color: var(--card-ink);
}

.head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.country {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--card-accent);
}

.artists {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  // Grow to fill the free space the page measured on the card's side (`--artists-max`, set per
  // hover); only scroll when the list still outgrows it. Falls back to a fixed cap if unset.
  max-height: var(--artists-max, 15rem);
  overflow-y: auto;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.rank {
  width: 1.2rem;
  text-align: center;
  color: var(--card-ink-soft);
  font-variant-numeric: tabular-nums;
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--card-ink);
  text-decoration: none;
}

.name:hover,
.name:focus-visible {
  color: var(--card-accent);
  text-decoration: underline;
}

.spotify {
  display: inline-flex;
  flex: none;
  color: #1db954; // Spotify green
  opacity: 0.85;
  transition: opacity 0.15s ease;
}

.spotify:hover,
.spotify:focus-visible {
  opacity: 1;
}

.spotify-icon {
  width: 1rem;
  height: 1rem;
  fill: currentColor;
}

.count {
  color: var(--card-accent);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.unit {
  margin-left: 0.15rem;
  font-weight: 400;
  opacity: 0.7;
}

.summary {
  margin: 0.6rem 0 0;
  font: var(--mat-sys-body-small);
  color: var(--card-ink-soft);
  text-align: center;
}
```

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

### `src/app/features/globe/log-terminal/log-terminal.ts`
```ts
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';

import { LogEntry } from '../../../core/logging/log-store';

/**
 * Full-cover, semi-transparent "terminal" shown while the globe dataset is loading. It streams the
 * pipeline's progress lines, keeps a live loading spinner, and — by covering the globe area with a
 * blocking scrim — prevents any action on the controls beneath until the scan finishes.
 */
@Component({
  selector: 'app-log-terminal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './log-terminal.html',
  styleUrl: './log-terminal.scss',
  host: { '[class.inline]': 'inline()' },
})
export class LogTerminal {
  readonly entries = input<readonly LogEntry[]>([]);
  /** Heading above the log stream. */
  readonly title = input('Building your globe…');
  /**
   * `false` (default): a full-cover blocking scrim over the host area. `true`: an in-flow panel with
   * no scrim, for a page that's already showing nothing but a loading state (e.g. the artist page).
   */
  readonly inline = input(false);
  readonly resolvedCount = input(0);
  readonly pendingCount = input(0);
  readonly failedCount = input(0);
  /** Globe artist total; when 0 the placed/pending footer is hidden (e.g. on the artist page). */
  readonly total = input(0);

  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  constructor() {
    // Keep the newest line in view: re-run after each render where the entries changed (reading the
    // signal inside registers the dependency), by which point the new lines are already in the DOM.
    afterRenderEffect(() => {
      this.entries();
      const el = this.list()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
```

### `src/app/features/globe/log-terminal/log-terminal.html`
```html
<section class="terminal" role="log" aria-live="polite" aria-label="Loading progress">
  <header class="head">
    <span class="spinner" aria-hidden="true"></span>
    <span class="title">{{ title() }}</span>
  </header>

  <ol #list class="lines">
    @for (entry of entries(); track entry.id) {
      <li class="line" [class]="entry.level">
        <span class="prompt" aria-hidden="true">›</span>
        <span class="text">{{ entry.text }}</span>
      </li>
    }
    <li class="cursor" aria-hidden="true">›&nbsp;<span class="blink">▋</span></li>
  </ol>

  @if (total() > 0) {
    <footer class="summary">
      <span class="stat placed">{{ resolvedCount() }} placed</span>
      <span class="stat pending">{{ pendingCount() }} pending</span>
      @if (failedCount() > 0) {
        <span class="stat failed">{{ failedCount() }} unplaced</span>
      }
      <span class="stat total">{{ total() }} artists</span>
    </footer>
  }
</section>
```

### `src/app/features/globe/log-terminal/log-terminal.scss`
```scss
// Blocking scrim: fills the globe area (globe-page :host is position:relative), dims the controls
// beneath, and captures pointer events so no action can be taken while the scan runs.
:host {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: color-mix(in srgb, var(--space-void) 55%, transparent);
  backdrop-filter: blur(2px);
  pointer-events: auto;
}

// Inline mode: no scrim — an in-flow panel centred in a tall block, for a page already showing
// nothing but a loading state (the artist page's discography load).
:host(.inline) {
  position: static;
  inset: auto;
  min-height: 50vh;
  background: none;
  backdrop-filter: none;
}

.terminal {
  display: flex;
  flex-direction: column;
  width: min(34rem, 100%);
  max-height: min(24rem, 100%);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 30%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: var(--glow-shadow);
  overflow: hidden;
}

.head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid color-mix(in srgb, var(--neon-teal) 18%, transparent);
}

.spinner {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  border-top-color: var(--neon-teal);
  animation: spin 0.7s linear infinite;
}

.title {
  font: var(--mat-sys-body-medium);
  color: var(--mat-sys-on-surface);
}

.lines {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0.6rem 0.9rem;
  overflow-y: auto;
  list-style: none;
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 0.72rem;
  line-height: 1.55;
}

.line {
  display: flex;
  gap: 0.5rem;
  color: var(--neon-teal);

  &.success {
    color: var(--globe-land-mid);
  }
  &.warn {
    color: var(--globe-land-hot);
  }
  &.error {
    color: #ff8a80;
  }
}

.prompt {
  flex: 0 0 auto;
  opacity: 0.55;
}

.text {
  word-break: break-word;
}

.cursor {
  color: var(--neon-teal);
}

.blink {
  animation: blink 1.1s step-end infinite;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  padding: 0.55rem 0.9rem;
  border-top: 1px solid color-mix(in srgb, var(--neon-teal) 18%, transparent);
  font: var(--mat-sys-label-small);
  color: var(--mat-sys-on-surface-variant);
}

.stat.placed {
  color: var(--globe-land-mid);
}

.stat.failed {
  color: var(--globe-land-hot);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
```

### `src/app/features/globe/scan-list/scan-list.ts`
```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { ArtistOrigin } from '../../../core/models/artist-origin';
import { CountryFlag } from '../country-flag/country-flag';
import { GlobePhase } from '../globe-store';

const REVEAL_STAGGER_MS = 100;
const FLAG_LINGER_MS = 500;
const FADE_MS = 400;

/**
 * The scan→place center experience. During 'scanning' it shows the artist list growing; during
 * 'placing' it walks the list top-to-bottom revealing one flag at a time, then fades each matched
 * row out 0.5s later. Emits `done` once resolution has finished and every matched row has faded —
 * the page then switches to the globe. Animation state is local (view-only).
 */
@Component({
  selector: 'app-scan-list',
  imports: [CountryFlag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scan-list.html',
  styleUrl: './scan-list.scss',
})
export class ScanList {
  readonly artists = input<ArtistOrigin[]>([]);
  readonly phase = input<GlobePhase>('scanning');
  readonly resolving = input(false);
  readonly done = output<void>();

  protected readonly revealed = signal<ReadonlySet<string>>(new Set());
  protected readonly fading = signal<ReadonlySet<string>>(new Set());
  private readonly faded = signal<ReadonlySet<string>>(new Set());

  /** Rows still on screen: matched rows leave once faded; failed rows move to the unplaced table. */
  protected readonly visible = computed(() =>
    this.artists().filter((a) => !a.failed && !this.faded().has(a.id)),
  );

  private emitted = false;

  constructor() {
    const ticker = setInterval(() => this.tick(), REVEAL_STAGGER_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(ticker));
  }

  private tick(): void {
    if (this.phase() !== 'placing') {
      return;
    }
    const revealed = this.revealed();
    const faded = this.faded();
    const next = this.artists().find(
      (a) => a.countryCode !== null && !revealed.has(a.id) && !faded.has(a.id),
    );
    if (next !== undefined) {
      this.reveal(next.id);
      return;
    }
    // Nothing to reveal now → done once resolution is finished and every matched row has faded.
    const allMatchedFaded = this.artists().every(
      (a) => a.countryCode === null || this.faded().has(a.id),
    );
    if (!this.emitted && !this.resolving() && allMatchedFaded) {
      this.emitted = true;
      this.done.emit();
    }
  }

  private reveal(id: string): void {
    this.revealed.update((set) => new Set(set).add(id));
    setTimeout(() => this.fading.update((set) => new Set(set).add(id)), FLAG_LINGER_MS);
    setTimeout(() => this.faded.update((set) => new Set(set).add(id)), FLAG_LINGER_MS + FADE_MS);
  }
}
```

### `src/app/features/globe/scan-list/scan-list.html`
```html
<section class="scan">
  <h2 class="status">
    @if (phase() === 'scanning') {
      Retrieving your library from Spotify…
    } @else {
      Finding where they're from…
    }
  </h2>
  <p class="count">{{ visible().length }} artists</p>

  <ul class="list">
    @for (artist of visible(); track artist.id) {
      <li class="row" [class.fading]="fading().has(artist.id)">
        <span class="name">{{ artist.name }}</span>
        @if (revealed().has(artist.id) && artist.countryCode; as code) {
          <app-country-flag [code]="code" />
        } @else if (!artist.tried) {
          <span class="pending">…</span>
        }
      </li>
    }
  </ul>
</section>
```

### `src/app/features/globe/scan-list/scan-list.scss`
```scss
.scan {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding: 2rem 1rem;
  box-sizing: border-box;
}

.status {
  margin: 0;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  color: var(--neon-teal);
  text-shadow: var(--glow-shadow);
  text-align: center;
}

.count {
  margin: 0;
  font: var(--mat-sys-body-small);
  color: var(--mat-sys-on-surface-variant);
}

.list {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  width: min(28rem, 90vw);
  flex: 1;
  overflow-y: auto;
  // Fade the top/bottom edges so the scrolling list melts into the space backdrop.
  mask-image: linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--neon-teal) 8%, transparent);
  transition:
    opacity 400ms ease,
    transform 400ms ease;
}

.row.fading {
  opacity: 0;
  transform: translateX(12px);
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending {
  color: var(--mat-sys-on-surface-variant);
  opacity: 0.6;
}

app-country-flag {
  animation: flag-in 250ms ease;
}

@keyframes flag-in {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

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

### `src/app/features/globe/globe-store.ts` *(modified — heat-mode + `setCountry` + `hideUnplaced` + `showGlobe`)*
```ts
import { computed, inject, Injectable, signal } from '@angular/core';

import { SpotifyApi } from '../../core/api/spotify-api';
import { OriginsCache } from '../../core/cache/origins-cache';
import { LogStore } from '../../core/logging/log-store';
import { ArtistRef } from '../../core/models/artist';
import { ArtistOrigin } from '../../core/models/artist-origin';
import { OriginsSnapshot } from '../../core/models/origins-snapshot';
import { ArtistResolution } from '../../core/pipeline/artist-resolution';
import { LikedIndex } from '../../core/pipeline/liked-index';
import { delay } from '../../core/util/delay';

const SAVE_DEBOUNCE_MS = 500;
const WORKER_IDLE_MS = 120;
/**
 * Min gap between globe repaints while a scan streams. The fast worker resolves 50 artists per
 * Wikidata round-trip with no throttle, so it would otherwise snapshot the working set into the
 * signal (and recompute every aggregate + repaint the canvas) dozens of times a second. Coalescing
 * to ~5 paints/s keeps progress visible without the recompute storm; the final state is flushed
 * explicitly when the scan ends.
 */
const PUBLISH_THROTTLE_MS = 200;
/** Artists resolved per fast Wikidata request — bounds query URL size and server-side cost. */
const RESOLVE_BATCH_SIZE = 50;

/** Kept for the page's view switching; the Liked-Songs source stays on 'globe' throughout M6. */
export type GlobePhase = 'scanning' | 'placing' | 'globe';

/** Which metric the globe heat encodes. Guide extension (M6) — the source only ever uses 'tracks'. */
export type HeatMode = 'tracks' | 'hours';

/**
 * Owns the **Liked Songs → country** dataset for the globe. Pages `/me/tracks` newest-first,
 * dedupes artists with a real per-artist liked-track count + Σ runtime, and resolves countries via
 * Wikidata-by-Spotify-id (with a MusicBrainz-by-name fallback), recolouring live. The heat metric
 * switches between liked-track count and rounded listening hours (M6); manual country fixups are
 * sticky and win over auto-resolution. Persists the whole dataset so a reload restores instantly.
 */
@Injectable({ providedIn: 'root' })
export class GlobeStore {
  private readonly spotify = inject(SpotifyApi);
  private readonly resolution = inject(ArtistResolution);
  private readonly cache = inject(OriginsCache);
  private readonly likedIndex = inject(LikedIndex);
  private readonly log = inject(LogStore);

  /** Mutable working set; snapshotted into the signal on publish() to bound signal churn. */
  private working = new Map<string, ArtistOrigin>();
  /** artistId → manually assigned country, sticky across reloads. Seeded by restore() from persisted
   * `manual` artists; written by setCountry() (the M6 fixup write path). Wins over auto-resolution. */
  private readonly manualOverrides = new Map<string, string>();
  /** artistId → country auto-resolved by a previous scan, reused by a full rescan to skip re-resolving. */
  private reuseOrigins = new Map<string, string>();
  private readonly fastQueue: string[] = [];
  private readonly fastQueued = new Set<string>();
  private readonly slowQueue: string[] = [];
  private readonly slowQueued = new Set<string>();
  private fastDone = false;
  /** True while pages are still streaming in, so the fast worker idle-waits instead of exiting. */
  private streaming = false;
  private saveTimer?: ReturnType<typeof setTimeout>;
  /** Set once a snapshot save is rejected (e.g. quota), to avoid re-warning on every debounce. */
  private saveFailed = false;
  private publishTimer?: ReturnType<typeof setTimeout>;

  private readonly _artists = signal<ReadonlyMap<string, ArtistOrigin>>(new Map());
  private readonly _computedAt = signal<number | null>(null);
  private readonly _oldest = signal<string | null>(null);
  private readonly _newest = signal<string | null>(null);
  private readonly _phase = signal<GlobePhase>('globe');
  private readonly _resolving = signal(false);

  readonly artists = computed(() => [...this._artists().values()]);
  readonly total = computed(() => this._artists().size);
  readonly resolvedCount = computed(
    () => this.artists().filter((a) => a.countryCode !== null).length,
  );
  readonly failedCount = computed(() => this.artists().filter((a) => a.failed).length);
  readonly pendingCount = computed(() => this.artists().filter((a) => !a.tried).length);
  readonly phase = this._phase.asReadonly();
  readonly isResolving = this._resolving.asReadonly();
  readonly hasData = computed(() => this.total() > 0);
  readonly computedAt = this._computedAt.asReadonly();
  /** Oldest / newest liked-song dates spanned by the dataset — surfaced in the HUD. */
  readonly dateRange = computed(() => ({ oldest: this._oldest(), newest: this._newest() }));

  /** Resolved artists where the country couldn't be found — the M6 fixup list (hidden ones excluded). */
  readonly unplaced = computed(() =>
    this.artists()
      .filter((a) => a.failed && !a.hidden)
      .sort((a, b) => b.trackCount - a.trackCount),
  );

  /**
   * The single source of the three per-country aggregates, so the globe heat, the legend, the
   * leaderboards, and the hover card all agree. Sums each placed artist's lifetime totals. The genre
   * + temporal (as-of-month / release-era) filter-aware passes grow in M9.
   */
  private readonly aggregates = computed<{
    tracks: Map<string, number>;
    duration: Map<string, number>;
    artists: Map<string, ArtistOrigin[]>;
  }>(() => {
    const artists = this._artists();
    const tracks = new Map<string, number>();
    const duration = new Map<string, number>();
    const byCountry = new Map<string, ArtistOrigin[]>();

    for (const artist of artists.values()) {
      if (artist.countryCode === null) {
        continue;
      }
      addTo(tracks, artist.countryCode, artist.trackCount);
      addTo(duration, artist.countryCode, artist.durationMs);
      pushTo(byCountry, artist.countryCode, artist);
    }

    for (const list of byCountry.values()) {
      list.sort((a, b) => b.trackCount - a.trackCount);
    }
    return { tracks, duration, artists: byCountry };
  });

  /** Resolved artists grouped by country (ISO alpha-2), each list sorted by trackCount desc. */
  readonly artistsByCountry = computed(() => this.aggregates().artists);

  /** Σ liked-track count per country — the 'tracks' heat metric and the tracks leaderboard. */
  readonly tracksByCountry = computed(() => this.aggregates().tracks);

  /** Σ liked-track runtime (ms) per country — the 'hours' heat metric and the listening-hours stat. */
  readonly durationByCountry = computed(() => this.aggregates().duration);

  /**
   * Which metric colours the globe. Guide extension (M6): the source hard-codes `heat =
   * tracksByCountry`. The genre / release-era / timeline filters that reshape these aggregates
   * arrive in M9.
   */
  private readonly _heatMode = signal<HeatMode>('tracks');
  readonly heatMode = this._heatMode.asReadonly();

  /** Heat per country (ISO alpha-2 → weight): liked-track count in 'tracks' mode, Σ ms in 'hours'. */
  readonly heat = computed(() =>
    this._heatMode() === 'hours' ? this.durationByCountry() : this.tracksByCountry(),
  );

  /** Set the heat metric (recolours the globe). */
  setHeatMode(mode: HeatMode): void {
    this._heatMode.set(mode);
  }

  /** Flip tracks ↔ hours. */
  toggleHeatMode(): void {
    this._heatMode.update((mode) => (mode === 'tracks' ? 'hours' : 'tracks'));
  }

  /** The busiest country's value — the hot end of the legend's scale. */
  readonly maxHeat = computed(() => {
    let max = 0;
    for (const weight of this.heat().values()) {
      if (weight > max) {
        max = weight;
      }
    }
    return max;
  });

  /** Resolved ISO alpha-2 for a Spotify artist id from the current dataset, else null. */
  countryOf(artistId: string): string | null {
    return this._artists().get(artistId)?.countryCode ?? null;
  }

  /** Hydrate the saved dataset from localStorage straight into the globe view. No network. */
  restore(): void {
    const snapshot = this.cache.load();
    if (snapshot === null) {
      return;
    }
    this.working = new Map(snapshot.artists.map((artist) => [artist.id, { ...artist }]));
    for (const artist of this.working.values()) {
      if (artist.manual && artist.countryCode !== null) {
        this.manualOverrides.set(artist.id, artist.countryCode);
      }
    }
    this._computedAt.set(snapshot.computedAt);
    this._oldest.set(snapshot.oldest);
    this._newest.set(snapshot.newest);
    this.publish();
  }

  /**
   * Manually assign a country to an artist; sticky across future runs. Works even for an artist not
   * yet in the globe dataset (e.g. opened from the library, M10): a minimal entry is created so the
   * choice persists and shows up. `name` labels that new entry — ignored when the artist exists.
   */
  setCountry(artistId: string, countryCode: string, name = ''): void {
    this.manualOverrides.set(artistId, countryCode);
    let artist = this.working.get(artistId);
    if (artist === undefined) {
      artist = {
        id: artistId,
        name,
        trackCount: 0,
        durationMs: 0,
        countryCode: null,
        tried: false,
        failed: false,
        manual: false,
      };
      this.working.set(artistId, artist);
    }
    artist.countryCode = countryCode;
    artist.manual = true;
    artist.tried = true;
    artist.failed = false;
    this.publish();
    this.save();
  }

  /** Dismiss an artist from the "couldn't place" list (e.g. one that has no real country). */
  hideUnplaced(artistId: string): void {
    const artist = this.working.get(artistId);
    if (artist === undefined) {
      return;
    }
    artist.hidden = true;
    this.publish();
    this.saveDebounced();
  }

  /** Return the page to the globe view — the (dormant in M6) scan-list's `done` target. */
  showGlobe(): void {
    this._phase.set('globe');
  }

  /**
   * Refresh the dataset. `fullRescan` (or having no data) re-pages the entire library and retries
   * every unresolved artist, while reusing countries already resolved by a previous scan so only new
   * or previously-failed artists hit the network; otherwise an incremental pass fetches only likes
   * newer than the last scan. Runs in the background; `isResolving` reflects progress.
   */
  async recalculate(fullRescan = false): Promise<void> {
    if (this._resolving()) {
      return;
    }
    // A rate-limit cooldown pre-check ("try again in N min") is added alongside richer sync in M9.
    if (fullRescan || !this.hasData()) {
      await this.load();
    } else {
      await this.incremental();
    }
  }

  /** Wipe persisted + in-memory data (e.g. before a fresh run). */
  clearData(): void {
    this.cache.clear();
    this.likedIndex.clear();
    this.working = new Map();
    this.manualOverrides.clear();
    this.resetQueues();
    this._computedAt.set(null);
    this._oldest.set(null);
    this._newest.set(null);
    this.publish();
  }

  /** Full scan: re-page the whole library from scratch, then resolve every artist's country. */
  private async load(): Promise<void> {
    this.log.clear();
    this.log.log('Starting a full scan of your Liked Songs…');
    // Carry over auto-resolved countries from the previous scan so re-paging the library (to pick up
    // added/removed likes) doesn't re-resolve artists we already placed. Manual fixups ride along via
    // `manualOverrides`; previously-failed artists are left out so the rescan retries them.
    this.reuseOrigins = new Map(
      [...this.working.values()]
        .filter((a) => a.countryCode !== null && !a.manual)
        .map((a) => [a.id, a.countryCode as string]),
    );
    this.working = new Map();
    this.resetQueues();
    this.likedIndex.beginFull();
    this._oldest.set(null);
    this._newest.set(null);
    this.publish();

    this._resolving.set(true);
    this.streaming = true;
    // Resolve countries + paint the globe as pages stream in, rather than after the whole library
    // is paged — a full scan is long, so progress must be visible from the first page.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker()]);
    try {
      let oldest: string | null = null;
      let newest: string | null = null;
      let tracks = 0;
      for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          if (oldest === null || track.addedAt < oldest) {
            oldest = track.addedAt;
          }
          if (newest === null || track.addedAt > newest) {
            newest = track.addedAt;
          }
          this.likedIndex.add(track);
          // Only the primary (main) artist counts toward the globe; Spotify lists them first.
          const main = track.artists[0];
          if (main !== undefined) {
            this.accumulate(main, track.durationMs);
          }
        }
        tracks += page.length;
        // Commit the watermarks per page so a mid-stream failure still persists scan progress
        // (otherwise newest stays null and every later recalculate falls back to a full rescan).
        this._oldest.set(oldest);
        this._newest.set(newest);
        this.likedIndex.commit(newest);
        this.publishProgress();
        this.log.log(`Fetched ${tracks} liked songs · ${this.working.size} artists so far`);
      }
    } catch {
      this.log.log('Could not load your Liked Songs from Spotify.', 'error');
    } finally {
      // Signal the workers no more artists are coming, then let them drain what's queued.
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.reuseOrigins = new Map();
      this.save();
    }
  }

  /** Incremental pass: page only likes newer than the last scan, then resolve the new artists. */
  private async incremental(): Promise<void> {
    const since = this._newest();
    if (since === null) {
      await this.load();
      return;
    }
    this.resetQueues();
    this.likedIndex.beginIncremental();
    this.log.clear();
    this.log.log('Checking Spotify for new favourites…');

    this._resolving.set(true);
    this.streaming = true;
    // Resolve + paint as new likes stream in (see load()); workers idle until pages arrive.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker()]);
    try {
      let newest = since;
      let added = 0;
      pages: for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          // Newest-first: once we reach the last scan's frontier, everything older is known.
          if (track.addedAt <= since) {
            break pages;
          }
          if (track.addedAt > newest) {
            newest = track.addedAt;
          }
          this.likedIndex.add(track);
          added += 1;
          // Only the primary (main) artist counts toward the globe; Spotify lists them first.
          const main = track.artists[0];
          if (main !== undefined) {
            this.accumulate(main, track.durationMs);
          }
        }
        // Advance the watermark per page so a mid-stream failure keeps the progress made so far.
        this._newest.set(newest);
        this.likedIndex.commit(newest);
        this.publishProgress();
        this.log.log(`Found ${added} new liked songs so far`);
      }
      // Covers the case where the frontier is reached on the first page (no per-page set ran).
      this._newest.set(newest);
      this.likedIndex.commit(newest);
      this.log.log(
        added === 0 ? 'No new liked songs since the last scan.' : `${added} new liked songs`,
      );
      // Retry previously-unresolved artists alongside any newly discovered ones. Done while still
      // streaming=true so the workers can't drain-and-exit before these are enqueued.
      let retried = 0;
      for (const artist of this.working.values()) {
        if (artist.failed && !artist.manual) {
          artist.tried = false;
          artist.failed = false;
          this.enqueueFast(artist.id);
          retried += 1;
        }
      }
      if (retried > 0) {
        this.log.log(`Retrying ${retried} previously unplaced artists`);
      }
      this.publishProgress();
    } catch {
      this.log.log('Could not fetch new favourites.', 'error');
    } finally {
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.save();
    }
  }

  /** Fast pass: drains the fast queue in batches via Wikidata-by-Spotify-id; misses → slow queue. */
  private async fastWorker(): Promise<void> {
    for (;;) {
      const batch = this.fastQueue.splice(0, RESOLVE_BATCH_SIZE);
      if (batch.length === 0) {
        // Empty queue: keep waiting while pages are still arriving; only stop once paging is done.
        if (this.streaming) {
          await delay(WORKER_IDLE_MS);
          continue;
        }
        break;
      }
      const results = await this.resolution.resolveBatchBySpotifyId(batch);
      let placed = 0;
      for (const id of batch) {
        const artist = this.working.get(id);
        if (artist === undefined || artist.manual || artist.tried) {
          continue;
        }
        const code = results.get(id) ?? null;
        if (code !== null) {
          artist.countryCode = code;
          artist.tried = true;
          artist.failed = false;
          placed += 1;
        } else {
          this.enqueueSlow(id);
        }
      }
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        `Wikidata: placed ${placed} of ${batch.length} artists`,
        placed > 0 ? 'success' : 'info',
      );
    }
    this.fastDone = true;
  }

  /** Slow pass: per-artist MusicBrainz fallback for the fast-pass misses. */
  private async slowWorker(): Promise<void> {
    for (;;) {
      const id = this.slowQueue.shift();
      if (id === undefined) {
        // Nothing queued: exit only once the fast pass is done feeding this queue; else idle-wait.
        if (this.fastDone) {
          break;
        }
        await delay(WORKER_IDLE_MS);
        continue;
      }
      const artist = this.working.get(id);
      if (artist === undefined || artist.manual || artist.tried) {
        continue;
      }
      const code = await this.resolution.resolveByName(artist.name);
      artist.tried = true;
      artist.countryCode = code;
      artist.failed = code === null;
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        code !== null ? `MusicBrainz: ${artist.name} → ${code}` : `Couldn't place ${artist.name}`,
        code !== null ? 'success' : 'warn',
      );
    }
  }

  /** Count one liked-track appearance for an artist (new or existing), summing its runtime. */
  private accumulate(ref: ArtistRef, durationMs: number): void {
    const existing = this.working.get(ref.id);
    if (existing !== undefined) {
      existing.trackCount += 1;
      existing.durationMs += durationMs;
      return;
    }
    const manual = this.manualOverrides.get(ref.id) ?? null;
    // A manual fixup wins; otherwise reuse a country resolved by a previous scan (full-rescan only).
    const known = manual ?? this.reuseOrigins.get(ref.id) ?? null;
    this.working.set(ref.id, {
      id: ref.id,
      name: ref.name,
      trackCount: 1,
      durationMs,
      countryCode: known,
      tried: known !== null,
      failed: false,
      manual: manual !== null,
    });
    if (known === null) {
      this.enqueueFast(ref.id);
    }
  }

  private enqueueFast(id: string): void {
    if (!this.fastQueued.has(id)) {
      this.fastQueued.add(id);
      this.fastQueue.push(id);
    }
  }

  private enqueueSlow(id: string): void {
    if (!this.slowQueued.has(id)) {
      this.slowQueued.add(id);
      this.slowQueue.push(id);
    }
  }

  private resetQueues(): void {
    this.fastQueue.length = 0;
    this.slowQueue.length = 0;
    this.fastQueued.clear();
    this.slowQueued.clear();
    this.fastDone = false;
    this.streaming = false;
  }

  private publish(): void {
    clearTimeout(this.publishTimer);
    this.publishTimer = undefined;
    this._artists.set(new Map(this.working));
  }

  /**
   * Publish a mid-scan progress update, coalesced to at most one paint per {@link PUBLISH_THROTTLE_MS}
   * while streaming (outside a scan it publishes immediately). The scan's finally block flushes the
   * final state with a direct {@link publish}, so a pending throttle never drops the last update.
   */
  private publishProgress(): void {
    if (!this.streaming) {
      this.publish();
      return;
    }
    if (this.publishTimer !== undefined) {
      return; // a paint is already scheduled — this update rides along with it
    }
    this.publishTimer = setTimeout(() => {
      this.publishTimer = undefined;
      this._artists.set(new Map(this.working));
    }, PUBLISH_THROTTLE_MS);
  }

  private snapshot(): OriginsSnapshot {
    return {
      version: 2,
      computedAt: this._computedAt() ?? Date.now(),
      oldest: this._oldest(),
      newest: this._newest(),
      artists: [...this.working.values()],
    };
  }

  private saveDebounced(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), SAVE_DEBOUNCE_MS);
  }

  private save(): void {
    clearTimeout(this.saveTimer);
    if (!this.cache.save(this.snapshot()) && !this.saveFailed) {
      // Warn once per session so a full localStorage doesn't spam on every debounced save.
      this.saveFailed = true;
      this.log.log('Could not save your globe data — browser storage may be full.', 'error');
    }
  }
}

/** Add `value` to a country's running total in `map` (initialising the entry at 0). */
function addTo(map: Map<string, number>, code: string, value: number): void {
  map.set(code, (map.get(code) ?? 0) + value);
}

/** Append an artist to its country's list in `map` (initialising the list). */
function pushTo(map: Map<string, ArtistOrigin[]>, code: string, artist: ArtistOrigin): void {
  const list = map.get(code);
  if (list === undefined) {
    map.set(code, [artist]);
  } else {
    list.push(artist);
  }
}
```

### `src/app/features/globe/globe-page/globe-page.ts` *(modified)*
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

### `src/app/features/globe/globe-page/globe-page.html` *(modified)*
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

### `src/app/features/globe/globe-page/globe-page.scss` *(modified)*
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

## What you have now (cumulative)
The `spotify-trip` globe is now **explorable and correctable**. On top of M5's coloured, persisted globe you
can: hover a country for a card of its flag + name + the artists you like from there; read leaderboards of your
top countries by artists / tracks / hours; flip the heat metric between track count and listening hours and
watch the globe recolour; and manually place any artist the resolver couldn't — a fixup that colours instantly,
sticks across reloads, and is never overwritten by a later scan. A blocking log terminal streams scan progress.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Hover card never appears | The canvas isn't emitting `countryHover`, or `hoveredArtists()` is empty for that country (it only shows for countries with placed artists). Check `(countryHover)="onHover($event)"` (step 10) and the M5 renderer's hover handler. |
| Card appears but flag is broken | `country-flag` got an invalid/upper-case code, or `CountryFlag` isn't imported by `country-hover` (steps 01, 03). |
| Heat toggle does nothing | `store.setHeatMode` missing (step 07 didn't land) or the button binds the wrong mode; confirm `heat` is a computed, not the M5 alias. |
| Legend max is a huge number in hours mode | The page bound `store.maxHeat()` directly; hours mode must use `legendMax()` (÷ 3 600 000) — step 10. |
| Manual fixup vanishes after reload | `setCountry` used `saveDebounced()` not `save()`, or didn't set `manual = true`; both are required (step 07). |
| A rescan overwrites a manual country | The scan paths skip `artist.manual` — if it's overwritten, `manual` wasn't set, or `manualOverrides` wasn't written (step 07). |
| Picker dropdown empty in every fixup row | `GeoData.countries()` hasn't resolved / GeoJSON asset missing (M4), or the page didn't pass `[countries]` (step 10). |
| Clicking an artist name logs `NG04002` | Expected — the `/library/artist/:id` route lands in M10 (step 03). |
| `app-country-picker`/`app-unplaced-artists` unknown element | Missing from the consumer's `imports` array (steps 08–10). |

## Next
Continue to **[M7 — The live player](../MILESTONE_7_live-player/00_overview.md)** — a now-playing panel wired
to Spotify playback, with read-only track info for any account and transport controls for Premium.
