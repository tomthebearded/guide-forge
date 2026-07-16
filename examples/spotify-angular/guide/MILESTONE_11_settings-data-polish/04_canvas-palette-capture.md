# M11 · Step 04 of 10 — Grow the canvas: `palette` / `dayMode` inputs + a `capture()` method
> Nav: [← Grow the renderer](03_renderer-live-appearance.md) · [Overview](00_overview.md) · [The data-transfer service →](05_data-transfer.md)

## Why / design
The canvas is the **one** place a signal touches the renderer
([D4](../foundation/decision-log.md#d4--signal-free-render-loop)): `effect()`s read inputs and push them into the
imperative `GlobeRenderer`. M8 wired `heat`, `flightTarget`, and `flightVisible`. M11 adds three more inputs and
one method:

- **`palette` (`LivePalette | null`)** → `renderer.applyPalette()`. Nullable because the store might not have
  resolved on the first render tick; the effect + the mount-time flush both guard on it.
- **`dayMode` (`boolean`)** → `renderer.setLighting()`.
- **`markerIcon` (`MarkerKind`)** → `renderer.setMarkerIcon()`. New here — M8's overlay flew a fixed plane, so
  this input (and the renderer method it drives, step 03) is introduced in M11 with the marker picker.
- **`capture(): string | null`** — a plain method (not an input) the page calls to snapshot the globe to a PNG
  data URL. It returns `null` until the renderer is `ready`, and `null` if the readback came back blank.

Each new input gets its own `effect()` guarded by `this.ready` (renderer methods are unsafe until
`afterNextRender` ran `init()`), and each is pushed once in the mount-time **flush on ready** block — the same
pattern M5/M8 use, so a value set before mount isn't lost.

> `MarkerKind` is imported from `core/cache/appearance-cache` (step 01) — the flight layer no longer exports it.

## Do this
Replace `src/app/features/globe/globe-canvas/globe-canvas.ts` with the version below. Changes vs M8:
1. Imports: add `MarkerKind` from `../../../core/cache/appearance-cache` and
   `import { LivePalette } from '../../settings/settings-store';`.
2. Three new `input()`s: `palette` (default `null`), `dayMode` (default `false`), `markerIcon` (default
   `'plane'`).
3. In `afterNextRender`, after `init()`, push `palette` (if present) + `dayMode` + `markerIcon` alongside the
   M8 flushes.
4. Three new `effect()`s bridging `palette` / `dayMode` / `markerIcon` into the renderer.
5. A `capture()` method.

`globe-canvas.html` and `globe-canvas.scss` are **unchanged** from M4 (`<div #host class="globe-host">`).

## Code
### `src/app/features/globe/globe-canvas/globe-canvas.ts`
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

## Done when (this step)
- [ ] `npm run build` → clean. The globe still renders; `globe-canvas.html` / `.scss` need no change.
- [ ] The canvas now *accepts* `[palette]` / `[dayMode]` bindings (wired by the globe page in step 07) and exposes
      a `capture()` method the page will call for "Save image" — verified once the page wires them.

## If it breaks
- **`MarkerKind` / `LivePalette` not found** → check the two new import paths: `MarkerKind` from
  `../../../core/cache/appearance-cache` (step 01), `LivePalette` from `../../settings/settings-store`
  (step 02).
- **Globe never recolours when a swatch changes** → the `palette` `effect()` is missing or its `if (this.ready
  && palette)` guard is wrong; also confirm the mount-time flush calls `applyPalette(palette)`.
- **`capture()` always returns null** → it's being called before the globe mounted (`ready` still false), or the
  renderer's `captureImage` returned `''` (blank PNG — see step 03's `preserveDrawingBuffer`).

---
> Nav: [← Grow the renderer](03_renderer-live-appearance.md) · [Overview](00_overview.md) · [The data-transfer service →](05_data-transfer.md)
