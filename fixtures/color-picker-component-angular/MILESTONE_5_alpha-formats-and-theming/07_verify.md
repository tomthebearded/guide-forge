# M5 · Step 07 of 07 — Verify
> Nav: [← Theme with custom properties](06_theme-with-custom-properties.md) · [Overview](00_overview.md) · —

## Done when (milestone gate)

The last gate in the guide. Served over HTTP with `-c-1`, hard-reloaded first.

1. **Rebuild and reload.** `npm run build` → exits **0**; hard-reload `http://127.0.0.1:8080/demo/`.
2. **Two pickers.** The first opens on solid `#3366ff` in hex; the second opens **half-transparent**, in rgb,
   on a near-black panel with square corners.
3. **Alpha is visible, not just smaller numbers.** On the first picker, drag the alpha rail left: the swatch
   fades to reveal the grey-and-white checkerboard behind it.
4. **The exact ends.** Drag **past the left edge** of the alpha rail and hold — the readout reads exactly
   **`#3366ff00`**. Drag **past the right edge** — exactly **`#3366ff`**, six digits again.
5. **Three formats, one colour.** Click the blue preset on the first picker, then click through the three
   buttons:

   | Button | Readout |
   |---|---|
   | hex | `#3366ff` |
   | rgb | `rgb(51, 102, 255)` |
   | hsl | `hsl(225, 100%, 60%)` |

6. **Three formats, half-transparent.** In the console, set the first picker to the half-transparent blue and
   click through the buttons again:

   ```js
   document.querySelector('color-picker').value = '#3366ff80'
   ```

   | Button | Readout |
   |---|---|
   | hex | `#3366ff80` |
   | rgb | `rgba(51, 102, 255, 0.5)` |
   | hsl | `hsla(225, 100%, 60%, 0.5)` |

7. **The wire format never changed.** After all of step 6, the `value` attribute in the Elements panel still
   reads **`#3366ff80`**, and clicking format buttons added **no** lines to the event log.
8. **`format` on the tag sets the initial mode.** The second picker opened with **rgb** selected, because its
   markup says `format="rgb"`.
9. **The host page restyled the shadow root, twice over.** The second picker's panel is square-cornered
   (`::part(panel)`) and near-black with light text (`--color-picker-background`,
   `--color-picker-text-color`) — while the first picker, on the same page, is untouched.
10. **The boundary still holds.** The page's own `.panel { background: #000000 }` from milestone 1 still does
    **not** reach inside either picker. Only the two channels you opened on purpose got through.
11. **Live theming works with no rebuild.** In the console:

    ```js
    document.querySelector('color-picker').style.setProperty('--color-picker-background', '#ffcc00')
    ```

    → the first picker's panel turns amber immediately.
12. **The console is clean** after all of it, and the bundle still needs no companion: `ls dist/color-picker`
    contains `main.js` and **no file whose name starts with `polyfills`**.

## Files after this milestone

**`color-picker/src/color-math.ts`**

