# M3 · Step 05 of 8 — Generative profiles II: the remaining six
> Nav: [← Generative profiles I](04_profiles-generative-1.md) · [Overview](00_overview.md) · [Generate →](06_generate.md)

## Why / design
Same pattern as step 04 — each profile is one entry that spreads `base()` and overrides only what its identity
changes. We add the final **six** generative profiles here, taking `GENERATIVE` to its full **nine**. Because it's
all data over one shared engine, this is six short sections, not six new code paths ([conventions.md](../foundation/conventions.md#data-vs-code)).

Reading each new profile as *rules with reasons*:
- **Warm Sepia** — mix every surface/text a little toward a warm tan (`#c98a3c`) and pin the accents to warm hues
  (`setHue` 32°/44°, orange-ish). *Why:* a paper-under-lamplight feel; warmth comes from biasing hue + blending,
  not from new colors.
- **Material** — ignore the seed for neutrals and use Material Design's fixed dark greys (`#121212` bg, `#1e1e1e`
  surface, `#e0e0e0` text), keeping only the seed's *accents* (lightly saturated). *Why:* Material's neutrals are a
  defined spec, so we pin them and let the combo supply personality through the accents.
- **Nature** — a **variant** profile (`['ocean','forest']`). It re-hues bg/surface/accents toward blue (`200°`,
  ocean) or green (`140°`, forest) via `setHue` + a half-`mix`. *Why:* one profile, two moods; `variant` (from
  `types.ts`) selects the target hue. `accent2` fans out from `accent1` by ±30–40° for variety.
- **High Contrast (AAA)** — the profile that *uses the contrast math*: darken bg slightly, then `ensureContrast`
  the text to **7:1** (AAA), muted text to **4.5:1** (AA), accents to 7:1, border to 3:1. *Why:* legibility is
  guaranteed by formula, not by eye — this is why `ensureContrast` exists.
- **Muted / Low-strain** — `desaturate` + slightly `darken` the text and accents. *Why:* lower saturation and a
  touch less lightness reduce eye strain for long sessions.
- **Monochrome + Accent** — `desaturate(h, 1)` drives *every neutral* to pure grey (saturation forced to 0), then
  reintroduces a **single** accent (both `accent1` and `accent2` = the seed's `accent1`). *Why:* a stark greyscale
  UI with one pop of color.

> 🧠 **`setHue` vs. `rotate` (why Nature/Warm-Sepia use `setHue`).** `rotate(hex, +40)` turns a color 40° *further*
> around the wheel — it depends on where the color already was. `setHue(hex, 200)` moves it to an *absolute* hue
> (200° = a specific blue) while keeping its saturation and lightness. Nature wants "make this blue" regardless of
> the seed, so it sets the hue absolutely.

*(TypeScript reminder — `buildPalette: (c, variant = 'ocean') => …` gives the variant a default, so calling it with
no variant still works. `const warm = (h, t) => mix(h, '#c98a3c', t)` is a local helper, scoped to that one profile.)*

## Do this
This step **edits one file**: `src/engine/profiles.ts` — replace it with the complete version below.

1. **Widen the `./color` import** to add the helpers the new profiles use: `setHue` (Warm Sepia, Nature) and
   `ensureContrast` (High Contrast). The full import line is now
   `{ darken, lighten, saturate, desaturate, setHue, mix, ensureContrast }`.
2. **Add the six new objects** to the `GENERATIVE` array, after `midnight`, in this order: `warm-sepia`, `material`,
   `nature`, `high-contrast`, `muted`, `monochrome`. Order is cosmetic (it's the dropdown order) but keeping it
   matches the verify step.
3. Leave `base()`, the first three profiles, `PROFILES = [...GENERATIVE]`, and `profileById` exactly as they were.
4. The simplest, safe move is to **replace the whole file** with the block below. Save.

**Load-bearing:** the six new `id`s (`warm-sepia`, `material`, `nature`, `high-contrast`, `muted`, `monochrome`),
`family: 'generative'`, and Nature's `variants: ['ocean', 'forest']`. Labels are cosmetic.

## Code
`src/engine/profiles.ts` *(complete — all 9 generative profiles; M4 appends the 4 signature presets)*
```ts
// [M3] exports GENERATIVE (9 profiles) + PROFILES = [...GENERATIVE]. [M4] appends SIGNATURE.
import { Palette, StarterCombo, StyleProfile } from './types';
import { darken, lighten, saturate, desaturate, setHue, mix, ensureContrast } from './color';

// Shared base: map a combo's 5 colors to the 8 palette roles.
function base(combo: StarterCombo): Palette {
  return {
    bg: combo.bg,
    surface: combo.surface,
    surfaceAlt: lighten(combo.surface, 0.04),
    text: combo.text,
    textMuted: mix(combo.text, combo.surface, 0.5),
    accent1: combo.accent1,
    accent2: combo.accent2,
    border: mix(combo.surface, combo.text, 0.15),
  };
}

export const GENERATIVE: StyleProfile[] = [
  {
    id: 'neon', label: 'Neon', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p,
        bg: darken(p.bg, 0.03), surface: darken(p.surface, 0.02),
        accent1: saturate(lighten(p.accent1, 0.05), 0.3),
        accent2: saturate(lighten(p.accent2, 0.05), 0.3),
        text: lighten(p.text, 0.02) };
    },
  },
  {
    id: 'pastel', label: 'Pastel', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p,
        surface: lighten(p.surface, 0.06), surfaceAlt: lighten(p.surfaceAlt, 0.06),
        accent1: lighten(desaturate(p.accent1, 0.25), 0.12),
        accent2: lighten(desaturate(p.accent2, 0.25), 0.12) };
    },
  },
  {
    id: 'midnight', label: 'Midnight / OLED', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p, bg: '#000000', surface: darken(p.surface, 0.06), surfaceAlt: darken(p.surfaceAlt, 0.05) };
    },
  },
  {
    id: 'warm-sepia', label: 'Warm Sepia', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      const warm = (h: string, t: number) => mix(h, '#c98a3c', t);
      return { ...p,
        bg: warm(p.bg, 0.10), surface: warm(p.surface, 0.12), surfaceAlt: warm(p.surfaceAlt, 0.12),
        text: warm(p.text, 0.06), textMuted: warm(p.textMuted, 0.10),
        accent1: setHue(p.accent1, 32), accent2: setHue(p.accent2, 44) };
    },
  },
  {
    id: 'material', label: 'Material', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p,
        bg: '#121212', surface: '#1e1e1e', surfaceAlt: '#242424',
        text: '#e0e0e0', textMuted: '#9e9e9e',
        accent1: saturate(p.accent1, 0.05), accent2: saturate(p.accent2, 0.05),
        border: '#2c2c2c' };
    },
  },
  {
    id: 'nature', label: 'Nature', family: 'generative', variants: ['ocean', 'forest'],
    buildPalette: (c, variant = 'ocean') => {
      const p = base(c);
      const hue = variant === 'forest' ? 140 : 200;
      return { ...p,
        bg: mix(p.bg, setHue(p.bg, hue), 0.5),
        surface: mix(p.surface, setHue(p.surface, hue), 0.5),
        accent1: setHue(p.accent1, hue),
        accent2: setHue(p.accent2, hue + (variant === 'forest' ? 40 : -30)) };
    },
  },
  {
    id: 'high-contrast', label: 'High Contrast (AAA)', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      const bg = darken(p.bg, 0.02);
      return { ...p, bg,
        text: ensureContrast(p.text, bg, 7),
        textMuted: ensureContrast(p.textMuted, bg, 4.5),
        accent1: ensureContrast(saturate(p.accent1, 0.1), bg, 7),
        accent2: ensureContrast(saturate(p.accent2, 0.1), bg, 7),
        border: ensureContrast(p.border, bg, 3) };
    },
  },
  {
    id: 'muted', label: 'Muted / Low-strain', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      return { ...p,
        text: desaturate(darken(p.text, 0.05), 0.1),
        accent1: desaturate(darken(p.accent1, 0.05), 0.25),
        accent2: desaturate(darken(p.accent2, 0.05), 0.25) };
    },
  },
  {
    id: 'monochrome', label: 'Monochrome + Accent', family: 'generative',
    buildPalette: (c) => {
      const p = base(c);
      const gray = (h: string) => desaturate(h, 1);
      return {
        bg: gray(p.bg), surface: gray(p.surface), surfaceAlt: gray(p.surfaceAlt),
        text: gray(p.text), textMuted: gray(p.textMuted), border: gray(p.border),
        accent1: p.accent1, accent2: p.accent1 };
    },
  },
];

// [M3] PROFILES = [...GENERATIVE]. [M4] becomes [...GENERATIVE, ...SIGNATURE].
export const PROFILES: StyleProfile[] = [...GENERATIVE];

export function profileById(id: string): StyleProfile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}
```

## Done when (this step)
- `src/engine/profiles.ts` compiles with no errors and `GENERATIVE` now has exactly **9** entries in the order
  `neon, pastel, midnight, warm-sepia, material, nature, high-contrast, muted, monochrome`.
- `nature` carries `variants: ['ocean', 'forest']`; the other eight have no `variants`.
- *(Optional pure check, via a scratch file like step 01:
  `console.log(profileById('high-contrast').buildPalette(comboById('deep-sea')).text)` prints a near-white hex that
  clears 7:1 on the darkened bg. Delete the scratch file after.)*

## If it breaks
- **`setHue`/`ensureContrast` "has no exported member"** → you didn't widen the `./color` import in step 1 above.
- **Type error "not all code paths return"** on `nature` → the `variant = 'ocean'` default must stay; every
  `buildPalette` must return a full `Palette`.
- **Fewer than 9 profiles** → you appended into the wrong array or left the file at its step-04 state. The dropdown
  in step 07 renders one `<option>` per `GENERATIVE` entry, so a short array shows a short menu.
