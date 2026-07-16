# PLAN — Live Recolor: a VS Code extension that recolors the whole editor

> **Stage-1 deliverable** (GuideForge `/plan-guide`). This is the plan the guide will be drafted from — the
> whole guide, in one drafting pass, after approval. It is **not** the guide. Nothing here is scaffolded yet except this file.
>
> **Status: awaiting approval.** On approval → `/scaffold-guide` stamps the skeleton, then `/draft-milestone` drafts the whole guide.

---

## 1. Brief & audience model

### What we're building
A VS Code extension (TypeScript) with a **sidebar panel in the Activity Bar** that generates and instantly
applies a full editor color theme — **workbench chrome AND syntax/semantic tokens** — from a *starter color
combination* + a *visual style preset*. Every apply is **live (no reload)** and **non-destructive (always
revertible)**. The finish line is a packaged `.vsix`.

**Observable end state:** press <kbd>F5</kbd> → Extension Development Host opens → click the extension's
Activity-Bar icon → the sidebar panel appears → pick a starter combo + a style preset → the whole editor
recolors live (background, sidebar, activity bar, status bar, tabs, panels, **and** keywords/strings/
comments/types). The reader can tweak individual colors, see a live palette-swatch preview and a WCAG
contrast readout, **Save** the result as a named set, **export/import** sets as JSON, **scope** a set's token
colors per language, and **Revert** (step back) or **Reset** (remove all customizations). Developed and run
on Windows via F5.

### Audience model (per-topic expertise → explanation-depth policy)

| Topic | Level | Depth policy applied in the guide |
|-------|-------|-----------------------------------|
| TypeScript / JavaScript (the language) | **Intermediate** | One-line reminder + doc link on anything non-obvious; skip fundamentals. No `async`/`interface` tutorials. |
| VS Code Extension API (activation, `contributes` manifest, commands, extension host lifecycle) | **New** | Define on first use + official doc link + a short "New concept" deep-dive callout + extra failure notes. |
| Webview View API (sidebar view, `postMessage`/`onDidReceiveMessage`, `acquireVsCodeApi`, CSP) | **New** | Same as above — full definitions, deep dives, failure notes. |
| Configuration API (`getConfiguration`, `update`, `ConfigurationTarget`) | **New** | Same — this is the load-bearing mechanism; explained thoroughly where it lands. |
| Color theory / palette math (HSL, deriving a palette from a seed, WCAG contrast) | **Beginner** | Define the color model + each formula rule on first use + a brief *why*; doc link. No color-science deep dives. |
| Node.js / npm / packaging (`npx`, `@vscode/vsce`) | **Intermediate** | One-line reminder + link; assume the reader can run npm and read a `package.json`. |

**Granularity: Highly granular / tutorial.** Smallest atomic steps, every sub-action spelled out, nothing
assumed. (This composes with the matrix above: many small steps, but explanation depth is *per topic* — VS Code
API and color math get taught; the language and npm do not.)

### Scope boundaries (out of scope — deliberately)
- Publishing to the Marketplace. **Packaging a `.vsix` is the finish line**; publishing is not.
- File-icon themes and product-icon themes (**colors only**).
- Building a settings-JSON editor UI.
- Multi-window / settings-sync behavior.
- Distributing or contributing a full `.tmTheme`/theme-extension file (we write *customizations*, not a theme extension).

### Hard constraints
- **Windows**, developed and tested via <kbd>F5</kbd> (Extension Development Host). Commands given cross-platform where they differ.
- **Every apply is live** — no window reload, no restart.
- **Every apply is non-destructive** — a snapshot is taken before every write; Revert steps back; Reset removes all customizations.
- **One VS Code engine version pinned guide-wide** (see Verified stack). No version drift between milestones.

### Accepted feature additions (from the advise-back)
- **Live WCAG contrast readout** in the panel (text-on-background ratio, updates as you tweak). Reinforces the
  contrast math the High-Contrast profile already teaches. → built in **M4**.
- **Palette swatch preview** in the sidebar panel (renders the generated palette as color chips before/after
  apply). Makes the formula's output visible, not just the recolored editor. → built in **M4**.