```ts
/** A colour as a person picks it: hue in degrees 0–360, saturation and value as ratios 0–1. */
export interface HsvColor {
  hueDegrees: number;
  saturationRatio: number;
  valueRatio: number;
  alphaRatio: number;
}

/** A colour as a screen shows it: 8-bit sRGB channels, each 0–255, plus opacity 0–1. */
export interface RgbColor {
  red: number;
  green: number;
  blue: number;
  alphaRatio: number;
}

/** A colour in the HSL model, in the units CSS writes: degrees and percentages. */
export interface HslColor {
  hueDegrees: number;
  saturationPercent: number;
  lightnessPercent: number;
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
    alphaRatio: color.alphaRatio,
  };
}

export function rgbToHex(color: RgbColor): string {
  const channels = [color.red, color.green, color.blue];
  if (color.alphaRatio < 1) {
    channels.push(Math.round(color.alphaRatio * 255)); // 0.5 → 128 → '80'
  }
  return '#' + channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
}

export function parseHex(text: string): RgbColor | null {
  const match = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(text.trim()); // six digits, optionally two more
  if (match === null) {
    return null;
  }
  const digits = match[1];
  const alphaDigits = match[2];
  return {
    red: parseInt(digits.slice(0, 2), 16),
    green: parseInt(digits.slice(2, 4), 16),
    blue: parseInt(digits.slice(4, 6), 16),
    alphaRatio: alphaDigits === undefined ? 1 : parseInt(alphaDigits, 16) / 255,
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
    alphaRatio: color.alphaRatio,
  };
}

export function rgbToHsl(color: RgbColor): HslColor {
  const red = color.red / 255;
  const green = color.green / 255;
  const blue = color.blue / 255;
  const largest = Math.max(red, green, blue);
  const smallest = Math.min(red, green, blue);
  const span = largest - smallest;
  const lightness = (largest + smallest) / 2; // midway between the extremes, not the maximum

  // At the top and bottom of the lightness range there is no room for saturation, so the
  // denominator shrinks to match — that is what keeps a pale colour reading as saturated.
  const saturation = span === 0 ? 0 : span / (1 - Math.abs(2 * lightness - 1));

  return {
    hueDegrees: Math.round(hueFromChannels(red, green, blue, largest, span)),
    saturationPercent: Math.round(saturation * 100),
    lightnessPercent: Math.round(lightness * 100),
  };
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

export function formatColor(color: RgbColor, format: ColorFormat): string {
  const alpha = Math.round(color.alphaRatio * 100) / 100; // two decimals: 128/255 → 0.5

  switch (format) {
    case 'rgb':
      return alpha < 1
        ? `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`
        : `rgb(${color.red}, ${color.green}, ${color.blue})`;
    case 'hsl': {
      const hsl = rgbToHsl(color);
      return alpha < 1
        ? `hsla(${hsl.hueDegrees}, ${hsl.saturationPercent}%, ${hsl.lightnessPercent}%, ${alpha})`
        : `hsl(${hsl.hueDegrees}, ${hsl.saturationPercent}%, ${hsl.lightnessPercent}%)`;
    }
    default:
      return rgbToHex(color);
  }
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
import { ColorFormat, formatColor, hsvToRgb, parseHex, rgbToHex, rgbToHsv } from './color-math';
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
  readonly formatAttribute = input<ColorFormat>('hex', { alias: 'format' });
  readonly colorInput = output<ColorChangeDetail>({ alias: 'input' });
  readonly colorChange = output<ColorChangeDetail>({ alias: 'change' });

  readonly hueDegrees = signal(0);
  readonly saturationRatio = signal(1);
  readonly valueRatio = signal(1);
  readonly alphaRatio = signal(1);
  readonly selectedFormat = signal<ColorFormat>('hex');
  readonly formats: readonly ColorFormat[] = ['hex', 'rgb', 'hsl'];
  readonly presetHexValues = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#3366ff', '#ffcc00'];

  readonly rgb = computed(() =>
    hsvToRgb({
      hueDegrees: this.hueDegrees(),
      saturationRatio: this.saturationRatio(),
      valueRatio: this.valueRatio(),
      alphaRatio: this.alphaRatio(),
    }),
  );
  readonly hexValue = computed(() => rgbToHex(this.rgb()));
  readonly huePositionPercent = computed(() => (this.hueDegrees() / 360) * 100);
  readonly hueOnlyHex = computed(() =>
    rgbToHex(
      hsvToRgb({ hueDegrees: this.hueDegrees(), saturationRatio: 1, valueRatio: 1, alphaRatio: 1 }),
    ),
  );
  readonly areaHandleLeftPercent = computed(() => this.saturationRatio() * 100);
  readonly areaHandleTopPercent = computed(() => (1 - this.valueRatio()) * 100);
  readonly alphaPositionPercent = computed(() => this.alphaRatio() * 100);
  readonly alphaGradient = computed(() => {
    const { red, green, blue } = this.rgb();
    return `linear-gradient(to right, rgba(${red}, ${green}, ${blue}, 0), rgb(${red}, ${green}, ${blue}))`;
  });
  readonly formattedValue = computed(() => formatColor(this.rgb(), this.selectedFormat()));

  constructor() {
    effect(() => this.applyIncomingValue(this.value()));
    effect(() => this.reflectValueToHost(this.hexValue()));
    effect(() => this.selectedFormat.set(this.formatAttribute()));
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
    this.alphaRatio.set(hsv.alphaRatio);
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

  selectFormat(format: ColorFormat): void {
    this.selectedFormat.set(format);
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

  onAlphaPointerDown(event: PointerEvent): void {
    const rail = event.currentTarget as HTMLElement;
    rail.setPointerCapture(event.pointerId);
    this.setAlphaFromPointer(rail, event);
  }

  onAlphaPointerMove(event: PointerEvent): void {
    const rail = event.currentTarget as HTMLElement;
    if (!rail.hasPointerCapture(event.pointerId)) {
      return; // a hover, not a drag
    }
    this.setAlphaFromPointer(rail, event);
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

  private setAlphaFromPointer(rail: HTMLElement, event: PointerEvent): void {
    const { xRatio } = pointerRatiosWithin(rail, event);
    this.alphaRatio.set(xRatio);
    this.emitColorInput();
  }
}
```

