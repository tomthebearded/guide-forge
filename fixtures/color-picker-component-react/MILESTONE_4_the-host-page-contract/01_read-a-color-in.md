# Milestone 4 · Step 01 of 07 — Read a colour in
> Nav: — · [Overview](00_overview.md) · [The `value` attribute →](02_the-value-attribute.md)

## Before you start

M3 complete: the picker produces any colour and starts on `#3366ff`.

## Glossary for this step

- [effect](../foundation/glossary.md#effect) — defined under *Do this*, action 3.

## Why / design

So far the starting colour is a constant inside the component. A host page has to be able to choose it, and
the only vocabulary it has is HTML: `<color-picker value="#3366ff">`.

Getting from that string to the picker's state needs two conversions the guide has not written yet — text to
RGB, and RGB back to HSV. The second is the one that is easy to underestimate: the picker's handles are
positioned from hue, saturation and value, so a colour arriving as RGB has to be turned back into those three
numbers before anything on screen can move.

This step teaches the component to accept a colour. Nothing observes changes to the attribute yet — that is
step 02 — so what you are proving here is the initial read.

## Do this

1. **Add `parseHex` to `src/color.ts`,** below `rgbToHex`.

   ```ts
   // src/color.ts — appended below rgbToHex
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
   ```

   Returning `null` rather than throwing is deliberate: a host page will hand this component whatever is in
   its database, and a picker that throws on bad input takes the page down with it.

2. **Add `rgbToHsv` to `src/color.ts`,** below `parseHex`. It is `hsvToRgb` read backwards: find which channel
   is the maximum, and the hue follows from which one it is.

   ```ts
   // src/color.ts — appended below parseHex
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

   A grey has no hue — chroma is 0 and there is no maximum channel to read an angle from — so this returns
   0°. That is the honest answer and it is why dragging to the left edge of the square and back does not
   always return you to the hue you started on.

3. **Give the component a `hostValue` prop.** Rewrite the top of `src/ColorPicker.tsx`: the imports, the props
   type, and the function signature and its first lines.

   ```tsx
   // src/ColorPicker.tsx — replacing the three import lines at the top
   import { useEffect, useState, type PointerEvent } from 'react';
   import { hsvToRgb, parseHex, rgbToHex, rgbToHsv, type HsvColor } from './color';
   import { horizontalRatio, verticalRatio } from './drag';

   export interface ColorPickerProps {
     /** The colour the host page asked for, as hex. Undefined means "you choose". */
     hostValue?: string;
   }
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the `export function ColorPicker() {` line
   export function ColorPicker({ hostValue }: ColorPickerProps) {
   ```

   > **New concept — an effect.** `useEffect(fn, deps)` runs `fn` after React has rendered, and re-runs it
   > whenever a value in `deps` has changed since the last run. It is the door out of React: use it for the
   > things that are not rendering — reading a prop into state, talking to the DOM, dispatching an event.
   > ([`useEffect`](https://react.dev/reference/react/useEffect))

   ```tsx
   // src/ColorPicker.tsx — inserted directly below the useState call
   useEffect(() => {
     if (hostValue === undefined) return;
     const rgb = parseHex(hostValue);
     if (rgb === null) return; // an unparseable value leaves the current colour alone
     setColor(rgbToHsv(rgb));
   }, [hostValue]);
   ```

4. **Pass the attribute down.** In `src/color-picker-element.tsx`, replace the `render` call inside
   `connectedCallback`.

   ```tsx
   // src/color-picker-element.tsx — replacing the `this.#reactRoot.render(<ColorPicker />);` line
   // getAttribute returns null when the attribute is absent; the prop wants undefined.
   this.#reactRoot.render(<ColorPicker hostValue={this.getAttribute('value') ?? undefined} />);
   ```

5. **Put a value on the demo tag.** In `demo/index.html`, replace the `<color-picker>` line.

   ```html
   <!-- color-picker-demo/demo/index.html — replacing the <color-picker></color-picker> line -->
   <color-picker value="#3366ff"></color-picker>
   ```

6. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- The demo page loads with the readout reading exactly `#3366ff`, the square's handle near the top-right and
  the rail's handle over the blue.
- Change the attribute in `demo/index.html` to `value="#ff0000"`, save, and hard-reload: the readout reads
  exactly `#ff0000`, the rail's handle is at the far left of the rail and the square's handle is in the
  top-right corner. Change it back to `#3366ff` before moving on.
- Change it to `value="nonsense"` and hard-reload: the picker falls back to its own starting colour,
  `#3366ff`, and the Console shows no error. Change it back.
- Editing the attribute live in DevTools' Elements panel does **nothing** yet. That is correct — step 02 adds
  it.
- `npm run build` exits without printing an error.

## If it breaks

- **The page loads on `#3366ff` whatever the attribute says.** The element is still rendering
  `<ColorPicker />` with no props — action 4 replaces that line.
- **`#36f` is rejected but `#3366ff` works.** The three-digit expansion is missing or runs after the regular
  expression test instead of before it.
- **The rail handle lands on red for every colour you pass in.** `rgbToHsv` is returning hue 0 — check the
  three branches compare against `red`, `green`, `blue` in that order and that the `+ 2` / `+ 4` offsets are
  on the green and blue branches respectively.
- **`npm run build` fails with `Type 'null' is not assignable to type 'string | undefined'`.** The `?? undefined`
  is missing from the `getAttribute` call.

---
> Nav: — · [Overview](00_overview.md) · [The `value` attribute →](02_the-value-attribute.md)