### Acknowledged long-run risks (logged so the *why* survives → `decision-log.md`)
1. **The extension mutates the user's real `settings.json`.** Color customizations are written to actual User
   (or Workspace) settings; during F5 dev that's *your own* editor. **The non-destructive backbone (M2) is the
   mitigation and must be airtight** — snapshot before every apply, Reset deletes the keys (not blank them).
   Load-bearing decision, introduced small on purpose.
2. **`workbench.colorCustomizations` is NOT language-scopable** (verified Phase 0.5). Per-language scoping (feature 9)
   therefore covers **syntax/semantic tokens only**; chrome stays global. Chosen resolution: **implement tokens-only
   scoping and teach the workbench-vs-editor-settings distinction as the reason.**
3. **Semantic tokens can silently do nothing.** They apply only when a language's semantic-tokens provider is
   active *and* the theme opts in. A beginner will think M5 is broken → explicit failure-note in the semantic-token step.
4. **13 styles + 5 combos is a large surface.** Per the reader's choice, **all 13 are taught in full** — mitigated
   structurally by grouping them into *sittings* and sharing one engine (generative profiles are seed-driven; the 4
   signature presets are fixed-identity), so the repetition is bounded and each profile is a short, patterned section.
5. **TypeScript 7.0 shipped 2 days before the stack check** (native compiler). Pinned **TS 5.9.x** to avoid a
   bleeding-edge beginner footgun; noted for a future `/update-stack`.
6. **Engine over-pinning shrinks reach.** The Webview View + color APIs are old/stable, so pinning to current
   stable is a teaching choice, not an API requirement — noted so a reader on an older VS Code can lower the floor.

---

## 2. Verified stack  *(Phase 0.5 — checked 2026-07-10)*

| Tool / library | Pinned version | Latest stable (as of 2026-07-10) | Official docs | Notes (renames, deprecations, install) |
|----------------|----------------|----------------------------------|---------------|----------------------------------------|
| VS Code (engine) | `engines.vscode`: `^1.128.0` | 1.128 (2026-07-08) | https://code.visualstudio.com/updates/v1_128 | Monthly cadence. Webview-View + color APIs stable since 1.49, so a lower floor (`^1.100.0`) works for wider reach; we pin current stable for a consistent teaching target. |
| @types/vscode | `^1.128.0` | 1.128.x | https://www.npmjs.com/package/@types/vscode | Mirrors the VS Code release number. `vsce package` requires `@types/vscode` ≥ `engines.vscode`. |
| Node.js | 24 LTS (e.g. 24.18.0) | Active LTS 24.18.0; Current 26.x | https://nodejs.org/en/about/previous-releases | 20 is EOL (Mar 2026); don't use 26 (not LTS until Oct 2026) for a beginner guide. |
| TypeScript | `^5.9.0` | 7.0.2 (2026-07-08) | https://www.typescriptlang.org/ | **Pin 5.9.x**: TS 7.0 (native compiler) is 2 days old — deliberately avoided here. |
| Scaffolder | `generator-code` via `npx` | generator-code 1.11.x | https://code.visualstudio.com/api/get-started/your-first-extension | Run `npx --package yo --package generator-code -- yo code` (no global install). Officially recommended path. |
| Packaging CLI | `@vscode/vsce` (dev dep / npx) | `@vscode/vsce` | https://code.visualstudio.com/api/working-with-extensions/publishing-extension | **RENAME:** package is `@vscode/vsce` (bare `vsce` is deprecated); the *command* is still `vsce package`. |
| Test/runtime helpers | `@vscode/test-cli`, `@vscode/test-electron` | current | https://code.visualstudio.com/api/working-with-extensions/testing-extension | The legacy `vscode` npm module is dead — never install it. |

**Key API references the milestones lean on (deep-linked):**
- Your First Extension — https://code.visualstudio.com/api/get-started/your-first-extension
- Webview guide — https://code.visualstudio.com/api/extension-guides/webview
- Contribution Points (`views`, `viewsContainers`, `commands`) — https://code.visualstudio.com/api/references/contribution-points
- VS Code API reference (`window.registerWebviewViewProvider`, `workspace.getConfiguration`, `ConfigurationTarget`) — https://code.visualstudio.com/api/references/vscode-api
- Themes (the three color-customization settings) — https://code.visualstudio.com/docs/configure/themes
- Theme Color reference (workbench color keys) — https://code.visualstudio.com/api/references/theme-color
- Settings + language overrides — https://code.visualstudio.com/docs/getstarted/settings

