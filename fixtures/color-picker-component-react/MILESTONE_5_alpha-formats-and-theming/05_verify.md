# Milestone 5 · Step 05 of 05 — Verify
> Nav: [← Name the parts](04_name-the-parts.md) · [Overview](00_overview.md) · —

## Before you start

Steps 01–05 done. `npm run build` has been run since your last edit, `npx http-server . -c-1` is running from
`color-picker-demo/`, and `http://127.0.0.1:8080/demo/` is open and **hard-reloaded**. The demo tag reads
`<color-picker value="#3366ff80" format="rgb">`.

## Done when (milestone gate)

Six readings, all on the demo page.

1. **The three formats agree on one colour.** On load the readout reads exactly `rgba(51, 102, 255, 0.5)`.
   Click `hex`: exactly `#3366ff80`. Click `hsl`: exactly `hsla(225, 100%, 60%, 0.5)`. Click `rgb`: back to
   `rgba(51, 102, 255, 0.5)`.
2. **`format` seeds the readout from the tag.** The `rgb` button is the highlighted one on load, because the
   tag says `format="rgb"`. Change the tag to `format="hsl"`, hard-reload, and `hsl` is highlighted with the
   readout reading `hsla(225, 100%, 60%, 0.5)`. Set it back to `rgb`.
3. **Alpha reaches its ends exactly.** Click `hex`, then drag the alpha rail past its **left** edge and hold:
   the readout ends in `00` and the swatch shows nothing but the checkerboard. Drag past its **right** edge:
   the readout is six digits again, with no alpha byte at all. Both are read past an edge, where the clamp
   holds them, rather than at a point you would have to hit.
4. **The wire format never changes.** With `hsl` selected, drag the square. In the Elements panel the `value`
   attribute rewrites itself as **hex**, and every line in the event log reads
   `input {"value":"#..."}` — hex, not `hsla(...)`. The display format and the contract are separate.
5. **The host page restyles the component from outside.** The panel's corners are square, not rounded, and the
   readout's text is larger than the format buttons' labels — both from `color-picker::part(...)` rules in
   `demo/index.html`, with nothing changed in `src/`.
6. **The encapsulation still holds everywhere it was not opened.** The panel's background is `#1e1e1e`, not
   `#00ff00`, even though the demo page's `.panel { background: #00ff00 }` rule from M1 is still in the file.
   A class name is invisible from outside; a part name is a promise.

## Files after this milestone

### `color-picker/src/color.ts`

```ts
export interface HsvColor {
  hueDegrees: number;      // 0–360, the angle around the colour wheel
  saturationRatio: number; // 0–1
  valueRatio: number;      // 0–1, brightness
  alphaRatio: number;      // 0–1, opacity — carried alongside, never converted
}

export interface RgbColor {
  red: number;   // 0–255
  green: number;
  blue: number;
}

export interface HslColor {
  hueDegrees: number;        // 0–360, the same angle HSV uses
  saturationPercent: number; // 0–100
  lightnessPercent: number;  // 0–100
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

/** Eight-digit hex: the six colour digits, then one alpha byte. */
export function rgbToHexWithAlpha(rgb: RgbColor, alphaRatio: number): string {
  // The alpha byte is round(alpha × 255), rounding half up: 0.5 → 128 → 0x80.
  return `${rgbToHex(rgb)}${toHexByte(Math.round(alphaRatio * 255))}`;
}

export interface ParsedColor {
  rgb: RgbColor;
  /** 1 when the text carried no alpha digits. */
  alphaRatio: number;
}

/**
 * Accepts `#3366ff`, `#36f`, `#3366ff80`, with or without the hash, in either case.
 * Returns null for anything else, so a host page's typo cannot corrupt the state.
 */
export function parseHex(text: string): ParsedColor | null {
  // trim() drops surrounding whitespace; replace(/^#/, '') removes a leading hash.
  const digits = text.trim().replace(/^#/, '');
  // A three-digit shorthand doubles each digit: 36f → 3366ff. split('') makes an
  // array of single characters, map() transforms each, join('') puts them back.
  const expanded =
    digits.length === 3 ? digits.split('').map((digit) => digit + digit).join('') : digits;

  // Six digits, optionally followed by two more for alpha.
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(expanded)) return null;

  return {
    rgb: {
      // parseInt(x, 16) reads a base-16 string as a number.
      red: parseInt(expanded.slice(0, 2), 16),
      green: parseInt(expanded.slice(2, 4), 16),
      blue: parseInt(expanded.slice(4, 6), 16),
    },
    alphaRatio: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1,
  };
}

/** The inverse of hsvToRgb. Saturation and value fall out of the max and min channels. */
export function rgbToHsv(rgb: RgbColor, alphaRatio: number): HsvColor {
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
    alphaRatio,
  };
}

