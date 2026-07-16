# M2 · Step 02 of 6 — Write the one apply function (`applyChrome`)
> Nav: [← Settings descriptors](01_settings.md) · [Overview](00_overview.md) · [History →](03_history.md)

## Why / design
This is the **only** function in the whole guide that writes `workbench.colorCustomizations`. Everything that wants
to recolor chrome — the M2 demo button, M3's generated palettes, M5's saved sets — calls `applyChrome`. One writer
means one place to reason about, and (next step) one place to snapshot before. That's the "single write path"
convention made concrete.

The function takes a plain object mapping workbench color keys to hex strings — e.g.
`{ 'statusBar.background': '#e11d48' }` — and writes it. It writes the **whole** object (it replaces, it doesn't
merge): whatever you pass becomes the entire `workbench.colorCustomizations` value. That's exactly why the snapshot
in step 03 matters — replacing is destructive on its own, and the snapshot is what makes it reversible.

> 🧠 **New concept — `getConfiguration` + `update` (the Configuration API).** `vscode.workspace.getConfiguration(section)`
> returns a config object scoped to that section (here `'workbench'`). Calling `.update(key, value, target)` on it
> writes `value` into `settings.json` at `section.key` — for us, `workbench.colorCustomizations`. Two things to
> internalize: **(1) it's async** — it returns a `Promise`, so you must `await` it before assuming the value landed;
> **(2) the write applies live** — VS Code re-renders the affected UI immediately, no reload. Docs:
> [workspace.getConfiguration](https://code.visualstudio.com/api/references/vscode-api#workspace.getConfiguration)
> and [WorkspaceConfiguration.update](https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration).
>
> ⚠️ **Failure note.** Forgetting to `await config.update(...)` is the classic bug: the code continues before the
> write commits, so a snapshot taken "after" can capture the *old* value, or a follow-up read races the write. Every
> `.update(...)` in this guide is `await`ed.

## Do this
This step creates **one file**: `src/theme/apply.ts`.

1. Create the file **`src/theme/apply.ts`** (next to `settings.ts`).
2. Paste the code below. Notes:
   - It imports **only** `CHROME` and `TARGET` from `./settings` — this M2 version writes chrome only.
   - `applyChrome` is `async` and returns `Promise<void>`; callers `await` it.
   - The parameter type is `Record<string, string>` — an object of workbench-color-key → hex. *(TS reminder —
     `Record<K, V>` is just "an object with keys of type K and values of type V".)*
3. Save.

> 📌 **This is the M2 version of `apply.ts`.** The locked source grows this file in M5 with `applyTokens`,
> `applySemantic`, and a combined `applyTheme` (plus per-language scoping). **Do not add those now** — they import
> types from `src/engine/`, which doesn't exist until M3. M2 is `applyChrome` and nothing else.

**Load-bearing:** the function name `applyChrome` (imported by the provider in step 05) and that it writes through
`CHROME` + `TARGET` from `settings.ts` — not a hard-coded `'workbench'`/`'colorCustomizations'`.

## Code
`src/theme/apply.ts`
```ts
import * as vscode from 'vscode';
import { CHROME, TARGET } from './settings';

export async function applyChrome(chrome: Record<string, string>): Promise<void> {
  await vscode.workspace.getConfiguration(CHROME.section).update(CHROME.key, chrome, TARGET);
}
```

## Done when (this step)
- `src/theme/apply.ts` exists with the code above and compiles with no errors.
- Still nothing observable in the editor — no one calls `applyChrome` yet (the history wraps it in step 03; the
  button triggers it in step 05).

## If it breaks
- **`Cannot find name 'CHROME'` / `Module '"./settings"' has no exported member 'CHROME'`** → step 01 wasn't saved, or
  the import path is wrong. It must be `./settings` (same folder, no `.ts`).
- **`Property 'update' does not exist`** → you called `.update` on something other than the result of
  `getConfiguration(...)`; check the chain reads `getConfiguration(CHROME.section).update(...)`.
- **ESLint flags `await` as unnecessary** → it isn't; `update` returns a `Thenable`. Keep the `await` — the failure
  note above explains why.

---
> Nav: [← Settings descriptors](01_settings.md) · [Overview](00_overview.md) · [History →](03_history.md)
