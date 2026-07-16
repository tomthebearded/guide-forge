# Milestone M4 — Preset gallery + panel UX  ⭐ reality-check gate
> Core · milestone 4 of 5 · prev: [M3](../MILESTONE_3_formula-engine-chrome/00_overview.md) · next: [M5](../MILESTONE_5_tokens-persistence-packaging/00_overview.md)

## Goal
Turn the two bare dropdowns from M3 into the **full preset gallery** and make the panel something you'd actually
keep open. Concretely: add the **4 signature presets** (Game Boy, 16-bit, Synthwave, Terminal) to the engine so
the gallery is **5 starter combos × 9 generative profiles + 4 signature presets = 13 styles**; move the webview
out of the provider string into real **`media/webview/main.js` + `styles.css`** files; render combos and styles
as clickable **chips**; and add the two accepted UX extras — a **palette swatch preview** and a **live WCAG
contrast readout**. Revert/Reset stay wired throughout. Still **chrome only**.

**Observable end state:** press <kbd>F5</kbd> → open the Live Recolor panel → it shows a row of **combo chips**
and a row of **13 style chips**. Click **Deep Sea** then **Neon** → the whole editor chrome recolors live, an
**8-swatch strip** appears, and a badge reads something like `text/bg contrast 12.3:1 AAA`. Click **Game Boy** →
the green DMG palette applies and a **variant row** (dmg / pocket / light) appears. **Revert** steps back through
your picks; **Reset** removes all customizations.

This is the **⭐ reality-check gate** — the first point the extension is genuinely usable. Step 06 tells you to
**stop building and actually use it** for a while, then decide it's worth finishing before M5.

## Scope discipline (what this milestone deliberately does NOT do)
Still **chrome only** — the same boundary M3 drew.
- **No syntax/semantic tokens.** The gallery recolors `workbench.colorCustomizations` only; recoloring the code
  text (`editor.tokenColorCustomizations` / `editor.semanticTokenColorCustomizations`) is **M5**.
