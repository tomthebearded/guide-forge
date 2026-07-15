# M11 · Verify — Settings, data transfer & polish (the finale)
> Nav: [← Empty/error states + a11y](10_states-and-a11y.md) · [Overview](00_overview.md) · [Back to the README →](../README.md)

This is the last milestone. Pass this gate and the **whole app** is drafted and internally consistent — the only
step left is to actually run it and walk every milestone's Done-when for real (see
[status.md](../foundation/status.md)).

## Done-when gate (the real test — check every box by hand)
Serve logged in (`ng serve --host 127.0.0.1 --port 4200`), on `/globe` with a prior scan unless noted.

- [ ] **Live recolour.** Open the gear (bottom-right, `tune`), change **Globe ocean** and drag **Heat — cold** →
      the sphere **and** the heat ramp/legend recolour **instantly** (no reload); the panel chips update too. →
      the globe visibly changes colour within one frame of releasing the picker.
- [ ] **Live lighting.** Toggle **Day mode (sunlit)** → the globe shifts from flat, fully-lit **studio** to a
      single-sun look (one bright hemisphere, a dark night side). Toggle off → back to flat.
- [ ] **Live marker.** Pick a different **Flight marker** (e.g. Sailboat) while a track plays → the flying icon
      changes to that glyph on the next circle/arc.
- [ ] **Persistence.** Reload → every choice sticks. `JSON.parse(localStorage['evm.appearance'])` shows your
      `ocean`/`heatCold`/… hex values, `"dayMode": true/false`, and `"markerIcon": "<kind>"`.
- [ ] **Export.** Gear → **Export** downloads `earthviewmusic-YYYY-MM-DD.json`. Opened, its `data` object holds
      `evm.origins`, `evm.appearance`, `evm.viewPrefs`, … and **no** `evm.spotify.*`, `evm.ratelimit.*`, or
      `evm.syncState` key.
- [ ] **Wipe keeps you logged in.** Gear → **Delete** (or `/actions` → **Clear all data**) → confirm → the page
      reloads to the **"Load my music"** scan prompt and you are **still logged in** (no `/login` redirect).
      `localStorage` still has `evm.spotify.*` but no `evm.origins`.
- [ ] **Import round-trips.** Gear → **Import** the exported file → confirm → reload → the full globe/dataset +
      your appearance return exactly. → the previously-removed `evm.*` keys are back.
- [ ] **Save image.** View-options fab (or the gear's data area) → **Save image** → downloads
      `earthviewmusic-<date>.png` that opens to the current globe on a **solid space background** (not blank /
      transparent).
- [ ] **Empty / error / Premium states (S3).** After a wipe you see the scan prompt (not a blank globe); with the
      network **Offline** a **Full re-scan** shows an **error toast**; a free account shows the read-only player
      and a **needs-Premium** toast on a transport press — no crash.
- [ ] **Keyboard a11y (S4).** Tab to the gear fab → Enter opens it → Tab/arrow through Day mode, the marker
      group, every swatch, and Export/Import/Delete/Reset; each control announces a label. Same for the
      view-options fab.
- [ ] **Consistency + gates.** `npm run format:check` && `npm run lint` && `npm run build` → all clean across the
      whole app (`Application bundle generation complete`, no ESLint errors, no `any`).

### Final consistency check (pinned versions + load-bearing names)
- [ ] **Versions unchanged** — Angular **21.2**, Material **21.2**, `three@~0.184`, `three-globe@2.45.2`, TS
      **~5.9**, Node **24** (see [stack.md](../foundation/stack.md)). No step introduced a different version.
- [ ] **Load-bearing names intact** across M11: the `evm.*` keys (`evm.appearance` +
      the dynamically-discovered set), the excluded prefixes (`evm.spotify.` / `evm.ratelimit.` / `evm.syncState`),
      the `DataTransfer` bundle `format: 'earthviewmusic'`, the CSS custom-property names
      (`--space-void` / `--neon-teal` / `--neon-cyan` / `--neon-violet` / `--flight-marker` / `--globe-ocean` /
      `--globe-land-cold` / `--globe-land-mid` / `--globe-land-hot`), the `MarkerKind` literals, and the
      `LivePalette` field names (`teal`/`cyan`/`ocean`/`landCold`/`landHot`/`marker`) all match across
      `appearance-cache.ts`, `settings-store.ts`, `globe-renderer.ts`, and `styles.scss`.
- [ ] The `callback` route + redirect URI `http://127.0.0.1:4200/callback` (M1) are untouched.

## Files after this milestone — full copies of what M11 created or changed (the checkpoint)

> Each file below carries a tag: **(created)** shows a whole new file; **(modified — full file)** shows the
> whole changed file. Files M11 didn't touch aren't repeated — where one is shown for context it's flagged
> "unchanged since M4/M9". Diff each shown file against your copy.

### `src/app/core/cache/appearance-cache.ts` (created)
```ts
import { Injectable } from '@angular/core';

import { readJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.appearance';

/**
 * Which marker carries the now-playing track around the globe — themed around the app's
 * "music on a trip" concept: ways to travel (plane, sailboat, car, train, bike) and music
 * (note, vinyl record).
 */
export type MarkerKind = 'plane' | 'boat' | 'car' | 'train' | 'bike' | 'note' | 'record';

export const MARKER_KINDS: readonly MarkerKind[] = [
  'plane',
  'boat',
  'car',
  'train',
  'bike',
  'note',
  'record',
];

/**
 * User-customizable appearance: globe/accent/background colours, the heat ramp endpoints (the mid
 * tone is derived), day-vs-studio lighting, and the flight marker icon. Colours are `#rrggbb`.
 */
export interface AppearanceSettings {
  /** Space backdrop (`--space-void`). */
  background: string;
  /** Primary accent — borders, country strokes (`--neon-teal`). */
  accent: string;
  /** Secondary accent — atmosphere halo, flight arcs/marker (`--neon-cyan`). */
  accentSecondary: string;
  /** Tertiary accent (`--neon-violet`). */
  accentTertiary: string;
  /** Flight marker icon fill (`--flight-marker`); drawn with a black outline for contrast. */
  markerColor: string;
  /** Globe sphere base (`--globe-ocean`). */
  ocean: string;
  /** Heat ramp cold end (`--globe-land-cold`). */
  heatCold: string;
  /** Heat ramp hot end (`--globe-land-hot`); the mid tone is interpolated from cold↔hot. */
  heatHot: string;
  /** Light the globe from a single sun (day/night terminator) instead of flat studio lighting. */
  dayMode: boolean;
  /** Icon drawn for the currently-playing track. */
  markerIcon: MarkerKind;
}

/** Persists the user's appearance choices to localStorage, merged over the live CSS defaults. */
@Injectable({ providedIn: 'root' })
export class AppearanceCache {
  /** Saved settings merged over `defaults` (captured from the stylesheet) so new fields keep theirs. */
  load(defaults: AppearanceSettings): AppearanceSettings {
    return readJson(STORAGE_KEY, (parsed) => ({ ...defaults, ...sanitize(parsed) }), {
      ...defaults,
    });
  }

  save(settings: AppearanceSettings): void {
    writeJson(STORAGE_KEY, settings);
  }
}

/** Keep only well-typed fields from a stored blob, so a corrupt/partial value can't poison defaults. */
function sanitize(value: unknown): Partial<AppearanceSettings> {
  if (value === null || typeof value !== 'object') {
    return {};
  }
  const v = value as Record<string, unknown>;
  const out: Partial<AppearanceSettings> = {};
  for (const key of [
    'background',
    'accent',
    'accentSecondary',
    'accentTertiary',
    'markerColor',
    'ocean',
    'heatCold',
    'heatHot',
  ] as const) {
    if (isHexColor(v[key])) {
      out[key] = v[key];
    }
  }
  if (typeof v['dayMode'] === 'boolean') {
    out.dayMode = v['dayMode'];
  }
  if (MARKER_KINDS.includes(v['markerIcon'] as MarkerKind)) {
    out.markerIcon = v['markerIcon'] as MarkerKind;
  }
  return out;
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}
```

### `src/app/features/settings/settings-store.ts` (created)
```ts
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Color } from 'three';

import { AppearanceCache, AppearanceSettings, MarkerKind } from '../../core/cache/appearance-cache';

/** The subset of colours the three.js renderer consumes (the rest drive CSS only). */
export interface LivePalette {
  /** Country strokes. */
  teal: string;
  /** Atmosphere halo + flight arcs/marker. */
  cyan: string;
  /** Globe sphere base. */
  ocean: string;
  /** Heat ramp cold end. */
  landCold: string;
  /** Heat ramp hot end. */
  landHot: string;
  /** Flight marker icon fill (drawn with a black outline). */
  marker: string;
}

/**
 * Owns the live appearance settings. Reads the stylesheet's colours once as defaults, layers any
 * saved overrides on top, then mirrors every change back to (a) CSS custom properties — so panels,
 * borders and the heat legend recolour live — and (b) localStorage. The globe page reads
 * {@link palette}/{@link dayMode}/{@link markerIcon} and feeds them into the canvas.
 */
@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly cache = inject(AppearanceCache);
  /** Captured from the stylesheet at construction, before we override anything. */
  private readonly defaults = readCssDefaults();

  readonly background = signal(this.defaults.background);
  readonly accent = signal(this.defaults.accent);
  readonly accentSecondary = signal(this.defaults.accentSecondary);
  readonly accentTertiary = signal(this.defaults.accentTertiary);
  readonly markerColor = signal(this.defaults.markerColor);
  readonly ocean = signal(this.defaults.ocean);
  readonly heatCold = signal(this.defaults.heatCold);
  readonly heatHot = signal(this.defaults.heatHot);
  readonly dayMode = signal(this.defaults.dayMode);
  readonly markerIcon = signal<MarkerKind>(this.defaults.markerIcon);

  /** Mid heat tone, interpolated in HSL so cold→hot never washes through a muddy grey. */
  private readonly heatMid = computed(() =>
    new Color(this.heatCold()).lerpHSL(new Color(this.heatHot()), 0.5).getStyle(),
  );

  /** Colours the renderer needs, as a single object input for the canvas. */
  readonly palette = computed<LivePalette>(() => ({
    teal: this.accent(),
    cyan: this.accentSecondary(),
    ocean: this.ocean(),
    landCold: this.heatCold(),
    landHot: this.heatHot(),
    marker: this.markerColor(),
  }));

  constructor() {
    const saved = this.cache.load(this.defaults);
    this.applySettings(saved);

    // Mirror every change to CSS custom properties (for HTML/SCSS surfaces) and to localStorage.
    effect(() => {
      const settings = this.snapshot();
      const root = document.documentElement.style;
      root.setProperty('--space-void', settings.background);
      root.setProperty('--neon-teal', settings.accent);
      root.setProperty('--neon-cyan', settings.accentSecondary);
      root.setProperty('--neon-violet', settings.accentTertiary);
      root.setProperty('--flight-marker', settings.markerColor);
      root.setProperty('--globe-ocean', settings.ocean);
      root.setProperty('--globe-land-cold', settings.heatCold);
      root.setProperty('--globe-land-mid', this.heatMid());
      root.setProperty('--globe-land-hot', settings.heatHot);
      this.cache.save(settings);
    });
  }

  /** Restore every setting to the stylesheet defaults. */
  reset(): void {
    this.applySettings(this.defaults);
  }

  private applySettings(s: AppearanceSettings): void {
    this.background.set(s.background);
    this.accent.set(s.accent);
    this.accentSecondary.set(s.accentSecondary);
    this.accentTertiary.set(s.accentTertiary);
    this.markerColor.set(s.markerColor);
    this.ocean.set(s.ocean);
    this.heatCold.set(s.heatCold);
    this.heatHot.set(s.heatHot);
    this.dayMode.set(s.dayMode);
    this.markerIcon.set(s.markerIcon);
  }

  private snapshot(): AppearanceSettings {
    return {
      background: this.background(),
      accent: this.accent(),
      accentSecondary: this.accentSecondary(),
      accentTertiary: this.accentTertiary(),
      markerColor: this.markerColor(),
      ocean: this.ocean(),
      heatCold: this.heatCold(),
      heatHot: this.heatHot(),
      dayMode: this.dayMode(),
      markerIcon: this.markerIcon(),
    };
  }
}

