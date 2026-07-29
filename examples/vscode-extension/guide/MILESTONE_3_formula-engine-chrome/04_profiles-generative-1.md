# M3 · Step 04 of 8 — Generative profiles I: `base()` + Neon, Pastel, Midnight
> Nav: [← Combos](03_combos.md) · [Overview](00_overview.md) · [Generative profiles II →](05_profiles-generative-2.md)

## Glossary for this step
- **[Generative profile](../foundation/glossary.md#generative-profile)** — a style whose full palette is *derived* from the seed combo by the profile's rules (as opposed to a fixed palette).

## Why / design
Now the engine earns its name. A **generative profile** is a `StyleProfile` whose `buildPalette` takes a combo and
*computes* the 8-role palette using the `color.ts` functions from step 01. Every profile starts from a shared helper,
**`base()`**, which does the boring, universal work — map the combo's 5 colors onto the 8 roles and derive the two
that combos don't carry (`surfaceAlt`, `textMuted`, `border`). Each profile then spreads `base()` and overrides only
the roles its *identity* changes. That's the "new style = new data" convention
([conventions.md](../foundation/conventions.md#data-vs-code)) in practice: a profile is a short object, not a new
code path.

This file is **partial by design** — we'll add six more profiles in step 05. But everything you write now must
compile and be usable, so the file already ends with the `PROFILES` registry and the `profileById` lookup (built
over just the 3 profiles for now).

> 🧠 **How `base()` derives the two extra roles.**
> - `surfaceAlt` = `lighten(surface, 0.04)` — a surface raised 4 lightness-points, for section headers/hover.
> - `textMuted` = `mix(text, surface, 0.5)` — text blended halfway toward the surface, i.e. a dimmer text.
> - `border` = `mix(surface, text, 0.15)` — surface nudged 15% toward text, a hairline that reads on the surface.
>
> Everything else is copied straight from the combo. A profile that overrides *nothing* would already be a valid,
> coherent theme — the profiles just add character on top.

Reading the three profiles as *rules with reasons*:
- **Neon** — deepen the backdrop and electrify the accents. `darken` bg/surface a touch, then `saturate(lighten(...))`
  both accents (brighter **and** more vivid), and lift the text slightly. *Why:* neon glows against a darker ground.
- **Pastel** — soften everything. `lighten` the surfaces, and `lighten(desaturate(...))` the accents (paler, less
  vivid). *Why:* pastel is low-saturation, high-lightness.
- **Midnight / OLED** — force a **pure-black** background (`'#000000'`, which on OLED panels is literally off pixels)
  and darken the surfaces beneath it. *Why:* maximum contrast and power saving; the black is intentional and absolute,
  not derived.

*(TypeScript reminder — `{ ...p, bg: darken(p.bg, 0.03) }` spreads the base palette then overrides `bg`; the arrow
`(c) => { … }` is the `buildPalette` implementation. Nothing to install.)*

## Do this
This step creates **one file**: `src/engine/profiles.ts` (extended in step 05).

1. Create **`src/engine/profiles.ts`** next to `combos.ts`.
2. Paste the **Code** block below — its *current* complete state (3 profiles). Notes:
   - The import from `./color` pulls in only the helpers these three profiles use (`darken`, `lighten`, `saturate`,
     `desaturate`, `mix`). Step 05 widens this import as more profiles need more helpers.
   - Each profile's `id` and `family` are **load-bearing** (`family: 'generative'` for all nine; the panel groups by
     it and `profileById` looks up by `id`). The `label` is cosmetic.
   - `PROFILES = [...GENERATIVE]` — in M3 the registry is exactly the generative array. (M4 appends the 4 signature
     presets, changing this line — noted in the comment.)
   - `profileById` mirrors `comboById`: total, with a `?? PROFILES[0]` fallback for an unknown id.
3. Save. It compiles against `types.ts` (step 02) and `color.ts` (step 01).

## Code
`src/engine/profiles.ts` *(current state — 3 of 9 generative profiles; step 05 adds the rest)*
```ts
// [M3] exports GENERATIVE + PROFILES = [...GENERATIVE]. [M4] appends SIGNATURE.
import { Palette, StarterCombo, StyleProfile } from './types';
import { darken, lighten, saturate, desaturate, mix } from './color';

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
];

// [M3] PROFILES = [...GENERATIVE]. [M4] becomes [...GENERATIVE, ...SIGNATURE].
export const PROFILES: StyleProfile[] = [...GENERATIVE];

export function profileById(id: string): StyleProfile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}
```

## Done when (this step)
- `src/engine/profiles.ts` exists and compiles with no errors.
- `GENERATIVE` currently has **3** entries (`neon`, `pastel`, `midnight`); `PROFILES` equals `[...GENERATIVE]`;
  `profileById('midnight')` would return the Midnight profile.
- *(No F5 needed — this is pure. If you want proof it derives sane colors, you can extend the step-01 scratch check:
  `import { comboById } from './combos'; import { profileById } from './profiles';` then
  `console.log(profileById('midnight').buildPalette(comboById('deep-sea')).bg)` prints `#000000`. Delete the scratch
  file after.)*

## If it breaks
- **`darken`/`saturate` etc. "has no exported member"** → a typo in the import from `./color`, or step 01 wasn't
  saved. Only import helpers you use — importing a name that doesn't exist fails the compile.
- **Type error on a `buildPalette` return** → you dropped one of the 8 `Palette` roles. Spreading `...base(c)` (via
  the local `p`) supplies all 8; make sure every profile keeps the spread.
- **"`GENERATIVE` has only 3 entries" — is that wrong?** No. This step is intentionally partial; step 05 adds the
  remaining six.

---
> Nav: [← Combos](03_combos.md) · [Overview](00_overview.md) · [Generative profiles II →](05_profiles-generative-2.md)