**Verified API facts that steps must honor (exact spelling — load-bearing):**
- Register the sidebar UI with **`vscode.window.registerWebviewViewProvider(viewId, provider)`**; the provider
  implements **`WebviewViewProvider.resolveWebviewView(webviewView, context, token)`**.
- The `contributes.views` entry **must include `"type": "webview"`** and the webview **must set
  `webview.options = { enableScripts: true }`** — the two top "nothing happens" traps.
- Manifest keys: **`contributes.viewsContainers.activitybar`** (`{ id, title, icon }`) + **`contributes.views`**
  (keyed by container id; `{ id, name, type: "webview" }`).
- Messaging: extension→webview `webviewView.webview.postMessage(data)`; webview→extension
  `webviewView.webview.onDidReceiveMessage(handler)`; in the webview script `const vscode = acquireVsCodeApi()`
  (callable **once**), then `vscode.postMessage(data)`.
- The three settings (exact IDs): **`workbench.colorCustomizations`**, **`editor.tokenColorCustomizations`**,
  **`editor.semanticTokenColorCustomizations`**.
- Per-theme scoping inside a customization object uses a **`"[Theme Display Name]"`** key (wildcards `*`,
  multiple `[A][B]` = OR).
- Per-**language** scoping uses a top-level **`"[languageId]"`** key and applies to `editor.*` settings only
  (tokens), **not** `workbench.colorCustomizations`.
- Write settings with **`vscode.workspace.getConfiguration().update(section, value, ConfigurationTarget.Global)`**
  (`Global = 1`, `Workspace = 2`); `await` it; changes apply **live**. Observe external edits with
  `vscode.workspace.onDidChangeConfiguration`.

---

## 3. Foundation docs (the cross-cutting layer — `/scaffold-guide` stamps these)

