# Milestone 4 · Step 07 of 07 — Verify
> Nav: [← Preset swatches](06_preset-swatches.md) · [Overview](00_overview.md) · [Alpha, formats and theming →](../MILESTONE_5_alpha-formats-and-theming/00_overview.md)

## Before you start

Steps 01–06 done. `npm run build` has been run since your last edit, `npx http-server . -c-1` is running from
`color-picker-demo/`, and `http://127.0.0.1:8080/demo/` is open and **hard-reloaded**, with DevTools open on
the Elements panel and `<color-picker>` selected.

## Done when (milestone gate)

Six readings, all on the demo page.

1. **The tag's attribute is honoured on load.** The page's `<color-picker value="#3366ff">` renders that
   colour: the readout reads exactly `#3366ff`, the square's handle sits near the top-right and the rail's
   handle over the blue.
2. **Dragging rewrites the attribute live.** With the tag selected in the Elements panel, drag the square. The
   `value` attribute rewrites continuously and always matches the readout.
3. **The events fire, and they fire the right number of times.** One drag of the square produces a stream of
   `input {"value":"#..."}` lines in the log and exactly **one** `change {"value":"#..."}` on release, whose
   hex equals the last `input`'s. Read this one after a **fast** drag as well as a slow one — flick the
   pointer across the square and release immediately. The two hexes still match, because `commitColor`
   re-emits the hex that was published rather than re-reading state React may not have committed yet.
4. **The property drives it both ways.** In the Console:

   ```js
   const picker = document.querySelector('color-picker');
   picker.value = '#00ff00';
   ```

   The picker turns green, the readout reads exactly `#00ff00`, the attribute in the Elements panel becomes
   `value="#00ff00"`, and **no** line is added to the event log. Then drag the picker somewhere else and type
   `picker.value` — it prints the colour you dragged to, as a lowercase seven-character string.
5. **A preset does everything at once.** Click the green swatch. The readout reads exactly `#00c853`, the
   attribute becomes `value="#00c853"`, and exactly two lines appear in the log: one `input` and one `change`,
   both `{"value":"#00c853"}`.
6. **A repeated value still re-syncs.** Click the green swatch, drag the picker elsewhere, then click the green
   swatch again. It returns to `#00c853`. This is the version counter from step 02 doing its job — the string
   is one the component has already been given, and it is not silently dropped.

## Files after this milestone

### `color-picker/src/color.ts`

```ts
export interface HsvColor {
  hueDegrees: number;      // 0–360, the angle around the colour wheel
  saturationRatio: number; // 0–1
  valueRatio: number;      // 0–1, brightness
}

export interface RgbColor {
  red: number;   // 0–255
  green: number;
  blue: number;
}

/**
 * The hue circle is six 60° sectors. In every sector one channel sits at the
 * maximum, one at the minimum, and the third slides between them — which is
 * the whole conversion, once you know which channel is which.
 */
export function hsvToRgb(hsv: HsvColor): RgbColor {
  const sector = (hsv.hueDegrees % 360) / 60;  // 0–6: which sixth of the wheel
  const sectorIndex = Math.floor(sector);      // Math.floor rounds down to a whole number
  const sectorOffset = sector - sectorIndex;   // 0–1: how far through that sixth

  const maxChannel = hsv.valueRatio;
  const minChannel = hsv.valueRatio * (1 - hsv.saturationRatio);
  const rising = minChannel + (maxChannel - minChannel) * sectorOffset;
  const falling = maxChannel - (maxChannel - minChannel) * sectorOffset;

  const channelsBySector: [number, number, number][] = [
    [maxChannel, rising, minChannel],   //   0°– 60°  red    → yellow
    [falling, maxChannel, minChannel],  //  60°–120°  yellow → green
    [minChannel, maxChannel, rising],   // 120°–180°  green  → cyan
    [minChannel, falling, maxChannel],  // 180°–240°  cyan   → blue
    [rising, minChannel, maxChannel],   // 240°–300°  blue   → magenta
    [maxChannel, minChannel, falling],  // 300°–360°  magenta→ red
  ];

  const [red, green, blue] = channelsBySector[sectorIndex % 6];
  return {
    // Math.round turns a 0–1 ratio into one of the 256 values a channel can hold.
    red: Math.round(red * 255),
    green: Math.round(green * 255),
    blue: Math.round(blue * 255),
  };
}

// toString(16) writes a number in base 16; padStart(2, '0') makes sure a
// single-digit channel like 5 becomes "05" rather than "5".
function toHexByte(channel: number): string {
  return channel.toString(16).padStart(2, '0');
}

/** Lowercase six-digit hex, the form every gate in this guide quotes. */
export function rgbToHex(rgb: RgbColor): string {
  return `#${toHexByte(rgb.red)}${toHexByte(rgb.green)}${toHexByte(rgb.blue)}`;
}

