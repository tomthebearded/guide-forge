# M3 · Step 02 of 8 — The engine's types (`StyleProfile`, `Palette`, …)
> Nav: [← Color utilities](01_color-utils.md) · [Overview](00_overview.md) · [Combos →](03_combos.md)

## Glossary for this step
- **[Starter combination](../foundation/glossary.md#starter-combination)** — one of the 5 base color sets (`bg` / `surface` / `text` / `accent1` / `accent2`) you pick as a starting point.
- **[Style profile](../foundation/glossary.md#style-profile)** — the data object (rules or fixed values) defining one style; collected in one registry.
- **[Seed color](../foundation/glossary.md#seed-color)** — the base color a generative profile expands into a full palette (here, the combo's colors are the seed).

## Why / design
Before any profile or combo exists, we fix the **shapes** they all agree on. This one file is the contract between
the three moving parts: a **`StarterCombo`** (5 colors you pick) goes into a profile's **`buildPalette`**,
which returns a **`Palette`** (8 coordinated roles), which `generate` (step 06) turns into **`ChromeColors`** and
packs into a **`ThemeResult`**. Nothing here has behaviour — it's pure type declarations — so there's nothing to run;
it just has to compile.

Two design choices worth naming:
- **8 palette roles, always.** Every profile — however it derives its colors — must return the same 8 keys
  (`bg`…`border`). That uniformity is what lets one `generate` function map *any* profile's output to workbench
  chrome without special-casing.
- **`StyleProfile` is data with one method.** `buildPalette(combo, variant?)` is the only behaviour; everything else
  (`id`, `label`, `family`, `variants`) is data. This is the "new style = new data" convention
  ([conventions.md](../foundation/conventions.md#data-vs-code)) expressed in the type system.

> 🧠 **Chrome vs. tokens (why `ThemeResult` looks small here).** This milestone recolors only the workbench
> **chrome** (`workbench.colorCustomizations`), so `ThemeResult` carries just `{ palette, chrome }`. In **M5** we add
> `tokens` and `semantic` (for `editor.tokenColorCustomizations` / `editor.semanticTokenColorCustomizations`) and the
> `TokenColors` / `SemanticColors` types. The comment markers in the code point at that future — they are a
> deliberate forward reference, **not** something you're missing.

*(TypeScript reminder — these are plain `interface` / `type` declarations; `Record<string, Hex>` is "an object with
string keys and hex-string values". Nothing to install.)*

## Do this
This step creates **one file**: `src/engine/types.ts`.

1. Create **`src/engine/types.ts`** next to `color.ts`.
2. Paste the **Code** block below. Notes on the load-bearing pieces (these names are read by the registry *and* the
   panel — see [conventions.md](../foundation/conventions.md#naming)):
   - **`StarterCombo`** fields `id, label, bg, surface, text, accent1, accent2` — the 5 picked colors plus an id/label.
   - **`Palette`** roles `bg, surface, surfaceAlt, text, textMuted, accent1, accent2, border` — the 8 roles every
     profile returns. `surfaceAlt` (a slightly raised surface) and `textMuted`/`border` (derived) are why a `Palette`
     is richer than a `StarterCombo`.
   - **`StyleProfile`** fields `id, label, family, variants?, buildPalette` — `family` is `'generative'` this
     milestone (`'signature'` arrives in M4); `variants?` is an optional list (e.g. Nature's `['ocean','forest']`);
     `buildPalette(combo, variant?)` is the rule that turns a combo into a `Palette`.
   - **`Hex`** is just `string` — a readability alias so a signature reads "this is a color" not "this is any string".
3. Leave the M5 forward-reference exactly as commented; do **not** add token types yet. Save.

## Code
`src/engine/types.ts` *(the M3 version — chrome only; M5 appends token/semantic types)*
```ts
// [M3 version] — chrome only. [M5] appends TokenColors, SemanticColors, and tokens/semantic on ThemeResult.
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

export interface ThemeResult {
  palette: Palette;
  chrome: ChromeColors;
  // [M5] adds: tokens: TokenColors; semantic: SemanticColors;
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
- `src/engine/types.ts` exists and compiles with no errors.
- It exports `Hex`, `StarterCombo`, `Palette`, `ChromeColors`, `ThemeResult`, and `StyleProfile`, and does **not**
  yet declare `TokenColors` or `SemanticColors`.

## If it breaks
- **Red squiggle "`Cannot find name 'TokenColors'`"** → you added the M5 fields to `ThemeResult` early. In M3
  `ThemeResult` is only `{ palette, chrome }`; keep the token line as a comment.
- **Nothing imports this yet, so no runtime check here** — the payoff is that `combos.ts` (next) and `profiles.ts`
  will import these types. If they compile, the shapes are right.

---
> Nav: [← Color utilities](01_color-utils.md) · [Overview](00_overview.md) · [Combos →](03_combos.md)
