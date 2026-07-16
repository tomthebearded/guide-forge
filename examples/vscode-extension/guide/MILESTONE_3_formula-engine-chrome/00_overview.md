# Milestone M3 — Color-formula engine (chrome)
> Core · milestone 3 of 5 · prev: [M2](../MILESTONE_2_nondestructive-backbone/00_overview.md) · next: [M4](../MILESTONE_4_gallery-and-ux/00_overview.md)

## Goal
Build the **pure color engine** — a `vscode`-free `src/engine/` — that turns a **starter combination** (5 hand-picked
hex colors) plus a **generative profile** (a set of rules) into a full, coordinated **workbench-chrome** palette,
then applies it live through the M2 backbone. By the end, the panel has two dropdowns — pick a combo + a style and
the whole editor's *chrome* (background, sidebar, activity bar, status bar, tabs, panels) recolors coherently, live,
and revertibly.

**Observable end state:** press <kbd>F5</kbd> → open the Live Recolor panel → it now shows a **Starter** dropdown
and a **Style** dropdown → pick **Deep Sea** + **Neon** → every chrome surface recolors at once to a coordinated
dark-teal theme → open your `settings.json` and `workbench.colorCustomizations` now holds **20 keys** → switch the
Style dropdown to **Midnight / OLED** → the background snaps to pure black live → click **Revert** → the prior
palette returns exactly.

## Scope discipline (what this milestone deliberately does NOT do)
- **Chrome only.** We map the palette to `workbench.colorCustomizations` (the surrounding UI) *only*. Syntax and
  semantic **token** colors (`editor.tokenColorCustomizations` / `editor.semanticTokenColorCustomizations`) are
  **M5**. The engine's `ThemeResult` carries `{ palette, chrome }` and nothing else this milestone.
- **No gallery UI, no swatch preview, no contrast readout.** The panel stays two plain `<select>` dropdowns + the
  Apply/Revert/Reset buttons. The rich chip gallery, palette swatches, and the WCAG contrast badge are **M4**.
- **No signature presets.** Only the **9 generative** profiles (seed-derived). The 4 fixed-identity signature
  presets (Game Boy, 16-bit, Synthwave, Terminal) are **M4**.
- **Engine has no `vscode` import.** Everything under `src/engine/` is plain TypeScript — colors are strings in,
  strings out. This is what makes the color math runnable and testable in plain Node (step 01). Enforced, not
  aspirational.
- **Webview HTML stays inline** in the provider (as in M1/M2). Externalizing to `media/webview/` is **M4**.

## Prerequisite
**M2's gate is green.** You have the non-destructive backbone working: clicking the panel's demo button turns the
status bar red *live*, **Revert** restores it, **Reset** removes the key. If any of those is shaky, fix M2 first —
M3's whole apply path rides on it. You still need Node 24 LTS and VS Code 1.128.* (see
[stack.md](../foundation/stack.md)).

## Load-bearing names (must match exactly, everywhere)
| Name | Value | What breaks if it drifts |
|------|-------|--------------------------|
| Engine folder | `src/engine/` (no `vscode` import) | the two-layer boundary; the Node-runnable check |
| Engine files | `color.ts`, `types.ts`, `combos.ts`, `profiles.ts`, `generate.ts` | import paths across the engine and the panel |
| `StyleProfile` fields | `id`, `label`, `family`, `variants?`, `buildPalette` | the registry and the panel both read these |
| `Palette` roles | `bg`, `surface`, `surfaceAlt`, `text`, `textMuted`, `accent1`, `accent2`, `border` | every profile returns these 8 keys; `generate` maps them |
| Combo ids | `deep-sea`, `ember`, `grove`, `orchid`, `graphite` | the dropdown values → `comboById` lookup |
| Profile ids | `neon`, `pastel`, `midnight`, `warm-sepia`, `material`, `nature`, `high-contrast`, `muted`, `monochrome` | the dropdown values → `profileById` lookup |
| Combo hex values | the exact 5 hexes per combo (step 03) | the whole generated palette shifts if they drift |

*(Cosmetic — rename freely: profile display **labels** ("Neon", "Midnight / OLED"…), combo display labels
("Deep Sea"…), the dropdown `<label>` text.)*

## Steps at a glance (grouped into sittings)
**Sitting 1 — The pure color math (01)** — the foundation everything else calls, verified in Node without F5.
1. [Color utilities — hex, HSL, and WCAG contrast](01_color-utils.md)

