# M5 · Step 01 of 10 — Extend the engine types (tokens + semantic)
> Nav: — · [Overview](00_overview.md) · [Generate tokens →](02_generate-extend.md)

## Glossary for this step
- **TextMate scope** — a dotted name (e.g. `comment.line`, `keyword.control`) identifying a class of syntax tokens, targeted by `editor.tokenColorCustomizations`. — [glossary.md](../foundation/glossary.md)
- **Semantic token** — a code token classified by the language's semantic-tokens provider (e.g. "this identifier is a parameter"), recolored via `editor.semanticTokenColorCustomizations`. — [glossary.md](../foundation/glossary.md)

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
This step edits **one file**: `src/engine/types.ts`.

1. Open `src/engine/types.ts`.
2. **Add** the `TokenColors` interface and the `SemanticColors` type alias (below the existing `ChromeColors`).
   The seven `TokenColors` field names are **load-bearing** — step 02 builds this exact object and step 03 spreads
   it straight into the `editor.tokenColorCustomizations` value, which recognizes these named keys.
3. **Add** `tokens: TokenColors;` and `semantic: SemanticColors;` to the `ThemeResult` interface. Leave `palette`
   and `chrome` exactly as they are.
4. Leave `StarterCombo`, `Palette`, `ChromeColors`, and `StyleProfile` unchanged.
5. Save. If your watch task is running it recompiles; you'll see **new errors in `generate.ts`** ("Property
   'tokens' is missing") — that's expected and correct, step 02 fixes it.

## Code
`src/engine/types.ts` (complete, final):
```ts
export type Hex = string;

export interface StarterCombo {
  id: string;
  label: string;
  bg: Hex;
  surface: Hex;
  text: Hex;
  accent1: Hex;
  accent2: Hex;
}

// 8 coordinated roles every profile produces.
export interface Palette {
  bg: Hex;
  surface: Hex;
  surfaceAlt: Hex;
  text: Hex;
  textMuted: Hex;
  accent1: Hex;
  accent2: Hex;
  border: Hex;
}

export type ChromeColors = Record<string, Hex>;

// The seven named roles editor.tokenColorCustomizations understands.
export interface TokenColors {
  comments: Hex; keywords: Hex; strings: Hex; numbers: Hex;
  types: Hex; functions: Hex; variables: Hex;
}

// Semantic token type -> color, for editor.semanticTokenColorCustomizations.rules.
export type SemanticColors = Record<string, Hex>;

export interface ThemeResult {
  palette: Palette;
  chrome: ChromeColors;
  tokens: TokenColors;
  semantic: SemanticColors;
}

export interface StyleProfile {
  id: string;
  label: string;
  family: 'generative' | 'signature';
  variants?: string[];                       // e.g. Nature: ['ocean','forest']
  buildPalette(combo: StarterCombo, variant?: string): Palette;
}
```

## Done when (this step)
- `src/engine/types.ts` matches the block above.
- The **only** remaining compile error is in `src/engine/generate.ts` — its `generate()` still returns
  `{ palette, chrome }`, which no longer satisfies the widened `ThemeResult`. Step 02 resolves it.
- No `vscode` import appears anywhere in this file (the engine stays pure).

## If it breaks
- **No error surfaced in `generate.ts`** → your watch task may not be running; run `npm run compile` once to
  force a full type-check. If there's still no error, confirm you actually added `tokens`/`semantic` to
  `ThemeResult` (not to a different interface).
- **Errors somewhere other than `generate.ts`** → you edited an existing member instead of adding new ones.
  Compare against the block above; `StarterCombo`, `Palette`, `ChromeColors`, `StyleProfile` must be untouched.

---
> Nav: — · [Overview](00_overview.md) · [Generate tokens →](02_generate-extend.md)