**`color-picker/src/color-picker.html`**

```html
<div class="panel" part="panel">
  <div class="sv-area" part="area" [style.background-color]="hueOnlyHex()" (pointerdown)="onAreaPointerDown($event)" (pointermove)="onAreaPointerMove($event)" (pointerup)="onPointerUp()">
    <div
      class="sv-handle"
      [style.left.%]="areaHandleLeftPercent()"
      [style.top.%]="areaHandleTopPercent()"
    ></div>
  </div>
  <div class="preview" part="preview">
    <div class="preview-fill" [style.background]="hexValue()"></div>
  </div>
  <div class="hue-rail" part="hue" (pointerdown)="onHuePointerDown($event)" (pointermove)="onHuePointerMove($event)" (pointerup)="onPointerUp()">
    <div class="hue-handle" [style.left.%]="huePositionPercent()"></div>
  </div>
  <div class="alpha-rail" part="alpha" (pointerdown)="onAlphaPointerDown($event)" (pointermove)="onAlphaPointerMove($event)" (pointerup)="onPointerUp()">
    <div class="alpha-rail-fill" [style.background-image]="alphaGradient()"></div>
    <div class="alpha-handle" [style.left.%]="alphaPositionPercent()"></div>
  </div>
  <output class="readout" part="readout">{{ formattedValue() }}</output>
  <div class="formats">
    @for (format of formats; track format) {
      <button
        type="button"
        class="format-button"
        [class.is-selected]="selectedFormat() === format"
        (click)="selectFormat(format)"
      >
        {{ format }}
      </button>
    }
  </div>
  <div class="presets">
    @for (preset of presetHexValues; track preset) {
      <button
        type="button"
        class="swatch"
        part="swatch"
        [style.background]="preset"
        [title]="preset"
        (click)="selectPreset(preset)"
      ></button>
    }
  </div>
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
  background: var(--color-picker-background, #ffffff);
  color: var(--color-picker-text-color, #1a1a1a);
}

.preview {
  position: relative;
  overflow: hidden;
  height: 32px;
  margin-top: 12px;
  border-radius: 4px;
  background-image: repeating-conic-gradient(#c0c0c0 0% 25%, #ffffff 0% 50%);
  background-size: 12px 12px;
}

.preview-fill {
  position: absolute;
  inset: 0;
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

.hue-handle,
.alpha-handle {
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

.alpha-rail {
  position: relative;
  overflow: hidden;
  height: 14px;
  margin-top: 12px;
  border-radius: 7px;
  touch-action: none;
  background-image: repeating-conic-gradient(#c0c0c0 0% 25%, #ffffff 0% 50%);
  background-size: 12px 12px;
}

.alpha-rail-fill {
  position: absolute;
  inset: 0;
}

.formats {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.format-button {
  flex: 1;
  padding: 4px 0;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.format-button.is-selected {
  border-color: #1a1a1a;
  background: #1a1a1a;
  color: #ffffff;
}
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
      #themed {
        --color-picker-background: #111111;
        --color-picker-text-color: #f0f0f0;
      }
      #themed::part(panel) {
        border-radius: 0;
        border-color: #1a1a1a;
      }
    </style>
  </head>
  <body>
    <h1>color-picker demo</h1>
    <div class="panel">This box is in the page, not in the component.</div>
    <color-picker value="#3366ff"></color-picker>
    <h2>Themed by the host page</h2>
    <color-picker id="themed" value="#3366ff80" format="rgb"></color-picker>
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

### Unchanged this milestone

`color-picker/src/pointer-ratio.ts`, `color-picker/src/main.ts`, `color-picker/angular.json` — all exactly as
earlier milestones left them.

## Troubleshooting

| Symptom | Usual cause | First thing to check |
|---|---|---|
| Every colour has eight hex digits | `< 1` guard missing | `rgbToHex` in `color-math.ts` |
| `#3366ff` parses to `null` | Alpha group made mandatory | The `?` after `([0-9a-f]{2})` in `parseHex` |
| Swatch shows no checkerboard | Shorthand wipes the background image | The colour binding belongs on `.preview-fill` |
| Alpha rail is a flat colour | Gradient bound on the rail | `[style.background-image]` on `.alpha-rail-fill` |
| Alpha handle invisible | Selector not extended | `.hue-handle, .alpha-handle` in the CSS |
| `rgba(…, 0.5019607843137255)` | Rounding line missing | `formatColor` in `color-math.ts` |
| Readout ignores the format buttons | Binding not updated | `{{ formattedValue() }}` in the template |
| `::part()` rule does nothing | Part name missing or dotted | `part="panel"`, and the selector is `::part(panel)` |
| Themed panel is transparent | `var()` without a fallback | `var(--color-picker-background, #ffffff)` |
| Both pickers go dark | Tokens set too high up | They belong on `#themed`, not on `color-picker` or `:root` |

