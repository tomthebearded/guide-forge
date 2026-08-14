# M2 · Step 02 of 05 — Hex output
> Nav: [← The colour model](01_the-color-model.md) · [Overview](00_overview.md) · [Draw the hue rail →](03_draw-the-hue-rail.md)

## Why / design

`hsvToRgb` returns three numbers. Everything that consumes a colour outside this component — a CSS property,
the readout you look at, the `value` attribute a host page reads in milestone 4 — wants one string. The
canonical form of that string, for this guide, is a hex triplet: `#3366ff`.

Hex earns the job over `rgb(51, 102, 255)` because it is the form a host page can hand back to you unchanged.
It is short, it has exactly one spelling per colour once you fix the case, and it is what a designer pastes.
Milestone 5 adds two more output formats for display; the value the component *stores and emits* stays hex from
here to the end.

## Before you start

Step 01 complete: `src/color-math.ts` exports `HsvColor`, `RgbColor` and `hsvToRgb`, and `npm run build` exits
0.

## Do this

1. In `src/color-math.ts`, add the function directly below the closing brace of `hsvToRgb` and above
   `function normalizeDegrees`.

   ```ts
   export function rgbToHex(color: RgbColor): string {
     const channels = [color.red, color.green, color.blue];
     return '#' + channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
   }
   ```

   `toString(16)` renders a number in base 16, and `padStart(2, '0')` puts back the leading zero it drops —
   without it, `rgb(0, 102, 255)` would come out as `#066ff`, which is five digits and not a colour.

   The output is **lower-case**, because that is what `toString(16)` produces and one spelling per colour is
   worth more than a preference. Milestone 4 compares this string against an attribute the host page set, and
   a comparison between `#3366FF` and `#3366ff` is a bug that only shows up on someone else's site.

2. Build.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] `src/color-math.ts` now exports four names — the interfaces `HsvColor` and `RgbColor`, and the functions
      `hsvToRgb` and `rgbToHex`. The two helpers stay unexported.
- [ ] The demo page still shows the fixed blue swatch from milestone 1. Nothing calls this yet; step 03 does.

## If it breaks

- **`Property 'padStart' does not exist on type 'string'`** → the workspace's TypeScript target is older than
  the one `ng new` sets. Angular 22 pins TypeScript 6.0.x and a modern target; if you edited `tsconfig.json`,
  put `"target"` back.
- **A colour comes out five characters long** → `padStart` is missing or its arguments are swapped. The length
  comes first: `padStart(2, '0')`.

---
> Nav: [← The colour model](01_the-color-model.md) · [Overview](00_overview.md) · [Draw the hue rail →](03_draw-the-hue-rail.md)