/** Read the app's default colours from the stylesheet so they stay the single source of truth. */
function readCssDefaults(): AppearanceSettings {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    normalizeHex(styles.getPropertyValue(name).trim()) || fallback;
  return {
    background: read('--space-void', '#0d1b2a'),
    accent: read('--neon-teal', '#9fe0cf'),
    accentSecondary: read('--neon-cyan', '#a9d4f0'),
    accentTertiary: read('--neon-violet', '#c4b5e8'),
    markerColor: read('--flight-marker', '#4cc9f0'),
    ocean: read('--globe-ocean', '#112233'),
    heatCold: read('--globe-land-cold', '#7fa8c9'),
    heatHot: read('--globe-land-hot', '#ef9a8a'),
    dayMode: false,
    markerIcon: 'plane',
  };
}

/** `<input type="color">` only accepts `#rrggbb`; expand a `#rgb` shorthand and drop anything else. */
function normalizeHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(value);
  return short
    ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase()
    : '';
}
```

### `src/app/core/cache/data-transfer.ts` (created)
```ts
import { Injectable } from '@angular/core';

const FORMAT = 'earthviewmusic';
const VERSION = 1;

/** Every app localStorage entry is namespaced with this prefix. */
const KEY_PREFIX = 'evm.';
/**
 * Auth keys (`evm.spotify.*`) are deliberately excluded from transfer: they're secret and tied to
 * this browser's PKCE flow, so the user simply logs in again on the other browser.
 *
 * Everything else under {@link KEY_PREFIX} is portable and discovered dynamically — the origins
 * dataset, the liked-songs index, appearance, and every preference — so a new cache is exported
 * automatically without anyone remembering to add it to a list.
 */
const AUTH_PREFIX = 'evm.spotify.';
/**
 * Transient, per-browser session state that must never travel in a bundle:
 *  - `evm.ratelimit.*` — 429 cooldowns/schedule; carrying one would needlessly delay the destination.
 *  - `evm.syncState` — per-browser last-sync timestamps. Exporting them would make the destination's
 *    staleness guard skip its reconcile (up to 15 min), silently showing imported data unverified
 *    against Spotify. The destination should always reconcile a fresh import, so this stays local.
 * Each browser tracks its own.
 */
const TRANSIENT_PREFIXES = ['evm.ratelimit.', 'evm.syncState'];

/** Whether a localStorage key is portable app data (namespaced, and not a secret/transient key). */
function isPortable(key: string): boolean {
  return (
    key.startsWith(KEY_PREFIX) &&
    !key.startsWith(AUTH_PREFIX) &&
    !TRANSIENT_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

/** A versioned, self-describing snapshot of the portable localStorage entries. */
export interface DataBundle {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  /** Each portable key's stored value (parsed JSON, or the raw string for bare-string entries). */
  data: Record<string, unknown>;
}

/** Serialises/restores the app's portable data so it can be moved between browsers as one JSON file. */
@Injectable({ providedIn: 'root' })
export class DataTransfer {
  /** Bundle every portable localStorage entry into a pretty-printed JSON string. */
  serialize(now: Date): string {
    const data: Record<string, unknown> = {};
    for (const key of portableKeys()) {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        continue;
      }
      // Keep structured values readable in the file; any bare-string entries stay as-is.
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
    const bundle: DataBundle = {
      format: FORMAT,
      version: VERSION,
      exportedAt: now.toISOString(),
      data,
    };
    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Wipe every portable entry (globe dataset, liked index + preferences) from localStorage. The
   * Spotify auth keys are left untouched — same scope as {@link serialize} — so the user stays
   * logged in. Returns how many entries were actually removed.
   */
  clear(): number {
    const keys = portableKeys();
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    return keys.length;
  }

  /**
   * Validate a bundle and write its entries back to localStorage, **replacing** the destination's
   * current data (not merging). Portable keys are wiped first, so a destination holding keys the
   * bundle lacks (a different app version, or a partial older export) can't end up a hybrid,
   * internally-inconsistent dataset. Only portable keys are restored, so a tampered/old bundle can
   * never inject auth or foreign keys. Returns how many entries were restored. Throws if the JSON
   * isn't an EarthViewMusic bundle — validation runs *before* the wipe, so a bad file changes nothing.
   */
  apply(json: string): number {
    const parsed: unknown = JSON.parse(json);
    if (!isBundle(parsed)) {
      throw new Error('Not an EarthViewMusic data file.');
    }
    if (parsed.version > VERSION) {
      throw new Error('This data file was made by a newer version of EarthViewMusic.');
    }
    this.clear();
    let restored = 0;
    for (const [key, value] of Object.entries(parsed.data)) {
      if (!isPortable(key)) {
        continue;
      }
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      restored++;
    }
    return restored;
  }
}

/** The current portable localStorage keys — every `evm.*` entry except the secret auth keys. */
function portableKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null && isPortable(key)) {
      keys.push(key);
    }
  }
  return keys;
}

function isBundle(value: unknown): value is DataBundle {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate['format'] === FORMAT &&
    typeof candidate['version'] === 'number' &&
    candidate['data'] !== null &&
    typeof candidate['data'] === 'object'
  );
}
```

### `src/app/features/settings/settings-panel/settings-panel.ts` (created)
```ts
import { ChangeDetectionStrategy, Component, inject, Signal, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { MarkerKind } from '../../../core/cache/appearance-cache';
import { DataTransfer } from '../../../core/cache/data-transfer';
import { Confirm } from '../../../shared/confirm';
import { Toast } from '../../../shared/toast';
import { SettingsStore } from '../settings-store';

interface Swatch {
  label: string;
  value: Signal<string>;
  set: (value: string) => void;
}

interface MarkerOption {
  kind: MarkerKind;
  icon: string;
  label: string;
}

/**
 * Pinned gear panel for live appearance settings: day/studio lighting, the flight marker icon, and
 * the globe/accent/background colours. Edits the root {@link SettingsStore} directly — it is this
 * widget's whole purpose — which mirrors changes to CSS, the renderer, and localStorage.
 */
@Component({
  selector: 'app-settings-panel',
  imports: [MatButtonModule, MatButtonToggleModule, MatIconModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanel {
  protected readonly store = inject(SettingsStore);
  private readonly dataTransfer = inject(DataTransfer);
  private readonly toast = inject(Toast);
  private readonly confirm = inject(Confirm);
  protected readonly open = signal(false);

  protected readonly markers: readonly MarkerOption[] = [
    { kind: 'plane', icon: 'flight', label: 'Plane' },
    { kind: 'boat', icon: 'directions_boat', label: 'Sailboat' },
    { kind: 'car', icon: 'directions_car', label: 'Car' },
    { kind: 'train', icon: 'train', label: 'Train' },
    { kind: 'bike', icon: 'directions_bike', label: 'Bicycle' },
    { kind: 'note', icon: 'music_note', label: 'Music note' },
    { kind: 'record', icon: 'album', label: 'Vinyl record' },
  ];

  protected readonly swatches: readonly Swatch[] = [
    { label: 'Background', value: this.store.background, set: (v) => this.store.background.set(v) },
    { label: 'Primary accent', value: this.store.accent, set: (v) => this.store.accent.set(v) },
    {
      label: 'Secondary accent',
      value: this.store.accentSecondary,
      set: (v) => this.store.accentSecondary.set(v),
    },
    {
      label: 'Tertiary accent',
      value: this.store.accentTertiary,
      set: (v) => this.store.accentTertiary.set(v),
    },
    {
      label: 'Flight marker',
      value: this.store.markerColor,
      set: (v) => this.store.markerColor.set(v),
    },
    { label: 'Globe ocean', value: this.store.ocean, set: (v) => this.store.ocean.set(v) },
    { label: 'Heat — cold', value: this.store.heatCold, set: (v) => this.store.heatCold.set(v) },
    { label: 'Heat — hot', value: this.store.heatHot, set: (v) => this.store.heatHot.set(v) },
  ];

  protected pickColor(swatch: Swatch, event: Event): void {
    swatch.set((event.target as HTMLInputElement).value);
  }

  protected setMarker(kind: MarkerKind): void {
    this.store.markerIcon.set(kind);
  }

  /** Download the globe dataset + preferences as a JSON file to carry to another browser. */
  protected exportData(): void {
    const json = this.dataTransfer.serialize(new Date());
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `earthviewmusic-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Read a previously-exported file and restore it, then reload so every store re-hydrates. */
  protected importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // let the same file be picked again later
    if (!file) {
      return;
    }
    void file.text().then(async (text) => {
      const ok = await this.confirm.ask({
        title: 'Import data?',
        message: 'This replaces your current globe data and settings, then reloads. Continue?',
        confirmLabel: 'Import & reload',
      });
      if (!ok) {
        return;
      }
      try {
        this.dataTransfer.apply(text);
        location.reload();
      } catch (error) {
        this.toast.error(
          `Couldn't import data: ${error instanceof Error ? error.message : 'invalid file'}`,
        );
      }
    });
  }

  /** Wipe the locally-stored globe dataset + preferences (keeps you logged in), then reload. */
  protected async deleteData(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete local data?',
      message:
        'Delete your locally-stored globe data and settings? You stay logged in, but the globe ' +
        'will rebuild from your Liked Songs on next load. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    this.dataTransfer.clear();
    location.reload();
  }
}
```

### `src/app/features/settings/settings-panel/settings-panel.html` (created)
```html
@if (open()) {
  <div class="panel">
    <section class="group">
      <span class="heading">Lighting</span>
      <mat-slide-toggle [checked]="store.dayMode()" (change)="store.dayMode.set($event.checked)">
        Day mode (sunlit)
      </mat-slide-toggle>
    </section>

    <section class="group">
      <span class="heading">Flight marker</span>
      <mat-button-toggle-group
        class="markers"
        [value]="store.markerIcon()"
        (change)="setMarker($event.value)"
        aria-label="Flight marker icon"
      >
        @for (marker of markers; track marker.kind) {
          <mat-button-toggle [value]="marker.kind" [attr.aria-label]="marker.label">
            <mat-icon>{{ marker.icon }}</mat-icon>
          </mat-button-toggle>
        }
      </mat-button-toggle-group>
    </section>

    <section class="group">
      <span class="heading">Colours</span>
      @for (swatch of swatches; track swatch.label) {
        <label class="swatch">
          <span>{{ swatch.label }}</span>
          <input
            type="color"
            [value]="swatch.value()"
            (input)="pickColor(swatch, $event)"
            [attr.aria-label]="swatch.label"
          />
        </label>
      }
    </section>

    <section class="group">
      <span class="heading">Data</span>
      <div class="data-actions">
        <button mat-stroked-button (click)="exportData()">
          <mat-icon>download</mat-icon>
          Export
        </button>
        <button mat-stroked-button (click)="fileInput.click()">
          <mat-icon>upload</mat-icon>
          Import
        </button>
        <button mat-stroked-button class="danger" (click)="deleteData()">
          <mat-icon>delete</mat-icon>
          Delete
        </button>
      </div>
      <input
        #fileInput
        type="file"
        accept="application/json,.json"
        hidden
        (change)="importData($event)"
      />
    </section>

    <button mat-stroked-button class="reset" (click)="store.reset()">
      <mat-icon>restart_alt</mat-icon>
      Reset appearance
    </button>
  </div>
}

<button
  mat-mini-fab
  class="trigger"
  (click)="open.set(!open())"
  [attr.aria-label]="open() ? 'Close appearance settings' : 'Customize globe appearance'"
>
  <mat-icon>{{ open() ? 'close' : 'tune' }}</mat-icon>