## Handoff

**You now have** a finished `<color-picker>`: an Angular component behind a native shadow root, built into one
self-registering ES-module bundle, usable from a page that knows nothing about Angular. It carries a
saturation/value square, a hue rail and an alpha rail over a checkerboard, six preset swatches, and a readout
that speaks hex, rgb or hsl. Its public surface is a `value` attribute that works in both directions, a
`format` attribute, `input` and `change` events carrying `{ value }` on `detail`, seven `::part()` names and
two CSS custom properties. Underneath it, five sRGB conversions and one clamping pointer helper, written by
hand and each one exercised by a gate you have watched pass.

**Open, and named honestly:** the picker is **drag-only**. Nothing is focusable, arrow keys do nothing, and a
screen reader announces nothing — recorded as an accepted risk in
[../foundation/decision-log.md](../foundation/decision-log.md) (D7), and the first thing to build if this ever
leaves teaching use. It is also **not form-associated**: inside a `<form>` it submits nothing (D1). And it is
**sRGB-only**: `oklch()` and wide-gamut colours are where the borrowed library becomes the right answer (D2).

**Next:** there is no milestone 6. Take the picker back to the [guide's front door](../README.md), and if you
want the component to survive contact with real users, the accessibility milestone in
[../PLAN.md](../PLAN.md) §1 is the one that was left on the table.

---
> Nav: [← Theme with custom properties](06_theme-with-custom-properties.md) · [Overview](00_overview.md) · —
