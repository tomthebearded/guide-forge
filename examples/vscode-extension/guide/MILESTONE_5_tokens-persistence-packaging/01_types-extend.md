# M5 · Step 01 of 10 — Extend the engine types (tokens + semantic)
> Nav: — · [Overview](00_overview.md) · [Generate tokens →](02_generate-extend.md)

## Glossary for this step
- **[TextMate scope](../foundation/glossary.md#textmate-scope)** — a dotted name (e.g. `comment.line`,
  `keyword.control`) identifying a class of syntax tokens, targeted by `editor.tokenColorCustomizations`.
- **[Semantic token](../foundation/glossary.md#semantic-token)** — a code token classified by the language's
  semantic-tokens provider (e.g. "this identifier is a parameter"), recolored via
  `editor.semanticTokenColorCustomizations`.

## Why / design
The engine is our **pure, `vscode`-free** layer (no `import * as vscode` — [conventions.md](../foundation/conventions.md#structure--architecture)).
Everything it produces is plain data: strings in, strings out. Through M4 it produced a `Palette` (8 color roles)
and `chrome` (a map of workbench color keys → hex). M5 adds two more outputs to the same result object: the colors
for **syntax tokens** and **semantic tokens**. This step only *describes the shapes* in `types.ts`; step 02 fills
them in. Doing the type first means step 02's new functions have a contract to satisfy and the compiler guides you.

The three new type members map 1:1 to the two token settings VS Code exposes:
- `TokenColors` — the seven named roles `editor.tokenColorCustomizations` understands (comments, keywords, strings, numbers, types, functions, variables).
- `SemanticColors` — a `Record<string, Hex>` of semantic **token type** → color for `editor.semanticTokenColorCustomizations`.
- `tokens` / `semantic` on `ThemeResult` — so `generate()` returns all three color families in one object.

> This is TypeScript-level work (audience: **Intermediate**) — interfaces and a `Record` type alias, no new API.
> The *why these exact keys* is the token-settings shape, which step 02 teaches against the Themes doc.

## Do this
This step edits **one file**: `src/engine/types.ts` — the M3 file. You're **adding** two type definitions and two
fields; `StarterCombo`, `Palette`, `ChromeColors`, and `StyleProfile` stay exactly as M3 wrote them. (The complete
file is in [the M5 checkpoint](10_verify.md) under `### src/engine/types.ts`.)

> **Before you start:** M3's `src/engine/types.ts` must exist with `Hex`, `StarterCombo`, `Palette`,
> `ChromeColors`, `StyleProfile`, and a `ThemeResult` carrying `palette` and `chrome`.

1. Open `src/engine/types.ts`.
2. **Add** the `TokenColors` interface and the `SemanticColors` type alias **directly below the existing
   `ChromeColors` type**. The seven `TokenColors` field names are **load-bearing** — step 02 builds this exact
   object and step 03 spreads it into the `editor.tokenColorCustomizations` value, which recognizes these named
   keys.
   ```ts
   // The seven named roles editor.tokenColorCustomizations understands.
   export interface TokenColors {
     comments: Hex; keywords: Hex; strings: Hex; numbers: Hex;
     types: Hex; functions: Hex; variables: Hex;
   }

   // Semantic token type -> color, for editor.semanticTokenColorCustomizations.rules.
   export type SemanticColors = Record<string, Hex>;
   ```
3. **Add** `tokens` and `semantic` to the `ThemeResult` interface, **directly after its `chrome: ChromeColors;`
   line**. Leave `palette` and `chrome` exactly as they are.
   ```ts
     tokens: TokenColors;
     semantic: SemanticColors;
   ```
4. Leave `StarterCombo`, `Palette`, `ChromeColors`, and `StyleProfile` unchanged.
5. Save. If your watch task is running it recompiles; you'll see **new errors in `generate.ts`** ("Property
   'tokens' is missing") — that's expected and correct, step 02 fixes it.

## Done when (this step)
- `src/engine/types.ts` matches the checkpoint version (the two additions above are in place).
- The **only** remaining compile error is in `src/engine/generate.ts` — its `generate()` still returns
  `{ palette, chrome }`, which no longer satisfies the widened `ThemeResult`. Step 02 resolves it.
- No `vscode` import appears anywhere in this file (the engine stays pure).

## If it breaks
- **No error surfaced in `generate.ts`** → your watch task may not be running; run `npm run compile` once to
  force a full type-check. If there's still no error, confirm you actually added `tokens`/`semantic` to
  `ThemeResult` (not to a different interface).
- **Errors somewhere other than `generate.ts`** → you edited an existing member instead of adding new ones.
  Compare against the checkpoint; `StarterCombo`, `Palette`, `ChromeColors`, `StyleProfile` must be untouched.

---
> Nav: — · [Overview](00_overview.md) · [Generate tokens →](02_generate-extend.md)