/** RGB to HSL. The hue is the same angle HSV reads; the other two are not. */
export function rgbToHsl(rgb: RgbColor): HslColor {
  const red = rgb.red / 255;
  const green = rgb.green / 255;
  const blue = rgb.blue / 255;

  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const chroma = maxChannel - minChannel;
  const lightness = (maxChannel + minChannel) / 2;

  let hueDegrees = 0;
  if (chroma !== 0) {
    if (maxChannel === red) hueDegrees = 60 * (((green - blue) / chroma) % 6);
    else if (maxChannel === green) hueDegrees = 60 * ((blue - red) / chroma + 2);
    else hueDegrees = 60 * ((red - green) / chroma + 4);
  }
  if (hueDegrees < 0) hueDegrees += 360;

  // HSL saturation is measured against how much room lightness leaves for it,
  // which is why the same colour has a different saturation in HSL and HSV.
  // Math.abs returns a number without its sign.
  const saturation = chroma === 0 ? 0 : chroma / (1 - Math.abs(2 * lightness - 1));

  return {
    hueDegrees,
    saturationPercent: saturation * 100,
    lightnessPercent: lightness * 100,
  };
}
```

### `color-picker/src/drag.ts`

Unchanged since M3.

```ts
/** Clamp any number into the 0–1 range every track in this picker works in. */
export function clampToUnitRange(ratio: number): number {
  // Math.max lifts anything below 0 up to 0; Math.min pulls anything above 1 down to 1.
  return Math.min(1, Math.max(0, ratio));
}

/** Where along a track's width a pointer sits: 0 at the left edge, 1 at the right. */
export function horizontalRatio(track: HTMLElement, clientX: number): number {
  // getBoundingClientRect gives the element's position and size in viewport pixels,
  // which is the same coordinate space clientX is measured in.
  const bounds = track.getBoundingClientRect();
  return clampToUnitRange((clientX - bounds.left) / bounds.width);
}

/** Where down a track's height a pointer sits: 0 at the top edge, 1 at the bottom. */
export function verticalRatio(track: HTMLElement, clientY: number): number {
  const bounds = track.getBoundingClientRect();
  return clampToUnitRange((clientY - bounds.top) / bounds.height);
}
```

### `color-picker/src/ColorPicker.tsx`

```tsx
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  hsvToRgb,
  parseHex,
  rgbToHex,
  rgbToHexWithAlpha,
  rgbToHsl,
  rgbToHsv,
  type HsvColor,
} from './color';
import { horizontalRatio, verticalRatio } from './drag';

// Hard-coded here. Letting a host page supply its own would mean another observed
// attribute, and the ladder does not give this component one.
const PRESET_HEXES = ['#3366ff', '#e51c23', '#00c853', '#ffd600', '#111111', '#ffffff'];

export type OutputFormat = 'hex' | 'rgb' | 'hsl';

const OUTPUT_FORMATS: OutputFormat[] = ['hex', 'rgb', 'hsl'];

/**
 * What the component puts on the wire: eight digits when the colour is translucent,
 * six when it is not. Both events and the reflected attribute use this and only this.
 */
function toWireHex(hsv: HsvColor): string {
  const rgb = hsvToRgb(hsv);
  return hsv.alphaRatio < 1 ? rgbToHexWithAlpha(rgb, hsv.alphaRatio) : rgbToHex(rgb);
}

/**
 * Alpha at two decimals, with trailing zeros dropped: 0.5, not 0.50 and not
 * 0.501960784313. The byte 0x80 is 128/255 = 0.50196…, and the contract says 0.5.
 */
function formatAlpha(alphaRatio: number): string {
  return String(Number(alphaRatio.toFixed(2)));
}

function formatRgb(hsv: HsvColor): string {
  const rgb = hsvToRgb(hsv);
  const channels = `${rgb.red}, ${rgb.green}, ${rgb.blue}`;
  return hsv.alphaRatio < 1
    ? `rgba(${channels}, ${formatAlpha(hsv.alphaRatio)})`
    : `rgb(${channels})`;
}

function formatHsl(hsv: HsvColor): string {
  const hsl = rgbToHsl(hsvToRgb(hsv));
  // Math.round on each: the gates read whole degrees and whole percents.
  const channels =
    `${Math.round(hsl.hueDegrees)}, ` +
    `${Math.round(hsl.saturationPercent)}%, ` +
    `${Math.round(hsl.lightnessPercent)}%`;
  return hsv.alphaRatio < 1
    ? `hsla(${channels}, ${formatAlpha(hsv.alphaRatio)})`
    : `hsl(${channels})`;
}

