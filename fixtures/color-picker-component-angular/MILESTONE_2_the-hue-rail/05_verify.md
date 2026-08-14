# M2 · Step 05 of 05 — Verify
> Nav: [← Make the rail draggable](04_make-the-rail-draggable.md) · [Overview](00_overview.md) · [The saturation/value area →](../MILESTONE_3_the-saturation-value-area/00_overview.md)

## Done when (milestone gate)

Same environment as milestone 1: served over HTTP by a server started with `-c-1`, hard-reloaded before you
read anything.

1. **Rebuild and reload.** `npm run build` → exits **0**; hard-reload `http://127.0.0.1:8080/demo/`.
2. **At rest** the readout reads **`#ff0000`**, the swatch is red, and the handle is against the left edge.
3. **Press and drag left to right.** The swatch sweeps **red → yellow → green → cyan → blue → magenta → red**
   and the readout changes continuously as it goes.
4. **Drag past the left edge** — well outside the rail, and keep the button down. The handle pins to the left
   edge and the readout reads exactly **`#ff0000`**.
5. **Drag past the right edge**, still holding. The handle pins to the right edge and the readout reads exactly
   **`#ff0000`** again — 360° is 0°, which is why the gradient's first and last stop are the same red.
6. **Across the middle third of the rail** — anywhere in the cyan region, no precision needed — the readout
   begins with **`#00`**: the red channel is exactly zero for every hue between 120° and 240°.
7. **Release outside the window**, move the mouse back over the page, and press the rail again. It responds
   normally: no stuck drag, no handle following the cursor without a press.
8. **The console is clean** — no red errors after all of the above.

> **Why the midpoint is not gated on `#00ffff`.** The rail is 240 px wide — the panel's content box, which the
> rail fills — so one pixel is 1.5° of hue and landing on exactly 180.0° by hand is not something you can do. A gate you cannot hit is not a
> gate. The exact values above are the ones **clamping** makes reachable — the two ends — plus one that holds
> across a whole region. Milestone 4 adds the `value` attribute, and with it the ability to demand an exact
> colour rather than aim for one.

## Files after this milestone

**`color-picker/src/color-math.ts`**

```ts
/** A colour as a person picks it: hue in degrees 0–360, saturation and value as ratios 0–1. */
export interface HsvColor {
  hueDegrees: number;
  saturationRatio: number;
  valueRatio: number;
}

/** A colour as a screen shows it: 8-bit sRGB channels, each 0–255. */
export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export function hsvToRgb(color: HsvColor): RgbColor {
  const chroma = color.valueRatio * color.saturationRatio; // how much colour, before any grey
  const sector = normalizeDegrees(color.hueDegrees) / 60; // 0–6: which sixth of the wheel
  const secondLargest = chroma * (1 - Math.abs((sector % 2) - 1)); // the ramp between two sector corners
  const [red, green, blue] = channelsForSector(sector, chroma, secondLargest);
  const offset = color.valueRatio - chroma; // the grey all three channels sit on

  return {
    red: Math.round((red + offset) * 255),
    green: Math.round((green + offset) * 255),
    blue: Math.round((blue + offset) * 255),
  };
}

export function rgbToHex(color: RgbColor): string {
  const channels = [color.red, color.green, color.blue];
  return '#' + channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360; // 370 → 10, -10 → 350, 360 → 0
}

function channelsForSector(
  sector: number,
  chroma: number,
  secondLargest: number,
): [number, number, number] {
  switch (Math.floor(sector) % 6) {
    case 0:
      return [chroma, secondLargest, 0]; // red → yellow
    case 1:
      return [secondLargest, chroma, 0]; // yellow → green
    case 2:
      return [0, chroma, secondLargest]; // green → cyan
    case 3:
      return [0, secondLargest, chroma]; // cyan → blue
    case 4:
      return [secondLargest, 0, chroma]; // blue → magenta
    default:
      return [chroma, 0, secondLargest]; // magenta → red
  }
}
```

**`color-picker/src/pointer-ratio.ts`**

```ts
/** Where a pointer landed inside an element, measured from its top-left corner as ratios 0–1. */
export interface PointerRatios {
  xRatio: number;
  yRatio: number;
}

export function pointerRatiosWithin(element: HTMLElement, event: PointerEvent): PointerRatios {
  const bounds = element.getBoundingClientRect(); // the element's position and size, in viewport pixels
  return {
    xRatio: clampToUnit((event.clientX - bounds.left) / bounds.width),
    yRatio: clampToUnit((event.clientY - bounds.top) / bounds.height), // [M3] the square's vertical axis
  };
}

function clampToUnit(ratio: number): number {
  return Math.min(1, Math.max(0, ratio)); // outside the element → the nearest edge
}
```

**`color-picker/src/color-picker.ts`**

