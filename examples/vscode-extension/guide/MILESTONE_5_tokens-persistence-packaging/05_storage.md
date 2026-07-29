# M5 · Step 05 of 10 — Save named sets with `globalState`
> Nav: [← History extend](04_history-extend.md) · [Overview](00_overview.md) · [Final provider →](06_provider-final.md)

## Glossary for this step
- **[Custom set](../foundation/glossary.md#custom-set)** — a user-saved, named theme (the full set of color
  customizations) persisted by the extension and shown in "My sets".

## Why / design
A saved set is **extension data**, not a user color setting — so it does **not** belong in `settings.json`. It
belongs in the extension's own persistent store. That store is `context.globalState`.

> 🧠 **New concept — `context.globalState` (a `Memento`).** Every extension's `activate(context)` receives an
> `ExtensionContext`. Its `globalState` is a **`Memento`**: a tiny key→value store VS Code persists **across window
> reloads and restarts**, scoped to your extension (invisible to the user's settings and to other extensions). Two
> methods: `get<T>(key, default?)` reads (returning `default` when the key is unset), and `update(key, value)`
> writes (returns a `Thenable` — `await` it). Store JSON-serializable values only. It's global (all workspaces);
> `workspaceState` is the per-workspace sibling, which we don't need. Docs:
> [ExtensionContext.globalState](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext) and the
> [Memento API](https://code.visualstudio.com/api/references/vscode-api#Memento).
> **Failure note:** `globalState` only persists what you actually `await update(...)`; a value you forget to write
> is gone on reload. And it stores a *copy* — mutating the array you got from `get` won't persist until you
> `update` it back.

This step creates a new module, `src/storage/sets.ts`, holding the whole set lifecycle: the `SavedSet` shape and
CRUD + import/export functions, all keyed by one constant. It's a thin adapter file (it imports `vscode` for the
type only) — the provider (step 06) calls into it. Keeping storage in its own module means the provider stays
about *messaging*, not persistence.

The `SavedSet` shape stores both the *recipe* (`comboId` / `profileId` / `variant` — enough to reproduce it) **and**
the *frozen output* (`chrome` / `tokens` / `semantic` — so applying a saved set never depends on the engine
producing the same result later). `saveSet` de-dupes by `name` (re-saving a name overwrites). `importSets` merges
incoming sets over existing ones by name and returns how many came in.

## Do this
This step creates **one new file**: `src/storage/sets.ts`.

1. In the Explorer, create a folder **`src/storage`**, then a file **`src/storage/sets.ts`** (this exact path is
   load-bearing — step 06 imports it).
2. Paste the code below.
3. Notes on what's load-bearing:
   - The `globalState` key **`'liveRecolor.savedSets'`** — read and write must use the same constant, or saved
     sets vanish. It's kept in one `const KEY`.
   - The `SavedSet` interface fields — the provider builds this exact shape (step 06) and export/import serialize
     it verbatim.
4. Save.

## Code
`src/storage/sets.ts` (complete, final):
```ts
import * as vscode from 'vscode';
import { ChromeColors, TokenColors, SemanticColors } from '../engine/types';

// A saved creation the user named. comboId+profileId+variant reproduce it; chrome/tokens/semantic are the frozen output.
export interface SavedSet {
  name: string;
  comboId: string;
  profileId: string;
  variant?: string;
  chrome: ChromeColors;
  tokens: TokenColors;
  semantic: SemanticColors;
}

const KEY = 'liveRecolor.savedSets';

export function listSets(ctx: vscode.ExtensionContext): SavedSet[] {
  return ctx.globalState.get<SavedSet[]>(KEY, []);
}

export async function saveSet(ctx: vscode.ExtensionContext, set: SavedSet): Promise<void> {
  const sets = listSets(ctx).filter((s) => s.name !== set.name);
  sets.push(set);
  await ctx.globalState.update(KEY, sets);
}

export async function deleteSet(ctx: vscode.ExtensionContext, name: string): Promise<void> {
  await ctx.globalState.update(KEY, listSets(ctx).filter((s) => s.name !== name));
}

export function exportSets(ctx: vscode.ExtensionContext): string {
  return JSON.stringify(listSets(ctx), null, 2);
}

export async function importSets(ctx: vscode.ExtensionContext, json: string): Promise<number> {
  const incoming = JSON.parse(json) as SavedSet[];
  if (!Array.isArray(incoming)) throw new Error('Expected a JSON array of sets.');
  const byName = new Map(listSets(ctx).map((s) => [s.name, s]));
  for (const s of incoming) byName.set(s.name, s);
  const merged = [...byName.values()];
  await ctx.globalState.update(KEY, merged);
  return incoming.length;
}
```

## Done when (this step)
- `src/storage/sets.ts` exists with the code above and the project compiles clean.
- No behavior yet — the provider (step 06) hasn't called these. Persistence is proven in step 10: save a set,
  reload the window (**Developer: Reload Window**), and it's still under "My sets".

## If it breaks
- **`Cannot find module 'vscode'`** → you created the file outside the `live-recolor` project, or deps aren't
  installed; run `npm install` in the project root.
- **Type error on `ctx.globalState.get<SavedSet[]>(KEY, [])`** → confirm you imported `vscode` and typed the
  parameter as `vscode.ExtensionContext`.
- **(Later) saved sets don't survive reload** → almost always a forgotten `await` on `update`, or reading/writing
  different keys. Everything here funnels through the single `KEY` constant — keep it that way.

---
> Nav: [← History extend](04_history-extend.md) · [Overview](00_overview.md) · [Final provider →](06_provider-final.md)
