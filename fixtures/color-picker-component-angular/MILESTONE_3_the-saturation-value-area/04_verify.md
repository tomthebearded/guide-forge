# M3 · Step 04 of 04 — Verify
> Nav: [← The square's handle](03_the-square-handle.md) · [Overview](00_overview.md) · [The host-page contract →](../MILESTONE_4_the-host-page-contract/00_overview.md)

## Done when (milestone gate)

Served over HTTP with `-c-1`, hard-reloaded first. Every exact value below is reached by **dragging past** the
edge you are aiming for and holding — clamping is what makes a corner hittable, and aiming for it by eye is
not.

1. **Rebuild and reload.** `npm run build` → exits **0**; hard-reload `http://127.0.0.1:8080/demo/`.
2. **At rest:** the circle is at the square's top-right corner, the swatch is red, the readout reads
   **`#ff0000`**.
3. **Press inside the square and drag well past its top-left corner**, still holding. Readout: exactly
   **`#ffffff`**. The swatch is white.
4. **Still holding, drag well past the bottom edge** — anywhere along it. Readout: exactly **`#000000`**.
5. **Still holding, drag well past the top-right corner.** Readout: exactly **`#ff0000`** again.
6. **Release, drag the hue rail** to roughly the middle. The square repaints, the swatch and readout follow —
   and the circle **has not moved**.
7. **Repeat 3 and 4 at that new hue.** Top-left is still exactly `#ffffff`; the bottom edge is still exactly
   `#000000`. Those two corners are hue-independent, and that is the check that the layering in step 01 is
   right way up.
8. **The console is clean** after all of it.

## Reality check — the point of stopping here

You have a colour picker. Before building a public API on top of it, use it for five minutes and confirm the
three things that would be expensive to change later:

- **Does the square feel right?** Press, drag out of the panel, come back, release. Nothing should stick, jump,
  or need a second press.
- **Is the state model the one you want?** Three signals — `hueDegrees`, `saturationRatio`, `valueRatio` —
  and everything else computed from them. Milestone 4 adds an attribute that writes *into* those three and an
  event that reads *out* of them. If a fourth piece of state belongs in here, this is the cheap moment.
- **Is hex the right canonical form?** Everything the component will hand a host page is derived from
  `hexValue`. Milestone 5 adds rgb and hsl **for display only** — the stored and emitted value stays hex. If
  that is wrong for your use, change it now, not after two milestones lean on it.

## Files after this milestone

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
  readonly saturationRatio = signal(1);
  readonly valueRatio = signal(1);

  readonly rgb = computed(() =>
    hsvToRgb({
      hueDegrees: this.hueDegrees(),
      saturationRatio: this.saturationRatio(),
      valueRatio: this.valueRatio(),
    }),
  );
  readonly hexValue = computed(() => rgbToHex(this.rgb()));
  readonly huePositionPercent = computed(() => (this.hueDegrees() / 360) * 100);
  readonly hueOnlyHex = computed(() =>
    rgbToHex(hsvToRgb({ hueDegrees: this.hueDegrees(), saturationRatio: 1, valueRatio: 1 })),
  );
  readonly areaHandleLeftPercent = computed(() => this.saturationRatio() * 100);
  readonly areaHandleTopPercent = computed(() => (1 - this.valueRatio()) * 100);

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

  onAreaPointerDown(event: PointerEvent): void {
    const area = event.currentTarget as HTMLElement;
    area.setPointerCapture(event.pointerId);
    this.setSaturationAndValueFromPointer(area, event);
  }

  onAreaPointerMove(event: PointerEvent): void {
    const area = event.currentTarget as HTMLElement;
    if (!area.hasPointerCapture(event.pointerId)) {
      return; // a hover, not a drag
    }
    this.setSaturationAndValueFromPointer(area, event);
  }

  private setHueFromPointer(rail: HTMLElement, event: PointerEvent): void {
    const { xRatio } = pointerRatiosWithin(rail, event);
    this.hueDegrees.set(xRatio * 360);
  }

  private setSaturationAndValueFromPointer(area: HTMLElement, event: PointerEvent): void {
    const { xRatio, yRatio } = pointerRatiosWithin(area, event);
    this.saturationRatio.set(xRatio);
    this.valueRatio.set(1 - yRatio); // the screen measures down, brightness reads up
  }
}
```

**`color-picker/src/color-picker.html`**

```html
<div class="panel">
  <div class="sv-area" [style.background-color]="hueOnlyHex()" (pointerdown)="onAreaPointerDown($event)" (pointermove)="onAreaPointerMove($event)">
    <div
      class="sv-handle"
      [style.left.%]="areaHandleLeftPercent()"
      [style.top.%]="areaHandleTopPercent()"
    ></div>
  </div>
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
  margin-top: 12px;
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

.sv-area {
  position: relative;
  height: 140px;
  border-radius: 4px;
  touch-action: none;
  background-image:
    linear-gradient(to top, #000000, rgba(0, 0, 0, 0)),
    linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0));
}

.sv-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}
```

### Unchanged this milestone

`color-picker/src/color-math.ts`, `color-picker/src/pointer-ratio.ts`, `color-picker/src/main.ts`,
`demo/index.html`, `color-picker/angular.json`.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| Black is at the top of the square | Axis not inverted | `1 - yRatio` in `setSaturationAndValueFromPointer` |
| Bottom-left corner is grey, not black | Gradient layers swapped | Black gradient is listed **first** in `.sv-area` |
| Square fades out as you drag left | Bound to the picked colour | `[style.background-color]="hueOnlyHex()"` |
| Circle lags behind the pointer by 7px | Missing centring margin | `margin: -7px 0 0 -7px` on `.sv-handle` |
| Pressing the circle makes the colour jump | Handle is a pointer target | `pointer-events: none` on `.sv-handle` |
| Top-left corner is not exactly `#ffffff` | You aimed at the corner instead of dragging past it | Drag well outside, keep holding, then read |
| Drag stops when leaving the square | No pointer capture | `setPointerCapture` in `onAreaPointerDown` |

## Handoff

**You now have** the milestone-1 distribution path and the milestone-2 colour model, plus a two-axis
saturation/value square layered over the hue, two draggable controls sharing one clamping pointer helper, and a
handle on each. Three signals hold everything: `hueDegrees`, `saturationRatio`, `valueRatio`. Every sRGB colour
is two drags away, and the three corners the maths guarantees match the three corners the CSS draws.

**Open:** the picker is sealed. A host page cannot set the colour, cannot read it, and is never told it
changed. Alpha, output formats and any way to restyle the component are all still absent.

**Next:** [Milestone 4 — The host-page contract](../MILESTONE_4_the-host-page-contract/00_overview.md) opens
it: a `value` attribute that works in both directions, `input` and `change` events carrying the colour, and
preset swatches that drive the same path from the inside.

---
> Nav: [← The square's handle](03_the-square-handle.md) · [Overview](00_overview.md) · [The host-page contract →](../MILESTONE_4_the-host-page-contract/00_overview.md)