export interface ColorPickerProps {
  /** The colour the host page asked for, as hex. Undefined means "you choose". */
  hostValue?: string;
  /** Increments on every write from outside, so a repeated value still re-syncs. */
  hostValueVersion?: number;
  /** Which format the readout starts in. Display only — the wire format is always hex. */
  initialFormat?: OutputFormat;
  /** Called on every change while a drag is in progress. */
  onValueInput?: (hexText: string) => void;
  /** Called once, when a drag ends. */
  onValueCommit?: (hexText: string) => void;
}

export function ColorPicker({
  hostValue,
  hostValueVersion,
  initialFormat,
  onValueInput,
  onValueCommit,
}: ColorPickerProps) {
  const [color, setColor] = useState<HsvColor>({
    hueDegrees: 225,
    saturationRatio: 0.8,
    valueRatio: 1,
    alphaRatio: 1,
  });
  // The prop seeds it; after that the buttons own it, which is why this is state
  // and not a value read straight from the prop on every render.
  const [format, setFormat] = useState<OutputFormat>(initialFormat ?? 'hex');

  useEffect(() => {
    if (hostValue === undefined) return;
    const parsed = parseHex(hostValue);
    if (parsed === null) return; // an unparseable value leaves the current colour alone
    setColor(rgbToHsv(parsed.rgb, parsed.alphaRatio));
  }, [hostValue, hostValueVersion]);

  const rgb = hsvToRgb(color);
  const cssColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${color.alphaRatio})`;
  const readoutText =
    format === 'rgb' ? formatRgb(color) : format === 'hsl' ? formatHsl(color) : toWireHex(color);
  // The square's base is the current hue at full saturation, brightness and opacity.
  const hueOnlyRgb = hsvToRgb({
    hueDegrees: color.hueDegrees,
    saturationRatio: 1,
    valueRatio: 1,
    alphaRatio: 1,
  });
  const hueOnlyCssColor = `rgb(${hueOnlyRgb.red}, ${hueOnlyRgb.green}, ${hueOnlyRgb.blue})`;
  // Fully transparent on the left, the current colour on the right — so the rail
  // always previews the result rather than just reporting the position.
  const alphaGradient =
    `linear-gradient(to right, rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0), ` +
    `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue}))`;

  // The hex most recently published. commitColor re-emits this instead of
  // re-deriving it, so `change` always carries the same value as the `input`
  // that preceded it.
  const lastPublishedHex = useRef<string | null>(null);

  function applyColor(nextColor: HsvColor) {
    setColor(nextColor);
    const hexText = toWireHex(nextColor);
    lastPublishedHex.current = hexText;
    onValueInput?.(hexText);
  }

  function commitColor() {
    if (lastPublishedHex.current === null) return; // nothing published yet
    onValueCommit?.(lastPublishedHex.current);
  }

  function choosePreset(presetHex: string) {
    const parsed = parseHex(presetHex);
    if (parsed === null) return;
    setColor(rgbToHsv(parsed.rgb, parsed.alphaRatio));
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

  function applyAlphaFromPointer(track: HTMLElement, clientX: number) {
    applyColor({ ...color, alphaRatio: horizontalRatio(track, clientX) });
  }

  function handleAlphaPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    applyAlphaFromPointer(event.currentTarget, event.clientX);
  }

  function handleAlphaPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    applyAlphaFromPointer(event.currentTarget, event.clientX);
  }

  return (
    <div className="panel" part="panel">
      <div className="swatch checkerboard" part="swatch">
        <div className="swatch-fill" style={{ background: cssColor }} />
      </div>
      <div
        className="sv-area"
        part="area"
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
        part="hue-rail"
        onPointerDown={handleRailPointerDown}
        onPointerMove={handleRailPointerMove}
        onPointerUp={commitColor}
      >
        <div className="handle" style={{ left: `${(color.hueDegrees / 360) * 100}%` }} />
      </div>
      <div
        className="alpha-rail checkerboard"
        part="alpha-rail"
        onPointerDown={handleAlphaPointerDown}
        onPointerMove={handleAlphaPointerMove}
        onPointerUp={commitColor}
      >
        <div className="alpha-rail-fill" style={{ background: alphaGradient }} />
        <div className="handle" style={{ left: `${color.alphaRatio * 100}%` }} />
      </div>
      <div className="readout" part="readout">{readoutText}</div>
      <div className="formats">
        {OUTPUT_FORMATS.map((candidateFormat) => (
          <button
            key={candidateFormat}
            type="button"
            className={candidateFormat === format ? 'format is-selected' : 'format'}
            onClick={() => setFormat(candidateFormat)}
          >
            {candidateFormat}
          </button>
        ))}
      </div>
      <div className="presets">
        {PRESET_HEXES.map((presetHex) => (
          <button
            key={presetHex}
            type="button"
            className="preset"
            part="preset"
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
import { ColorPicker, type OutputFormat } from './ColorPicker';
import { pickerStyleSheet } from './styles';

export class ColorPickerElement extends HTMLElement {
  static observedAttributes = ['value', 'format'];

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

  attributeChangedCallback(name: string, _oldValue: string | null, _newValue: string | null) {
    if (this.#isReflecting) return; // our own write, not the host's
    // Only `value` feeds the colour, so only `value` moves its version counter.
    if (name === 'value') this.#hostValueVersion += 1;
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
        initialFormat={(this.getAttribute('format') as OutputFormat | null) ?? undefined}
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
    position: relative;
    height: 48px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .swatch-fill {
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  /* Two offset diagonal gradients over white: the standard way to draw the
     grey-and-white grid that means "you are seeing through this". */
  .checkerboard {
    background-color: #ffffff;
    background-image:
      linear-gradient(45deg, #b0b0b0 25%, transparent 25%, transparent 75%, #b0b0b0 75%),
      linear-gradient(45deg, #b0b0b0 25%, transparent 25%, transparent 75%, #b0b0b0 75%);
    background-size: 12px 12px;
    background-position: 0 0, 6px 6px;
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

  .alpha-rail {
    position: relative;
    height: 16px;
    margin-top: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    touch-action: none;
  }

  .alpha-rail-fill {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
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

  .formats {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }

  .format {
    flex: 1;
    padding: 4px 0;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: transparent;
    color: #f5f5f5;
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  .format.is-selected {
    background: rgba(255, 255, 255, 0.18);
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

### `color-picker/vite.config.ts`

Unchanged since M1.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // React reads process.env.NODE_ENV at module scope, and library mode does not
  // replace it. Without this line the bundle throws on a plain HTML page. See below.
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist/color-picker',
    lib: {
      entry: 'src/color-picker-element.tsx',
      formats: ['es'],
      // The function form pins the exact filename. The string form would let Vite
      // pick the extension, and the demo page's <script src> has to know it.
      fileName: () => 'color-picker.js',
    },
  },
});
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
      color-picker::part(panel) {
        border-radius: 0;
      }
      color-picker::part(readout) {
        font-size: 18px;
      }
    </style>
  </head>
  <body>
    <h1>color-picker demo</h1>
    <color-picker value="#3366ff80" format="rgb"></color-picker>
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
| `npm run build` lists missing `alphaRatio` properties | The type change in M5 step 01 — every `HsvColor` literal needs the field |
| `#3366ff80` is rejected | `parseHex`'s regular expression is missing the optional `([0-9a-fA-F]{2})?` group |
| The alpha byte is `7f` instead of `80` | Something truncates instead of rounding — it is `Math.round(alphaRatio * 255)` |
| The readout shows `0.50` or `0.501960784` | `formatAlpha` is not wrapping `toFixed(2)` in `Number(...)`, or is not being called |
| The readout never reaches eight digits | `toWireHex` compares `<= 1` instead of `< 1` |
| The events carry `rgba(...)` | The format switch is reaching the wire — only `readoutText` may depend on `format` |
| The panel's corners stay rounded | The selector needs the host: `color-picker::part(panel)`, not `::part(panel)` |
| A `::part()` rule is ignored though the selector is right | Specificity — the component's own `.panel` rule can win; try `body color-picker::part(panel)` |
| Changing `format` in DevTools after load does nothing | Deliberate: `initialFormat` seeds state once, and the buttons own it afterwards |
| A rebuild changed nothing on screen | Cached bundle. Hard-reload; confirm `-c-1` on the server |