</button>
```

### `src/app/features/settings/settings-panel/settings-panel.scss` (created)
```scss
:host {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 15rem;
  max-height: min(70vh, 32rem);
  overflow-y: auto;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--glow-shadow);
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.heading {
  font: var(--mat-sys-title-small);
  color: var(--neon-teal);
}

.markers {
  align-self: flex-start;
  // Seven icons won't fit one row in the panel — let them wrap to a grid.
  flex-wrap: wrap;
}

.swatch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font: var(--mat-sys-body-medium);
  cursor: pointer;

  span {
    color: var(--mat-sys-on-surface-variant);
  }

  // Native colour picker, restyled to a tidy rounded chip.
  input[type='color'] {
    inline-size: 2.25rem;
    block-size: 1.5rem;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--neon-teal) 35%, transparent);
    border-radius: 0.4rem;
    background: none;
    cursor: pointer;

    &::-webkit-color-swatch-wrapper {
      padding: 2px;
    }

    &::-webkit-color-swatch {
      border: none;
      border-radius: 0.25rem;
    }
  }
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  // Export + Import share the first row; Delete wraps to its own full-width row below.
  button {
    flex: 1 1 6rem;
  }

  .danger {
    flex-basis: 100%;
    --mat-stroked-button-label-text-color: var(--mat-sys-error);
    color: var(--mat-sys-error);
    border-color: color-mix(in srgb, var(--mat-sys-error) 45%, transparent);
  }
}

.reset {
  align-self: flex-start;
}

.trigger {
  box-shadow: var(--glow-shadow);
}
```

### `src/app/features/globe/flight-layer.ts` (modified — full file)
Grown from the plane-only M8 overlay into the full marker engine: `MarkerKind` now comes from
`appearance-cache` (step 01), the constructor takes its `markerKind` + `isWater` params again (8 args), and
the marker constants / fields / methods / six glyph drawings are all restored (step 03). The whole file:
```ts
import {
  BufferGeometry,
  type Camera,
  CanvasTexture,
  Color,
  ConeGeometry,
  Group,
  Line,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  QuadraticBezierCurve3,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from 'three';
import type ThreeGlobe from 'three-globe';

import { MarkerKind } from '../../core/cache/appearance-cache';
import { LatLng } from '../../core/geo/geo-data';
import { FlightTarget } from './flight-target';

const DEG2RAD = Math.PI / 180;

/** Plane sits/circles clearly above the surface so its sprites never clip into terrain. */
const PLANE_ALT = 0.13;
/** Arc endpoints ride at cruise altitude so a flight departs/arrives continuous with the circle —
 * no vertical pop down to the surface and back. The trail bows higher than this between them. */
const ARC_MIN_ALT = 0.14;
const ARC_DIST_ALT = 0.55;

/** Circle radius around the country centroid, in degrees, and one loop's period. */
const CIRCLE_RADIUS_DEG = 7;
const CIRCLE_PERIOD_MS = 9000;

/**
 * Easing of the marker's heading toward its travel direction, expressed as a time constant (ms)
 * rather than a per-frame factor — so the turn rate is identical whether frames arrive every 8 ms or
 * 33 ms, and a dropped frame can't make the heading lurch to catch up to the time-based position.
 * Larger = a softer, slower turn.
 */
const ROTATION_TIME_CONSTANT_MS = 100;
/**
 * Subtle bank: the marker leans into a turn by an extra roll proportional to how fast its heading is
 * changing (rad/s), clamped so a hard turn never rolls it flat. Purely cosmetic; directional glyphs
 * only. Set to 0 to disable.
 */
const BANK_PER_RAD_PER_S = 0.4;
const BANK_MAX = 0.22;
/** Nominal 60 fps frame, used for the first frame when there's no prior timestamp to diff against. */
const NOMINAL_FRAME_MS = 1000 / 60;
/** Cap a frame's dt so a long stall (e.g. a backgrounded tab) eases gently instead of snapping. */
const MAX_FRAME_MS = 100;

/** A late-detected song still gets a visible hop rather than teleporting. */
const MIN_FLIGHT_MS = 2500;

/** Where the plane goes when an artist's country is unknown — the empty mid-Pacific. */
const PACIFIC: LatLng = { lat: 0, lng: -155 };
/** Unknown destinations fly out over only the first third of the song, then circle the rest. */
const UNKNOWN_FLIGHT_FRACTION = 1 / 3;

/** Past dotted paths kept on the map; the oldest fades out once exceeded. */
const MAX_ARCS = 10;
const ARC_FADE_MS = 1500;
const ARC_OPACITY = 0.9;

const UP = new Vector3(0, 1, 0);
/** The arc's destination arrowhead — large enough to read clearly as "the plane is heading here". */
const ARROW_RADIUS = 3.4;
const ARROW_HEIGHT = 9;
const ARROW_GEOMETRY = new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 16);

/**
 * On-screen direction each marker's artwork points at zero rotation, measured CCW from screen-right
 * (the canvas is drawn facing right; the plane is drawn nose-up). `null` marks a non-directional
 * glyph (note/record) that should stay upright. Land/water vehicles in {@link MIRROR_KINDS} mirror
 * rather than rotate past vertical, so they never ride upside-down when heading screen-left.
 */
const MARKER_FORWARD: Record<MarkerKind, number | null> = {
  plane: Math.PI / 2,
  note: null,
  boat: 0,
  car: 0,
  train: 0,
  bike: 0,
  record: null,
};
const MIRROR_KINDS = new Set<MarkerKind>(['boat', 'car', 'train', 'bike']);

/** Land-bound markers that hop into a boat across open water; plane + music markers never change. */
const TERRAIN_KINDS = new Set<MarkerKind>(['car', 'train', 'bike']);
/** How often (ms) to re-check the terrain under the marker — cheap, and coastlines pass slowly. */
const TERRAIN_CHECK_MS = 200;

interface Arc {
  line: Line;
  lineMaterial: LineDashedMaterial;
  head: Mesh;
  headMaterial: MeshBasicMaterial;
  fading: boolean;
  fadeStart: number;
}

type Leg =
  | { mode: 'circle'; center: LatLng }
  | {
      mode: 'fly';
      curve: QuadraticBezierCurve3;
      dest: LatLng;
      /** Country to highlight on arrival, or null for the unknown/Pacific destination. */
      destCode: string | null;
      start: number;
      duration: number;
    };

/**
 * The animated plane + its dotted trail, layered onto the three-globe. Owned by {@link GlobeRenderer}
 * and driven imperatively (no signals): `setTarget` on each track change, `update(now)` every frame.
 * Same country → circle it; new country → fly a curved arc, arriving as the song ends.
 */
export class FlightLayer {
  /** Country to highlight (the one being circled), or null mid-flight. */
  onHighlightChange?: () => void;

  private readonly layer = new Group();
  private readonly plane = new Group();
  private readonly glyphSprite: Sprite;

  /** Accent colour for the flight arcs; updated live from settings. */
  private readonly arcColor: Color;
  /** The raw accent from settings (for change-detection) and its brightened, more-visible variant. */
  private rawAccent: string;
  private accentHex: string;
  /** The marker glyph's fill colour, chosen independently of the accent — drawn with a black outline. */
  private markerColor: string;
  /** The marker the user chose, and what's actually drawn — a land vehicle becomes a boat over water. */
  private selectedKind: MarkerKind;
  private displayedKind: MarkerKind;
  /** True when a lat/lng is open water (no country under it); drives the land-vehicle → boat swap. */
  private readonly isWater: (lat: number, lng: number) => boolean;
  /** Throttle the terrain check — point-in-polygon every frame would be wasteful. */
  private lastTerrainCheck = 0;
  private leg: Leg | null = null;
  /** User toggled the overlay off: the plane keeps flying (the leg still advances every frame), it's
   * just not drawn — so toggling back on resumes at the live position rather than restarting. */
  private hidden = false;
  /** Where the plane currently rests/circles; null until the first track places it. */
  private currentCenter: LatLng | null = null;
  private currentCode: string | null = null;
  private highlight: string | null = null;
  private readonly arcs: Arc[] = [];
  private activeArc: Arc | null = null;

  /** Last frame's plane position + scratch vectors, used to orient the marker along its travel. */
  private readonly prevPos = new Vector3();
  private hasPrev = false;
  /** Wall-clock of the previous frame and this frame's derived (frame-rate-independent) ease alpha. */
  private lastFrame = 0;
  private frameDtMs = NOMINAL_FRAME_MS;
  private rotationAlpha = 0;
  private facingMirror = false;
  /** Previous frame's screen-space travel heading, to derive the turn rate that drives the bank. */
  private prevHeading = 0;
  private hasHeading = false;
  private readonly camRight = new Vector3();
  private readonly camUp = new Vector3();
  private readonly velocity = new Vector3();

  constructor(
    private readonly globe: ThreeGlobe,
    private readonly camera: Camera,
    private readonly centroids: ReadonlyMap<string, LatLng>,
    private readonly radius: number,
    accentColor: string,
    markerColor: string,
    markerKind: MarkerKind,
    isWater: (lat: number, lng: number) => boolean,
  ) {
    this.rawAccent = accentColor;
    this.accentHex = vivid(accentColor);
    this.arcColor = new Color(this.accentHex);
    this.markerColor = markerColor;
    this.selectedKind = markerKind;
    this.displayedKind = markerKind;
    this.isWater = isWater;

    this.glyphSprite = new Sprite(
      new SpriteMaterial({
        map: makeMarkerTexture(markerKind, this.markerColor),
        transparent: true,
        depthWrite: false,
      }),
    );
    this.glyphSprite.scale.set(8, 8, 1);

    this.plane.add(this.glyphSprite);
    this.plane.visible = false;
    this.layer.add(this.plane);
    this.globe.add(this.layer);
  }

  highlightCode(): string | null {
    // The highlight is part of the overlay — suppress it while hidden so the globe shows no flight tint.
    return this.hidden ? null : this.highlight;
  }

  /**
   * Show or hide the whole overlay (plane + route arcs + country highlight) without disturbing the
   * flight: `update()` keeps advancing the leg every frame, so re-showing it picks up at the plane's
   * current point of the trip instead of restarting. Toggling the parent group is all it takes — the
   * marker's own visibility (track playing or not) and the arcs are children of it.
   */
  setHidden(hidden: boolean): void {
    if (hidden === this.hidden) {
      return;
    }
    this.hidden = hidden;
    this.layer.visible = !hidden;
    this.onHighlightChange?.();
  }

  /**
   * The marker's live world position, or null when it isn't placed/visible. The globe sits at the
   * origin with no rotation (the camera orbits it), so the plane's local position is also its world
   * position — letting the renderer steer a follow-camera straight at it.
   */
  planePosition(): Vector3 | null {
    return this.leg !== null && this.plane.visible ? this.plane.position : null;
  }

  /** Swap the marker icon live; re-evaluates the terrain so a land vehicle may show as a boat. */
  setMarker(kind: MarkerKind): void {
    if (kind === this.selectedKind) {
      return;
    }
    this.selectedKind = kind;
    this.refreshMarker();
  }

  /** Recolour the future flight arcs when the secondary accent changes. */
  setAccent(color: string): void {
    if (color === this.rawAccent) {
      return;
    }
    this.rawAccent = color;
    this.accentHex = vivid(color);
    this.arcColor.set(this.accentHex);
  }

  /** Recolour the marker glyph live when the user picks a new marker colour. */
  setMarkerColor(color: string): void {
    if (color === this.markerColor) {
      return;
    }
    this.markerColor = color;
    this.renderGlyph();
  }

  /** Redraw the marker glyph onto its sprite for the currently-displayed kind + marker colour. */
  private renderGlyph(): void {
    const material = this.glyphSprite.material;
    material.map?.dispose();
    material.map = makeMarkerTexture(this.displayedKind, this.markerColor);
    material.needsUpdate = true;
    // The fresh texture starts unmirrored; let the next orient step re-apply a flip if needed.
    this.facingMirror = false;
    // Forget the heading sample so a kind swap can't spike the bank against a stale heading.
    this.hasHeading = false;
  }

