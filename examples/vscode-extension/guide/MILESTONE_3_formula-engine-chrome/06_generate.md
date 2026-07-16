# M3 · Step 06 of 8 — Generate: palette → workbench chrome
> Nav: [← Generative profiles II](05_profiles-generative-2.md) · [Overview](00_overview.md) · [Panel: two dropdowns →](07_panel-selects.md)

## Why / design
A `Palette` (8 abstract roles) isn't something VS Code understands — VS Code wants **workbench color keys** like
`statusBar.background`. This file is the translator: **`paletteToChrome`** maps the 8 roles onto 20 named workbench
keys, and **`generate`** is the engine's single public entry point — give it a combo + profile, get back a
`ThemeResult`. This is still pure engine (no `vscode`); the adapter (step 07) takes the `chrome` object and hands it
to M2's `applyChrome`.

The mapping is deliberately opinionated: one palette role fans out to several related keys so the whole UI moves
together. For example `accent1` becomes both the status-bar background *and* the active activity-bar border, so the
"brand" color shows up consistently. The one computed value is `onAccent = readableOn(p.accent1)` — the status-bar
*text* is forced to black-or-white for legibility on whatever accent the profile produced (this is why
`readableOn` exists).

> 🧠 **Workbench color keys (a quick refresher).** A *workbench color key* is one of VS Code's named, themeable UI
> colors — `editor.background`, `sideBar.background`, `statusBar.background`, and so on — set under
> `workbench.colorCustomizations` (the setting M2 already writes through `applyChrome`). The full catalogue is the
> **Theme Color reference**: [code.visualstudio.com/api/references/theme-color](https://code.visualstudio.com/api/references/theme-color).
> The 20 keys below are a curated subset that covers every visible chrome surface; you can add more later by
> extending this one function — nothing else changes.

The 20 keys, grouped by surface (so you can see the coverage):
- **Editor:** `editor.background`, `editor.foreground`
- **Side bar:** `sideBar.background`, `sideBar.foreground`, `sideBarSectionHeader.background`
- **Activity bar:** `activityBar.background`, `activityBar.foreground`, `activityBar.activeBorder`
- **Status bar:** `statusBar.background`, `statusBar.foreground`
- **Title bar:** `titleBar.activeBackground`, `titleBar.activeForeground`
- **Tabs:** `tab.activeBackground`, `tab.inactiveBackground`, `tab.activeForeground`, `tab.inactiveForeground`, `editorGroupHeader.tabsBackground`
- **Panel + focus:** `panel.background`, `panel.border`, `focusBorder`

> 🧠 **Why `ThemeResult` is `{ palette, chrome }` here.** `generate` returns both the *raw* `palette` (so the panel
> can later show swatches + a contrast readout in M4) and the *mapped* `chrome` (what actually gets written). M5
> extends the return with `tokens` and `semantic`; the `[M5]` comments mark exactly where. Don't add those now.

*(Config API reminder — the write itself still happens in the adapter via `applyChrome` (M2); this file only
*builds the value*. Keeping the mapping in the pure engine is the two-layer split from
[conventions.md](../foundation/conventions.md#structure--architecture).)*

## Do this
This step creates **one file**: `src/engine/generate.ts`.

1. Create **`src/engine/generate.ts`** next to `profiles.ts`.
2. Paste the **Code** block below.
   - It imports the types it needs and `readableOn` from `./color` (the only color helper the M3 mapping uses).
   - `paletteToChrome` is a plain function (not exported) — `generate` is the only public surface.
   - `generate` calls `profile.buildPalette(combo, variant)` then wraps the result: `{ palette, chrome:
     paletteToChrome(palette) }`. **Nothing else** — the token/semantic lines are M5.
3. Keep the `[M5]` comment on `ThemeResult` in mind but add no token code. Save; it compiles against `types.ts`,
   `color.ts`.

## Code
`src/engine/generate.ts` *(the M3 version — returns `{ palette, chrome }` only; M5 adds `tokens` + `semantic`)*
```ts
// [M3 version] returns { palette, chrome } only. [M5] adds tokens + semantic.
import { ChromeColors, Palette, StarterCombo, StyleProfile, ThemeResult } from './types';
import { readableOn } from './color';

function paletteToChrome(p: Palette): ChromeColors {
  const onAccent = readableOn(p.accent1);
  return {
    'editor.background': p.bg,
    'editor.foreground': p.text,
    'sideBar.background': p.surface,
    'sideBar.foreground': p.text,
    'sideBarSectionHeader.background': p.surfaceAlt,
    'activityBar.background': p.surfaceAlt,
    'activityBar.foreground': p.accent1,
    'activityBar.activeBorder': p.accent1,
    'statusBar.background': p.accent1,
    'statusBar.foreground': onAccent,
    'titleBar.activeBackground': p.surfaceAlt,
    'titleBar.activeForeground': p.text,
    'tab.activeBackground': p.bg,
    'tab.inactiveBackground': p.surface,
    'tab.activeForeground': p.text,
    'tab.inactiveForeground': p.textMuted,
    'editorGroupHeader.tabsBackground': p.surface,
    'panel.background': p.surface,
    'panel.border': p.border,
    'focusBorder': p.accent2,
  };
}

export function generate(combo: StarterCombo, profile: StyleProfile, variant?: string): ThemeResult {
  const palette = profile.buildPalette(combo, variant);
  return {
    palette,
    chrome: paletteToChrome(palette),
  };
}
```

## Done when (this step)
- `src/engine/generate.ts` exists and compiles with no errors.
- `generate` returns an object with exactly two keys, `palette` and `chrome`; `chrome` has **20** workbench keys.
- *(Optional pure check — extend the step-01 scratch pattern:
  `import { generate } from './generate'; import { comboById } from './combos'; import { profileById } from './profiles';`
  then `console.log(Object.keys(generate(comboById('deep-sea'), profileById('neon')).chrome).length)` prints `20`,
  and `...generate(...).chrome['statusBar.background']` prints Neon's brightened accent hex. Delete the scratch file
  after.)*

## If it breaks
- **`Property 'tokens' is missing`** anywhere → you're on the M5 shape too early. In M3 `ThemeResult` and `generate`
  are `{ palette, chrome }` only; keep the token lines commented.
- **A key value is `undefined` when applied** → a typo in a palette role name (e.g. `p.surfaceAlt` misspelled). The
  8 role names are load-bearing and must match `types.ts` exactly.
- **`readableOn` not found** → import it from `./color`; it's the only color helper this file needs.

---
> Nav: [← Generative profiles II](05_profiles-generative-2.md) · [Overview](00_overview.md) · [Panel: two dropdowns →](07_panel-selects.md)