## Handoff

**You now have** a complete, self-contained colour picker: a React component mounted by a custom-element class
you wrote, isolated behind a shadow root, styled without a CSS file, built by Vite into one ES module that a
plain HTML page loads with a single `<script>`. It carries an sRGB HSV model with alpha, hand-written
conversions to hex, RGB and HSL, three pointer-driven controls with capture and clamping, a preset row, a
`value` attribute and property that work in both directions, `input` and `change` events carrying hex, a
`format` attribute and switch that change only the display, and a seven-name `::part()` theming surface.

**Open, and named honestly:** the picker is drag-only — nothing is focusable, arrow keys do nothing, and a
screen reader announces nothing (D9). It does not participate in forms, because a shadow-DOM element is not
form-associated without `ElementInternals` (D1). Its colour maths is sRGB-only and will be wrong for
wide-gamut, CSS Color 4 or perceptual spaces (D3). And there is no test suite anywhere: every gate you have
just read was read by you, which is the whole cost of D6.

**Next:** there is no M6. The ladder ends here. If you want one, the accessibility milestone is the strongest
candidate and the one the plan recommended — two `role` attributes and arrow-key handlers on the three tracks
would close most of the first gap above.

---
> Nav: [← Name the parts](04_name-the-parts.md) · [Overview](00_overview.md) · —
