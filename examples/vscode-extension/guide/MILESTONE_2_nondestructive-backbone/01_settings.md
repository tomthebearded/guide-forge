# M2 · Step 01 of 6 — Create the settings descriptors
> Nav: — · [Overview](00_overview.md) · [Apply function →](02_apply.md)

## Glossary for this step
- **[Chrome (workbench chrome)](../foundation/glossary.md#chrome-workbench-chrome)** — the editor's surrounding UI (title bar, activity bar, sidebar, status bar, tabs, panels), as opposed to the code text; recolored via `workbench.colorCustomizations`.
- **[Workbench color key](../foundation/glossary.md#workbench-color-key)** — one of VS Code's named themeable UI colors (e.g. `statusBar.background`) settable under `workbench.colorCustomizations`.
- **[`ConfigurationTarget`](../foundation/glossary.md#configurationtarget)** — the enum choosing *where* a settings write lands: `Global` (User settings, all workspaces) or `Workspace`/`WorkspaceFolder`.

## Why / design
Before anything writes a setting, we make **one** place that names the settings and the write target. The convention
for this whole guide is **one write path** — all settings writes go through `src/theme/`, and nothing writes
`workbench.colorCustomizations` ad hoc anywhere else (that single choke point is what keeps "non-destructive"
honest). `settings.ts` is the first file of that path: it holds the *descriptors* every other `theme/` file imports.

Each of VS Code's three color settings has a dotted ID like `workbench.colorCustomizations`. The Configuration API
splits that into a **section** (`workbench`) and a **key** (`colorCustomizations`), because you fetch a config
object per section — `getConfiguration('workbench')` — then read/write the key on it. So we store each setting
pre-split into `{ section, key }`, ready for step 02 to consume.

> 🧠 **New concept — `ConfigurationTarget`.** When you write a setting, VS Code needs to know *which* settings file to
> put it in. `ConfigurationTarget.Global` = your **User** settings (applies to every workspace); `.Workspace` = the
> current folder's `.vscode/settings.json`; `.WorkspaceFolder` = a specific folder in a multi-root workspace. This
> guide uses **`Global`** everywhere — we export it once here as `TARGET` so no step hard-codes it. Docs:
> [ConfigurationTarget API](https://code.visualstudio.com/api/references/vscode-api#ConfigurationTarget).
>
> ⚠️ **Failure note.** `ConfigurationTarget.Workspace` **throws** ("Unable to write … No workspace folder open") when
> the window has no folder open. Because we pin `Global`, that trap can't bite us — but if you ever switch a write to
> `Workspace`, open a folder first. Verified against the current API — see [stack.md](../foundation/stack.md#verified-api-facts-steps-must-honor-exact-spelling--load-bearing).

## Do this
**Before you start:** [M1](../MILESTONE_1_scaffold-sidebar/00_overview.md) is green — the `live-recolor` project is open in VS Code and `src/panel/` exists (this step's folder sits beside it). Dependencies are already installed from M1's scaffold.

This step creates **one file**: `src/theme/settings.ts`.

1. In the Explorer, create a folder **`src/theme`** (sibling of `src/panel`), then a file **`src/theme/settings.ts`**.
   This exact path is **load-bearing** — steps 02–04 import from `./settings` / `../theme/settings`.
2. Paste the code below. What each part is for:
   - `CHROME` — the pre-split descriptor for `workbench.colorCustomizations`, the **only** setting M2 writes.
   - `TOKENS` and `SEMANTIC` — descriptors for the *other* two color settings. **We write them now but don't use them
     until M5.** They're harmless `const`s; leaving them in means we don't touch this file again later. (Load-bearing
     later, dormant now — don't delete them.)
   - `TARGET` — `ConfigurationTarget.Global`, exported once so every write in the guide agrees on the target.
3. The `as const` on each descriptor freezes it to its literal string types so TypeScript treats `section`/`key` as
   exact strings, not just `string`. *(TS reminder — `as const` narrows a literal to a readonly, exact-value type.)*
4. Save.

**Load-bearing** in the block below: the three setting IDs (`workbench.colorCustomizations`,
`editor.tokenColorCustomizations`, `editor.semanticTokenColorCustomizations`) split into the exact `section`/`key`
pairs, and `TARGET = ConfigurationTarget.Global`. **Cosmetic:** the constant names `CHROME`/`TOKENS`/`SEMANTIC` (used
only within this project) — but they're referenced by later steps, so if you rename one, rename its every use.

## Code
`src/theme/settings.ts`
```ts
import * as vscode from 'vscode';

// The three setting IDs, split into their config section + key.
export const CHROME = { section: 'workbench', key: 'colorCustomizations' } as const;
export const TOKENS = { section: 'editor', key: 'tokenColorCustomizations' } as const;
export const SEMANTIC = { section: 'editor', key: 'semanticTokenColorCustomizations' } as const;

export const TARGET = vscode.ConfigurationTarget.Global;
```

## Done when (this step)
- `src/theme/settings.ts` exists with the code above.
- It compiles with no red squiggles (the `watch` task, or `npm run compile`, reports no errors).
- Nothing is observable in the editor yet — this file only *declares* constants; step 02 is the first to use them.

## If it breaks
- **`Cannot find module 'vscode'`** → you're editing outside the `live-recolor` project, or dependencies didn't
  install. Run `npm install` in the project root (`@types/vscode` is already a devDependency).
- **Red squiggle on `vscode.ConfigurationTarget.Global`** → a typo in the enum name; it's `ConfigurationTarget`
  (capital C, capital T) with member `Global`. Autocomplete after `vscode.` confirms the spelling.
- **`'TOKENS' is declared but its value is never read`** → that's a lint *hint*, not an error, and it's expected —
  those two are used in M5. Don't delete them.

---
> Nav: — · [Overview](00_overview.md) · [Apply function →](02_apply.md)