- **No Save / import / export.** The panel applies live but persists nothing; named sets and JSON round-trips are **M5**.
- **No per-language scoping.** One theme for everything; the per-language token input is **M5**.
- **No packaging.** No `publisher` field, no `.vsix` — that's **M5**.
- The externalized `media/webview/main.js` we write here is the **M4 subset**: combos + styles + variant + preview
  + Revert/Reset only. It grows a language input, Save/Export/Import, and a saved-sets list in **M5**. (Recorded
  here so the smaller file isn't mistaken for drift.)

## Prerequisite
**M3 green.** You have the pure engine (`src/engine/color.ts`, `types.ts`, `combos.ts`, `profiles.ts` with the
**9 generative** profiles, `generate.ts`), the write path (`src/theme/settings.ts`, `apply.ts`, `history.ts`),
and a provider whose two inline `<select>`s already apply a generated chrome palette live with Revert/Reset. If
picking a combo + a generative style in M3 didn't recolor the chrome, fix M3 first — M4 builds directly on it.

## Load-bearing names (must match exactly, everywhere)
| Name | Value | What breaks if it drifts |
|------|-------|--------------------------|
| Webview script file | `media/webview/main.js` | `asWebviewUri` path in the provider; the `<script src>` |
| Webview style file | `media/webview/styles.css` | `asWebviewUri` path; the `<link href>` |
| Local resource root | `media` (under `extensionUri`) | webview can't load `main.js`/`styles.css` if the root doesn't cover them |
| Signature profile ids | `game-boy`, `sixteen-bit`, `synthwave`, `terminal` | `profileById` lookups; the chip you click |
| Signature variants | `dmg` / `pocket` / `light` (game-boy), `green` / `amber` (terminal) | the variant chips + `buildPalette` branch |
| Message types | `ready`, `init`, `apply`, `applied`, `revert`, `reset` | the webview⇄extension protocol; a typo silently drops a message |
| `StyleProfile.family` | `'generative' \| 'signature'` | already fixed in M3's `types.ts`; the `init` payload forwards it |

*(Cosmetic — rename freely: the signature display labels "Game Boy" / "16-bit" / "Synthwave" / "Terminal / CRT",
the section headings "Starter combination" / "Style" / "Variant", every swatch/chip/badge CSS class, the fixed hex
values inside each signature palette.)*

## Steps at a glance (grouped into sittings)
**Sitting 1 — Finish the gallery's data (01)**
1. [Add the 4 signature presets to the engine](01_signature-profiles.md)

**Sitting 2 — Externalize the webview (02–05)**
2. [Create `media/webview/styles.css`](02_styles.md)
3. [Create `media/webview/main.js` — the gallery + preview + contrast](03_main-js.md)
4. [Rewrite the provider to serve external files + post `init`/`applied`](04_provider-externalize.md)
5. [Wire `extensionUri` into the provider from `extension.ts`](05_wire-extension.md)

**Verify + reality check**
6. [Milestone verification, file checkpoint, and the ⭐ reality check](06_verify.md)

## Design / decisions folded in
- **Signature presets are fixed-identity, not seed-derived.** The 4 signature styles ignore the starter combo and
  return a hand-picked palette (that's what makes Game Boy *look like* a Game Boy). Same `StyleProfile` shape as the
  9 generative ones, so they slot into the one registry — **new style = new data, not new control flow.**
  → [conventions.md](../foundation/conventions.md#data-vs-code), [decision-log.md](../foundation/decision-log.md#d4--all-13-styles-taught-in-full-data-driven)
- **Webview assets live in `media/`, not `src/`.** The generator's `.vscodeignore` drops `src/**` from the package;
  files under `media/` survive into the `.vsix`. Externalizing now (not in M5) keeps the M5 packaging step trap-free.
  → [conventions.md](../foundation/conventions.md#structure--architecture)
- **Data-driven, init-first rendering.** The provider owns the truth (which combos/profiles exist) and *pushes* it
  to the webview as an `init` message; the webview renders whatever it's told. Adding style #14 later never touches
  `main.js`. → this milestone's steps 03–04.
- **Enforced-on-select apply.** Clicking any chip applies immediately (no separate "Apply" button) — the reality
  check depends on the panel feeling instant. → step 03.

## Done-when gate (aggregated — the real test)
- [ ] `src/engine/profiles.ts` exports **13** profiles; `PROFILES.length === 13` (verified by the Node check in step 01). → step 01
- [ ] `media/webview/styles.css` and `media/webview/main.js` exist under `media/webview/`. → steps 02–03
- [ ] Opening the panel shows a row of **combo chips** and a row of **13 style chips** (no dropdowns). → steps 03–04
- [ ] Picking **Deep Sea + Neon** recolors the chrome live, shows an **8-swatch strip**, and a badge like
      `text/bg contrast 12.3:1 AAA`. → steps 03–04
- [ ] Picking **Game Boy** applies the green DMG palette and shows a **variant row** (dmg / pocket / light);
      switching to **light** re-applies live. → steps 01, 03
- [ ] **Revert** steps back one pick at a time; **Reset** removes all customizations. → step 04
- [ ] **⭐ Reality check:** you used it as your editor for a while and decided it's worth finishing. → step 06

## Handoff
### Recap
You completed the engine's style registry (13 profiles), lifted the webview into real `media/webview/` files, and
gave the panel a chip gallery, a live palette swatch preview, and a WCAG contrast readout — all still chrome-only,
all still non-destructive.

### Done so far (cumulative)
- A runnable extension with an Activity-Bar sidebar panel and a verified messaging channel (M1).
- A non-destructive backbone — snapshot before every apply, Revert steps back, Reset clears (M2).
- A pure, `vscode`-free engine: color math, 5 starter combos, and **13** style profiles (9 generative + 4
  signature), with `generate()` producing a full **chrome** palette (M3 + M4).
- An **externalized, data-driven gallery UI**: combo + style + variant chips, an 8-swatch preview, and a live
  contrast badge, applied on select with Revert/Reset (M4).

### Artifacts now in the project
- **New this milestone:** `media/webview/styles.css`, `media/webview/main.js`.
- **Modified this milestone:** `src/engine/profiles.ts` (added `SIGNATURE` + `fixed()`, `PROFILES` now all 13),
  `src/panel/ThemePanelProvider.ts` (externalized, posts `init`/`applied`), `src/extension.ts` (passes
  `extensionUri`).
- **Unchanged from earlier milestones:** the rest of `src/engine/*`, all of `src/theme/*`, `package.json`,
  `media/icon.svg`.

### Decisions / open issues
- The apply is still `applyChrome(theme.chrome)` — tokens are intentionally not touched yet.
- The provider constructor is now `(extensionUri, history)`; M5 adds `context` (for `globalState`) to make it
  `(extensionUri, context, history)`.

### Next milestone
**[M5 — Tokens, persistence, packaging](../MILESTONE_5_tokens-persistence-packaging/00_overview.md):** recolor the
code text too (syntax + semantic tokens), **Save** named sets that survive reload, **export/import** as JSON,
**scope tokens per language**, and build the shippable **`.vsix`**. Done-when: tokens recolor, a saved set
survives a reload, export→import round-trips, a language-scoped set touches one language only, and `vsce package`
emits `live-recolor-0.0.1.vsix`.

---
> Core · milestone 4 of 5 · prev: [M3](../MILESTONE_3_formula-engine-chrome/00_overview.md) · next: [M5](../MILESTONE_5_tokens-persistence-packaging/00_overview.md)
