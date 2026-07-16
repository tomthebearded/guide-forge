# Milestone M2 — Non-destructive backbone
> Core · milestone 2 of 5 · prev: [M1](../MILESTONE_1_scaffold-sidebar/00_overview.md) · next: [M3](../MILESTONE_3_formula-engine-chrome/00_overview.md)

## Goal
Make the panel's button *do* something real — apply **one** workbench color live — but only on top of the safety
net that makes every write reversible. You build the **single write path** (`src/theme/`): a place that names the
settings, one function that writes them, and a **history** that snapshots before every write. Then you wire the
panel to it with three buttons: **Apply demo** (turns the status bar crimson), **Revert**, **Reset**.

**Observable end state:** press <kbd>F5</kbd> → open the Live Recolor panel → click **Apply demo** → the status
bar turns `#e11d48` with white text **live, no reload**, and your User `settings.json` grows a
`"workbench.colorCustomizations"` block. Click **Revert** → the status bar returns to exactly its prior state.
Click **Reset** → the whole `workbench.colorCustomizations` key vanishes from `settings.json`.

## Scope discipline (what this milestone deliberately does NOT do)
- **One hard-coded color only.** `#e11d48` on the status bar. **No seed→palette generation** — that's **M3**.
- **No gallery, selects, swatches, or contrast readout** — that's **M3/M4**. M2's UI is exactly three buttons.
- **No tokens, persistence, import/export, or packaging** — that's **M5**.
- **No ad-hoc writes.** Every settings write in this guide, from here on, goes through the single `src/theme/`
  path. No step ever calls `getConfiguration().update('colorCustomizations', …)` anywhere else. → [conventions.md](../foundation/conventions.md#structure--architecture)
- **The engine (`src/engine/`) still does not exist.** M2 is pure adapter — `theme/` + the panel. The `vscode`-free
  engine arrives in **M3**.

## Prerequisite
**M1 green.** You need the runnable `live-recolor` extension from M1: the Activity-Bar panel renders and the
webview→extension message channel works (M1's step-10 gate). If F5 doesn't open a panel yet, finish
[M1](../MILESTONE_1_scaffold-sidebar/00_overview.md) first.

## Load-bearing names (must match exactly, everywhere)
| Name | Value | What breaks if it drifts |
|------|-------|--------------------------|
| Setting ID (chrome) | `workbench.colorCustomizations` | the one setting M2 writes; snapshot/restore/reset all target it |
| Config split (in `settings.ts`) | `CHROME = { section: 'workbench', key: 'colorCustomizations' }` | `getConfiguration(section).update(key, …)` needs both halves; a wrong split writes to the wrong place |
| Write target | `ConfigurationTarget.Global` (exported as `TARGET`) | writes land in User settings; `Workspace` throws with no folder open |
| Demo hexes | `#e11d48` (background) · `#ffffff` (foreground) | the verify gate checks these exact values in `settings.json` |
| Message types | `applyDemo` · `revert` · `reset` | the webview posts these; `onMessage`'s `switch` reads them — a typo = a dead button |
| Files (the write path) | `src/theme/settings.ts` · `src/theme/apply.ts` · `src/theme/history.ts` | import paths in `extension.ts` and the provider |
| Provider constructor | `new ThemePanelProvider(history)` | the provider now takes the shared `ThemeHistory`; the M1 no-arg form no longer compiles |

*(Cosmetic — rename freely: the button labels, the `<h3>` text, the `Snapshot` interface name.)*

## Steps at a glance (grouped into sittings)
**Sitting 1 — The single write path `src/theme/` (01–03)** — build the backbone before any UI touches it.
1. [Create the settings descriptors](01_settings.md)
2. [Write the one apply function (`applyChrome`)](02_apply.md)
3. [Build the snapshot history (Revert / Reset)](03_history.md)

**Sitting 2 — Wire it to the panel (04–05)**
4. [Instantiate the history at activation](04_wire-extension.md)
5. [Panel buttons — Apply demo / Revert / Reset](05_panel-buttons.md)

**Verify**
6. [Milestone verification + file checkpoint](06_verify.md)

## Design / decisions folded in
- **The non-destructive backbone is load-bearing, and it's built first.** Every apply snapshots the prior settings
  *before* writing; Revert steps back through snapshots; Reset **deletes** the keys (never blanks them). It's
  introduced *small* — one color — on purpose, so the mechanism is airtight before any generator can produce a bad
  palette. → [decision-log.md](../foundation/decision-log.md#d1--non-destructive-backbone-is-load-bearing)
- **One write path, one choke point.** All three settings live in `settings.ts`; the only function that writes them
  is `applyChrome`; the only thing that decides *when* to snapshot is `ThemeHistory`. That single chokepoint is what
  keeps "non-destructive" honest. → [conventions.md](../foundation/conventions.md#structure--architecture)
- **`ConfigurationTarget.Global` everywhere.** Writes go to User settings (all workspaces). `Workspace` scope throws
  when no folder is open — a first-timer trap we sidestep guide-wide. → [stack.md](../foundation/stack.md#verified-api-facts-steps-must-honor-exact-spelling--load-bearing)
- **`settings.ts` names all three settings now, uses one.** `TOKENS` and `SEMANTIC` descriptors are written in M2 but
  not touched until M5. They're harmless constants — leaving them in avoids editing this file twice.

## Done-when gate (aggregated — the real test)
Each check pairs an action with the **exact** observable result. Full walkthrough + settings.json diffs in [step 06](06_verify.md).
- [ ] The three files exist and compile: `src/theme/settings.ts`, `src/theme/apply.ts`, `src/theme/history.ts`. → steps 01–03
- [ ] `src/extension.ts` creates one `ThemeHistory` and passes it into `new ThemePanelProvider(history)`; the project compiles with no errors. → steps 04–05
- [ ] <kbd>F5</kbd> → the Live Recolor panel shows three buttons: **Apply demo (red status bar)**, **Revert**, **Reset**. → step 05
- [ ] Click **Apply demo** → the EDH's status bar turns `#e11d48` (crimson) with `#ffffff` text **live**, and its User `settings.json` gains `"workbench.colorCustomizations": { "statusBar.background": "#e11d48", "statusBar.foreground": "#ffffff" }`. → step 06
- [ ] Click **Revert** → the status bar returns to exactly its prior state; the key returns to its prior value (or is removed if you had none before). → step 06
- [ ] Click **Reset** → the entire `"workbench.colorCustomizations"` key is **removed** from `settings.json` (not left as `{}`). → step 06

## Handoff
### Recap
You built the single write path — a settings module, one apply function, and a snapshot history — then wired the
panel's three buttons to it. One workbench color now applies live and is fully reversible.

### Done so far (cumulative)
- A runnable `live-recolor` extension with a sidebar Webview panel and a working webview↔extension message channel. *(M1)*
- The **non-destructive write backbone** (`src/theme/settings.ts` + `apply.ts` + `history.ts`): snapshot-before-write,
  Revert, Reset — the single settings write path. *(M2)*
- A panel that **applies / reverts / resets one workbench color** live. *(M2)*

### Artifacts now in the project
- Added by us: `src/theme/settings.ts`, `src/theme/apply.ts`, `src/theme/history.ts`.
- Modified by us: `src/extension.ts` (creates + injects `ThemeHistory`), `src/panel/ThemePanelProvider.ts` (three
  demo buttons + `onMessage`).
- Unchanged since M1: `package.json` (no new contributions — the buttons live in the webview), `media/icon.svg`, and
  all generator files (`tsconfig.json`, `.vscode/`, ESLint, `src/test/`, `.vscodeignore`, `.gitignore`).

### Decisions / open issues
- `applyChrome` writes the **entire** `colorCustomizations` object (it replaces, not merges). That's fine here — the
  demo is the only writer and the snapshot captures whatever was there first. M3's generator will produce the full
  object, so this stays correct.
- `settings.ts` already exports `TOKENS` and `SEMANTIC`; they're dormant until M5.
- The webview HTML is still inline (externalized in M4).

### Next milestone
**[M3 — Color-formula engine (chrome)](../MILESTONE_3_formula-engine-chrome/00_overview.md):** replace the one
hard-coded color with a real engine — a seed color + a style profile derive a whole coordinated **chrome** palette,
applied live through this exact backbone. Done-when: pick a starter combo + a generative profile → all chrome
recolors coherently and live; Revert restores.

---
> Core · milestone 2 of 5 · prev: [M1](../MILESTONE_1_scaffold-sidebar/00_overview.md) · next: [M3](../MILESTONE_3_formula-engine-chrome/00_overview.md)
