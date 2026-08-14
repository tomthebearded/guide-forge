# Milestone 5 · Step 03 of 05 — rgb, hsl and the format switch
> Nav: [← The alpha rail](02_the-alpha-rail.md) · [Overview](00_overview.md) · [Name the parts →](04_name-the-parts.md)

## Before you start

Step 02 done: the alpha rail drags and the readout grows to eight digits when alpha drops below 1.

## Glossary for this step

- [HSL](../foundation/glossary.md#hsl) — defined under *Do this*, action 1.

## Why / design

Three formats, one colour: three buttons change what the readout shows, and a `format` attribute lets the host
page choose which one the component starts on.

This is a long step, and deliberately so. The two conversions and the switch that chooses between them cannot
be split: a formatter with no caller is a declaration TypeScript reports as unused, and `npm run build` runs
`tsc -b` before Vite, so a step that wrote the formatters and stopped would not compile. **Ending green
outranks keeping steps small** — one longer step beats two with a broken interval between them.

The decision worth stating plainly, because everything else here follows from it: **the format switch changes
the readout and nothing else.** The `value` attribute and both events keep carrying hex, whatever is
displayed.

The alternative — emitting `rgb(51, 102, 255)` when the readout says so — breaks two things at once. It makes
`parseHex` responsible for every CSS colour notation, and it turns a display preference into a change in what
a host page has stored. It would also make a stored value and a reflected value disagree forever, because two
spellings of one colour never compare equal. One wire format, one display format, and the switch only touches
the second.

## Do this

1. **Add HSL to `src/color.ts`.** The interface goes beside the others at the top; the function goes at the
   end of the file.

   > **New concept — HSL.** A third way to name the same colour: **hue** (the same angle HSV uses),
   > **saturation**, and **lightness** — where 100% lightness is white and 0% is black, with the pure colour
   > at 50%. It is not a better or worse model than HSV, it is the one CSS took, which is why a picker has to
   > speak it even when it thinks in HSV. ([MDN `hsl()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl))

   ```ts
   // src/color.ts — added below the RgbColor interface
   export interface HslColor {
     hueDegrees: number;        // 0–360, the same angle HSV uses
     saturationPercent: number; // 0–100
     lightnessPercent: number;  // 0–100
   }
   ```

   ```ts
   // src/color.ts — appended at the end of the file
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

2. **Import it** in `src/ColorPicker.tsx`.

   ```tsx
   // src/ColorPicker.tsx — replacing the whole existing import block from './color'
   import {
     hsvToRgb,
     parseHex,
     rgbToHex,
     rgbToHexWithAlpha,
     rgbToHsl,
     rgbToHsv,
     type HsvColor,
   } from './color';
   ```

3. **Declare the format type.** Below the `PRESET_HEXES` line.

   ```tsx
   // src/ColorPicker.tsx — added below the PRESET_HEXES line
   export type OutputFormat = 'hex' | 'rgb' | 'hsl';

   const OUTPUT_FORMATS: OutputFormat[] = ['hex', 'rgb', 'hsl'];
   ```

4. **Add the three formatters,** below the existing `toWireHex` function. They stay in this file rather than
   in `color.ts` because they are about display, and `color.ts` is about colour.

   ```tsx
   // src/ColorPicker.tsx — appended below toWireHex
   /**
    * Alpha at two decimals, with trailing zeros dropped: 0.5, not 0.50 and not
    * 0.501960784313. The byte 0x80 is 128/255 = 0.50196…, and the contract says 0.5.
    */
   function formatAlpha(alphaRatio: number): string {
     // toFixed(2) rounds to two decimals and returns a string — "0.50".
     // Number() reads it back as a number, dropping the trailing zero; String()
     // turns that back into the text the readout shows.
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
   ```

   These three produce **exactly** the CSS spellings that
   [`../foundation/conventions.md`](../foundation/conventions.md) fixes for the canonical colour:
   `rgb(51, 102, 255)` and `hsl(225, 100%, 60%)`, with `rgba(...)` and `hsla(...)` below alpha 1. Comma
   placement, spacing and decimal places are all part of the contract — this milestone's gate reads these
   strings character by character.

5. **Add the prop.** Two edits to the component's signature.

   ```tsx
   // src/ColorPicker.tsx — added to the ColorPickerProps interface, below hostValueVersion
   /** Which format the readout starts in. Display only — the wire format is always hex. */
   initialFormat?: OutputFormat;
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the destructured parameter list of ColorPicker
   export function ColorPicker({
     hostValue,
     hostValueVersion,
     initialFormat,
     onValueInput,
     onValueCommit,
   }: ColorPickerProps) {
   ```

6. **Hold the chosen format in state.** Directly below the colour's `useState` call.

   ```tsx
   // src/ColorPicker.tsx — added directly below the colour's useState call
   // The prop seeds it; after that the buttons own it, which is why this is state
   // and not a value read straight from the prop on every render.
   const [format, setFormat] = useState<OutputFormat>(initialFormat ?? 'hex');
   ```

7. **Compute the readout from the format.** Replace the line that computes `hexText`, then the readout
   element.

   ```tsx
   // src/ColorPicker.tsx — replacing the `const hexText = toWireHex(color);` line
   const readoutText =
     format === 'rgb' ? formatRgb(color) : format === 'hsl' ? formatHsl(color) : toWireHex(color);
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the readout div in the returned markup
   <div className="readout">{readoutText}</div>
   ```

   `toWireHex` is still the hex branch, so the hex the readout shows and the hex the events carry are the same
   string by construction rather than by coincidence.

8. **Add the buttons,** directly below the readout `<div>` and above the presets row.

   ```tsx
   // src/ColorPicker.tsx — inserted between the readout div and the presets div
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
   ```

9. **Observe the `format` attribute** in `src/color-picker-element.tsx`. Four edits, and the third is the one
   worth reading twice.

   ```tsx
   // src/color-picker-element.tsx — replacing the observedAttributes line
   static observedAttributes = ['value', 'format'];
   ```

   ```tsx
   // src/color-picker-element.tsx — replacing the import of ColorPicker
   import { ColorPicker, type OutputFormat } from './ColorPicker';
   ```

   ```tsx
   // src/color-picker-element.tsx — replacing the whole attributeChangedCallback method
   attributeChangedCallback(name: string, _oldValue: string | null, _newValue: string | null) {
     if (this.#isReflecting) return; // our own write, not the host's
     // Only `value` feeds the colour, so only `value` moves its version counter.
     if (name === 'value') this.#hostValueVersion += 1;
     this.#render();
   }
   ```

   The first parameter stops being `_name` here, and that is the point: with one observed attribute the
   callback could ignore which one changed, and with two it cannot. A counter named `#hostValueVersion` that
   a `format` change also incremented would be a field whose name lied about what it counts.

   ```tsx
   // src/color-picker-element.tsx — added as a new prop inside #render()'s <ColorPicker ... />, below hostValueVersion
   initialFormat={(this.getAttribute('format') as OutputFormat | null) ?? undefined}
   ```

   The cast is doing something honest: `getAttribute` returns whatever string is on the tag, and a host page
   can write `format="banana"`. That value reaches `useState`, no branch in action 7 matches it, and the
   readout falls through to hex — the sensible answer, with no validation code needed to produce it.

10. **Add the button styles.** In `src/styles.ts`, append these rules after the `.readout` rule.

    ```css
    /* src/styles.ts — appended inside the pickerStyleSheet.replaceSync template literal */
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
    ```

11. **Set the format on the demo tag.** In `demo/index.html`, replace the `<color-picker>` line.

    ```html
    <!-- color-picker-demo/demo/index.html — replacing the <color-picker> line -->
    <color-picker value="#3366ff80" format="rgb"></color-picker>
    ```

12. **Build and reload.**

    ```bash
    npm run build
    ```

## Done when (this step)

- The page loads with `rgb` selected — that button is highlighted — and the readout reads exactly
  `rgba(51, 102, 255, 0.5)`.
- Clicking `hex` makes it read exactly `#3366ff80`. Clicking `hsl` makes it read exactly
  `hsla(225, 100%, 60%, 0.5)`. Clicking `rgb` returns it to `rgba(51, 102, 255, 0.5)`.
- Whatever format is selected, dragging still writes **hex** to the `value` attribute in the Elements panel
  and still puts **hex** on `event.detail.value` in the log. The switch never reaches the wire.
- Setting `format="banana"` on the tag and hard-reloading starts the readout in hex, with no error in the
  Console.
- Changing `format` in DevTools while the page is open changes nothing, and — this is what the counter guard
  buys — it also does not snap the colour back to the `value` attribute mid-session.
- `npm run build` exits without printing an error.

## If it breaks

- **The readout shows `rgb(51, 102, 255)` with no alpha.** The tag is at `value="#3366ff"`, not `#3366ff80` —
  action 11 changes it.
- **`rgba(51, 102, 255, 0.50)` — two decimal places.** `formatAlpha` is returning `toFixed(2)` directly
  instead of passing it through `Number(...)`, which is what drops the trailing zero.
- **The alpha reads `0.5019607843137255`.** `formatAlpha` is not being called at all; the raw ratio is being
  interpolated.
- **`npm run build` fails with `'formatRgb' is declared but its value is never read`.** Action 7 was not
  applied, so nothing calls the formatters. The template's TypeScript config has `noUnusedLocals` on, and this
  is exactly why the formatters and the switch are one step rather than two.
- **Clicking a format button does nothing.** `setFormat` is not wired, or the buttons were given
  `onPointerDown` instead of `onClick`.
- **The `format` attribute is ignored on load.** `'format'` is missing from `observedAttributes`, or the prop
  is spelled `format` rather than `initialFormat` in `#render`.
- **`npm run build` fails with `'name' is declared but its value is never read`.** The guard line from action
  9 was not added — the parameter is only used by the `if (name === 'value')` check.

---
> Nav: [← The alpha rail](02_the-alpha-rail.md) · [Overview](00_overview.md) · [Name the parts →](04_name-the-parts.md)
