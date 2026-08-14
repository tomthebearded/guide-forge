# Milestone 5 · Step 01 of 05 — Alpha in the colour model
> Nav: — · [Overview](00_overview.md) · [The alpha rail →](02_the-alpha-rail.md)

## Before you start

M4 complete: the `value` attribute, the `value` property and both events work from the demo page.

## Glossary for this step

- [alpha](../foundation/glossary.md#alpha) — defined under *Why / design*.

## Why / design

> **New concept — alpha.** Opacity, 0 to 1. It is not part of the colour: it is how much of the colour you
> see. Nothing in the HSV conversion touches it, and nothing in the RGB conversion touches it — it travels
> alongside, and only the formatting cares.

Adding one field to `HsvColor` breaks every place that builds one. That is not a problem to work around; it
is the point of doing it in a single step. A type that gains a required field and a codebase that still
compiles at the end of the same commit is exactly what rule 4.4 is protecting, and TypeScript will list the
call sites for you if you would rather build first and follow the errors.

Two of those call sites need a decision rather than a mechanical fix:

- **`rgbToHsv` has no alpha to return.** An RGB triple does not carry one. So it takes the alpha to keep as a
  parameter — the caller always knows, and making it explicit stops a default from being invented in the
  wrong place.
- **`parseHex` must accept eight digits.** From this step on, the component emits `#3366ff80` when alpha is
  below 1, and it has to be able to read its own output back — otherwise reflecting a translucent colour to
  the attribute would produce a value the next `attributeChangedCallback` rejects.

## Do this

1. **Add the field** to `src/color.ts`.

   ```ts
   // src/color.ts — replacing the HsvColor interface
   export interface HsvColor {
     hueDegrees: number;      // 0–360, the angle around the colour wheel
     saturationRatio: number; // 0–1
     valueRatio: number;      // 0–1, brightness
     alphaRatio: number;      // 0–1, opacity — carried alongside, never converted
   }
   ```

2. **Add the eight-digit formatter,** directly below `rgbToHex`.

   ```ts
   // src/color.ts — appended below rgbToHex
   /** Eight-digit hex: the six colour digits, then one alpha byte. */
   export function rgbToHexWithAlpha(rgb: RgbColor, alphaRatio: number): string {
     // The alpha byte is round(alpha × 255), rounding half up: 0.5 → 128 → 0x80.
     return `${rgbToHex(rgb)}${toHexByte(Math.round(alphaRatio * 255))}`;
   }
   ```

3. **Teach `parseHex` about alpha.** Replace the whole function, and add the result type above it.

   ```ts
   // src/color.ts — added directly above parseHex
   export interface ParsedColor {
     rgb: RgbColor;
     /** 1 when the text carried no alpha digits. */
     alphaRatio: number;
   }
   ```

   ```ts
   // src/color.ts — replacing the whole parseHex function
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
   ```

4. **Give `rgbToHsv` an alpha parameter.** Replace its signature and its return statement; the maths between
   them is unchanged.

   ```ts
   // src/color.ts — replacing the `export function rgbToHsv(rgb: RgbColor): HsvColor {` line
   export function rgbToHsv(rgb: RgbColor, alphaRatio: number): HsvColor {
   ```

   ```ts
   // src/color.ts — replacing the return statement at the end of rgbToHsv
   return {
     hueDegrees,
     saturationRatio: maxChannel === 0 ? 0 : chroma / maxChannel,
     valueRatio: maxChannel,
     alphaRatio,
   };
   ```

5. **Fix the component's call sites.** Five edits in `src/ColorPicker.tsx`, all forced by the type change.

   ```tsx
   // src/ColorPicker.tsx — replacing the import from './color'
   import {
     hsvToRgb,
     parseHex,
     rgbToHex,
     rgbToHexWithAlpha,
     rgbToHsv,
     type HsvColor,
   } from './color';
   ```

   ```tsx
   // src/ColorPicker.tsx — added below the PRESET_HEXES line, above the props interface
   /**
    * What the component puts on the wire: eight digits when the colour is translucent,
    * six when it is not. Both events and the reflected attribute use this and only this.
    */
   function toWireHex(hsv: HsvColor): string {
     const rgb = hsvToRgb(hsv);
     return hsv.alphaRatio < 1 ? rgbToHexWithAlpha(rgb, hsv.alphaRatio) : rgbToHex(rgb);
   }
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the object passed to useState
   const [color, setColor] = useState<HsvColor>({
     hueDegrees: 225,
     saturationRatio: 0.8,
     valueRatio: 1,
     alphaRatio: 1,
   });
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the body of the useEffect
   useEffect(() => {
     if (hostValue === undefined) return;
     const parsed = parseHex(hostValue);
     if (parsed === null) return; // an unparseable value leaves the current colour alone
     setColor(rgbToHsv(parsed.rgb, parsed.alphaRatio));
   }, [hostValue, hostValueVersion]);
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the body of choosePreset
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
   ```

6. **Route the published value through `toWireHex`.** Two more edits in the same file.

   ```tsx
   // src/ColorPicker.tsx — replacing the body of applyColor
   function applyColor(nextColor: HsvColor) {
     setColor(nextColor);
     const hexText = toWireHex(nextColor);
     lastPublishedHex.current = hexText;
     onValueInput?.(hexText);
   }
   ```

   `commitColor` needs no edit: it re-emits `lastPublishedHex.current`, so routing `applyColor` through
   `toWireHex` carries alpha into the `change` event for free. That is the payoff of publishing the value that
   was emitted rather than re-deriving one.

   ```tsx
   // src/ColorPicker.tsx — replacing the four derived-value declarations that start at
   // `const rgb = hsvToRgb(color);` and end with the closing `});` of `hueOnlyRgb`.
   // Leave the `const hueOnlyCssColor = …` line that follows them exactly as it is.
   const rgb = hsvToRgb(color);
   const cssColor = `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${color.alphaRatio})`;
   const hexText = toWireHex(color);
   // The square's base is the current hue at full saturation, brightness and opacity.
   const hueOnlyRgb = hsvToRgb({
     hueDegrees: color.hueDegrees,
     saturationRatio: 1,
     valueRatio: 1,
     alphaRatio: 1,
   });
   ```