- **README** (guide front door) — objective/end state, one-line stack summary, the headline decisions
  (non-destructive backbone; write-to-settings mechanism; tokens-only language scoping), an **Updates** log, and a
  "**Following this guide**" note (type the code, don't paste; the complete files are a reference to diff against).
  Links to the detail docs; does not duplicate them.
- **`foundation/stack.md`** — the Verified-stack table above + the pinned engine + the API-facts list. Every
  milestone imports versions and identifier spellings from here.
- **`foundation/audience.md`** — the per-topic matrix + Highly-granular setting, as the guide's north star.
- **`foundation/conventions.md`** — code/architecture rules (see below) referenced everywhere so no step re-argues them.
- **`foundation/glossary.md`** — running plain-language definitions (Activity Bar, View Container, Webview View,
  workbench color key, TextMate scope, semantic token, `ConfigurationTarget`, HSL, WCAG contrast ratio, seed color,
  style profile, signature preset, custom set, snapshot/Revert/Reset). Grows as milestones introduce terms.
- **`foundation/status.md`** — the single source of truth for what is actually built and **verified** (vs. what the
  guide intends). Only this file states reality. Reconciled after every milestone.
- **`foundation/decision-log.md`** — non-obvious choices + rationale, seeded with the 6 acknowledged risks above.

### Conventions the code will follow (`conventions.md`)
- **Two-layer architecture:** a **pure engine** (`src/engine/`, no `vscode` import — plain TS: color math + profiles)
  and a **thin VS Code adapter** (`src/extension.ts`, `src/panel/`, `src/theme/apply.ts` — everything that touches the
  API). The engine is testable without VS Code; the adapter is where side effects live.
- **One write path.** All settings writes go through a single `applyTheme(customizations)` / `snapshot()` module in
  `src/theme/`. No step writes `workbench.colorCustomizations` ad hoc — this is what keeps "non-destructive" honest.
- **Data-driven profiles.** Each of the 13 styles is a `StyleProfile` object (rules/values), collected in one
  registry. Generative profiles are seed-driven functions; signature presets are fixed palettes. Adding a style =
  adding one data entry, not new control flow.
- **Colors are strings in, strings out.** Hex `#RRGGBB(AA)` at the boundary; HSL only inside the engine.
- **Load-bearing names** (must match exactly, flagged at first use): the view container id, the view id, the three
  settings IDs, the command ids, the `StyleProfile` field names. **Cosmetic** (free to rename): profile display
  labels, the extension display name, swatch CSS classes.
- **Naming:** `camelCase` identifiers, `kebab-case` command ids under one publisher prefix, `PascalCase` types.

---

## 4. Milestone ladder

Order is strict-by-dependency; every milestone is a runnable vertical slice with an observable **Done-when** gate.
The **reality-check gate is M4** — the first point the extension is genuinely usable end-to-end.

| # | Milestone | Proves (end state) | Depends on | Done-when (one line) |
|---|-----------|--------------------|------------|----------------------|
| **M1** | Scaffold + sidebar panel | An installed extension shows a Webview panel in the Activity Bar and can round-trip a message | — | F5 → Activity-Bar icon → panel renders; a button click logs a message received by the extension host |
| **M2** | Non-destructive backbone | One workbench color applies live; snapshot + Revert + Reset work | M1 | Click "make status bar red" → it changes live; **Revert** restores exactly; **Reset** removes the customization entirely |
| **M3** | Color-formula engine (chrome) | A seed color → a full coordinated **chrome** palette, via any of the **9 generative profiles**, applied live | M2 | Pick a starter combo + a generative profile → all chrome recolors coherently and live; Revert restores |
| **M4** ⭐ *reality-check gate* | Preset gallery + panel UX | The full gallery (5 combos × 9 generative + **4 signature presets**) → full chrome theme live, with **swatch preview** + **contrast readout**, Revert/Reset | M3 | Every combo/style in the gallery yields a coherent live chrome theme; swatches + contrast ratio show; **stop and actually use it** |
| **M5** | Tokens, persistence, packaging | Syntax + semantic tokens recolor too; **Save** named sets; **import/export** JSON; **per-language token scoping**; a built **`.vsix`** | M4 | Tokens recolor; a saved set survives reload; export→import round-trips; a language-scoped token set applies to one language only; `vsce package` emits `live-recolor-x.y.z.vsix` |

### Sittings (natural pause points inside the big milestones)
- **M3** — (a) color utilities: hex↔HSL, lighten/darken, mix, contrast ratio; (b) the `StyleProfile` type + registry
  + 2–3 generative profiles taught in full; (c) the remaining generative profiles as patterned data entries; (d) wire
  seed+profile → chrome palette → live apply.
- **M4** — (a) the gallery data + Webview layout (combos, profile cards); (b) swatch-preview rendering; (c) contrast
  readout; (d) the 4 signature presets (fixed-identity path); (e) **reality-check**: use it for real, decide it's worth finishing.
- **M5** — (a) extend the engine to emit `editor.tokenColorCustomizations` (TextMate) for all profiles; (b) semantic
  token customizations + the "silently does nothing" failure-note; (c) Save/list custom sets via `globalState`; (d)
  export/import JSON; (e) per-language token scoping (+ teach the workbench-vs-editor limit); (f) package the `.vsix`.

---

## 5. Templates

### Per-step template (Highly-granular tuning)
```
# <Milestone> · Step NN of <TOTAL> — <single action title>
> Nav: [← prev](PREV.md) · [Milestone overview](00_overview.md) · [next →](NEXT.md)   ← MUST be line 2, no blank line under the H1

## Glossary for this step        (only terms THIS step introduces; omit if none)
## Why / design                  (the rationale the reader needs; omit only if pure mechanics)
## Do this                       (numbered atomic actions — every sub-action spelled out; each says WHERE + WHAT + WHY)
## Code                          (complete file(s), never partial snippets; omit if no code this step)
## Done when (this step)         (the sub-slice of the milestone gate this step satisfies, with the EXACT observable result)
## If it breaks                  (the most likely error + first thing to check)
```

### Milestone-overview template (`00_overview.md`)
```
# <Milestone N> — <title>
Goal · Scope discipline (what this milestone deliberately does NOT do) · Prerequisite (prior gate green) ·
Steps-at-a-glance (grouped into the sittings above) · Design/decisions folded in ·
Done-when gate (aggregated, observable) · Handoff (what now exists · open issues · pointer to next milestone)
```

---

## 6. Writing contract

### Pedagogical rules (every step must satisfy these)
1. **Explain every concept on first use at its topic's depth** — VS Code API + Webview + Config API + color math get
   defined inline or in a "New concept" callout on its own line above the line it lands on, with an official doc link;
   TS/JS and npm get at most a one-line reminder. Never a bare unfamiliar term with no gloss and no link.
2. **Every action says WHERE** — which file / manifest key / Activity-Bar icon / command palette entry / panel control.
3. **Every action says WHAT it does and WHY** — the reader finishes understanding the mechanism, not just the keystrokes.
4. **Be exact where outcome depends on it** — concrete hex values, exact setting IDs, exact command ids; say so where a value is free.
5. **Separate MANDATORY from ILLUSTRATIVE** — what the gate requires vs. an example/embellishment.
6. **State which fields to change and which to LEAVE AT DEFAULT** — exhaustive for the `package.json`/manifest edits so the reader never wonders what else to touch.
7. **Teach the recurring mental models at point of use** — (a) *snapshot-before-write → everything is revertible*;
   (b) *engine is pure, the adapter is the only thing that touches VS Code*; (c) *chrome vs. editor settings decides what can be language-scoped*.
8. **Flag load-bearing names vs cosmetic** before the reader types (per `conventions.md`).
9. **Sequences are numbered lists, never arrow-chains** — arrows only for a single navigation path within one action.
10. **Name the common failure + its usual cause** — e.g. missing `"type": "webview"`, missing `enableScripts`, forgetting to `await config.update`, semantic tokens appearing to do nothing.

### Verification design (Phase 5)
- **Every gate shows expected output** — not "it works" but the exact observable: the panel HTML rendered, the status
  bar turned `#…`, the console line printed, the `.vsix` filename emitted, the settings.json diff.
- **Consistency check before ship** — every code block uses the pinned versions from `stack.md`; every load-bearing
  name (view ids, settings IDs, command ids, `StyleProfile` fields) is spelled identically wherever it recurs.
- **Engine unit-testability** — because `src/engine/` has no `vscode` import, the color-math steps include a tiny
  Node-runnable check (hex↔HSL round-trip, contrast ratio of a known pair) so the reader verifies the math *without* F5.
- **Troubleshooting sheet** — the first-timer traps: silent webview, no scripts, `ConfigurationTarget.Workspace`
  throwing with no folder open, semantic tokens no-op, `@vscode/vsce` vs `vsce`, engine/`@types` mismatch.
- **Reconcile-before-follow** — if followed against a VS Code that has drifted (renamed key, new engine), **reality
  wins**: patch the step and log the drift in `status.md`. (`/review-before-follow` + `/update-stack` support this.)

---

## 7. Folder / file layout (canonical skeleton — filled with real slugs)

```
examples/vscode-extension/
  guide/
    PLAN.md                           ← THIS FILE (the only thing written now)
    README.md                         ← front door (scaffold)
    TOKEN_USAGE.md                    ← the one cost ledger (metered by the hook; scaffold seeds row 1 from the cost line below)
    feedback-log.md                   ← reader-friction log (scaffold)
    foundation/
      stack.md  audience.md  conventions.md  glossary.md  status.md  decision-log.md
    MILESTONE_1_scaffold-sidebar/     00_overview.md … NN_verify.md
    MILESTONE_2_nondestructive-backbone/
    MILESTONE_3_formula-engine-chrome/
    MILESTONE_4_gallery-and-ux/
    MILESTONE_5_tokens-persistence-packaging/
```

The extension source the guide builds (created *inside* the steps, not scaffolded now) will live under the reader's
own workspace, structured per `conventions.md`:
```
live-recolor/
  package.json  tsconfig.json  .vscodeignore
  src/
    extension.ts                    ← activation + provider registration + command wiring (adapter)
    panel/  (provider + webview html/js/css)
    theme/  (apply.ts, snapshot.ts — the single write path)
    engine/ (color.ts, profiles/, presets/, types.ts — pure, no vscode import)
```

---

## 8. First move

`/draft-milestone` drafts the **whole guide in one pass** — every milestone M1→M5 in ladder order, back-to-back —
so you have the finished guide before you build. Once it's drafted I reconcile `status.md` + the README Updates log +
`examples/README.md` and run a dead-link check. You then follow the guide, building each milestone and verifying its
Done-when gate as you go (M1's F5 gate is the first checkpoint).

**Do not draft yet.** This plan is the deliverable. Next steps in order:
1. You approve (or adjust) this plan.
2. `/scaffold-guide` stamps the README + 5 foundation docs + milestone overview placeholders.
3. `/draft-milestone` drafts the whole guide (M1→M5).
