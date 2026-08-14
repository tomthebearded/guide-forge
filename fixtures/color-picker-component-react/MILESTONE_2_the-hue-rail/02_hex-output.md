# Milestone 2 · Step 02 of 05 — Hex output
> Nav: [← The colour model](01_the-color-model.md) · [Overview](00_overview.md) · [Draw the hue rail →](03_draw-the-hue-rail.md)

## Before you start

Step 01 done: `src/color.ts` exists and the readout shows `rgb(0, 64, 255)`.

## Why / design

Hex is the form a web page actually stores and passes around, and from M4 onwards it is the only form this
component puts on the wire — the `value` attribute and both events carry hex, whatever the readout happens to
be displaying. Writing the conversion now means the rest of the guide has one canonical string to quote in
every gate.

The conversion is two lines of real work: each channel becomes two hex digits, padded, and the three are
joined behind a `#`.

## Do this

1. **Add the conversion to `src/color.ts`.** Append both functions below the existing `hsvToRgb` function.

   ```ts
   // src/color.ts — appended below hsvToRgb

   // toString(16) writes a number in base 16; padStart(2, '0') makes sure a
   // single-digit channel like 5 becomes "05" rather than "5".
   function toHexByte(channel: number): string {
     return channel.toString(16).padStart(2, '0');
   }

   /** Lowercase six-digit hex, the form every gate in this guide quotes. */
   export function rgbToHex(rgb: RgbColor): string {
     return `#${toHexByte(rgb.red)}${toHexByte(rgb.green)}${toHexByte(rgb.blue)}`;
   }
   ```

   `toHexByte` stays unexported: nothing outside this file needs it, and keeping it private is what lets you
   change it later without checking who calls it. `rgbToHex` is **load-bearing** — M4 and M5 both import it.

   The output is deliberately **lowercase**. `toString(16)` produces lowercase, every gate in this guide is
   written lowercase, and a component that emitted `#3366FF` while its gates said `#3366ff` would fail a
   string comparison in M4 for a reason that has nothing to do with colour.

2. **Switch the readout to hex.** In `src/ColorPicker.tsx`, add `rgbToHex` to the import from `./color`, then
   compute the hex text and render it.

   ```tsx
   // src/ColorPicker.tsx — replacing the existing import from './color'
   import { hsvToRgb, rgbToHex, type HsvColor } from './color';
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the line `const cssColor = ...`
   const cssColor = `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
   const hexText = rgbToHex(rgb);
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the readout div inside the returned markup
   <div className="readout">{hexText}</div>
   ```

   The swatch keeps using `cssColor`. Both stay: the swatch needs a CSS colour, the readout needs the hex
   string, and from M5 the two genuinely diverge when alpha arrives.

3. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- The demo page's readout reads exactly `#0040ff` — lowercase, seven characters.
- The swatch is unchanged: the same blue as in step 01. Only the text changed.
- `npm run build` exits without printing an error.

## If it breaks

- **The readout reads `#40ff` or similar — too short.** `padStart` is missing. A red channel of 0 becomes
  `"0"`, not `"00"`, and the string silently loses a digit.
- **The readout is uppercase.** Something is calling `.toUpperCase()`. Take it out — every gate from here on
  compares lowercase.
- **`npm run build` fails with `Cannot find name 'RgbColor'` in `color.ts`.** `rgbToHex` was pasted above the
  `RgbColor` interface. Interfaces are hoisted for types, but keep the file readable in the order shown:
  interfaces, then `hsvToRgb`, then these two.

---
> Nav: [← The colour model](01_the-color-model.md) · [Overview](00_overview.md) · [Draw the hue rail →](03_draw-the-hue-rail.md)