  /**
   * Keep the drawn marker in step with the chosen kind and the terrain underneath it: land vehicles
   * (car/train/bike) ride a boat across open water; plane and the music markers never change. Only
   * redraws when the displayed kind actually flips, so it's cheap to call.
   */
  private refreshMarker(): void {
    const at = this.currentLatLng();
    const overWater = at !== null && this.isWater(at.lat, at.lng);
    const want = TERRAIN_KINDS.has(this.selectedKind) && overWater ? 'boat' : this.selectedKind;
    if (want !== this.displayedKind) {
      this.displayedKind = want;
      this.renderGlyph();
    }
  }

  /** The plane's live lat/lng, or null before the first track has placed it. */
  private currentLatLng(): LatLng | null {
    if (this.leg === null) {
      return null;
    }
    const { lat, lng } = this.globe.toGeoCoords(this.plane.position);
    return { lat, lng };
  }

  setTarget(target: FlightTarget | null, now: number): void {
    if (target === null) {
      // Nothing playing: park the plane out of sight; faded arcs fade on their own. (Hiding the
      // overlay via the view toggle goes through setHidden, which leaves the live leg untouched.)
      this.plane.visible = false;
      this.leg = null;
      this.hasPrev = false; // forget stale heading so it doesn't jolt when the plane reappears
      this.hasHeading = false;
      this.setHighlight(null);
      return;
    }
    this.plane.visible = true;

    const code = target.countryCode;
    const known = code !== null && this.centroids.has(code);
    const dest = known ? this.centroids.get(code)! : PACIFIC;
    const destCode = known ? code : null;
    const remaining = Math.max(MIN_FLIGHT_MS, target.durationMs - target.progressMs);
    // Unknown origin: fly out over only the first third of the song, then circle the Pacific.
    const duration = known
      ? remaining
      : Math.max(MIN_FLIGHT_MS, remaining * UNKNOWN_FLIGHT_FRACTION);

    // First track: just drop the plane on the destination and circle.
    if (this.leg === null) {
      this.settleAt(dest, destCode);
      return;
    }
    // Already sitting on / flying toward this same place → nothing to do (e.g. same-country skip).
    const headingTo = this.leg.mode === 'fly' ? this.leg.destCode : this.currentCode;
    if (destCode === headingTo) {
      return;
    }
    // Country changed (including a mid-flight skip): retarget now, from where the plane actually is.
    this.startFlight(this.currentFrom(), this.currentAlt(), dest, destCode, duration, now);
    // Light the destination for the whole flight so you can see where the plane is heading; it stays
    // lit through arrival (settleAt re-sets the same code, a no-op). A null code (unknown/Pacific
    // origin) clears the highlight, as before.
    this.setHighlight(destCode);
  }

  /**
   * The plane's live position as lat/lng — used as a flight's start so a new leg departs from exactly
   * where the marker is (mid-orbit or mid-flight), never snapping to the country centroid.
   */
  private currentFrom(): LatLng {
    if (this.leg === null) {
      return this.currentCenter ?? PACIFIC;
    }
    const { lat, lng } = this.globe.toGeoCoords(this.plane.position);
    return { lat, lng };
  }

  /** The plane's current altitude (globe radii above the surface), so a flight departs at cruise. */
  private currentAlt(): number {
    if (this.leg === null) {
      return PLANE_ALT;
    }
    return this.plane.position.length() / this.radius - 1;
  }

  update(now: number): void {
    // Derive this frame's easing alpha from real elapsed time, so heading turns stay smooth and
    // frame-rate independent — matching the time-parametrised position rather than lagging on hitches.
    const dt =
      this.lastFrame === 0 ? NOMINAL_FRAME_MS : Math.min(MAX_FRAME_MS, now - this.lastFrame);
    this.lastFrame = now;
    this.frameDtMs = dt;
    this.rotationAlpha = 1 - Math.exp(-dt / ROTATION_TIME_CONSTANT_MS);
    this.animatePlane(now);
    this.fadeArcs(now);
    // Coastline crossings are gradual; a few checks a second is plenty and keeps picking cheap.
    if (now - this.lastTerrainCheck > TERRAIN_CHECK_MS) {
      this.lastTerrainCheck = now;
      this.refreshMarker();
    }
  }

  dispose(): void {
    for (const arc of [...this.arcs, this.activeArc]) {
      if (arc !== null) {
        this.disposeArc(arc);
      }
    }
    disposeSprite(this.glyphSprite);
    this.globe.remove(this.layer);
  }

  private animatePlane(now: number): void {
    if (this.leg === null) {
      return;
    }
    if (this.leg.mode === 'circle') {
      const angle = (now / CIRCLE_PERIOD_MS) * Math.PI * 2;
      this.plane.position.copy(this.circlePosition(this.leg.center, angle));
      this.orientToHeading();
      return;
    }
    const t = Math.min(1, (now - this.leg.start) / this.leg.duration);
    // Ease the position along the curve so the leg accelerates out of the orbit and decelerates into
    // the destination, instead of a constant-velocity slide. Arrival still lands as the song ends.
    this.leg.curve.getPoint(easeInOut(t), this.plane.position);
    this.orientToHeading();
    if (t >= 1) {
      if (this.activeArc !== null) {
        this.arcs.push(this.activeArc);
        this.activeArc = null;
        this.enforceCap(now);
      }
      this.settleAt(this.leg.dest, this.leg.destCode);
    }
  }

  /**
   * Rotate the marker so its artwork points along the plane's on-screen travel direction. The sprite
   * billboards to the camera, so the screen axes are the camera's right/up — project the world-space
   * velocity onto them and the `atan2` of the result is the on-screen heading. Land/water vehicles
   * mirror past vertical instead of rolling upside-down; non-directional glyphs stay upright.
   */
  private orientToHeading(): void {
    if (MARKER_FORWARD[this.displayedKind] === null) {
      this.setMirror(false);
      this.hasHeading = false;
      this.glyphSprite.material.rotation = 0;
      return;
    }
    if (!this.hasPrev) {
      this.prevPos.copy(this.plane.position);
      this.hasPrev = true;
      return;
    }
    this.velocity.subVectors(this.plane.position, this.prevPos);
    this.prevPos.copy(this.plane.position);
    if (this.velocity.lengthSq() < 1e-6) {
      return; // barely moving — keep the last heading rather than spin to noise
    }
    const theta = this.headingFromDirection(this.velocity);
    // Lean into the turn by an extra roll proportional to how fast the heading is sweeping — only the
    // plane banks; a leaning car/train/bike would look wrong, so they track the heading flat. Sample
    // the rate every frame (keeps it current), but only apply the bank mid-flight: a steady orbit
    // would otherwise hold a constant, odd-looking tilt instead of circling level.
    const rawBank = this.displayedKind === 'plane' ? this.bankFor(theta) : 0;
    const bank = this.leg?.mode === 'fly' ? rawBank : 0;
    this.applyHeading(theta, bank, false);
  }

  /**
   * Snap the marker to point along a world-space direction immediately (no easing). Used at the start
   * of a flight so the plane aligns with the fresh arc on frame one, instead of holding the old
   * orbit's heading while the eased position slowly accelerates out of the turn.
   */
  private snapHeadingTo(direction: Vector3): void {
    if (MARKER_FORWARD[this.displayedKind] === null) {
      this.setMirror(false);
      this.glyphSprite.material.rotation = 0;
      return;
    }
    this.applyHeading(this.headingFromDirection(direction), 0, true);
  }

  /** The on-screen heading (CCW from screen-right) of a world-space direction, via the camera axes. */
  private headingFromDirection(direction: Vector3): number {
    this.camRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.camUp.setFromMatrixColumn(this.camera.matrixWorld, 1);
    return Math.atan2(direction.dot(this.camUp), direction.dot(this.camRight));
  }

  /**
   * Point the marker along screen-space heading `theta`: mirror an asymmetric vehicle past vertical
   * rather than roll it upside-down, then either snap to the resulting rotation or ease toward it.
   */
  private applyHeading(theta: number, bank: number, snap: boolean): void {
    const forward = MARKER_FORWARD[this.displayedKind]!;
    let target: number;
    if (MIRROR_KINDS.has(this.displayedKind) && Math.cos(theta) < 0) {
      this.setMirror(true);
      // Mirrored art faces left at zero rotation; the bank's screen sense flips with it.
      target = theta - Math.PI - forward - bank;
    } else {
      this.setMirror(false);
      target = theta - forward + bank;
    }
    if (snap) {
      this.glyphSprite.material.rotation = target;
    } else {
      this.easeRotation(target);
    }
  }

  /** Clamped roll proportional to the screen-heading turn rate (rad/s); 0 on the first sample. */
  private bankFor(heading: number): number {
    if (!this.hasHeading) {
      this.prevHeading = heading;
      this.hasHeading = true;
      return 0;
    }
    let delta = (heading - this.prevHeading) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    this.prevHeading = heading;
    const ratePerS = delta / (this.frameDtMs / 1000);
    return clamp(BANK_PER_RAD_PER_S * ratePerS, -BANK_MAX, BANK_MAX);
  }

  /**
   * Ease the marker's rotation toward `target` along the shortest angular path, so a heading change
   * (a new arc on track change, or the flight→circle hand-off) turns smoothly instead of snapping.
   */
  private easeRotation(target: number): void {
    const material = this.glyphSprite.material;
    let delta = (target - material.rotation) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    material.rotation += delta * this.rotationAlpha;
  }

  /** Flip the marker texture horizontally so an asymmetric vehicle stays upright heading screen-left. */
  private setMirror(on: boolean): void {
    if (on === this.facingMirror) {
      return;
    }
    this.facingMirror = on;
    const map = this.glyphSprite.material.map;
    if (map === null) {
      return;
    }
    map.repeat.x = on ? -1 : 1;
    map.offset.x = on ? 1 : 0;
  }

  /** Park the plane over a destination and circle it; highlight its country (none for Pacific). */
  private settleAt(dest: LatLng, destCode: string | null): void {
    this.currentCenter = dest;
    this.currentCode = destCode;
    this.setHighlight(destCode);
    this.leg = { mode: 'circle', center: dest };
  }

  private startFlight(
    from: LatLng,
    fromAlt: number,
    to: LatLng,
    destCode: string | null,
    duration: number,
    now: number,
  ): void {
    // Skipping mid-flight abandons the previous leg — drop its half-drawn arc rather than leak it.
    if (this.activeArc !== null) {
      this.disposeArc(this.activeArc);
      this.activeArc = null;
    }
    const curve = this.buildArc(from, fromAlt, to);
    this.activeArc = this.addArcVisual(curve);
    this.leg = { mode: 'fly', curve, dest: to, destCode, start: now, duration };
    // Align the marker with the fresh arc right away. The eased position barely moves for the first
    // frames (easeInOut starts near zero velocity), so without this snap the plane would hold its old
    // orbit heading — visibly off the arc and its arrowhead — until the easing slowly caught up.
    this.prevPos.copy(this.plane.position);
    this.hasPrev = true;
    this.hasHeading = false;
    this.snapHeadingTo(curve.getTangent(0));
  }

  /**
   * A quadratic arc from the plane's live point to the destination. Endpoints sit at cruise altitude
   * (the start at wherever the plane currently is, the end at {@link PLANE_ALT}) so a flight blends
   * seamlessly out of and back into the circling orbit, with the control point bowed higher between.
   */
  private buildArc(from: LatLng, fromAlt: number, to: LatLng): QuadraticBezierCurve3 {
    const p0 = this.coords(from.lat, from.lng, fromAlt);
    const p1 = this.coords(to.lat, to.lng, PLANE_ALT);
    const s0 = this.coords(from.lat, from.lng, 0);
    const s1 = this.coords(to.lat, to.lng, 0);
    // Bow the arc higher the farther apart the endpoints are — but never below the (possibly high)
    // departure altitude of a mid-flight skip, so the fresh arc rises away rather than dipping first.
    const baseLift = ARC_MIN_ALT + ARC_DIST_ALT * (s0.angleTo(s1) / Math.PI);
    const lift = Math.max(baseLift, fromAlt + 0.05);
    const mid = s0
      .clone()
      .add(s1)
      .normalize()
      .multiplyScalar(this.radius * (1 + lift));
    return new QuadraticBezierCurve3(p0, mid, p1);
  }

