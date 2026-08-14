# M4 · Step 06 of 06 — Verify
> Nav: [← Preset swatches](05_preset-swatches.md) · [Overview](00_overview.md) · [Alpha, formats and theming →](../MILESTONE_5_alpha-formats-and-theming/00_overview.md)

## Done when (milestone gate)

Served over HTTP with `-c-1`, hard-reloaded first. Keep DevTools open on the **Elements** panel for steps 3–5
and switch to **Console** for 7–8.

1. **Rebuild and reload.** `npm run build` → exits **0**; hard-reload `http://127.0.0.1:8080/demo/`.
2. **The markup sets the colour.** The picker opens on **`#3366ff`**: that blue in the swatch, `#3366ff` in the
   readout, the hue handle at **62.5%** across the rail, the circle at the top edge four-fifths of the way
   across.
3. **The attribute follows the drag.** With the `<color-picker>` tag selected in the Elements panel, drag the
   square: `value="…"` **changes live** in the markup, in step with the readout.
4. **Copying the markup round-trips.** Right-click the tag → *Copy* → *Copy outerHTML*, paste it into the
   console prefixed with a comment. The `value` in what you pasted is the colour on screen.
5. **Dragging logs `input`, releasing logs `change`.** A drag in the square produces a run of
   `input: {"value":"#xxxxxx"}` lines, newest on top, then exactly **one** `change:` line whose value equals
   the last `input:` above it.
6. **A preset does both, once.** Click the blue swatch: readout `#3366ff`, both handles move, and the log gains
   exactly one `input:` and one `change:` line, both `{"value":"#3366ff"}`.
7. **The page can write, and is not told about its own write.** In the console:

   ```js
   document.querySelector('color-picker').value = '#00ff00'
   ```

   → the picker turns green, the attribute reads `#00ff00`, and **no new line appears in the log**.

8. **Rubbish is ignored, quietly.** In the console:

   ```js
   document.querySelector('color-picker').value = 'rebeccapurple'
   ```

   → nothing changes, and there is **no error**. The picker is still green and still draggable.

9. **No loop.** After all of the above the tab is responsive, the log is not growing on its own, and the
   console shows no `NG0103` or infinite-update warning.

## Files after this milestone

**`color-picker/src/color-math.ts`** — the four functions from milestones 2–4 and their helpers.

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

export function parseHex(text: string): RgbColor | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(text.trim()); // optional '#', then exactly six hex digits
  if (match === null) {
    return null;
  }
  const digits = match[1];
  return {
    red: parseInt(digits.slice(0, 2), 16),
    green: parseInt(digits.slice(2, 4), 16),
    blue: parseInt(digits.slice(4, 6), 16),
  };
}