**Sitting 2 — The data model + the first profiles (02–04)**
2. [The engine's types (`StyleProfile`, `Palette`, …)](02_types.md)
3. [The five starter combos](03_combos.md)
4. [Generative profiles I — `base()` + Neon, Pastel, Midnight](04_profiles-generative-1.md)

**Sitting 3 — The rest of the profiles + the chrome mapping (05–06)**
5. [Generative profiles II — the remaining six](05_profiles-generative-2.md)
6. [Generate — palette → workbench chrome](06_generate.md)

**Sitting 4 — Wire seed + profile into the panel (07)**
7. [Panel: two dropdowns → live chrome](07_panel-selects.md)

**Verify**
8. [Milestone verification + file checkpoint](08_verify.md)

## Design / decisions folded in
- **The engine is pure; the adapter is the only thing that touches VS Code.** All of `src/engine/` is `vscode`-free
  plain TS, so the hardest-to-eyeball part (the color formulas) is unit-testable in plain Node — step 01 ships a
  real, runnable check. → [decision-log.md D3](../foundation/decision-log.md#d3--two-layer-architecture-pure-engine--thin-adapter)
- **New style = new data, not new control flow.** Each profile is one `StyleProfile` object in one array. Adding a
  style is adding an entry — never a new `if`/`switch`. That's why teaching 9 profiles is 9 short patterned
  sections, not 9 new code paths. → [conventions.md](../foundation/conventions.md#data-vs-code) ·
  [decision-log.md D4](../foundation/decision-log.md#d4--all-13-styles-taught-in-full-data-driven)
- **Colors are strings in, strings out.** Hex `#rrggbb` at every boundary; HSL exists **only** inside the math in
  `color.ts` and never leaks into a stored value or a setting. → [conventions.md](../foundation/conventions.md#data-vs-code)
- **Chrome vs. editor settings.** This milestone writes only `workbench.*` keys. That `workbench` vs. `editor` split
  is the same one that later decides what can be language-scoped (chrome can't; tokens can) — introduced here so M5
  doesn't surprise you. → [decision-log.md D2](../foundation/decision-log.md#d2--per-language-scoping-is-tokens-only)

## Done-when gate (aggregated — the real test)
- [ ] The **Node color check** compiles and prints `round-trip #3ec6ff -> #3ec6ff` and `contrast #ffffff/#000000 -> 21`. → step 01
- [ ] `types.ts` + `combos.ts` compile with no errors; `COMBOS` has the 5 combos with the exact hex values. → steps 02–03
- [ ] `profiles.ts` exports `GENERATIVE` with **9** entries and a `profileById` lookup. → step 05
- [ ] `generate(combo, profile)` returns `{ palette, chrome }` where `chrome` has **20** workbench keys. → step 06
- [ ] The panel shows a **Starter** dropdown and a **Style** dropdown; **Deep Sea + Neon** recolors all chrome live. → step 07
- [ ] `settings.json` `workbench.colorCustomizations` now holds 20 keys; switching the Style dropdown **re-applies** live; **Revert** restores the prior palette exactly. → step 08

## Handoff
### Recap
You built the pure color engine — hex/HSL/contrast math, the `StyleProfile` data model, 5 starter combos, 9
generative profiles, and the palette → workbench-chrome mapping — then wired it to the panel through the M2
backbone so a combo + style choice recolors the whole editor chrome live and revertibly.

### Done so far (cumulative)
- A runnable `live-recolor` extension with an Activity-Bar sidebar panel and verified webview↔extension messaging (M1).
- The non-destructive backbone: `theme/settings.ts`, `theme/apply.ts` (`applyChrome`), `theme/history.ts` (snapshot / Revert / Reset), all writes through one path (M2).
- **New in M3:** a pure `src/engine/` (`color.ts`, `types.ts`, `combos.ts`, `profiles.ts`, `generate.ts`) — HSL + WCAG math, 5 combos, 9 generative profiles, and full chrome generation — wired to the panel via two dropdowns.

### Artifacts now in the project
- **Created this milestone:** `src/engine/color.ts`, `src/engine/types.ts`, `src/engine/combos.ts`,
  `src/engine/profiles.ts`, `src/engine/generate.ts`.
- **Modified this milestone:** `src/panel/ThemePanelProvider.ts` (two dropdowns → generated chrome via the history).
- **Unchanged from M2:** `src/extension.ts`, `src/theme/*`, `package.json`, `media/icon.svg`.

### Decisions / open issues
- Engine emits chrome only; `ThemeResult` is `{ palette, chrome }`. M5 extends `types.ts`/`generate.ts` to add
  `tokens`/`semantic` — a deliberate forward reference, flagged in the code with `[M5]` notes so it isn't mistaken
  for missing work.
- The panel dropdown reads `GENERATIVE` (the 9); in M4 it switches to `PROFILES` once the 4 signature presets land.

### Next milestone
**[M4 — Preset gallery + panel UX](../MILESTONE_4_gallery-and-ux/00_overview.md):** replace the two dropdowns with
the full chip gallery (5 combos × 9 generative **+ 4 signature presets**), add a live **swatch preview** and a
**WCAG contrast readout**, and externalize the webview to `media/webview/`. M4 is the *reality-check gate* — the
point you stop and actually use the thing.

---
> Core · milestone 3 of 5 · prev: [M2](../MILESTONE_2_nondestructive-backbone/00_overview.md) · next: [M4](../MILESTONE_4_gallery-and-ux/00_overview.md)