  private addArcVisual(curve: QuadraticBezierCurve3): Arc {
    const points = curve.getPoints(72);
    const geometry = new BufferGeometry().setFromPoints(points);
    const lineMaterial = new LineDashedMaterial({
      color: this.arcColor,
      transparent: true,
      opacity: ARC_OPACITY,
      dashSize: 2.2,
      gapSize: 2,
    });
    const line = new Line(geometry, lineMaterial);
    line.computeLineDistances();
    this.layer.add(line);

    const headMaterial = new MeshBasicMaterial({
      color: this.arcColor,
      transparent: true,
      opacity: ARC_OPACITY,
    });
    const head = new Mesh(ARROW_GEOMETRY, headMaterial);
    const tip = points[points.length - 1]!;
    const direction = curve.getTangent(1).normalize();
    head.quaternion.setFromUnitVectors(UP, direction);
    // Pull the cone back by half its height so its point — not its centre — sits on the arc tip,
    // i.e. the arrow's nose touches down on the destination country.
    head.position.copy(tip).addScaledVector(direction, -ARROW_HEIGHT / 2);
    this.layer.add(head);

    return { line, lineMaterial, head, headMaterial, fading: false, fadeStart: 0 };
  }

  private enforceCap(now: number): void {
    const live = this.arcs.filter((arc) => !arc.fading);
    for (let i = 0; i < live.length - MAX_ARCS; i++) {
      live[i]!.fading = true;
      live[i]!.fadeStart = now;
    }
  }

  private fadeArcs(now: number): void {
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const arc = this.arcs[i]!;
      if (!arc.fading) {
        continue;
      }
      const progress = (now - arc.fadeStart) / ARC_FADE_MS;
      if (progress >= 1) {
        this.disposeArc(arc);
        this.arcs.splice(i, 1);
      } else {
        // Ease-out so the trail lingers, then drops away quickly at the end — softer than a linear ramp.
        const remaining = 1 - easeOut(progress);
        arc.lineMaterial.opacity = ARC_OPACITY * remaining;
        arc.headMaterial.opacity = ARC_OPACITY * remaining;
      }
    }
  }

  private circlePosition(center: LatLng, angle: number): Vector3 {
    const cosLat = Math.max(0.2, Math.cos(center.lat * DEG2RAD));
    const lat = center.lat + CIRCLE_RADIUS_DEG * Math.sin(angle);
    const lng = center.lng + (CIRCLE_RADIUS_DEG * Math.cos(angle)) / cosLat;
    return this.coords(lat, lng, PLANE_ALT);
  }

  /** three-globe's `getCoords` returns a plain `{x,y,z}`; wrap it as a real Vector3. */
  private coords(lat: number, lng: number, alt: number): Vector3 {
    const { x, y, z } = this.globe.getCoords(lat, lng, alt);
    return new Vector3(x, y, z);
  }

  private setHighlight(code: string | null): void {
    if (code === this.highlight) {
      return;
    }
    this.highlight = code;
    this.onHighlightChange?.();
  }

  private disposeArc(arc: Arc): void {
    this.layer.remove(arc.line, arc.head);
    arc.line.geometry.dispose();
    arc.lineMaterial.dispose();
    arc.headMaterial.dispose();
  }
}

/**
 * Brighten the accent into a punchier variant for the arcs + marker, so they stay legible against
 * both the pale heat ramp and the dark ocean — the soft pastel accent alone tends to wash out.
 */
function vivid(hex: string): string {
  const color = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, Math.min(1, hsl.s + 0.35), Math.min(0.62, Math.max(0.5, hsl.l - 0.18)));
  return `#${color.getHexString()}`;
}

/** Canvas size every marker is drawn into; sprite scale maps it to world units. */
const MARKER_SIZE = 128;
/** Black outline width (px) ringed around each glyph so it reads on any globe colour. */
const MARKER_OUTLINE = 5;

/**
 * Draw the chosen marker icon, tinted with `color` and ringed with a black outline, to a billboard
 * texture. The glyph is rendered once to an offscreen canvas, then a dilated black silhouette of it
 * is stamped behind the colour — one uniform outline that works for every glyph shape without having
 * to stroke each drawing by hand.
 */
function makeMarkerTexture(kind: MarkerKind, color: string): CanvasTexture {
  const glyph = drawGlyphCanvas(kind, color);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext('2d')!;
  stampOutline(ctx, blackSilhouette(glyph));
  ctx.drawImage(glyph, 0, 0);
  return new CanvasTexture(canvas);
}

/** Render just the tinted glyph (no outline) to its own canvas. */
function drawGlyphCanvas(kind: MarkerKind, color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  switch (kind) {
    case 'plane':
      drawPlane(ctx);
      break;
    case 'note':
      // ♫ has a monochrome (text) default presentation, so it tints with fillStyle.
      drawGlyph(ctx, '♫');
      break;
    case 'boat':
      drawBoat(ctx);
      break;
    case 'car':
      drawCar(ctx);
      break;
    case 'train':
      drawTrain(ctx);
      break;
    case 'bike':
      drawBike(ctx);
      break;
    case 'record':
      drawRecord(ctx);
      break;
  }
  return canvas;
}

/** A solid-black copy of `glyph`, masked to its alpha — the shape that gets dilated into an outline. */
function blackSilhouette(glyph: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(glyph, 0, 0);
  // Keep only where the glyph is opaque, then flood it black — a clean silhouette of any shape.
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, MARKER_SIZE, MARKER_SIZE);
  return canvas;
}

/** Stamp the silhouette around a ring of offsets, dilating it into an even {@link MARKER_OUTLINE} edge. */
function stampOutline(ctx: CanvasRenderingContext2D, silhouette: HTMLCanvasElement): void {
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    ctx.drawImage(silhouette, Math.cos(angle) * MARKER_OUTLINE, Math.sin(angle) * MARKER_OUTLINE);
  }
}

