# M2 · Step 01 of 05 — The colour model
> Nav: — · [Overview](00_overview.md) · [Hex output →](02_hex-output.md)

> Build vs borrow — **chroma-js 3.2.0** does this in production
> (<https://www.npmjs.com/package/chroma-js>): you're writing it by hand here to learn how a picker's two
> controls map onto a colour. Swap it in when you need wide-gamut output, CSS Color 4 parsing, perceptual
> spaces such as Oklch, or contrast maths — see D2 in
> [../foundation/decision-log.md](../foundation/decision-log.md).

## Glossary for this step

> New here: **[HSV](../foundation/glossary.md#hsv)**, **[hue](../foundation/glossary.md#hue)**,
> **[saturation](../foundation/glossary.md#saturation)** and
> **[value (in HSV)](../foundation/glossary.md#value-in-hsv)** — all defined under *Why / design*;
> **[sRGB](../foundation/glossary.md#srgb)**, defined under *Do this* 1.

## Why / design

A screen takes red, green and blue. A person does not think in red, green and blue — nobody reaches for
"more blue" when they want a darker sky. Every colour picker ever built exists to bridge that gap, and they all
bridge it the same way.

> **New concept — HSV.** A colour described by three numbers chosen because each one maps onto a control a
> person can drag:
>
> - **hue** — *which* colour, as an angle around a wheel: 0° red, 120° green, 240° blue, 360° back to red;
> - **saturation** — how far from grey, as a ratio 0–1;
> - **value** — how far from black, as a ratio 0–1.
>
> That is the whole design of the thing you are building: hue is the rail in this milestone, and saturation and
> value are the two axes of the square in the next one.
> ([MDN: colour value types](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value))

**The mental model to hold on to**, because every later step leans on it: HSV is the *input* model and RGB is
the *output* model. The reader drags in HSV; the screen only understands RGB; a conversion sits between them
and runs on every pointer move. Nothing in this component stores a colour as RGB — RGB is always computed, and
always from the three HSV numbers.

The conversion itself is three ideas:

1. **Chroma** — `value × saturation` — is how much colour there is at all. Grey has chroma 0.
2. **The sector** — the hue divided by 60 — says which pair of channels is doing the work. Six sectors, six
   arrangements of *largest*, *middle*, *smallest*.
3. **The offset** — `value − chroma` — is the grey the whole thing sits on. It lifts all three channels
   together, which is exactly what "less saturated" means.

## Before you start

Milestone 1 complete. Everything below is inside the workspace, `angular-color-picker/color-picker/`.

## Do this

1. Create `src/color-math.ts` with the two shapes every later step passes around.

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
   ```

   > **New concept — sRGB.** The colour space `#rrggbb` has always meant on the web: three 8-bit channels, one
   > fixed set of primaries. It is not the only one a modern browser understands — `oklch()` and `display-p3`
   > reach colours sRGB cannot — and this picker deliberately handles **only sRGB**. That is the boundary D2
   > draws around the hand-written maths.
   > ([MDN: colour spaces](https://developer.mozilla.org/en-US/docs/Glossary/Color_space))

   The field names carry their units on purpose: `hueDegrees` and `saturationRatio` cannot be swapped by
   accident the way `h` and `s` can.

2. Add the conversion to the same file, below the interfaces.

   ```ts
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
   ```

   Read `secondLargest` once and you will not have to again: within a sector one channel is at full chroma, one
   is at zero, and the third ramps linearly between them. `sector % 2` is the position inside the current
   sixth, and `1 - |x - 1|` is the triangle wave that ramps up on even sectors and down on odd ones.

3. Add the two private helpers at the bottom of `src/color-math.ts`. They are not exported: nothing outside
   this file has a reason to call them.

   ```ts
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

   `normalizeDegrees` is doubled up (`% 360` twice, with a `+ 360` between) because JavaScript's `%` keeps the
   sign of its left operand: `-10 % 360` is `-10`, not `350`. Hue wraps in both directions, so this matters the
   first time a drag runs off the left end of the rail.

4. Build.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] `ls src` lists `color-math.ts`.
- [ ] Nothing on the demo page has changed — nothing imports this file yet. The values it produces get their
      first gate in step 04, where a drag makes them visible.

## If it breaks

- **`Type '(number | undefined)[]' is not assignable to type '[number, number, number]'`** → the `switch` has
  a `case` without a `return`, or no `default`. Every branch must return, and the last one must be `default`
  so TypeScript knows the function always does.
- **`Cannot find name 'HsvColor'`** in a later step → the `export` keyword is missing from one of the two
  interfaces.

---
> Nav: — · [Overview](00_overview.md) · [Hex output →](02_hex-output.md)
