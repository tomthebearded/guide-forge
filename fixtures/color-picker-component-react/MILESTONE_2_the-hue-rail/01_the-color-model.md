# Milestone 2 · Step 01 of 05 — The colour model
> Nav: — · [Overview](00_overview.md) · [Hex output →](02_hex-output.md)

## Before you start

M1 complete. You are editing `color-picker/src/`; `npm run dev` is convenient here, but the step's gate is read
on the built demo page.

## Glossary for this step

- [HSV](../foundation/glossary.md#hsv) — defined under *Why / design*.
- [hue](../foundation/glossary.md#hue) — defined under *Why / design*.
- [saturation](../foundation/glossary.md#saturation) — defined under *Why / design*.
- [value](../foundation/glossary.md#value) — defined under *Why / design*.
- [sRGB](../foundation/glossary.md#srgb) — defined under *Do this*, action 1.

## Why / design

> **New concept — HSV, and why a picker is built on it.** A screen mixes red, green and blue, but nobody
> *thinks* in red, green and blue. **HSV** is the model almost every colour picker uses instead:
> **hue** is the angle around the colour wheel, 0–360° — 0° red, 120° green, 240° blue;
> **saturation** is how far the colour is from grey, 0–1;
> **value** is how bright it is, 0–1.
> The reason it wins is geometric: fix the hue and the remaining two numbers are exactly two axes, which is
> why every picker you have used is a rail plus a square. ([MDN: colour spaces](https://developer.mozilla.org/en-US/docs/Glossary/Color_space))

The component will hold HSV and convert to RGB for display, because HSV is what the controls move and RGB is
what the screen needs. This step writes that conversion and puts the model into the component.

> **Build vs borrow — [`chroma-js` 3.2.0](https://www.npmjs.com/package/chroma-js)** does this in production
> ([`culori` 4.0.2](https://www.npmjs.com/package/culori) is the other verified option): you're writing it by
> hand here to learn the model itself — hue as an angle, and why the same saturation looks different at every
> hue. Swap it in the moment you need anything beyond sRGB hex: wide-gamut output, CSS Color 4 parsing, or a
> perceptual space like Oklch. Recorded as D3 in [../foundation/decision-log.md](../foundation/decision-log.md).

## Do this

1. **Create `src/color.ts`** with the whole file below.

   > **New concept — sRGB.** The colour space every hex code on the web means, and the only one this picker
   > works in. The conversion below is correct for sRGB and is *not* correct for wide-gamut displays or for
   > CSS Color 4 notations like `oklch()`. That is a deliberate scope limit, recorded as D3.

   ```ts
   // src/color.ts — the whole file
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
   ```

   The names `HsvColor`, `RgbColor` and `hsvToRgb` are **load-bearing** — every later milestone imports them.
   The local names inside the function are yours.

2. **Put the model into the component.** Rewrite `src/ColorPicker.tsx` with the whole file below.

   ```tsx
   // src/ColorPicker.tsx — the whole file
   import { hsvToRgb, type HsvColor } from './color';

   export function ColorPicker() {
     // Saturation and value are pinned at 1 here, so the rail in step 03 shows pure
     // hues. M3 gives them the square that moves them.
     const color: HsvColor = {
       hueDegrees: 225,
       saturationRatio: 1,
       valueRatio: 1,
     };

     const rgb = hsvToRgb(color);
     const cssColor = `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;

     return (
       <div className="panel">
         <div className="swatch" style={{ background: cssColor }} />
         <div className="readout">{cssColor}</div>
       </div>
     );
   }
   ```

   The colour is a plain `const`, not React state, and that is deliberate: nothing changes it yet. React state
   is what you reach for when something has to *change* a value and have the screen follow — which is step 04,
   the drag. Introducing it here would mean writing a setter with no caller, and the TypeScript config the
   template ships (`noUnusedLocals`) treats an unused declaration as an error, so the step would not build.

3. **Build and reload.**

   ```bash
   npm run build
   ```

   Then hard-reload `http://127.0.0.1:8080/demo/`.

## Done when (this step)

- The demo page's readout reads exactly `rgb(0, 64, 255)`, and the swatch is that blue.
- That is the conversion working: hue 225° at full saturation and brightness. The readout stops being a
  hard-coded string and starts being computed — the next step turns it into hex.
- `npm run build` exits without printing an error.

## If it breaks

- **The readout says `rgb(NaN, NaN, NaN)`.** `sectorIndex` fell outside 0–5, so the lookup returned
  `undefined`. Check the `% 360` on the first line and the `% 6` on the lookup — both are there to keep the
  index inside the table for any hue you can hand it.
- **The swatch is black.** `valueRatio` is 0, or the colour object's keys are misspelled — they are
  `hueDegrees`, `saturationRatio`, `valueRatio`, and TypeScript will point at the mismatch when you build.
- **`npm run build` fails with `'setColor' is declared but its value is never read`.** You reached for
  `useState` here. It arrives in step 04, where something finally changes the colour.
- **`npm run build` fails on `type HsvColor`.** The import must be `import { hsvToRgb, type HsvColor } from
  './color'` — `HsvColor` is a type, `hsvToRgb` is a value, and this syntax imports both in one line.

---
> Nav: — · [Overview](00_overview.md) · [Hex output →](02_hex-output.md)