/** Centre a single text glyph in the marker box. */
function drawGlyph(ctx: CanvasRenderingContext2D, glyph: string): void {
  ctx.font = `${MARKER_SIZE * 0.7}px "Material Icons", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, MARKER_SIZE / 2, MARKER_SIZE / 2);
}

/**
 * Top-down airplane silhouette, nose pointing UP (−y) so its forward direction is a known
 * {@link MARKER_FORWARD} of π/2 — independent of any system font's glyph orientation.
 */
function drawPlane(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(64, 18); // nose
  ctx.lineTo(72, 58); // right shoulder
  ctx.lineTo(108, 80); // right wingtip (leading)
  ctx.lineTo(108, 88); // right wingtip (trailing)
  ctx.lineTo(72, 72); // right wing root
  ctx.lineTo(70, 96); // right fuselage toward tail
  ctx.lineTo(88, 108); // right tailplane tip (leading)
  ctx.lineTo(88, 114); // right tailplane tip (trailing)
  ctx.lineTo(64, 104); // tail centre
  ctx.lineTo(40, 114); // left tailplane tip (trailing)
  ctx.lineTo(40, 108); // left tailplane tip (leading)
  ctx.lineTo(58, 96); // left fuselage toward tail
  ctx.lineTo(56, 72); // left wing root
  ctx.lineTo(20, 88); // left wingtip (trailing)
  ctx.lineTo(20, 80); // left wingtip (leading)
  ctx.lineTo(56, 58); // left shoulder
  ctx.closePath();
  ctx.fill();
}

/** Sailboat silhouette: a hull under a mast with a mainsail and jib. Centred in the 128 box. */
function drawBoat(ctx: CanvasRenderingContext2D): void {
  // Hull.
  ctx.beginPath();
  ctx.moveTo(26, 82);
  ctx.lineTo(102, 82);
  ctx.lineTo(86, 100);
  ctx.lineTo(42, 100);
  ctx.closePath();
  ctx.fill();
  // Mast.
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 18);
  ctx.lineTo(64, 82);
  ctx.stroke();
  // Mainsail (right of the mast).
  ctx.beginPath();
  ctx.moveTo(70, 24);
  ctx.lineTo(70, 76);
  ctx.lineTo(100, 76);
  ctx.closePath();
  ctx.fill();
  // Jib (left of the mast).
  ctx.beginPath();
  ctx.moveTo(58, 38);
  ctx.lineTo(58, 76);
  ctx.lineTo(34, 76);
  ctx.closePath();
  ctx.fill();
}

/** Side-on car silhouette: a body with a domed cabin and two wheels. */
function drawCar(ctx: CanvasRenderingContext2D): void {
  // Body + cabin as one outline.
  ctx.beginPath();
  ctx.moveTo(20, 76);
  ctx.lineTo(24, 62);
  ctx.lineTo(44, 62);
  ctx.lineTo(54, 46);
  ctx.lineTo(84, 46);
  ctx.lineTo(94, 62);
  ctx.lineTo(106, 64);
  ctx.lineTo(108, 76);
  ctx.closePath();
  ctx.fill();
  // Wheels.
  ctx.beginPath();
  ctx.arc(44, 80, 11, 0, Math.PI * 2);
  ctx.arc(86, 80, 11, 0, Math.PI * 2);
  ctx.fill();
}

/** Side-on locomotive silhouette: a body with a cab roof, smokestack and wheels. */
function drawTrain(ctx: CanvasRenderingContext2D): void {
  // Body.
  ctx.beginPath();
  ctx.moveTo(26, 44);
  ctx.lineTo(78, 44);
  ctx.lineTo(78, 36);
  ctx.lineTo(98, 36);
  ctx.lineTo(98, 80);
  ctx.lineTo(26, 80);
  ctx.closePath();
  ctx.fill();
  // Smokestack.
  ctx.fillRect(34, 30, 12, 16);
  // Wheels.
  ctx.beginPath();
  ctx.arc(42, 86, 9, 0, Math.PI * 2);
  ctx.arc(66, 86, 9, 0, Math.PI * 2);
  ctx.arc(88, 86, 9, 0, Math.PI * 2);
  ctx.fill();
}

/** Side-on bicycle silhouette: two spoked-looking wheels with a stroked frame. */
function drawBike(ctx: CanvasRenderingContext2D): void {
  ctx.lineWidth = 5;
  // Wheels as rings.
  ctx.beginPath();
  ctx.arc(38, 78, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(90, 78, 18, 0, Math.PI * 2);
  ctx.stroke();
  // Frame, handlebar and seat.
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(38, 78); // rear hub
  ctx.lineTo(62, 78); // bottom bracket
  ctx.lineTo(54, 50); // up the seat tube
  ctx.lineTo(38, 78); // back to rear hub
  ctx.moveTo(62, 78);
  ctx.lineTo(78, 50); // down tube to head
  ctx.lineTo(54, 50); // top tube
  ctx.moveTo(78, 50);
  ctx.lineTo(90, 78); // fork to front hub
  ctx.moveTo(74, 46);
  ctx.lineTo(86, 46); // handlebar
  ctx.moveTo(50, 48);
  ctx.lineTo(60, 48); // seat
  ctx.stroke();
}

/** Vinyl record silhouette: a disc with a groove ring and centre hole punched out. */
function drawRecord(ctx: CanvasRenderingContext2D): void {
  // Disc (keeps the drop shadow).
  ctx.beginPath();
  ctx.arc(64, 64, 42, 0, Math.PI * 2);
  ctx.fill();
  // Punch the groove + centre hole to transparent so it reads as a record, not a plain dot.
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(64, 64, 27, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(64, 64, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

/** Symmetric cubic ease-in-out over [0,1] — gentle at both ends, fastest in the middle. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Cubic ease-out over [0,1] — fast then settling. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function disposeSprite(sprite: Sprite): void {
  const material = sprite.material as SpriteMaterial;
  (material.map as Texture | null)?.dispose();
  material.dispose();
}
```

### `src/app/features/globe/globe-renderer.ts` (modified — full file)
```ts
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { MarkerKind } from '../../core/cache/appearance-cache';
import { countryCentroids, GeoFeature, isoA2, pickCountryCode } from '../../core/geo/geo-data';
import { LivePalette } from '../settings/settings-store';
import { FlightLayer } from './flight-layer';
import { FlightTarget } from './flight-target';

/** three-globe renders the sphere at this radius; frame the camera + picking relative to it. */
const GLOBE_RADIUS = 100;
const INITIAL_DISTANCE = 320;
/**
 * Easing of the follow camera toward the marker, expressed as a time constant (ms) rather than a
 * per-frame factor — so the track stays equally gentle at any frame rate and never lurches on a
 * dropped frame. Larger = a slower, more lagging follow.
 */
const FOLLOW_TIME_CONSTANT_MS = 360;
/** Nominal 60 fps frame, used for the first frame when there's no prior timestamp to diff against. */
const NOMINAL_FRAME_MS = 1000 / 60;
/** Cap a frame's dt so a long stall (e.g. a backgrounded tab) eases gently instead of snapping. */
const MAX_FRAME_MS = 100;
/** White, lerped into the hovered country's cap colour so it reads as highlighted. */
const HIGHLIGHT = new Color(0xffffff);

/** Flat fill for countries with no liked artists — a muted "no data" tone, not user-configurable. */
const LAND_EMPTY = '#5a6672';
/** Where the single "sun" sits — a soft directional light so the sphere isn't flat. */
const SUN_POSITION = new Vector3(-200, 120, 220);
/** Ambient/sun balance per mode. Studio: flat & fully lit. Day: one lit hemisphere + dark night. */
const LIGHTING = {
  studio: { ambient: 0.95, sun: 0.6 },
  day: { ambient: 0.16, sun: 1.35 },
} as const;

/**
 * Owns the three.js + three-globe scene for the country globe. Plain three.js with its own render
 * loop — it never touches signals / Angular change detection, which is what keeps the zoneless app
 * cheap. `init(host, features)` once; `applyHeat(map)` to recolour land; `applyPalette` / `setLighting`
 * / `setMarkerIcon` to restyle live; `captureImage()` for a PNG snapshot; `dispose()` to tear down.
 */
export class GlobeRenderer {
  private readonly scene = new Scene();
  private renderer?: WebGLRenderer;
  private camera?: PerspectiveCamera;
  private controls?: OrbitControls;
  private globe?: ThreeGlobe;
  private resizeObserver?: ResizeObserver;
  private frameId = 0;
  /** Wall-clock of the previous frame, for frame-rate-independent follow-camera easing. */
  private lastFrameTime = 0;

  private features: GeoFeature[] = [];

  // Live palette (seeded from the stylesheet, updated by applyPalette) + its derived Colors.
  private palette: LivePalette = readPalette();
  private cold = new Color(this.palette.landCold);
  private hot = new Color(this.palette.landHot);
  private readonly empty = new Color(LAND_EMPTY);
  /** Tint lerped into the country the plane is currently circling. */
  private flightHighlight = new Color(this.palette.cyan);
  private heat: ReadonlyMap<string, number> = new Map();
  private maxWeight = 0;

  // Flight state.
  private flightLayer?: FlightLayer;
  private markerIcon: MarkerKind = 'plane'; // default until the settings store pushes one
  /** Latest flight directive + whether the user has the overlay switched on — together they decide
   * whether the follow camera engages. The target keeps feeding the layer even while hidden so the
   * flight advances in the background. */
  private flightTarget: FlightTarget | null = null;
  private flightVisible = true;
  /** Steer the camera to keep the moving marker centred (and pause auto-rotate) while following. */
  private follow = false;
  /** True while the user is actively dragging the globe — the follow camera yields so it doesn't fight. */
  private userDragging = false;
  /** Scratch vectors for the follow camera, reused each frame to avoid per-frame allocation. */
  private readonly followDir = new Vector3();
  private readonly markerDir = new Vector3();

  private ambient?: AmbientLight;
  private sun?: DirectionalLight;

  // Hover picking: raycast the pointer against an invisible sphere, then point-in-polygon the hit.
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private pickSphere?: Mesh;
  private pendingPick = false;
  private hoveredCode: string | null = null;
  /** Last pointer position in canvas pixels — passed to the hover handler to anchor a card later. */
  private readonly pointerPx = { x: 0, y: 0 };
  private hoverHandler?: (code: string | null, x: number, y: number) => void;

  init(host: HTMLElement, features: GeoFeature[]): void {
    this.features = features;
    // Re-read the palette here: the settings store has already run by app start, so the CSS custom
    // properties now hold the user's saved colours (or the stylesheet defaults on first run).
    this.palette = readPalette();
    this.cold = new Color(this.palette.landCold);
    this.hot = new Color(this.palette.landHot);
    this.flightHighlight = new Color(this.palette.cyan);

    const { clientWidth: width, clientHeight: height } = host;
    // alpha: true → transparent background, so the page's space gradient shows through the canvas.
    // preserveDrawingBuffer → captureImage() can read the canvas back to a PNG (otherwise the buffer
    // is cleared after each present and toDataURL returns blank). Minor perf cost, fine for a globe.
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    // Cap the device-pixel-ratio at 2: retina sharpness without rendering 3–4× the pixels on phones.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    host.appendChild(this.renderer.domElement);

    // FOV 50°, aspect from the host, near/far clip planes. Pull back so the whole globe is in frame.
    this.camera = new PerspectiveCamera(50, width / height, 0.1, 4000);
    this.camera.position.z = INITIAL_DISTANCE;

    // Studio lighting to start: bright ambient (flat, fully lit) + a soft directional sun for shape.
    this.ambient = new AmbientLight(0xffffff, LIGHTING.studio.ambient);
    this.scene.add(this.ambient);
    this.sun = new DirectionalLight(0xffffff, LIGHTING.studio.sun);
    this.sun.position.copy(SUN_POSITION);
    this.scene.add(this.sun);

    this.globe = this.buildGlobe();
    this.globe.polygonsData(this.features);
    this.scene.add(this.globe);

    // The flight overlay lives inside the globe group, seeded with country centroids + a water test
    // (open water = no country under the point) so a land vehicle can ride a boat across the sea.
    this.flightLayer = new FlightLayer(
      this.globe,
      this.camera,
      countryCentroids(this.features),
      GLOBE_RADIUS,
      this.palette.cyan,
      this.palette.marker,
      this.markerIcon,
      (lat, lng) => pickCountryCode(this.features, lat, lng) === null,
    );
    // Re-draw the polygons when the circled country (flight highlight) changes.
    this.flightLayer.onHighlightChange = () => this.refreshPolygons();

    // Invisible sphere at the globe surface — the raycast target for hover picking.
    this.pickSphere = new Mesh(new SphereGeometry(GLOBE_RADIUS, 64, 64), new MeshBasicMaterial());
    this.pickSphere.visible = false;
    this.scene.add(this.pickSphere);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerleave', this.onPointerLeave);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // inertia: the globe glides to a stop after a drag
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.enablePan = false; // never slide the globe off-centre
    this.controls.minDistance = 160; // zoom clamps (relative to GLOBE_RADIUS = 100)
    this.controls.maxDistance = 600;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.12; // a slow idle spin
    // While the user drags, suspend the follow camera so it stops pulling the view back; once they
    // let go it eases toward the marker again from wherever they left it.
    this.controls.addEventListener('start', this.onControlsStart);
    this.controls.addEventListener('end', this.onControlsEnd);

    this.observeResize(host);
    this.start();
  }

  /**
   * Render one frame onto a solid space background and read it back as a PNG data URL, for the
   * "save image" share feature. The canvas is normally transparent (`alpha: true`) so the page
   * gradient shows through; a transparent capture looks wrong, so we paint a flat space fill for the
   * shot and restore transparency right after. Returns '' if the renderer isn't ready.
   */
  captureImage(): string {
    if (!this.renderer || !this.camera) {
      return '';
    }
    const styles = getComputedStyle(document.documentElement);
    const space = styles.getPropertyValue('--space-void').trim() || '#070b14';
    const previous = this.scene.background;
    this.scene.background = new Color(space);
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    this.scene.background = previous;
    return url;
  }

  /** Recolour countries from a heat map (ISO alpha-2 → weight). Safe to call repeatedly/live. */
  applyHeat(heat: ReadonlyMap<string, number>): void {
    this.heat = heat;
    this.maxWeight = heat.size > 0 ? Math.max(...heat.values()) : 0;
    this.globe?.polygonsData(this.features); // re-evaluates every cap colour
  }

  /** Recolour the globe live from user settings (sphere, atmosphere, strokes, heat ramp, flight). */
  applyPalette(palette: LivePalette): void {
    this.palette = palette;
    this.cold = new Color(palette.landCold);
    this.hot = new Color(palette.landHot);
    this.flightHighlight = new Color(palette.cyan);
    this.flightLayer?.setAccent(palette.cyan);
    this.flightLayer?.setMarkerColor(palette.marker);
    if (this.globe) {
      this.globe.atmosphereColor(palette.cyan);
      (this.globe.globeMaterial() as MeshPhongMaterial).color = new Color(palette.ocean);
      // Stroke + cap colours read this.palette / this.cold / this.hot, so a redraw applies them.
      this.refreshPolygons();
    }
  }

  /** Switch between flat studio lighting and a single-sun day/night look. */
  setLighting(dayMode: boolean): void {
    const { ambient, sun } = dayMode ? LIGHTING.day : LIGHTING.studio;
    if (this.ambient) this.ambient.intensity = ambient;
    if (this.sun) this.sun.intensity = sun;
  }

  /** Fly the plane for the currently-playing track (circle same country, arc to a new one). Always
   * fed, even while the overlay is hidden, so the flight keeps advancing in the background. */
  setFlightTarget(target: FlightTarget | null): void {
    this.flightTarget = target;
    this.flightLayer?.setTarget(target, performance.now());
    this.updateFollow();
  }

  /**
   * Show or hide the flight overlay without interrupting the flight: the layer keeps animating while
   * hidden, so switching it back on resumes at the plane's live point of the trip. Only follows the
   * marker while the overlay is visible *and* something is playing.
   */
  setFlightVisible(visible: boolean): void {
    this.flightVisible = visible;
    this.flightLayer?.setHidden(!visible);
    this.updateFollow();
  }

  /** Swap the flight marker icon live. */
  setMarkerIcon(kind: MarkerKind): void {
    this.markerIcon = kind;
    this.flightLayer?.setMarker(kind);
  }

  /** Follow the marker only when the overlay is shown and a track is playing; otherwise free-orbit. */
  private updateFollow(): void {
    this.setFollow(this.flightVisible && this.flightTarget !== null);
  }

  private setFollow(on: boolean): void {
    if (on === this.follow) return;
    this.follow = on;
    this.updateAutoRotate();
  }

  /** Auto-rotate only when free-orbiting: never while following the marker or inspecting a country. */
  private updateAutoRotate(): void {
    if (this.controls) this.controls.autoRotate = !this.follow && this.hoveredCode === null;
  }

  /** Re-evaluate polygon cap colour + altitude (hover / flight highlight / palette changed). */
  private refreshPolygons(): void {
    this.globe?.polygonsData(this.features);
  }

  /**
   * Register a callback fired whenever the hovered country changes, with its ISO alpha-2 (or null)
   * and the pointer's canvas-pixel position so a page can anchor a hover card to the cursor.
   */
  setHoverHandler(handler: (code: string | null, x: number, y: number) => void): void {
    this.hoverHandler = handler;
  }

  dispose(): void {
    // 1. Stop the loop so no frame runs against a half-freed scene.
    cancelAnimationFrame(this.frameId);
    // 2. Tear down the flight overlay (arcs, sprite texture, the layer group).
    this.flightLayer?.dispose();
    // 3. Stop observing resize, drop pointer + controls listeners, dispose the pick sphere's GPU mem.
    this.resizeObserver?.disconnect();
    this.controls?.removeEventListener('start', this.onControlsStart);
    this.controls?.removeEventListener('end', this.onControlsEnd);
    this.controls?.dispose();
    if (this.pickSphere) {
      this.pickSphere.geometry.dispose();
      (this.pickSphere.material as MeshBasicMaterial).dispose();
    }
    // 4. Release the GPU: detach the canvas, dispose the renderer, force the WebGL context to close.
    //    Browsers allow only a handful of live contexts — skipping this leaks one per navigation and
    //    eventually throws "Too many active WebGL contexts".
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.renderer.domElement.removeEventListener('pointerleave', this.onPointerLeave);
      this.renderer.domElement.remove();
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }

  private buildGlobe(): ThreeGlobe {
    const globe = new ThreeGlobe()
      .showAtmosphere(true)
      .atmosphereColor(this.palette.cyan)
      .atmosphereAltitude(0.16)
      .showGraticules(true) // the faint lat/long grid
      .polygonCapColor((feature) => this.capColor(feature as GeoFeature))
      .polygonSideColor(() => 'rgba(40, 60, 80, 0.5)')
      .polygonStrokeColor(() => this.palette.teal)
      .polygonAltitude((feature) => this.capAltitude(feature as GeoFeature))
      // Short transition so the hover lift/whiten + heat recolour feel responsive (default is ~1s).
      .polygonsTransitionDuration(200);

    // A plain lit ocean sphere. (The source uses a cel-shaded toon material — cosmetic, trimmed here.)
    globe.globeMaterial(new MeshPhongMaterial({ color: new Color(this.palette.ocean) }));
    return globe;
  }

  /** A country is "empty" (no liked artists) when its heat weight is zero/absent. */
  private isEmpty(code: string | null): boolean {
    return code === null || (this.heat.get(code) ?? 0) <= 0;
  }

  /**
   * Cap (top face) colour per country: muted when empty, on the heat ramp otherwise, whitened on
   * hover, or tinted toward the flight accent while the plane circles it.
   */
  private capColor(feature: GeoFeature): string {
    const code = isoA2(feature.properties);
    const color = this.isEmpty(code) ? this.empty.clone() : this.weightColor(code);
    if (code !== null && code === this.hoveredCode) {
      color.lerp(HIGHLIGHT, 0.5);
    } else if (code !== null && code === this.flightLayer?.highlightCode()) {
      color.lerp(this.flightHighlight, 0.6);
    }
    return color.getStyle();
  }

  /** Heat colour for a country, as a fresh Color (caller may mutate it). */
  private weightColor(code: string | null): Color {
    const weight = code !== null ? (this.heat.get(code) ?? 0) : 0;
    if (weight <= 0 || this.maxWeight <= 0) {
      return this.cold.clone();
    }
    // sqrt spreads the ramp so a few dominant countries don't wash out the rest.
    const intensity = Math.sqrt(weight / this.maxWeight);
    // Interpolate cold → hot in HSL so the two endpoints yield a vivid ramp
    // (a straight RGB lerp would pass through a muddy grey mid-tone).
    return this.cold.clone().lerpHSL(this.hot, intensity);
  }

  /** Lift the hovered or currently-circled country slightly off the sphere so it reads as raised. */
  private capAltitude(feature: GeoFeature): number {
    const code = isoA2(feature.properties);
    const lifted = code === this.hoveredCode || code === this.flightLayer?.highlightCode();
    return code !== null && lifted ? 0.03 : 0.006;
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.renderer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerPx.x = event.clientX - rect.left;
    this.pointerPx.y = event.clientY - rect.top;
    // Canvas pixels → normalized device coordinates (−1…+1), y flipped (screen y grows downward).
    this.pointer.x = (this.pointerPx.x / rect.width) * 2 - 1;
    this.pointer.y = -(this.pointerPx.y / rect.height) * 2 + 1;
    this.pendingPick = true; // resolved in the render loop to throttle to frame rate
  };

  private readonly onPointerLeave = (): void => {
    this.pendingPick = false;
    this.setHovered(null);
  };

  private readonly onControlsStart = (): void => {
    this.userDragging = true;
  };

  private readonly onControlsEnd = (): void => {
    this.userDragging = false;
  };

  private pick(): void {
    if (!this.camera || !this.pickSphere || !this.globe) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.pickSphere, false)[0];
    if (hit === undefined) {
      this.setHovered(null);
      return;
    }
    const { lat, lng } = this.globe.toGeoCoords(hit.point);
    this.setHovered(pickCountryCode(this.features, lat, lng));
  }

  private setHovered(code: string | null): void {
    if (code === this.hoveredCode) return;
    this.hoveredCode = code;
    // Stop auto-rotating while inspecting a country so it doesn't drift out from under the cursor
    // (shared with the follow-camera gate).
    this.updateAutoRotate();
    this.globe?.polygonsData(this.features); // re-evaluates cap colour + altitude
    this.hoverHandler?.(code, this.pointerPx.x, this.pointerPx.y);
  }

  private observeResize(host: HTMLElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.camera) return;
      const { clientWidth: width, clientHeight: height } = host;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix(); // must call after changing aspect
      this.renderer.setSize(width, height);
    });
    this.resizeObserver.observe(host);
  }

  /**
   * Ease the camera so the moving marker stays centred. Keeps the orbit distance fixed (the controls'
   * target is the globe centre) and only rotates the view direction toward the marker, so following
   * never zooms — and the small ease lets a user drag still nudge the view before it eases back.
   */
  private trackMarker(dt: number): void {
    if (!this.camera) return;
    const marker = this.flightLayer?.planePosition();
    if (!marker) return;
    const alpha = 1 - Math.exp(-dt / FOLLOW_TIME_CONSTANT_MS);
    const radius = this.camera.position.length();
    this.markerDir.copy(marker).normalize();
    this.followDir.copy(this.camera.position).normalize().lerp(this.markerDir, alpha);
    this.camera.position.copy(this.followDir.normalize().multiplyScalar(radius));
  }

  private start(): void {
    const tick = (): void => {
      const now = performance.now();
      const dt =
        this.lastFrameTime === 0
          ? NOMINAL_FRAME_MS
          : Math.min(MAX_FRAME_MS, now - this.lastFrameTime);
      this.lastFrameTime = now;
      if (this.pendingPick) {
        this.pendingPick = false;
        this.pick();
      }
      if (this.follow && !this.userDragging) this.trackMarker(dt);
      this.controls?.update(); // required every frame when damping/auto-rotate are on
      this.flightLayer?.update(now); // advance the plane/arc — even while hidden
      if (this.renderer && this.camera) this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }
}

/** Read the renderer's colours from the stylesheet's custom properties (the settings store's mirror). */
function readPalette(): LivePalette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    teal: read('--neon-teal', '#9fe0cf'),
    cyan: read('--neon-cyan', '#a9d4f0'),
    ocean: read('--globe-ocean', '#112233'),
    landCold: read('--globe-land-cold', '#7fa8c9'),
    landHot: read('--globe-land-hot', '#ef9a8a'),
    marker: read('--flight-marker', '#4cc9f0'),
  };
}
```

### `src/app/features/globe/globe-canvas/globe-canvas.ts` (modified — full file)
```ts
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { MarkerKind } from '../../../core/cache/appearance-cache';
import { GeoData } from '../../../core/geo/geo-data';
import { LivePalette } from '../../settings/settings-store';
import { FlightTarget } from '../flight-target';
import { GlobeRenderer } from '../globe-renderer';

/** Hovered country (ISO alpha-2, or null off-country) plus the cursor position in canvas pixels. */
export interface CountryHoverEvent {
  code: string | null;
  x: number;
  y: number;
}

/** Dumb host for the three.js globe: owns the renderer's DOM lifecycle and bridges inputs into it. */
@Component({
  selector: 'app-globe-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-canvas.html',
  styleUrl: './globe-canvas.scss',
})
export class GlobeCanvas {
  /** Per-country heat (ISO alpha-2 → liked-track count). Recolours the globe live as it changes. */
  readonly heat = input<ReadonlyMap<string, number>>(new Map());

  /** The currently-playing track's flight directive, or null when nothing is playing. */
  readonly flightTarget = input<FlightTarget | null>(null);
  /** Whether the flight overlay (plane + route) is drawn. Hidden keeps flying in the background. */
  readonly flightVisible = input(true);

  /** Live globe colours from user settings (null until the store has resolved them). */
  readonly palette = input<LivePalette | null>(null);
  /** Light the globe from a single sun (day/night terminator) instead of flat studio lighting. */
  readonly dayMode = input(false);
  /** Icon drawn for the currently-playing track. */
  readonly markerIcon = input<MarkerKind>('plane');

  /** Emits the hovered country (or null off-country) with the cursor position, anchoring a card later. */
  readonly countryHover = output<CountryHoverEvent>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly geoData = inject(GeoData);
  private readonly renderer = new GlobeRenderer();
  /** Guards the effects: the renderer's methods are unsafe until init() has run (afterNextRender). */
  private ready = false;

  constructor() {
    // afterNextRender: the first moment the host <div> is a real DOM element — mount the renderer here.
    afterNextRender(async () => {
      const features = await this.geoData.features();
      this.renderer.setHoverHandler((code, x, y) => this.countryHover.emit({ code, x, y }));
      this.renderer.init(this.host().nativeElement, features);
      this.ready = true;
      // Push whatever state already exists now that the renderer is live — effects that fired before
      // `ready` flipped would have skipped these.
      const palette = this.palette();
      if (palette) {
        this.renderer.applyPalette(palette);
      }
      this.renderer.setLighting(this.dayMode());
      this.renderer.setMarkerIcon(this.markerIcon());
      this.renderer.applyHeat(this.heat());
      this.renderer.setFlightVisible(this.flightVisible());
      this.renderer.setFlightTarget(this.flightTarget());
    });

    // Each effect is a signal→imperative bridge — the ONLY place a signal touches the renderer; the
    // render loop itself stays signal-free (D4).
    effect(() => {
      const heat = this.heat();
      if (this.ready) {
        this.renderer.applyHeat(heat);
      }
    });

    effect(() => {
      const target = this.flightTarget();
      if (this.ready) {
        this.renderer.setFlightTarget(target);
      }
    });

    effect(() => {
      const visible = this.flightVisible();
      if (this.ready) {
        this.renderer.setFlightVisible(visible);
      }
    });

    effect(() => {
      const palette = this.palette();
      if (this.ready && palette) {
        this.renderer.applyPalette(palette);
      }
    });

    effect(() => {
      const dayMode = this.dayMode();
      if (this.ready) {
        this.renderer.setLighting(dayMode);
      }
    });

    effect(() => {
      const markerIcon = this.markerIcon();
      if (this.ready) {
        this.renderer.setMarkerIcon(markerIcon);
      }
    });

    // Component destroyed (e.g. navigating away from /globe) → release the WebGL context + GPU memory.
    inject(DestroyRef).onDestroy(() => this.renderer.dispose());
  }

  /** Snapshot the current globe as a PNG data URL (for the share/download action), or null if the
   * renderer isn't ready yet. */
  capture(): string | null {
    if (!this.ready) {
      return null;
    }
    const url = this.renderer.captureImage();
    return url === '' ? null : url;
  }
}
```

> `globe-canvas.html` (`<div #host class="globe-host"></div>`) and `globe-canvas.scss` (its full-size styles)
> are unchanged since M4.

### `src/app/features/globe/globe-page/globe-page.ts` (modified — full file)
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

### `src/app/features/globe/globe-page/globe-page.html` (modified — full file)
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

### `src/app/features/globe/globe-page/globe-page.scss` (modified — full file)
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

### `src/app/features/globe/view-options/view-options.ts` (modified — full file)
```ts
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/**
 * Pinned control to toggle which globe overlays are visible — and hide them all at once for a
 * globe-only view, or save the current globe as an image. Dumb: inputs/outputs only; the page owns
 * and persists the state and performs the snapshot. The open/closed state of its little panel is
 * purely local view state.
 */
@Component({
  selector: 'app-view-options',
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-options.html',
  styleUrl: './view-options.scss',
})
export class ViewOptions {
  readonly showStats = input(true);
  readonly showLegend = input(true);
  readonly showFlight = input(true);
  readonly showTripLog = input(true);
  readonly showJourney = input(true);
  readonly showFilters = input(true);
  readonly showTimeline = input(true);

  readonly toggleStats = output<boolean>();
  readonly toggleLegend = output<boolean>();
  readonly toggleFlight = output<boolean>();
  readonly toggleTripLog = output<boolean>();
  readonly toggleJourney = output<boolean>();
  readonly toggleFilters = output<boolean>();
  readonly toggleTimeline = output<boolean>();
  readonly hideAll = output<void>();
  /** User asked to download the current globe view as an image. */
  readonly saveImage = output<void>();

  protected readonly open = signal(false);
}
```

### `src/app/features/globe/view-options/view-options.html` (modified — full file)
```html
@if (open()) {
  <div class="panel">
    <mat-slide-toggle [checked]="showStats()" (change)="toggleStats.emit($event.checked)">
      Leaderboards
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showLegend()" (change)="toggleLegend.emit($event.checked)">
      Heat legend
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showFlight()" (change)="toggleFlight.emit($event.checked)">
      Flight (plane &amp; route)
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showTripLog()" (change)="toggleTripLog.emit($event.checked)">
      Trip log
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showJourney()" (change)="toggleJourney.emit($event.checked)">
      Journey passport
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showFilters()" (change)="toggleFilters.emit($event.checked)">
      Heat filters
    </mat-slide-toggle>
    <mat-slide-toggle [checked]="showTimeline()" (change)="toggleTimeline.emit($event.checked)">
      Timeline
    </mat-slide-toggle>
    <button mat-stroked-button class="save-image" (click)="saveImage.emit()">
      <mat-icon>photo_camera</mat-icon>
      Save image
    </button>
    <button mat-stroked-button class="hide-all" (click)="hideAll.emit()">
      <mat-icon>visibility_off</mat-icon>
      Hide all
    </button>
  </div>
}

<button
  mat-mini-fab
  class="trigger"
  (click)="open.set(!open())"
  [attr.aria-label]="open() ? 'Close overlay options' : 'Show or hide globe overlays'"
>
  <mat-icon>{{ open() ? 'close' : 'visibility' }}</mat-icon>
</button>
```

> `view-options.scss` is unchanged since M9.

### `src/app/features/actions/actions-page/actions-page.ts` (modified — full file)
```ts
import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DataTransfer } from '../../../core/cache/data-transfer';
import { GeoData } from '../../../core/geo/geo-data';
import { Country } from '../../../core/models/country';
import { BootSync } from '../../../core/pipeline/boot-sync';
import { PlaylistIndex } from '../../../core/pipeline/playlist-index';
import { Confirm } from '../../../shared/confirm';
import { GlobeStore } from '../../globe/globe-store';
import { UnplacedArtists } from '../../globe/unplaced-artists/unplaced-artists';

/**
 * Data management page: per-domain reload of the three datasets that feed the app — Liked Songs,
 * playlists, artist info — each with a cheap "Check for updates" (diff only) and a "Full re-scan"
 * (re-fetch from scratch), plus the couldn't-place list and a wipe-everything control. The globe view
 * stays a pure visualization; every control lives here.
 */
@Component({
  selector: 'app-actions-page',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, UnplacedArtists],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './actions-page.html',
  styleUrl: './actions-page.scss',
})
export class ActionsPage {
  protected readonly store = inject(GlobeStore);
  protected readonly sync = inject(BootSync);
  protected readonly playlists = inject(PlaylistIndex);
  private readonly dataTransfer = inject(DataTransfer);
  private readonly confirm = inject(Confirm);
  /** Countries for the couldn't-place picker, loaded once from the GeoJSON. */
  protected readonly countries = signal<Country[]>([]);

  constructor() {
    // Hydrate the cached playlist index so its "last built" status reflects a prior scan without any
    // network on open. The globe dataset is already restored by the app root (step 14).
    afterNextRender(() => this.playlists.hydrate());
    const geoData = inject(GeoData);
    void geoData.countries().then((countries) => this.countries.set(countries));
  }

  // --- Liked Songs ---

  protected checkLiked(): void {
    void this.sync.syncLiked(true);
  }

  protected rescanLiked(): void {
    void this.sync.fullRescanLiked();
  }

  // --- Playlists ---

  protected checkPlaylists(): void {
    void this.sync.syncPlaylists(true);
  }

  protected rescanPlaylists(): void {
    void this.sync.fullRescanPlaylists();
  }

  // --- Artists ---

  protected checkArtists(): void {
    void this.sync.syncArtists(true);
  }

  protected rescanArtists(): void {
    void this.sync.fullRescanArtists();
  }

  protected recheckUnplaced(): void {
    void this.store.recheckUnplaced();
  }

  /** "synced 3 min ago" / "never synced" for a domain's last-sync timestamp. */
  protected agoLabel(at: number | null): string {
    if (at === null) {
      return 'never synced';
    }
    const seconds = Math.round((Date.now() - at) / 1000);
    if (seconds < 60) {
      return 'synced just now';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `synced ${minutes} min ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `synced ${hours} h ago`;
    }
    return `synced ${Math.round(hours / 24)} d ago`;
  }

  /**
   * Wipe every locally-stored EarthViewMusic entry (globe dataset, playlist index, preferences,
   * appearance, trip log), keeping the Spotify login, then reload so each store re-hydrates empty.
   * Same scope as the settings panel's Delete.
   */
  protected async clearAllData(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Clear all data?',
      message:
        'Clear all locally-stored EarthViewMusic data — the globe dataset, playlist index, ' +
        'preferences, appearance, and trip log? You stay logged in. This cannot be undone.',
      confirmLabel: 'Clear all',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    this.dataTransfer.clear();
    location.reload();
  }
}
```

### `src/app/features/actions/actions-page/actions-page.html` (modified — full file)
```html
<section class="actions">
  <header class="head">
    <h1>Actions</h1>
    <p class="sub">
      Reload the data that feeds EarthViewMusic. “Check for updates” fetches only what changed;
      “Full re-scan” re-reads everything from scratch.
    </p>
  </header>

  <div class="groups">
    <!-- Liked Songs → globe -->
    <section class="group">
      <h2 class="group-title">Liked Songs</h2>
      <p class="group-sub">The dataset that colours the globe.</p>
      <div class="panel">
        <p class="status">
          {{ agoLabel(sync.lastSyncedAt('liked')) }} · {{ store.total() }} artists ·
          {{ store.resolvedCount() }} placed · {{ store.failedCount() }} unplaced
        </p>
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="checkLiked()"
            matTooltip="Check Spotify for new likes and fetch only what changed"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="rescanLiked()"
            matTooltip="Re-page your entire Liked Songs and retry every unplaced artist"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Playlists -->
    <section class="group">
      <h2 class="group-title">Playlists</h2>
      <p class="group-sub">
        Membership index for the library tools — which playlists hold each track.
      </p>
      <div class="panel">
        @if (playlists.building()) {
          <p class="status">
            Checking your playlists… {{ playlists.progress().done }} of
            {{ playlists.progress().total }}
          </p>
        } @else {
          <p class="status">{{ agoLabel(sync.lastSyncedAt('playlists')) }}</p>
        }
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || playlists.building()"
            (click)="checkPlaylists()"
            matTooltip="Re-read only the playlists changed since the last check"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || playlists.building()"
            (click)="rescanPlaylists()"
            matTooltip="Re-read every playlist from scratch"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Artist info (genres + follow state) -->
    <section class="group">
      <h2 class="group-title">Artist info</h2>
      <p class="group-sub">Genres and follow status for each placed artist.</p>
      <div class="panel">
        <p class="status">{{ agoLabel(sync.lastSyncedAt('artists')) }}</p>
        <div class="controls">
          <button
            mat-flat-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="checkArtists()"
            matTooltip="Fetch genres/follow state for artists still missing it"
          >
            <mat-icon>sync</mat-icon> Check for updates
          </button>
          <button
            mat-stroked-button
            [disabled]="sync.running() || store.isResolving()"
            (click)="rescanArtists()"
            matTooltip="Re-fetch genres and follow state for every placed artist"
          >
            <mat-icon>restart_alt</mat-icon> Full re-scan
          </button>
        </div>
      </div>
    </section>

    <!-- Wipe local data (settings panel's Delete does the same for the globe view). -->
    <section class="group">
      <h2 class="group-title">Data</h2>
      <p class="group-sub">
        Everything EarthViewMusic stores in this browser — the globe dataset, playlist index,
        preferences, appearance, and trip log. Your Spotify login is kept.
      </p>
      <div class="panel">
        <button mat-stroked-button class="clear" (click)="clearAllData()">
          <mat-icon>delete_forever</mat-icon>
          Clear all data
        </button>
      </div>
    </section>
  </div>

  @if (store.unplaced().length > 0) {
    <div class="unplaced-head">
      <button
        mat-stroked-button
        [disabled]="sync.running() || store.isResolving()"
        (click)="recheckUnplaced()"
        matTooltip="Try again to auto-resolve the artists we couldn't place"
      >
        <mat-icon>refresh</mat-icon> Recheck unplaced
      </button>
    </div>
    <app-unplaced-artists
      class="unplaced"
      [artists]="store.unplaced()"
      [countries]="countries()"
      (place)="store.setCountry($event.artistId, $event.code)"
      (hide)="store.hideUnplaced($event)"
    />
  }
</section>
```

> `actions-page.scss` is unchanged since M9.

## What you have now (cumulative)
The **whole app**, drafted end to end: log in with Spotify (M1) over a resilient HTTP layer (M2); stream Liked
Songs (M3) and colour a three.js globe by country (M4–M5); hover for detail (M6); watch the live player (M7) fly
a plane between countries as songs change (M8); filter and scrub the map and manage data on the Actions page
(M9); browse + tidy the library (M10); and now **customise the globe's look live, carry your data between
browsers, snapshot it to an image, and hit clean `format:check`/`lint`/`build` across the app** (M11). Every
appearance change persists to `evm.appearance`; every portable `evm.*` key exports/imports as one JSON bundle
(auth + transient state excluded).

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Colours change in the panel but not on the globe | The canvas `[palette]` binding or step 04's `palette` effect/flush is missing → re-check `globe-page.html` + `globe-canvas.ts`. |
| Appearance resets on every reload | The store's mirror `effect()` isn't running (must be in the constructor), or `AppearanceCache.save` isn't called → confirm step 02's `effect` writes `cache.save(settings)`. |
| Export file contains `evm.spotify.*` | `AUTH_PREFIX` check missing in `isPortable` → the auth keys must never be portable (step 05). |
| Import mixes old + new data | `apply` didn't `clear()` before writing → it must validate, then wipe, then restore (step 05). |
| Wipe logs you out | You called `localStorage.clear()` or added auth keys to the portable set → wipe only via `DataTransfer.clear()` (steps 05/09). |
| Saved PNG is blank/transparent | `preserveDrawingBuffer: true` or `captureImage`'s solid-fill paint missing → fix in `globe-renderer.ts` (step 03). |
| `Duplicate identifier 'MarkerKind'` | The old `flight-layer` declaration wasn't deleted when the import was added (step 01). |
| Day mode does nothing | `setLighting` isn't wired, or the lights weren't kept as fields → confirm `this.ambient`/`this.sun` are set in `init()` and `setLighting` retunes them (step 03). |

## Next
**This is the last milestone — the guide is complete.** There is no next milestone. Head back to the
**[README](../README.md)** for the overview and suggested build order. The remaining work is not drafting but
**doing**: build the app against every milestone's Done-when gate and verify it for real (nothing is
build-verified yet — see [status.md](../foundation/status.md)). Before executing against live Spotify / Wikidata
/ MusicBrainz, run the `review-before-follow` skill; run `clarify-step` on any step that reads unclearly.
