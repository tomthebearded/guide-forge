# M5 · Step 04 of 10 — History captures all three settings
> Nav: [← Apply tokens](03_apply-extend.md) · [Overview](00_overview.md) · [Save sets →](05_storage.md)

## Why / design
`src/theme/history.ts` is the **non-destructive backbone** ([decision-log.md D1](../foundation/decision-log.md#d1--non-destructive-backbone-is-load-bearing)):
before every apply it snapshots the *current* settings, so Revert can restore them exactly and Reset can delete
them. M2 built it for **chrome only**. Now that an apply also writes tokens + semantic (step 03), the snapshot has
to capture all three — otherwise Revert would restore the old chrome but leave your new token colors stuck, and
Reset would delete chrome but orphan the token settings. Same mental model, widened: **snapshot everything you're
about to write.**

The mechanism is unchanged from M2:
- `capture()` reads each setting's current **global** value via `config.inspect(key)?.globalValue` (which is
  `undefined` when the user hasn't set it — the correct "nothing was here" marker).
- `restore(snap)` writes each value back. Writing `undefined` **removes** the key (that's how Reset deletes
  customizations rather than blanking them).
- `apply(fn)` pushes a snapshot, then runs the write; `revert()` pops and restores; `reset()` restores the
  all-`undefined` snapshot and clears the stack.

> This is API you already met in M2 (`inspect().globalValue`, `update(key, undefined, target)` to delete).
> M5 only adds two fields to the `Snapshot` and two lines each in `capture`/`restore`. No new concept — reuse.

Note both token settings live under the `editor` section, so `capture`/`restore` reuse one `editor` config object
(`ed`) for both — one `getConfiguration('editor')` call, two keys.

## Do this
This step edits **one file**: `src/theme/history.ts`.

1. Open `src/theme/history.ts`.
2. **Widen the import** from `./settings` to include `TOKENS` and `SEMANTIC` alongside `CHROME, TARGET`.
3. **Extend the `Snapshot` interface** to `{ chrome: unknown; tokens: unknown; semantic: unknown; }`.
4. In **`capture()`**, add an `editor` config read and capture `tokens` + `semantic` globalValues.
5. In **`restore()`**, write all three back (chrome via the workbench config, tokens + semantic via the editor
   config).
6. Confirm **`reset()`** passes all-`undefined` for the three fields (so it deletes every customization).
7. Leave `apply`, `revert`, and `depth` unchanged. Save.

**Load-bearing:** the three `Snapshot` fields must line up with the three settings; `restore` writing `undefined`
is what makes Reset *delete* keys. The private method names are cosmetic.

## Code
`src/theme/history.ts` (complete, final):
```ts
import * as vscode from 'vscode';
import { CHROME, TOKENS, SEMANTIC, TARGET } from './settings';

interface Snapshot { chrome: unknown; tokens: unknown; semantic: unknown; }

export class ThemeHistory {
  private stack: Snapshot[] = [];

  private capture(): Snapshot {
    const wb = vscode.workspace.getConfiguration(CHROME.section);
    const ed = vscode.workspace.getConfiguration(TOKENS.section);
    return {
      chrome: wb.inspect(CHROME.key)?.globalValue,
      tokens: ed.inspect(TOKENS.key)?.globalValue,
      semantic: ed.inspect(SEMANTIC.key)?.globalValue,
    };
  }

  private async restore(s: Snapshot): Promise<void> {
    const wb = vscode.workspace.getConfiguration(CHROME.section);
    const ed = vscode.workspace.getConfiguration(TOKENS.section);
    await wb.update(CHROME.key, s.chrome, TARGET);
    await ed.update(TOKENS.key, s.tokens, TARGET);
    await ed.update(SEMANTIC.key, s.semantic, TARGET);
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

  // Remove ALL customizations (undefined = delete the keys). Clears history.
  async reset(): Promise<void> {
    await this.restore({ chrome: undefined, tokens: undefined, semantic: undefined });
    this.stack = [];
  }

  get depth(): number { return this.stack.length; }
}
```

## Done when (this step)
- `src/theme/history.ts` matches the block above and the project compiles clean.
- Behavior is verified in step 10: after applying a themed set (chrome + tokens + semantic), **Revert** restores
  the previous state of *all three* settings, and **Reset** removes all three from `settings.json` entirely.

## If it breaks
- **Revert restores chrome but token colors stay** → `capture`/`restore` didn't get the `tokens`/`semantic`
  lines, or they read/write the wrong section. Both token settings are under `editor` (the `ed` config).
- **Reset blanks colors instead of removing the keys** → you passed `{}` (empty object) instead of `undefined`;
  only `undefined` deletes a key. Confirm `reset()` passes `undefined` for all three.
- **Language-scoped applies don't get reverted** → expected and out of scope: this snapshot captures **global**
  values (`globalValue`). Per-language overrides live in `"[languageId]"` blocks; Revert here targets the global
  settings. (Reset the language block by re-applying globally, or clear it manually — noted, not a defect.)

---
> Nav: [← Apply tokens](03_apply-extend.md) · [Overview](00_overview.md) · [Save sets →](05_storage.md)
