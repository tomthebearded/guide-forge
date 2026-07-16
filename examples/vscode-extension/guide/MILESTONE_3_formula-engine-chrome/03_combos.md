# M3 · Step 03 of 8 — The five starter combos
> Nav: [← Types](02_types.md) · [Overview](00_overview.md) · [Generative profiles I →](04_profiles-generative-1.md)

## Why / design
A **starter combination** is your seed: 5 hand-picked hex colors (`bg`, `surface`, `text`, `accent1`,
`accent2`) that a profile then expands into a full 8-role palette. Rather than ask a beginner to invent good colors,
we ship 5 curated, coordinated sets — a dark blue, a warm dark, a green, a purple, and a neutral graphite — each
already balanced for a code editor (dark background, light text, two accents).

These 5 hex sets are **load-bearing**: the whole generated theme is derived from them, so every profile's output
shifts if a value drifts. The combo **ids** (`deep-sea`, `ember`, `grove`, `orchid`, `graphite`) are the values the
panel's dropdown sends back, resolved by `comboById`. The display **labels** ("Deep Sea"…) are cosmetic — rename
freely.

> 🧠 **Why `?? COMBOS[0]` in `comboById`.** The lookup takes an id string that arrives from the webview (untrusted
> input) and returns a `StarterCombo`. If the id doesn't match — a stale message, a typo — we fall back to the first
> combo rather than return `undefined` and force every caller to null-check. The engine stays total: *give it
> anything, it returns a valid combo.*

*(TypeScript reminder — `Array.prototype.find` returns the match or `undefined`; `?? COMBOS[0]` supplies the
fallback. Nothing to install.)*

## Do this
This step creates **one file**: `src/engine/combos.ts`.

1. Create **`src/engine/combos.ts`** next to `types.ts`.
2. Paste the **Code** block below.
   - It imports the `StarterCombo` type from `./types` and exports `COMBOS` (the 5 curated sets) plus a
     `comboById(id)` lookup.
   - **Type the hex values exactly** — do not paste-and-tweak. These are the load-bearing seeds; step 08's verify
     assumes them (Deep Sea's `bg` is `#0b1a2b`, its `accent1` is `#3ec6ff` — the same color the step-01 check
     round-tripped).
3. Save. It should compile with no errors (it depends only on `types.ts` from step 02).

## Code
`src/engine/combos.ts` *(the complete file — final; used unchanged through M5)*
```ts
import { StarterCombo } from './types';

export const COMBOS: StarterCombo[] = [
  { id: 'deep-sea', label: 'Deep Sea', bg: '#0b1a2b', surface: '#13293d', text: '#dbe9f4', accent1: '#3ec6ff', accent2: '#5eead4' },
  { id: 'ember',    label: 'Ember',    bg: '#1b1210', surface: '#2a1a15', text: '#f6e7dd', accent1: '#ff7849', accent2: '#ffd24c' },
  { id: 'grove',    label: 'Grove',    bg: '#0f1f17', surface: '#183025', text: '#e4f2ea', accent1: '#5fd68b', accent2: '#b8d96a' },
  { id: 'orchid',   label: 'Orchid',   bg: '#170f22', surface: '#241634', text: '#efe6f7', accent1: '#c084fc', accent2: '#ff77c8' },
  { id: 'graphite', label: 'Graphite', bg: '#17191c', surface: '#212429', text: '#e6e8ea', accent1: '#7dd3fc', accent2: '#9aa0a6' },
];

export function comboById(id: string): StarterCombo {
  return COMBOS.find((c) => c.id === id) ?? COMBOS[0];
}
```

## Done when (this step)
- `src/engine/combos.ts` exists and compiles with no errors.
- `COMBOS` has exactly **5** entries with the ids `deep-sea`, `ember`, `grove`, `orchid`, `graphite`, at the exact
  hex values above.

## If it breaks
- **`Cannot find module './types'`** → `types.ts` isn't in the same `src/engine/` folder, or step 02 wasn't saved.
- **A hex looks off in a later step** → a mistyped digit here; the seed propagates to *every* profile's output, so
  fix it here rather than downstream. Re-read the 5 lines against the block above.

---
> Nav: [← Types](02_types.md) · [Overview](00_overview.md) · [Generative profiles I →](04_profiles-generative-1.md)
