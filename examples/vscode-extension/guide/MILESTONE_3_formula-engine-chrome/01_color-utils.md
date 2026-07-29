# M3 · Step 01 of 8 — Color utilities: hex, HSL, and WCAG contrast
> Nav: — · [Overview](00_overview.md) · [Types →](02_types.md)

## Glossary for this step
- **RGB** — a color as three channels, **R**ed / **G**reen / **B**lue, each `0–255`. Hex `#rrggbb` is just those three bytes written in base-16 (`ff` = 255). *(defined inline below)*
- **[HSL](../foundation/glossary.md#hsl)** — a color as **H**ue (`0–360°`, the position on the color wheel), **S**aturation (`0–1`, grey→vivid), **L**ightness (`0–1`, black→white).
- **[Contrast ratio (WCAG)](../foundation/glossary.md#contrast-ratio-wcag)** — a number from `1:1` (identical) to `21:1` (black vs. white) describing how distinguishable two colors are; text wants **≥ 4.5:1** (AA) or **≥ 7:1** (AAA).

## Why / design
This is the first file of the **pure engine** (`src/engine/`) — plain TypeScript with **no `import * as vscode`**.
Because it never touches the editor API, you can compile it and run it in plain Node, which is exactly what we do at
the end of this step to *prove the math* without pressing <kbd>F5</kbd>. Every profile in this milestone is built out
of the handful of functions below, so it pays to get them right and verified now.

The engine follows one rule from [conventions.md](../foundation/conventions.md#data-vs-code): **colors are strings
in, strings out** — hex `#rrggbb` at every boundary. HSL exists *only* inside this file's math. The reason we
convert to HSL at all: deriving a coordinated palette (lighten a surface, rotate a hue, mute an accent) is trivial
in HSL and painful in RGB.

> 🧠 **Color model — hex ⇆ RGB ⇆ HSL.** Three ways to name the same color:
> - **Hex / RGB** — `#3ec6ff` is R=`3e`(62), G=`c6`(198), B=`ff`(255). Good for storage and for what VS Code
>   settings expect, bad for *adjusting* a color.
> - **HSL** — the same color as `H≈198°, S=1.0, L≈0.62`. Now "make it lighter" is just *raise L*, "make it a green
>   instead" is *set H to 140*, "mute it" is *lower S* — each is one independent knob.
>
> So the pattern for every adjuster below is: **hex → HSL → nudge one channel → back to hex.** Reference:
> [MDN — `hsl()` color](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl) ·
> [MDN — color values](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

> 🧠 **WCAG contrast — luminance, then a ratio.** Readability isn't "how different do two colors look" — it's a
> defined formula. First compute each color's **relative luminance** (perceived brightness: green counts far more
> than blue, and each channel is *gamma-corrected* — adjusted for how our eyes actually perceive brightness rather
> than the raw stored value). Then the **contrast ratio** is `(Llighter + 0.05) / (Ldarker +
> 0.05)`, giving `1:1` for identical colors up to `21:1` for pure black on pure white. We use it two ways: pick
> black-or-white text for a background (`readableOn`), and nudge a color until it's legible (`ensureContrast`).
> Reference: [W3C — relative luminance](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance) ·
> [W3C — contrast (minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html).

## Do this
**Before you start:** [M2](../MILESTONE_2_nondestructive-backbone/00_overview.md) is green and the `live-recolor` project compiles. The Node color check at the end of this step reuses the Node 24 + `tsc` you set up in [M1/01](../MILESTONE_1_scaffold-sidebar/01_prerequisites.md) — no new install needed.

This step creates **one file**: `src/engine/color.ts`.

1. In the Explorer, create a folder **`src/engine`** (this is the pure engine layer — nothing here may import
   `vscode`), then a file **`src/engine/color.ts`**.
2. Paste the code in the **Code** block below. What each group does and why:
   - **`hexToRgb` / `rgbToHex`** — parse `#rrggbb` (or shorthand `#rgb`) into `{r,g,b}` and back. `rgbToHex` rounds
     and `clamp`s each channel to `0–255` and `padStart`s to two hex digits, so a value like `255.4` or `-2` can
     never produce a malformed color string. *(Load-bearing: these are the string↔number boundary.)*
   - **`hexToHsl` / `hslToHex`** — the two model converters. `hexToHsl` also handles the grey case (`d === 0` →
     saturation 0). `hslToHex` normalizes hue into `0–360` (`((h % 360) + 360) % 360`) and clamps `s`/`l`, so a
     rotate past 360° or a lighten past 1.0 wraps/clamps safely instead of breaking.
   - **`lighten` / `darken`** — move **L** up/down by an amount (e.g. `0.05` = 5 percentage points). *Why:* coordinated
     shades of one surface.
   - **`saturate` / `desaturate`** — move **S**. *Why:* Neon boosts it, Pastel/Muted cut it.
   - **`rotate` / `setHue`** — `rotate` adds degrees to **H** (relative); `setHue` sets it absolutely. *Why:* Nature
     re-hues a palette toward ocean/forest; Warm-Sepia pins accents to warm hues.
   - **`mix`** — linearly blend two colors in RGB by `t` (`0` = all `a`, `1` = all `b`). *Why:* deriving `textMuted`
     (text mixed toward surface) and `border` (surface mixed toward text).
   - **`relativeLuminance` / `contrastRatio`** — the WCAG math from the callout above.
   - **`readableOn`** — returns near-white or near-black, whichever has more contrast on a given background. *Why:*
     status-bar text that stays legible whatever the accent color is.
   - **`ensureContrast`** — nudges a foreground's lightness step by step until it clears a target ratio (or clamps at
     pure white/black). *Why:* the High-Contrast profile (step 05) leans on it to hit AAA.
3. Save the file. With the `watch` task running (or `npm run compile`) it should compile with **no** errors.

## Code
`src/engine/color.ts` *(the complete file — load-bearing; this is the final version, used unchanged through M5)*
```ts
// Pure color math. No VS Code imports. Colors cross the boundary as "#rrggbb" strings.

export interface Rgb { r: number; g: number; b: number; } // 0..255
export interface Hsl { h: number; s: number; l: number; }  // h 0..360, s/l 0..1

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break;
      case gn: h = ((bn - rn) / d + 2); break;
      default: h = ((rn - gn) / d + 4); break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

export function lighten(hex: string, amount: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, l: c.l + amount });
}
export function darken(hex: string, amount: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, l: c.l - amount });
}
export function saturate(hex: string, amount: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, s: c.s + amount });
}
export function desaturate(hex: string, amount: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, s: c.s - amount });
}
export function rotate(hex: string, degrees: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, h: c.h + degrees });
}
export function setHue(hex: string, hue: number): string {
  const c = hexToHsl(hex); return hslToHex({ ...c, h: hue });
}
export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

// WCAG relative luminance + contrast ratio.
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

// Return near-black or near-white, whichever reads better on `bg`.
export function readableOn(bg: string): string {
  return contrastRatio('#ffffff', bg) >= contrastRatio('#111111', bg) ? '#ffffff' : '#111111';
}

// Nudge `fg` lighter/darker until it hits `ratio` against `bg` (or clamps).
export function ensureContrast(fg: string, bg: string, ratio: number): string {
  if (contrastRatio(fg, bg) >= ratio) return fg;
  const goLighter = relativeLuminance(bg) < 0.5;
  let c = hexToHsl(fg);
  for (let i = 0; i < 100; i++) {
    c = { ...c, l: clamp(c.l + (goLighter ? 0.01 : -0.01), 0, 1) };
    const candidate = hslToHex(c);
    if (contrastRatio(candidate, bg) >= ratio) return candidate;
    if (c.l <= 0 || c.l >= 1) break;
  }
  return goLighter ? '#ffffff' : '#111111';
}
```

## Do this — run the color check in Node
Because the engine is pure, you can execute it directly — no F5, no VS Code. We'll write a tiny throwaway script,
compile the project, run it, read the numbers, then delete it.

1. Create a **temporary** file **`src/engine/color.check.ts`** with exactly this:
   ```ts
   import { hexToHsl, hslToHex, contrastRatio, readableOn } from './color';

   console.log('round-trip #3ec6ff ->', hslToHex(hexToHsl('#3ec6ff')));
   console.log('contrast #ffffff/#000000 ->', contrastRatio('#ffffff', '#000000'));
   console.log('readableOn(#0b1a2b) ->', readableOn('#0b1a2b'));
   ```
2. Compile the project (this is the same `tsc` your `compile`/`watch` script runs; it emits JS into `out/`):
   ```powershell
   npx tsc -p ./
   ```
3. Run the compiled check with Node (note: `.js`, in `out/`, **not** the `.ts` source):
   ```powershell
   node ./out/engine/color.check.js
   ```
   **Expected output — exactly:**
   ```
   round-trip #3ec6ff -> #3ec6ff
   contrast #ffffff/#000000 -> 21
   readableOn(#0b1a2b) -> #ffffff
   ```
   Line 1 proves `hexToHsl → hslToHex` round-trips a real accent color losslessly. Line 2 proves the WCAG contrast
   of black-on-white is the theoretical maximum, `21`. Line 3 proves `readableOn` picks white text for a dark
   background.
4. **Delete `src/engine/color.check.ts`** now (and, if you like, `out/engine/color.check.js`). It was scaffolding to
   verify the math — it must **not** ship. Nothing imports it.

> *(One-liner alternative, no scratch file — after `npx tsc -p ./`:)*
> ```powershell
> node -e "const c=require('./out/engine/color'); console.log(c.hslToHex(c.hexToHsl('#3ec6ff')), c.contrastRatio('#ffffff','#000000'))"
> ```
> prints `#3ec6ff 21`.

## Done when (this step)
- `src/engine/color.ts` exists with the code above and compiles with no errors.
- Running the check prints `round-trip #3ec6ff -> #3ec6ff`, `contrast #ffffff/#000000 -> 21`, and
  `readableOn(#0b1a2b) -> #ffffff`.
- `src/engine/color.check.ts` has been deleted.

## If it breaks
- **`Cannot find module './out/engine/color.js'`** when running Node → the compile step didn't emit it. Confirm
  `npx tsc -p ./` ran with no errors and that `color.ts` really is under `src/engine/` (the output path mirrors the
  source path).
- **Node error `Cannot use import statement outside a module`** → you tried to `node` the **`.ts`** file. Node runs
  the **compiled `.js`** in `out/`, not TypeScript source. Re-run `npx tsc -p ./` then `node ./out/engine/...js`.
- **`contrast` prints something other than `21`** → a typo in `channelLuminance` or `contrastRatio`; the weights are
  `0.2126 / 0.7152 / 0.0722` and the ratio is `(hi + 0.05) / (lo + 0.05)`. Compare against the block above.
- **`round-trip` prints a *slightly* different hex** (e.g. `#3ec6fe`) → a rounding/branch typo in `hslToHex`; check
  the `if (h < 60) … else …` ladder and `rgbToHex`'s `Math.round`.

---
> Nav: — · [Overview](00_overview.md) · [Types →](02_types.md)
