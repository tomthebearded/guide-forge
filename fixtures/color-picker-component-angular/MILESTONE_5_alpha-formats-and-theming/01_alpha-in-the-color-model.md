# M5 · Step 01 of 07 — Alpha in the colour model
> Nav: — · [Overview](00_overview.md) · [The alpha rail →](02_the-alpha-rail.md)

## Glossary for this step

> New here: **[alpha](../foundation/glossary.md#alpha)** (defined under *Why / design*).

## Why / design

> **New concept — alpha.** Opacity, as a ratio from 0 (invisible) to 1 (solid). It is not a colour: it does not
> change which colour you have, only how much of what is behind it shows through. Every colour form on the web
> has a place for it — the fourth argument of `rgba()` and `hsla()`, or **two extra hex digits**: `#3366ff80`
> is the guide's canonical blue at half opacity.
> ([MDN: `<alpha-value>`](https://developer.mozilla.org/en-US/docs/Web/CSS/alpha-value))

Alpha rides along with the colour rather than sitting beside it, so it belongs in the two interfaces
`color-math.ts` already exports. That single decision breaks every place either interface is constructed — five
of them, across two files — and **this step fixes all of them**. A step that left the project not compiling
"until the next one" would hide any mistake you made in the meantime among the errors you were told to expect.

One conversion rule is fixed here and quoted nowhere else: **the alpha byte is `round(alpha × 255)`, rounding
half up.** So `0.5` becomes `128`, which is `80` in hex. Read the other way, `80` is `128 / 255 = 0.502`, which
displays as `0.5`. The round trip is stable, which is what lets a gate name an exact string.

## Before you start

Milestone 4 complete: `src/color-math.ts` exports `HsvColor`, `RgbColor`, `hsvToRgb`, `rgbToHex`, `parseHex`
and `rgbToHsv`, and the picker reflects its colour into the `value` attribute.

## Do this

1. In `src/color-math.ts`, add the field to **both** interfaces.

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
   ```

2. Carry it through `hsvToRgb` — add one line to the returned object. Nothing else in the function changes:
   alpha is not part of the hue maths.

   ```ts
   return {
     red: Math.round((red + offset) * 255),
     green: Math.round((green + offset) * 255),
     blue: Math.round((blue + offset) * 255),
     alphaRatio: color.alphaRatio,
   };
   ```

3. Teach `rgbToHex` the eight-digit form. Replace the whole function.

   ```ts
   export function rgbToHex(color: RgbColor): string {
     const channels = [color.red, color.green, color.blue];
     if (color.alphaRatio < 1) {
       channels.push(Math.round(color.alphaRatio * 255)); // 0.5 → 128 → '80'
     }
     return '#' + channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
   }
   ```

   The `< 1` test is the whole design of the output: a solid colour stays six digits, so nothing that consumed
   this component's value before alpha existed sees anything new. Only a colour that is genuinely see-through
   grows the two extra digits.

4. Teach `parseHex` to read them. Replace the whole function.

   ```ts
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
   ```

   A missing alpha group means opaque, not transparent — `#3366ff` is the same colour it always was.

5. Carry it through `rgbToHsv` — one line in its returned object.

   ```ts
   return {
     hueDegrees: hueFromChannels(red, green, blue, largest, span),
     saturationRatio: largest === 0 ? 0 : span / largest, // black would divide by zero
     valueRatio: largest,
     alphaRatio: color.alphaRatio,
   };
   ```

6. Fix the two call sites in `src/color-picker.ts` that construct an `HsvColor`. Both are computed values, and
   both pass `1` for now — step 02 gives the first one a signal.

   ```ts
   readonly rgb = computed(() =>
     hsvToRgb({
       hueDegrees: this.hueDegrees(),
       saturationRatio: this.saturationRatio(),
       valueRatio: this.valueRatio(),
       alphaRatio: 1,
     }),
   );
   ```

   ```ts
   readonly hueOnlyHex = computed(() =>
     rgbToHex(
       hsvToRgb({ hueDegrees: this.hueDegrees(), saturationRatio: 1, valueRatio: 1, alphaRatio: 1 }),
     ),
   );
   ```

   `hueOnlyHex` keeps `alphaRatio: 1` permanently. It paints the square's backdrop, and a see-through backdrop
   would show the panel through the colour you are picking from.

7. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`). If it does not, the count of
      errors tells you how many construction sites you missed — there are five in total across the two files.
- [ ] The demo page is **visually identical** to milestone 4: same colours, same readout, six hex digits
      everywhere. Alpha exists in the types and is pinned to 1 in every path.
- [ ] In the console, `document.querySelector('color-picker').value = '#3366ff80'` still shows solid blue and
      the attribute reflects back as **`#3366ff`** — the parser reads the alpha, and nothing carries it yet.
      Step 02 connects it.

## If it breaks

- **`Property 'alphaRatio' is missing in type … but required in type 'HsvColor'`** → one of the two computed
  values in `color-picker.ts` still constructs the old shape. The error names the file and the line.
- **Every colour suddenly has eight digits** → the `< 1` guard in `rgbToHex` is missing or inverted.
- **`#3366ff` now parses to `null`** → the new capture group was written as `([0-9a-f]{2})` without the `?`,
  making the alpha pair mandatory.

---
> Nav: — · [Overview](00_overview.md) · [The alpha rail →](02_the-alpha-rail.md)