```ts
import { Component, ViewEncapsulation, computed, signal } from '@angular/core';
import { hsvToRgb, rgbToHex } from './color-math';
import { pointerRatiosWithin } from './pointer-ratio';

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ColorPicker {
  readonly hueDegrees = signal(0);

  // Saturation and value are fixed at 1 here; M3 makes them the two axes of the square.
  readonly rgb = computed(() =>
    hsvToRgb({ hueDegrees: this.hueDegrees(), saturationRatio: 1, valueRatio: 1 }),
  );
  readonly hexValue = computed(() => rgbToHex(this.rgb()));
  readonly huePositionPercent = computed(() => (this.hueDegrees() / 360) * 100);

  onHuePointerDown(event: PointerEvent): void {
    const rail = event.currentTarget as HTMLElement;
    rail.setPointerCapture(event.pointerId); // every later move for this pointer comes here
    this.setHueFromPointer(rail, event);
  }

  onHuePointerMove(event: PointerEvent): void {
    const rail = event.currentTarget as HTMLElement;
    if (!rail.hasPointerCapture(event.pointerId)) {
      return; // a hover, not a drag
    }
    this.setHueFromPointer(rail, event);
  }

  private setHueFromPointer(rail: HTMLElement, event: PointerEvent): void {
    const { xRatio } = pointerRatiosWithin(rail, event);
    this.hueDegrees.set(xRatio * 360);
  }
}
```

**`color-picker/src/color-picker.html`**

```html
<div class="panel">
  <div class="preview" [style.background]="hexValue()"></div>
  <div class="hue-rail" (pointerdown)="onHuePointerDown($event)" (pointermove)="onHuePointerMove($event)">
    <div class="hue-handle" [style.left.%]="huePositionPercent()"></div>
  </div>
  <output class="readout">{{ hexValue() }}</output>
</div>
```

**`color-picker/src/color-picker.css`**

```css
:host {
  display: inline-block;
  font-family: system-ui, sans-serif;
}

.panel {
  width: 240px;
  padding: 12px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: #ffffff;
}

.preview {
  height: 32px;
  border-radius: 4px;
}

.hue-rail {
  position: relative;
  height: 14px;
  margin-top: 12px;
  border-radius: 7px;
  touch-action: none;
  background-image: linear-gradient(
    to right,
    #ff0000 0%,
    #ffff00 16.67%,
    #00ff00 33.33%,
    #00ffff 50%,
    #0000ff 66.67%,
    #ff00ff 83.33%,
    #ff0000 100%
  );
}

.hue-handle {
  position: absolute;
  top: -3px;
  width: 6px;
  height: 20px;
  margin-left: -3px;
  border: 2px solid #ffffff;
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

.readout {
  display: block;
  margin-top: 12px;
  font-family: ui-monospace, monospace;
  font-size: 14px;
}
```

### Unchanged this milestone

`color-picker/src/main.ts`, `demo/index.html`, `color-picker/angular.json` — all exactly as milestone 1 left
them.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| Swatch still blue after a rebuild | Cached bundle | Server started with `-c-1`; hard reload |
| Readout shows `[object Object]` | Template interpolates `rgb()` | `{{ hexValue() }}` in `color-picker.html` |
| Drag dies when the cursor leaves the rail | No pointer capture | `setPointerCapture` in `onHuePointerDown`, called on `currentTarget` |
| Handle moves on hover | Missing capture guard | The `hasPointerCapture` early return in `onHuePointerMove` |
| Handle sits outside the rail | Missing positioning context | `position: relative` on `.hue-rail` |
| Page scrolls instead of dragging (touch) | Default touch gesture | `touch-action: none` on `.hue-rail` |
| A colour renders as five hex digits | `padStart` missing | `rgbToHex` in `color-math.ts` |

## Handoff

**You now have** the milestone-1 distribution path unchanged — one self-registering bundle, one shadow root,
one plain-HTML page — plus a colour model written by hand (`HsvColor`, `RgbColor`, `hsvToRgb`, `rgbToHex`), a
reusable pointer-to-ratio helper with clamping, and a hue rail whose drag survives leaving the element. The
component's state is one signal; everything else on screen is derived from it.

**Open:** saturation and value are literals in the `rgb` computed, so the picker reaches only the six fully
saturated hues. There is still no way for a host page to set or read the colour.

**Next:** [Milestone 3 — The saturation/value area](../MILESTONE_3_the-saturation-value-area/00_overview.md)
adds the square, turns those two literals into signals, and reaches every sRGB colour with two drags. It is the
reality-check gate: the first point where this is genuinely a colour picker.

---
> Nav: [← Make the rail draggable](04_make-the-rail-draggable.md) · [Overview](00_overview.md) · [The saturation/value area →](../MILESTONE_3_the-saturation-value-area/00_overview.md)
