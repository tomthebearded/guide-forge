# M5 · Step 02 of 10 — Generate token + semantic colors
> Nav: [← Types extend](01_types-extend.md) · [Overview](00_overview.md) · [Apply tokens →](03_apply-extend.md)

## Why / design
`generate.ts` turns a `Palette` into the concrete values VS Code will write. M4's version produced only `chrome`
(a map of workbench color keys). Now we add two small pure functions — `paletteToTokens` and `paletteToSemantic` —
and have `generate()` return them alongside `chrome`. Same pattern as `paletteToChrome`: **derive** token colors
from the palette's accents/text/muted roles, so any of the 13 profiles automatically gets coordinated code colors
for free. No profile changes; the engine stays data-driven.

Two color families, two VS Code settings — and their value shapes differ, which is why we need both functions:

> 🧠 **Beginner — TextMate named keys vs. semantic token *types*.** VS Code colors code text two ways, and our two
> functions target each:
> - **`editor.tokenColorCustomizations`** is the older **TextMate** path. Besides raw `textMateRules` (scope →
>   color), it exposes a handful of **named convenience keys** — `comments`, `keywords`, `strings`, `numbers`,
>   `types`, `functions`, `variables` — that map to common scopes for you. `paletteToTokens` fills exactly those
>   seven (they're the fields you defined in step 01), so we never hand-write TextMate scopes.
> - **`editor.semanticTokenColorCustomizations`** is the newer **semantic** path. A language server labels each
>   identifier by **token type** (`variable`, `parameter`, `function`, `class`, `type`, `keyword`, …), and you map
>   *type → color* under a `rules` object. `paletteToSemantic` builds that map. Semantic colors layer *on top of*
>   TextMate ones when a language server is active. Docs: [Themes — syntax & semantic colors](https://code.visualstudio.com/docs/configure/themes)
>   and the [Semantic Highlight guide](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide).

Both functions run every color through `ensureContrast(color, bg, 3)` (from `color.ts`) so code text keeps at
least a 3:1 ratio against the background — a color that's invisible on the theme's `bg` is a bug, not a style.
`paletteToSemantic` takes the *already-built* `TokenColors` (not the palette) so syntax and semantic coloring
agree: a keyword and the semantic `keyword` type get the same hex.

## Do this
This step edits **one file**: `src/engine/generate.ts` — the M4 file. `paletteToChrome` stays **exactly** as M4
wrote it (don't re-type it); you're widening the imports, adding two functions below it, and rewriting `generate()`.
(The complete file is in [the M5 checkpoint](10_verify.md) under `### src/engine/generate.ts`.)

> **Before you start:** M4's `src/engine/generate.ts` must exist with `paletteToChrome` and a `generate()` that
> returns `{ palette, chrome }`, and step 01's `TokenColors`/`SemanticColors` must already be in `types.ts`.

1. Open `src/engine/generate.ts`.
2. **Widen the imports.** Add `TokenColors, SemanticColors` to the `types` import, and `mix, rotate,
   ensureContrast` to the `color` import (they're used by the new functions; `readableOn` stays — chrome uses it).
   **Replace the two import lines at the top** with:
   ```ts
   import { ChromeColors, Palette, StarterCombo, StyleProfile, ThemeResult, TokenColors, SemanticColors } from './types';
   import { readableOn, mix, rotate, ensureContrast } from './color';
   ```
3. **Add `paletteToTokens`** directly **below the unchanged `paletteToChrome` function**. It maps each of the seven
   roles from palette accents/text/muted, each clamped for contrast against `p.bg`.
   ```ts
   function paletteToTokens(p: Palette): TokenColors {
     const on = (c: string) => ensureContrast(c, p.bg, 3);
     return {
       comments: on(p.textMuted),
       keywords: on(p.accent1),
       strings: on(p.accent2),
       numbers: on(rotate(p.accent2, 20)),
       types: on(rotate(p.accent1, -20)),
       functions: on(mix(p.accent2, p.text, 0.2)),
       variables: on(p.text),
     };
   }
   ```
4. **Add `paletteToSemantic`** directly **below `paletteToTokens`**. It fans the seven token colors out to the
   semantic **token type** names a language server emits (several types share a color on purpose — e.g.
   `class`/`type`/`interface`/`enum` all use `types`).
   ```ts
   function paletteToSemantic(t: TokenColors): SemanticColors {
     return {
       variable: t.variables, parameter: t.variables, property: t.variables,
       function: t.functions, method: t.functions,
       class: t.types, type: t.types, interface: t.types, enum: t.types,
       keyword: t.keywords, string: t.strings, number: t.numbers, comment: t.comments,
     };
   }
   ```
5. **Replace `generate()`** so it computes `tokens` and returns `tokens` + `semantic` alongside `palette` and
   `chrome`:
   ```ts
   export function generate(combo: StarterCombo, profile: StyleProfile, variant?: string): ThemeResult {
     const palette = profile.buildPalette(combo, variant);
     const tokens = paletteToTokens(palette);
     return {
       palette,
       chrome: paletteToChrome(palette),
       tokens,
       semantic: paletteToSemantic(tokens),
     };
   }
   ```
6. Save — this clears the `ThemeResult` error left over from step 01.

**Load-bearing:** the seven `TokenColors` keys (from step 01) and the semantic **type names** on the left of
`paletteToSemantic` (`variable`, `parameter`, `property`, `function`, `method`, `class`, `type`, `interface`,
`enum`, `keyword`, `string`, `number`, `comment`) — these are the standard type names VS Code recognizes. The
specific *derivation math* (which accent maps where, the `rotate` degrees) is **cosmetic** — tune it freely.

## Done when (this step)
- `src/engine/generate.ts` matches the checkpoint version and the **whole engine compiles with no errors** (`npm run
  compile` is clean).
- Optional Node-runnable sanity check (the engine is pure, so no F5 needed). From the project root:
  ```powershell
  npm run compile
  node -e "const {generate}=require('./out/engine/generate.js');const {comboById}=require('./out/engine/combos.js');const {profileById}=require('./out/engine/profiles.js');const t=generate(comboById('deep-sea'),profileById('neon'));console.log(t.tokens);console.log(Object.keys(t.semantic).length,'semantic types')"
  ```
  Expected: an object with seven `#rrggbb` fields (`comments`, `keywords`, …), then `13 semantic types`. Every
  value is a valid 7-char hex string.

## If it breaks
- **`node -e` prints `undefined` for `tokens`** → `generate()` isn't returning the new fields, or you compiled a
  stale build; re-run `npm run compile` and confirm the `return` includes `tokens` and `semantic`.
- **`Cannot find module './out/engine/...'`** → the compile hasn't run or `tsconfig` emits elsewhere; run
  `npm run compile` first and check `out/engine/generate.js` exists.
- **A token color comes out as `#ffffff` or `#111111` unexpectedly** → that's `ensureContrast` clamping when the
  derived color couldn't reach 3:1 against a very light/dark `bg`. Not a bug — it's the readability floor doing its
  job. Change the profile/combo if you want a different look.

---
> Nav: [← Types extend](01_types-extend.md) · [Overview](00_overview.md) · [Apply tokens →](03_apply-extend.md)