/**
 * Accepts `#3366ff`, `#36f`, with or without the hash, in either case.
 * Returns null for anything else, so a host page's typo cannot corrupt the state.
 */
export function parseHex(text: string): RgbColor | null {
  // trim() drops surrounding whitespace; replace(/^#/, '') removes a leading hash.
  const digits = text.trim().replace(/^#/, '');
  // A three-digit shorthand doubles each digit: 36f → 3366ff. split('') makes an
  // array of single characters, map() transforms each, join('') puts them back.
  const expanded =
    digits.length === 3 ? digits.split('').map((digit) => digit + digit).join('') : digits;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  // parseInt(x, 16) reads a base-16 string as a number.
  return {
    red: parseInt(expanded.slice(0, 2), 16),
    green: parseInt(expanded.slice(2, 4), 16),
    blue: parseInt(expanded.slice(4, 6), 16),
  };
}

/** The inverse of hsvToRgb. Saturation and value fall out of the max and min channels. */
export function rgbToHsv(rgb: RgbColor): HsvColor {
  const red = rgb.red / 255;
  const green = rgb.green / 255;
  const blue = rgb.blue / 255;

  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const chroma = maxChannel - minChannel; // how far the colour is from grey

  let hueDegrees = 0;
  if (chroma !== 0) {
    if (maxChannel === red) hueDegrees = 60 * (((green - blue) / chroma) % 6);
    else if (maxChannel === green) hueDegrees = 60 * ((blue - red) / chroma + 2);
    else hueDegrees = 60 * ((red - green) / chroma + 4);
  }
  if (hueDegrees < 0) hueDegrees += 360;

  return {
    hueDegrees,
    saturationRatio: maxChannel === 0 ? 0 : chroma / maxChannel,
    valueRatio: maxChannel,
  };
}
```

### `color-picker/src/ColorPicker.tsx`

```tsx
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { hsvToRgb, parseHex, rgbToHex, rgbToHsv, type HsvColor } from './color';
import { horizontalRatio, verticalRatio } from './drag';

// Hard-coded here. Letting a host page supply its own would mean another observed
// attribute, and the ladder does not give this component one.
const PRESET_HEXES = ['#3366ff', '#e51c23', '#00c853', '#ffd600', '#111111', '#ffffff'];

export interface ColorPickerProps {
  /** The colour the host page asked for, as hex. Undefined means "you choose". */
  hostValue?: string;
  /** Increments on every write from outside, so a repeated value still re-syncs. */
  hostValueVersion?: number;
  /** Called on every change while a drag is in progress. */
  onValueInput?: (hexText: string) => void;
  /** Called once, when a drag ends. */
  onValueCommit?: (hexText: string) => void;
}

export function ColorPicker({
  hostValue,
  hostValueVersion,
  onValueInput,
  onValueCommit,
}: ColorPickerProps) {
  const [color, setColor] = useState<HsvColor>({
    hueDegrees: 225,
    saturationRatio: 0.8,
    valueRatio: 1,
  });

  useEffect(() => {
    if (hostValue === undefined) return;
    const rgb = parseHex(hostValue);
    if (rgb === null) return; // an unparseable value leaves the current colour alone
    setColor(rgbToHsv(rgb));
  }, [hostValue, hostValueVersion]);

  const rgb = hsvToRgb(color);
  const cssColor = `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
  const hexText = rgbToHex(rgb);
  // The square's base is the current hue at full saturation and brightness —
  // the corner of the square, which the gradients then fade away from.
  const hueOnlyRgb = hsvToRgb({ hueDegrees: color.hueDegrees, saturationRatio: 1, valueRatio: 1 });
  const hueOnlyCssColor = `rgb(${hueOnlyRgb.red}, ${hueOnlyRgb.green}, ${hueOnlyRgb.blue})`;

  // The hex most recently published. commitColor re-emits this instead of
  // re-deriving it, so `change` always carries the same value as the `input`
  // that preceded it.
  const lastPublishedHex = useRef<string | null>(null);

  function applyColor(nextColor: HsvColor) {
    setColor(nextColor);
    const hexText = rgbToHex(hsvToRgb(nextColor));
    lastPublishedHex.current = hexText;
    onValueInput?.(hexText);
  }

  function commitColor() {
    if (lastPublishedHex.current === null) return; // nothing published yet
    onValueCommit?.(lastPublishedHex.current);
  }

  function choosePreset(presetHex: string) {
    const rgb = parseHex(presetHex);
    if (rgb === null) return;
    setColor(rgbToHsv(rgb));
    // Emit the preset's own text, not a re-derived one: a colour with no hue
    // would not survive the round trip through HSV unchanged.
    lastPublishedHex.current = presetHex;
    onValueInput?.(presetHex);
    onValueCommit?.(presetHex);
  }

  function applyHueFromPointer(track: HTMLElement, clientX: number) {
    applyColor({ ...color, hueDegrees: horizontalRatio(track, clientX) * 360 });
  }

  function handleRailPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    applyHueFromPointer(event.currentTarget, event.clientX);
  }

  function handleRailPointerMove(event: PointerEvent<HTMLDivElement>) {
    // hasPointerCapture is how you tell a drag apart from a pointer merely passing over.
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    applyHueFromPointer(event.currentTarget, event.clientX);
  }

  function applySaturationValueFromPointer(track: HTMLElement, clientX: number, clientY: number) {
    applyColor({
      ...color,
      saturationRatio: horizontalRatio(track, clientX),
      // The square's top edge is value 1 and its bottom edge is value 0, so the
      // vertical ratio is inverted on the way in.
      valueRatio: 1 - verticalRatio(track, clientY),
    });
  }

  function handleAreaPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    applySaturationValueFromPointer(event.currentTarget, event.clientX, event.clientY);
  }

  function handleAreaPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    applySaturationValueFromPointer(event.currentTarget, event.clientX, event.clientY);
  }

  return (
    <div className="panel">
      <div className="swatch" style={{ background: cssColor }} />
      <div
        className="sv-area"
        style={{ background: hueOnlyCssColor }}
        onPointerDown={handleAreaPointerDown}
        onPointerMove={handleAreaPointerMove}
        onPointerUp={commitColor}
      >
        <div
          className="handle"
          style={{
            left: `${color.saturationRatio * 100}%`,
            // Inverted on the way out, exactly as it was inverted on the way in.
            top: `${(1 - color.valueRatio) * 100}%`,
          }}
        />
      </div>
      <div
        className="hue-rail"
        onPointerDown={handleRailPointerDown}
        onPointerMove={handleRailPointerMove}
        onPointerUp={commitColor}
      >
        <div className="handle" style={{ left: `${(color.hueDegrees / 360) * 100}%` }} />
      </div>
      <div className="readout">{hexText}</div>
      <div className="presets">
        {PRESET_HEXES.map((presetHex) => (
          <button
            key={presetHex}
            type="button"
            className="preset"
            style={{ background: presetHex }}
            title={presetHex}
            onClick={() => choosePreset(presetHex)}
          />
        ))}
      </div>
    </div>
  );
}
```

### `color-picker/src/color-picker-element.tsx`

```tsx
import { createRoot, type Root } from 'react-dom/client';
import { ColorPicker } from './ColorPicker';
import { pickerStyleSheet } from './styles';

export class ColorPickerElement extends HTMLElement {
  static observedAttributes = ['value'];

  // `#` means a real private field: unreachable from outside the class, even at runtime.
  #mountNode: HTMLDivElement;
  #reactRoot: Root | null = null;
  // Counts writes to `value` that came from outside this element.
  #hostValueVersion = 0;
  // True only for the instant this element is writing its own `value` attribute.
  #isReflecting = false;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.adoptedStyleSheets = [pickerStyleSheet];
    this.#mountNode = document.createElement('div');
    shadowRoot.append(this.#mountNode);
  }

  connectedCallback() {
    this.#reactRoot = createRoot(this.#mountNode); // one React root per element instance
    this.#render();
  }

  disconnectedCallback() {
    this.#reactRoot?.unmount(); // tear the tree down so a removed tag leaks nothing
    this.#reactRoot = null;
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null) {
    if (this.#isReflecting) return; // our own write, not the host's
    this.#hostValueVersion += 1;
    this.#render();
  }

  get value(): string {
    return this.getAttribute('value') ?? '';
  }

  // Writing the property writes the attribute, which is what triggers the re-render.
  // One direction of the mapping, in one line — nothing in the platform does it for you.
  set value(hexText: string) {
    this.setAttribute('value', hexText);
  }

  #publish(eventName: 'input' | 'change', hexText: string) {
    // setAttribute calls attributeChangedCallback synchronously, so the flag is
    // guaranteed to still be true when the callback checks it.
    this.#isReflecting = true;
    this.setAttribute('value', hexText);
    this.#isReflecting = false;

    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { value: hexText },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #render() {
    this.#reactRoot?.render(
      <ColorPicker
        hostValue={this.getAttribute('value') ?? undefined}
        hostValueVersion={this.#hostValueVersion}
        onValueInput={(hexText) => this.#publish('input', hexText)}
        onValueCommit={(hexText) => this.#publish('change', hexText)}
      />,
    );
  }
}

// Registering here, at module scope, is what makes one <script> tag enough for a host page.
customElements.define('color-picker', ColorPickerElement);
```

### `color-picker/src/styles.ts`

Unchanged from M3 except for the two `.presets` / `.preset` rules appended after `.readout`. The whole file:

```ts
export const pickerStyleSheet = new CSSStyleSheet();

// replaceSync parses the text and replaces every rule in the sheet, synchronously.
pickerStyleSheet.replaceSync(`
  :host {
    display: inline-block;
    font-family: system-ui, sans-serif;
  }

  .panel {
    width: 240px;
    padding: 12px;
    border-radius: 10px;
    background: #1e1e1e;
    color: #f5f5f5;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  }

  .swatch {
    height: 48px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .sv-area {
    position: relative;
    height: 140px;
    margin-top: 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    touch-action: none;
  }

  /* Layer 2: saturation. White on the left, transparent on the right. */
  .sv-area::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0));
  }

  /* Layer 3: value. Black along the bottom, transparent at the top. */
  .sv-area::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(to top, #000000, rgba(0, 0, 0, 0));
  }

  .hue-rail {
    position: relative;
    height: 16px;
    margin-top: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: linear-gradient(
      to right,
      #ff0000 0%,
      #ffff00 16.6667%,
      #00ff00 33.3333%,
      #00ffff 50%,
      #0000ff 66.6667%,
      #ff00ff 83.3333%,
      #ff0000 100%
    );
    touch-action: none;
  }

  .handle {
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .readout {
    margin-top: 10px;
    font-family: ui-monospace, monospace;
    font-size: 14px;
    letter-spacing: 0.04em;
  }

  .presets {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }

  .preset {
    flex: 1;
    height: 22px;
    padding: 0;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    cursor: pointer;
  }
`);
```

### `color-picker-demo/demo/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>color-picker demo</title>
    <style>
      body {
        margin: 0;
        padding: 32px;
        background: #f4f4f5;
        font-family: system-ui, sans-serif;
      }
      /* This rule is a probe, not decoration: it targets the component's own class
         name from outside. If the shadow root works, it changes nothing. */
      .panel {
        background: #00ff00;
      }
      #event-log {
        margin-top: 16px;
        padding: 8px 12px;
        min-height: 6em;
        background: #ffffff;
        border: 1px solid #d4d4d8;
        border-radius: 6px;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <h1>color-picker demo</h1>
    <color-picker value="#3366ff"></color-picker>
    <pre id="event-log"></pre>
    <script type="module" src="../color-picker/dist/color-picker/color-picker.js"></script>
    <script type="module">
      const picker = document.querySelector('color-picker');
      const log = document.querySelector('#event-log');

      function record(event) {
        // Newest line on top, capped so the page cannot grow without limit.
        const line = `${event.type.padEnd(6)} ${JSON.stringify(event.detail)}`;
        log.textContent = [line, ...log.textContent.split('\n')].slice(0, 12).join('\n');
      }

      picker.addEventListener('input', record);
      picker.addEventListener('change', record);
    </script>
  </body>
</html>
```

## Troubleshooting

| Symptom | First thing to check |
|---|---|
| Editing the `value` attribute does nothing | `static observedAttributes = ['value']` missing or not static |
| Setting a value the picker already had does nothing | `hostValueVersion` missing from the effect's dependency array |
| The drag stutters or the hue jumps at saturation 0 | The `#isReflecting` guard is missing from `attributeChangedCallback` |
| `picker.value` prints `undefined` | The tag was never upgraded — check the Console for a module error |
| Events never reach the page's listener | `composed: true` missing from the `CustomEvent` options |
| Two `change` lines per release | `StrictMode` in the bundle, or `onPointerUp` on both a track and a child |
| Setting the property fires events | It must not — only `applyColor`, `commitColor` and `choosePreset` publish |
| `Each child in a list should have a unique "key" prop` | `key={presetHex}` missing from the preset `<button>` |

## Handoff

**You now have** everything from M1–M3, plus a complete public surface: the `value` attribute read on load and
observed for changes, a `value` property that reads and writes it, live reflection out of the component with a
guard that keeps it from feeding back into a drag, `input` and `change` events carrying hex on
`event.detail.value`, and a preset row that exercises all of it in one click.

**Open:** the picker is fully opaque — there is no alpha anywhere in the model. The readout has exactly one
format, and the host page still cannot restyle any part of the component.

**Next:** [Milestone 5 — Alpha, formats and theming](../MILESTONE_5_alpha-formats-and-theming/00_overview.md),
which completes the public surface and opens a deliberate hole in the encapsulation.

---
> Nav: [← Preset swatches](06_preset-swatches.md) · [Overview](00_overview.md) · [Alpha, formats and theming →](../MILESTONE_5_alpha-formats-and-theming/00_overview.md)
