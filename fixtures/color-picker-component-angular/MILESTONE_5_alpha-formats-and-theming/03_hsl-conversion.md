# M5 · Step 03 of 07 — HSL conversion
> Nav: [← The alpha rail](02_the-alpha-rail.md) · [Overview](00_overview.md) · [The format switch →](04_the-format-switch.md)

## Glossary for this step

> New here: **[HSL](../foundation/glossary.md#hsl)** (defined under *Why / design*).

## Why / design

The last conversion, and the one that pays off a distinction the guide has been carrying since milestone 3.

> **New concept — HSL.** The colour model CSS writes as `hsl(225, 100%, 60%)`: a **hue** in degrees, a
> **saturation** percentage, and a **lightness** percentage. It is the third way of naming the same sRGB
> colours you already have in HSV and in hex, and it is the one people quote in design systems because the
> lightness axis is the one that reads as "the same colour, lighter".
> ([MDN: `hsl()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl))

HSL and HSV share a hue and share nothing else. Both then ask "how bright", and they mean different things by
it:

| | at its maximum | grey lives at |
|---|---|---|
| **HSV** *value* | the most vivid form of the hue — pure red | saturation 0, any value |
| **HSL** *lightness* | **white**, whatever the hue | lightness 50%, saturation 0 |

That is why the square you built has a rainbow along its top edge rather than a white band: its vertical axis
is value, not lightness. The two models describe the same colours and lay them out differently, and a picker
that offers `hsl()` output has to convert rather than relabel.

The hue is the shared part, so this function reuses `hueFromChannels` — the helper milestone 4 wrote for
`rgbToHsv`. That is the whole reason it was pulled out as a helper rather than inlined.

## Before you start

Step 02 complete: the alpha rail drags, and the readout grows to eight hex digits below full opacity.

## Do this

1. In `src/color-math.ts`, add the interface directly below the `RgbColor` interface.

   ```ts
   /** A colour in the HSL model, in the units CSS writes: degrees and percentages. */
   export interface HslColor {
     hueDegrees: number;
     saturationPercent: number;
     lightnessPercent: number;
   }
   ```

   The fields are percentages rather than ratios because that is what `hsl()` takes, and this interface exists
   to be printed. Alpha is not in it: `hsla()` takes its alpha as a ratio, so it comes straight off the
   `RgbColor` rather than round-tripping through this shape.

2. Add the conversion directly below `rgbToHsv`.

   ```ts
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
   ```

   The `span === 0` guard covers both ends at once: a grey has no saturation, and it is also the only case
   where the denominator would be zero — pure black and pure white both make `1 - |2L - 1|` vanish.

   The three `Math.round` calls are what make the output quotable. `#3366ff` converts to
   **`hsl(225, 100%, 60%)`** exactly, and that string appears in the milestone gate.

3. Build.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] `src/color-math.ts` exports eight names: three interfaces (`HsvColor`, `RgbColor`, `HslColor`) and five
      functions — `hsvToRgb`, `rgbToHex`, `parseHex`, `rgbToHsv`, `rgbToHsl` — with three private helpers
      below them.
- [ ] The demo page is unchanged. Nothing calls `rgbToHsl` until step 04.

## If it breaks

- **`Cannot find name 'hueFromChannels'`** → `rgbToHsl` landed **below** the private helpers instead of
  directly under `rgbToHsv`. Function declarations hoist, so this only bites if it landed outside the module —
  check for a stray closing brace.
- **White comes out as `hsl(0, NaN%, 100%)`** → the `span === 0` guard is missing and the denominator is zero.

---
> Nav: [← The alpha rail](02_the-alpha-rail.md) · [Overview](00_overview.md) · [The format switch →](04_the-format-switch.md)
