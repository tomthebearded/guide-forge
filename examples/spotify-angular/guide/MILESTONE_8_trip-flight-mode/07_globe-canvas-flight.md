# M8 · Step 07 of 12 — Grow the canvas: `flightTarget` / `flightVisible` inputs
> Nav: [← Grow the renderer](06_globe-renderer-flight.md) · [Overview](00_overview.md) · [TripLog component →](08_trip-log.md)

## Why / design
The canvas is the **one** place a signal touches the renderer ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)):
`effect()`s read inputs and push them into the imperative `GlobeRenderer`. In M5 the only bridge was `heat`.
M8 adds two more:
- `flightTarget` (`FlightTarget | null`) → `renderer.setFlightTarget()`
- `flightVisible` (`boolean`, default `true`) → `renderer.setFlightVisible()`

Each is a signal `input()` with its own `effect()`, guarded by `this.ready` (the renderer's methods are unsafe
until `afterNextRender` has run `init()`). And in the `afterNextRender` block itself, after `init()` we push the
**current** value of each input once — an effect that fired before `ready` flipped would have skipped it, so a
target/visibility set before mount would otherwise be lost. This is the same "flush on ready" the M5 `heat`
effect uses.

> The `markerIcon` input (the picker that swaps the flying icon), the `palette` / `dayMode` inputs, and the
> `capture()` method from the source are all **M11** — not here. M8's overlay flies a fixed plane.

## Do this
Replace `src/app/features/globe/globe-canvas/globe-canvas.ts` with the version below. It's the M5 canvas plus:
1. `import { FlightTarget } from '../flight-target'`.
2. Two new `input()`s: `flightTarget`, `flightVisible`.
3. In `afterNextRender`, push both (plus heat) once the renderer is `ready`.
4. Two new `effect()`s bridging each input into the renderer.

`globe-canvas.html` and `globe-canvas.scss` are **unchanged** from M4 (`<div #host class="globe-host">` + its
full-size styles).

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

import { GeoData } from '../../../core/geo/geo-data';
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

    // Component destroyed (e.g. navigating away from /globe) → release the WebGL context + GPU memory.
    inject(DestroyRef).onDestroy(() => this.renderer.dispose());
  }
}
```

## Done when (this step)
- [ ] `npm run build` clean. The globe still renders + hovers + heats; no template change needed
      (`globe-canvas.html`/`.scss` untouched).
- [ ] The canvas now *accepts* `[flightTarget]` / `[flightVisible]` bindings without a template error — verified
      once the page wires them (step 12).

## If it breaks
- **`No suitable injection token` / `input() must be called…`** → an `input()`/`inject()` moved out of a field
  initializer; keep them at field-declaration level.
- **Plane never appears once wired** → the `afterNextRender` "flush on ready" block didn't call
  `setFlightTarget(this.flightTarget())`, so a target set before mount was dropped and no effect re-fired it.
- **`FlightTarget` not found** → wrong relative path: from `globe-canvas/`, it lives one level up
  (`../flight-target`).

---
> Nav: [← Grow the renderer](06_globe-renderer-flight.md) · [Overview](00_overview.md) · [TripLog component →](08_trip-log.md)