7. **Show the transparency.** A translucent swatch over a dark panel just looks darker, so the swatch needs a
   checkerboard behind it. Replace the swatch element in the markup.

   ```tsx
   // src/ColorPicker.tsx — replacing the `<div className="swatch" ... />` element
   <div className="swatch checkerboard">
     <div className="swatch-fill" style={{ background: cssColor }} />
   </div>
   ```

   ```css
   /* src/styles.ts — replacing the .swatch rule inside the template literal */
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
   ```

8. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- The demo page looks exactly as it did at the end of M4: the readout reads `#3366ff` — six digits, because
  alpha is 1 — and the swatch is opaque blue, with no checkerboard showing through.
- Set the demo tag to `value="#3366ff80"` and hard-reload. The readout reads exactly `#3366ff80`, and the
  swatch shows the grey-and-white grid through a half-transparent blue. Change it back to `#3366ff` before
  moving on.
- Dragging still works and the log still shows `input` and `change` lines. With alpha at 1 they still carry
  six-digit hex.
- `npm run build` exits without printing an error. If it fails, the errors are a list of the call sites this
  step changes — work through them against actions 5 and 6.

## If it breaks

- **`npm run build` reports `Property 'alphaRatio' is missing`** at a line building an `HsvColor`. That is the
  type change doing its job. Every object literal typed as `HsvColor` now needs the field: the `useState`
  initial value and the `hueOnlyRgb` call are the two in this file.
- **`#3366ff80` is rejected and the picker falls back to its own colour.** The regular expression is still
  the six-digit one — it needs the optional `([0-9a-fA-F]{2})?` group.
- **The alpha byte reads `7f` instead of `80` at alpha 0.5.** Something is truncating instead of rounding.
  `Math.round(0.5 * 255)` is 128; `Math.floor` would give 127.
- **The swatch is a checkerboard with no colour over it.** The `.swatch-fill` child is missing, or
  `.swatch` lost `position: relative` so the fill is positioning against the panel.

---
> Nav: — · [Overview](00_overview.md) · [The alpha rail →](02_the-alpha-rail.md)
