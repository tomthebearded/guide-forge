# M2 · Step 03 of 6 — Build the snapshot history (Revert / Reset)
> Nav: [← Apply function](02_apply.md) · [Overview](00_overview.md) · [Wire extension →](04_wire-extension.md)

## Glossary for this step
- **[Snapshot](../foundation/glossary.md#snapshot)** — a saved copy of the color settings taken *before* an apply, so the change can be reverted exactly.

## Why / design
Here's the whole safety net. `ThemeHistory` wraps every write so it's reversible. The mental model — the one that
recurs through the entire guide — is **snapshot-before-write → everything is revertible**:

1. Before applying anything, **capture** the current value of the setting into a snapshot and push it on a stack.
2. Then run the apply.
3. **Revert** = pop the last snapshot and restore it → you're back exactly where you were before that apply.
4. **Reset** = restore a snapshot of "nothing" (every value `undefined`) → all customizations are removed, and the
   history is cleared.

Because M2 only writes chrome, the M2 snapshot holds **one** field: `chrome`. (The locked source grows this to three
fields in M5; see the note below.)

> 🧠 **New concept — `config.inspect(key)?.globalValue` (reading a snapshot).** `update` writes; to *read* the exact
> current User-settings value you use `inspect`. `getConfiguration(section).inspect(key)` returns an object with the
> value at each scope — `.globalValue` is what's in **User** settings right now, or **`undefined`** if the user
> hasn't set it. We snapshot `globalValue` specifically because that's the scope we write to (`TARGET = Global`), so
> restoring it puts things back byte-for-byte. Docs:
> [WorkspaceConfiguration.inspect](https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration).
>
> 🧠 **New concept — `update(key, undefined, target)` DELETES the key.** Passing `undefined` as the value doesn't
> write an empty object — it **removes** the setting from `settings.json` entirely. This is the heart of **Reset**:
> we don't blank `workbench.colorCustomizations` to `{}`, we delete it, returning the editor to its untouched base
> theme. It's also how **Revert** restores "you had nothing here before" — the captured `globalValue` was `undefined`,
> so restoring it deletes the key. Docs: same `update` reference as step 02.
>
> ⚠️ **Failure note.** Reset that leaves `"workbench.colorCustomizations": {}` behind is a bug, not a reset — an empty
> object is still a customization present in `settings.json`. Restoring `undefined` (not `{}`) is what actually
> removes it. The verify gate (step 06) checks the key is *gone*, not empty.

## Do this
This step creates **one file**: `src/theme/history.ts`.

1. Create the file **`src/theme/history.ts`** (next to `settings.ts` and `apply.ts`).
2. Paste the code below. Walk the structure:
   - `Snapshot` — in M2, just `{ chrome: unknown }`. `unknown` because we don't care about the shape; we only store
     it and hand it straight back to `update`.
   - `private stack: Snapshot[]` — the undo stack; `apply` pushes, `revert` pops.
   - `capture()` — reads the current `globalValue` of `workbench.colorCustomizations` (may be `undefined`).
   - `restore(s)` — writes `s.chrome` straight back (which deletes the key when `s.chrome` is `undefined`).
   - `apply(fn)` — **snapshot first, then run the apply function.** This ordering is the entire guarantee. The `fn`
     it runs is `applyChrome(...)` (wired in step 05).
   - `revert()` — pops one snapshot and restores it; returns `false` if the stack is empty (nothing to undo).
   - `reset()` — restores an all-`undefined` snapshot (deletes the key) and empties the stack.
   - `depth` — how many snapshots are stacked; handy for debugging / a future "Revert (n)" label.
3. Save.

> 📌 **This is the M2 version of `history.ts`.** The locked source expands `Snapshot` to
> `{ chrome, tokens, semantic }` in M5, and `capture`/`restore` there touch all three settings. **In M2 the snapshot
> is chrome-only** — don't add `tokens`/`semantic` yet (the settings for them stay untouched until M5).

**Load-bearing:** the class name `ThemeHistory` and its methods `apply` / `revert` / `reset` (called from
`extension.ts` and the provider). **Cosmetic:** the `Snapshot` interface name and the `depth` getter.

## Code
`src/theme/history.ts`
```ts
import * as vscode from 'vscode';
import { CHROME, TARGET } from './settings';

interface Snapshot { chrome: unknown; } // [M2: chrome only; M5 adds tokens + semantic]

export class ThemeHistory {
  private stack: Snapshot[] = [];

  private capture(): Snapshot {
    const wb = vscode.workspace.getConfiguration(CHROME.section);
    return {
      chrome: wb.inspect(CHROME.key)?.globalValue,
    };
  }

  private async restore(s: Snapshot): Promise<void> {
    const wb = vscode.workspace.getConfiguration(CHROME.section);
    await wb.update(CHROME.key, s.chrome, TARGET);
  }

  // Snapshot current state, THEN run the apply function. This is the non-destructive backbone.
  async apply(fn: () => Promise<void>): Promise<void> {
    this.stack.push(this.capture());
    await fn();
  }

  // Step back one apply. Returns false if nothing to revert.
  async revert(): Promise<boolean> {
    const snap = this.stack.pop();
    if (!snap) return false;
    await this.restore(snap);
    return true;
  }

  // Remove ALL customizations (undefined = delete the key). Clears history.
  async reset(): Promise<void> {
    await this.restore({ chrome: undefined });
    this.stack = [];
  }

  get depth(): number { return this.stack.length; }
}
```

## Done when (this step)
- `src/theme/history.ts` exists with the code above and compiles with no errors.
- The three `theme/` files are now complete for M2. Still nothing observable in the editor — `extension.ts` (step 04)
  creates a `ThemeHistory`, and the panel (step 05) is what finally calls `apply`/`revert`/`reset`.

## If it breaks
- **`Property 'globalValue' does not exist`** → `inspect` returns `T | undefined`, so you must use `?.` — it's
  `wb.inspect(CHROME.key)?.globalValue`. Without the `?.`, TypeScript rejects the possible `undefined`.
- **`Cannot find name 'CHROME' / 'TARGET'`** → the import from `./settings` is missing or misspelled; match step 01's
  exports exactly.
- **A red squiggle on `apply(fn: () => Promise<void>)`** → check the arrow-function type is written exactly
  `() => Promise<void>`; this is the shape `applyChrome()`-wrapping callbacks satisfy in step 05.

---
> Nav: [← Apply function](02_apply.md) · [Overview](00_overview.md) · [Wire extension →](04_wire-extension.md)
