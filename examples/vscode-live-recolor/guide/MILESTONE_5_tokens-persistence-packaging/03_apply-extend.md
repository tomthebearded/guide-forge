# M5 · Step 03 of 10 — Apply tokens + semantic, and scope tokens per language
> Nav: [← Generate tokens](02_generate-extend.md) · [Overview](00_overview.md) · [History extend →](04_history-extend.md)

## Why / design
`src/theme/apply.ts` is the **one write path** — the only module that touches settings ([conventions.md](../foundation/conventions.md#structure--architecture)).
M2 gave it `applyChrome`. Now we add `applyTokens` and `applySemantic` (the two `editor.*` settings) and a single
`applyTheme(theme, languageId?)` that writes everything. Keeping all writes here is what lets M2's snapshot
backbone (step 04) capture *everything* — if a step wrote a setting directly, Revert couldn't undo it.

Two new things are taught here: the **value shapes** the settings expect, and the **per-language mechanism**.

> 🧠 **New concept — the language-override 4th argument to `config.update`.** `getConfiguration().update()` takes
> an optional 4th boolean, `overrideInLanguage`. When you (a) obtain the config **scoped to a language** —
> `getConfiguration('editor', { languageId: 'typescript' })` — and (b) pass `true` as the 4th arg, VS Code writes
> the value under a `"[typescript]"` block in `settings.json` instead of at the top level. The setting then applies
> **only** when editing that language. Pass no scope and omit the 4th arg (our default) and it writes globally, for
> all languages. Docs: [WorkspaceConfiguration.update](https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration)
> and [language-specific settings](https://code.visualstudio.com/docs/getstarted/settings#_languagespecific-editor-settings).
> **Failure note:** obtaining the config *with* the languageId scope but forgetting `true` writes globally anyway —
> the scope object alone does nothing; the `true` is what targets the language block.

> 🧠 **New concept — why `applyTheme` skips chrome when a languageId is given.** `workbench.colorCustomizations`
> (chrome) is a **workbench** setting, and workbench settings are **not** language-overridable — VS Code simply
> ignores a `"[languageId]"` block around them. Only `editor.*` settings (our two token settings) accept the
> override. So when the caller passes a `languageId`, `applyTheme` writes **tokens + semantic scoped to that
> language** and **deliberately does not touch chrome** (writing chrome would either be ignored or, worse, clobber
> the global chrome as a side effect). This is the tokens-only-scoping limit, made real in code.
> Reasoning: [decision-log.md D2](../foundation/decision-log.md#d2--per-language-scoping-is-tokens-only).

Value shapes (both are objects VS Code merges into the setting):
- `editor.tokenColorCustomizations` → `{ comments, keywords, strings, numbers, types, functions, variables }` (the
  seven named keys — exactly our `TokenColors`).
- `editor.semanticTokenColorCustomizations` → `{ enabled: true, rules: { <type>: hex, … } }`. **`enabled: true` is
  load-bearing** — without it, semantic coloring is off and your `rules` are ignored.

## Do this
This step edits **one file**: `src/theme/apply.ts`.

1. Open `src/theme/apply.ts`. It currently imports `CHROME, TARGET` and exports `applyChrome`.
2. **Widen the import** from `./settings` to include `TOKENS` and `SEMANTIC` (the two `editor.*` setting descriptors
   defined back in M2's `settings.ts`), and import `ThemeResult` from `../engine/types`.
3. **Add `applyTokens(tokens, languageId?)`** — builds the seven-key value, gets `editor` config (scoped to the
   language when `languageId` is given), and updates with the 4th arg `true` **only** when scoping.
4. **Add `applySemantic(semantic, languageId?)`** — same pattern, value `{ enabled: true, rules: semantic }`.
5. **Add `applyTheme(theme, languageId?)`** — writes chrome **only when no `languageId`**, then always writes
   tokens + semantic (scoped or global to match).
6. Leave `applyChrome` exactly as it was. Save.

**Load-bearing:** `TOKENS`/`SEMANTIC` resolve to `editor.tokenColorCustomizations` /
`editor.semanticTokenColorCustomizations`; the `{ enabled: true, rules }` shape; the `languageId ? true :
undefined` 4th arg; and the `if (!languageId) applyChrome(...)` guard. The local variable names are cosmetic.

## Code
`src/theme/apply.ts` (complete, final):
```ts
import * as vscode from 'vscode';
import { CHROME, TOKENS, SEMANTIC, TARGET } from './settings';
import { ThemeResult } from '../engine/types';

export async function applyChrome(chrome: Record<string, string>): Promise<void> {
  await vscode.workspace.getConfiguration(CHROME.section).update(CHROME.key, chrome, TARGET);
}

export async function applyTokens(tokens: ThemeResult['tokens'], languageId?: string): Promise<void> {
  const value = { comments: tokens.comments, keywords: tokens.keywords, strings: tokens.strings,
    numbers: tokens.numbers, types: tokens.types, functions: tokens.functions, variables: tokens.variables };
  const cfg = vscode.workspace.getConfiguration(TOKENS.section, languageId ? { languageId } : undefined);
  await cfg.update(TOKENS.key, value, TARGET, languageId ? true : undefined);
}

export async function applySemantic(semantic: ThemeResult['semantic'], languageId?: string): Promise<void> {
  const value = { enabled: true, rules: semantic };
  const cfg = vscode.workspace.getConfiguration(SEMANTIC.section, languageId ? { languageId } : undefined);
  await cfg.update(SEMANTIC.key, value, TARGET, languageId ? true : undefined);
}

// Accepts anything carrying the three color maps — a generated ThemeResult OR a saved set.
export async function applyTheme(
  theme: Pick<ThemeResult, 'chrome' | 'tokens' | 'semantic'>,
  languageId?: string,
): Promise<void> {
  if (!languageId) { await applyChrome(theme.chrome); } // chrome can't be language-scoped
  await applyTokens(theme.tokens, languageId);
  await applySemantic(theme.semantic, languageId);
}
```

## Done when (this step)
- `src/theme/apply.ts` matches the block above and the project compiles clean.
- Nothing observable in the editor yet — the provider doesn't call `applyTheme` until step 06. This step is wiring;
  its real proof is in the verify gate (step 10), where a global apply recolors code and a `typescript`-scoped
  apply recolors only `.ts`.

## If it breaks
- **`Property 'tokens' does not exist on type 'ThemeResult'`** → step 01/02 aren't in place; `ThemeResult` must
  already carry `tokens`/`semantic`. Finish those steps first.
- **Later (step 10): a language-scoped apply changes *all* files, not just the one language** → you obtained the
  config without the `{ languageId }` scope, or dropped the `true` 4th arg. Both are required together.
- **Later: semantic colors never appear** → check `enabled: true` is in the `applySemantic` value; without it the
  `rules` are inert. (And see the semantic "silently does nothing" note in step 10 — the file's language server
  also has to be running.)