export function rgbToHsv(color: RgbColor): HsvColor {
  const red = color.red / 255;
  const green = color.green / 255;
  const blue = color.blue / 255;
  const largest = Math.max(red, green, blue); // this is 'value'
  const smallest = Math.min(red, green, blue);
  const span = largest - smallest; // this is chroma, back out of the channels

  return {
    hueDegrees: hueFromChannels(red, green, blue, largest, span),
    saturationRatio: largest === 0 ? 0 : span / largest, // black would divide by zero
    valueRatio: largest,
  };
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

function hueFromChannels(
  red: number,
  green: number,
  blue: number,
  largest: number,
  span: number,
): number {
  if (span === 0) {
    return 0; // a grey has no hue to recover
  }
  if (largest === red) {
    return normalizeDegrees(60 * (((green - blue) / span) % 6));
  }
  if (largest === green) {
    return normalizeDegrees(60 * ((blue - red) / span + 2));
  }
  return normalizeDegrees(60 * ((red - green) / span + 4));
}
```

**`color-picker/src/color-picker.ts`**

```ts
import {
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { hsvToRgb, parseHex, rgbToHex, rgbToHsv } from './color-math';
import { pointerRatiosWithin } from './pointer-ratio';

export interface ColorChangeDetail {
  value: string;
}

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ColorPicker {
  private readonly hostElement: HTMLElement = inject(ElementRef).nativeElement;

  readonly value = input('');
  readonly colorInput = output<ColorChangeDetail>({ alias: 'input' });
  readonly colorChange = output<ColorChangeDetail>({ alias: 'change' });

  readonly hueDegrees = signal(0);
  readonly saturationRatio = signal(1);
  readonly valueRatio = signal(1);
  readonly presetHexValues = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#3366ff', '#ffcc00'];

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

  constructor() {
    effect(() => this.applyIncomingValue(this.value()));
    effect(() => this.reflectValueToHost(this.hexValue()));
  }

  private applyIncomingValue(text: string): void {
    const rgb = parseHex(text);
    if (rgb === null) {
      return; // not a hex colour — leave the picker where it is
    }
    if (rgbToHex(rgb) === untracked(this.hexValue)) {
      return; // already showing exactly this colour
    }

    const hsv = rgbToHsv(rgb);
    this.hueDegrees.set(hsv.hueDegrees);
    this.saturationRatio.set(hsv.saturationRatio);
    this.valueRatio.set(hsv.valueRatio);
  }

  private reflectValueToHost(hex: string): void {
    if (this.hostElement.getAttribute('value') !== hex) {
      this.hostElement.setAttribute('value', hex);
    }
  }

  onPointerUp(): void {
    this.colorChange.emit({ value: this.hexValue() });
  }

  private emitColorInput(): void {
    this.colorInput.emit({ value: this.hexValue() });
  }

  selectPreset(hex: string): void {
    this.applyIncomingValue(hex);
    this.emitColorInput();
    this.colorChange.emit({ value: this.hexValue() });
  }

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
    this.emitColorInput();
  }

  private setSaturationAndValueFromPointer(area: HTMLElement, event: PointerEvent): void {
    const { xRatio, yRatio } = pointerRatiosWithin(area, event);
    this.saturationRatio.set(xRatio);
    this.valueRatio.set(1 - yRatio); // the screen measures down, brightness reads up
    this.emitColorInput();
  }
}
```

**`color-picker/src/color-picker.html`**

```html
<div class="panel">
  <div class="sv-area" [style.background-color]="hueOnlyHex()" (pointerdown)="onAreaPointerDown($event)" (pointermove)="onAreaPointerMove($event)" (pointerup)="onPointerUp()">
    <div
      class="sv-handle"
      [style.left.%]="areaHandleLeftPercent()"
      [style.top.%]="areaHandleTopPercent()"
    ></div>
  </div>
  <div class="preview" [style.background]="hexValue()"></div>
  <div class="hue-rail" (pointerdown)="onHuePointerDown($event)" (pointermove)="onHuePointerMove($event)" (pointerup)="onPointerUp()">
    <div class="hue-handle" [style.left.%]="huePositionPercent()"></div>
  </div>
  <output class="readout">{{ hexValue() }}</output>
  <div class="presets">
    @for (preset of presetHexValues; track preset) {
      <button
        type="button"
        class="swatch"
        [style.background]="preset"
        [title]="preset"
        (click)="selectPreset(preset)"
      ></button>
    }
  </div>
</div>
```

**`demo/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>color-picker demo</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 32px;
      }
      .panel {
        background: #000000;
        color: #ffffff;
        padding: 12px;
      }
    </style>
  </head>
  <body>
    <h1>color-picker demo</h1>
    <div class="panel">This box is in the page, not in the component.</div>
    <color-picker value="#3366ff"></color-picker>
    <h2>Events</h2>
    <pre id="event-log">(nothing yet)</pre>
    <script>
      const picker = document.querySelector('color-picker');
      const eventLog = document.querySelector('#event-log');

      for (const eventName of ['input', 'change']) {
        picker.addEventListener(eventName, (event) => {
          eventLog.textContent = `${eventName}: ${JSON.stringify(event.detail)}\n${eventLog.textContent}`;
        });
      }
    </script>
    <script type="module" src="../color-picker/dist/color-picker/main.js"></script>
  </body>
</html>
```

### Pre-existing files modified

**`color-picker/src/color-picker.css`** — two rules added at the end; nothing else touched.

```css
.presets {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.swatch {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  cursor: pointer;
}
```

### Unchanged this milestone

`color-picker/src/pointer-ratio.ts`, `color-picker/src/main.ts`, `color-picker/angular.json`.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| Tab hangs on load or first drag | A reflection guard is missing | Both early returns: in `applyIncomingValue` and in `reflectValueToHost` |
| Picker ignores the attribute | Input not named `value`, or no effect | `readonly value = input('')` and the first `effect` in the constructor |
| Attribute never updates | Effect reads the wrong signal | It must read `this.hexValue()` |
| No event lines in the log | Listeners attached to `null` | The `<script>` block sits **below** the `<color-picker>` tag |
| `change` fires on every move | Binding on the wrong event | `(pointerup)="onPointerUp()"` on both the square and the rail |
| A page's own write logs an event | Emitting from an effect | Emits belong in the two `set…FromPointer` methods and `selectPreset` |
| Clicking black sends the hue handle to 0° | Not a defect | A grey has no hue; see `hueFromChannels` |
| Swatches render huge and grey | Button defaults | `padding: 0` and `[style.background]` on `.swatch` |

## Handoff

**You now have** a component with a real public surface: a `value` attribute that works from markup, from a
property assignment and from the Elements panel; live reflection back out to that attribute, guarded on both
sides so the loop closes; `input` and `change` events carrying `{ value }` on `detail`, split the way native
inputs split them; and six preset swatches that drive the same single path into the state. Under it all,
milestones 1–3 are unchanged: one bundle, one shadow root, three signals, two clamping drags.

**Open:** every colour is fully opaque, the readout speaks only hex, and the host page still cannot change how
any of it looks.

**Next:** [Milestone 5 — Alpha, formats and theming](../MILESTONE_5_alpha-formats-and-theming/00_overview.md)
finishes the surface: an alpha rail over a checkerboard, a `format` switch between hex, rgb and hsl, and the
`::part()` names and custom properties that let a host site restyle the picker without touching its source.

---
> Nav: [← Preset swatches](05_preset-swatches.md) · [Overview](00_overview.md) · [Alpha, formats and theming →](../MILESTONE_5_alpha-formats-and-theming/00_overview.md)
