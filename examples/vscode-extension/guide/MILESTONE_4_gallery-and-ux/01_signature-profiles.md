# M4 · Step 01 of 6 — Add the 4 signature presets to the engine
> Nav: — · [Overview](00_overview.md) · [Externalize the CSS →](02_styles.md)

## Glossary for this step
- **[Signature preset](../foundation/glossary.md#signature-preset)** — a style with a **fixed identity palette**
  (hand-picked hex values) rather than one *derived* from the starter combo; e.g. Game Boy, Synthwave.
- **[Generative profile](../foundation/glossary.md#generative-profile)** — the M3 kind: a style whose palette is
  **computed from the seed combo** by rules (Neon, Pastel…).

## Why / design
M3 gave you 9 **generative** profiles: each one takes the combo you picked and transforms it (lighten, saturate,
rotate hue…). That's great for coordinated, tweakable palettes — but it can't reproduce an *iconic* look. A Game
Boy screen is a specific four-green wash; "derive it from Deep Sea" is meaningless. So the last 4 styles are
**signature presets**: they ignore the combo and return fixed colors.

> 🧠 **Concept — generative vs. signature (same shape, different source).** Both kinds are the *same* data type,
> `StyleProfile`, and both live in the *same* registry — the only difference is what `buildPalette` does with its
> arguments. A generative profile reads `combo` and computes; a signature profile ignores `combo` (note the `_c`)
> and returns constants. This is the payoff of the data-driven design from [conventions.md](../foundation/conventions.md#data-vs-code):
> adding these 4 is **appending 4 objects**, not adding branches anywhere else. The `family` field
> (`'generative' | 'signature'`) — already on the `StyleProfile` type since M3 — is just a label we forward to the
> UI later; nothing branches on it in the engine.

This is a **domain** concept, not a VS Code one, so there's no external doc link — it's a design distinction this
guide draws. The color values below are **cosmetic** (rename/re-tune freely); the profile **ids** and **variant
names** are load-bearing (the UI and `profileById` look them up by string).

## Do this
This step edits **one file**: `src/engine/profiles.ts` — the M3 file with the 9 generative profiles. You're
**appending** two things and changing one line; the import, `base()`, the whole `GENERATIVE` array, and
`profileById` stay exactly as M3 wrote them. (The complete file, all 13 profiles, is in
[the M4 checkpoint](06_verify.md) under `### src/engine/profiles.ts` — don't re-type the unchanged parts.)

> **Before you start:** M3's `src/engine/profiles.ts` must already exist with the `GENERATIVE` array (9 profiles)
> and the `base()` helper. This step adds to that file.

1. Open `src/engine/profiles.ts`.
2. **After** the closing `];` of the `GENERATIVE` array, add the `SIGNATURE` array. It holds 4 profiles; two of
   them declare `variants` — `game-boy` → `['dmg', 'pocket', 'light']` (the three classic Game Boy screens),
   `terminal` → `['green', 'amber']` (the two CRT phosphor colors); the other two (`sixteen-bit`, `synthwave`) take
   no variant.

   In `src/engine/profiles.ts`, **immediately after the `GENERATIVE` array's closing `];`**:
   ```ts
   // M4 — the 4 fixed-identity signature presets. They ignore the combo (note `_c`)
   // and return hand-picked palettes via the fixed() helper below.
   export const SIGNATURE: StyleProfile[] = [
     {
       id: 'game-boy', label: 'Game Boy', family: 'signature', variants: ['dmg', 'pocket', 'light'],
       buildPalette: (_c, variant = 'dmg') => {
         if (variant === 'pocket') return fixed('#0d0d0d', '#2b2b2b', '#8b8b8b', '#c4c4c4', '#5a5a5a');
         if (variant === 'light') return fixed('#c4cfa1', '#8b956d', '#4d533c', '#1f1f1f', '#4d533c');
         return fixed('#0f380f', '#306230', '#9bbc0f', '#8bac0f', '#306230'); // dmg
       },
     },
     {
       id: 'sixteen-bit', label: '16-bit', family: 'signature',
       buildPalette: () => fixed('#1a1c2c', '#29366f', '#f4f4f4', '#ef7d57', '#41a6f6'),
     },
     {
       id: 'synthwave', label: 'Synthwave', family: 'signature',
       buildPalette: () => fixed('#241b2f', '#2a2139', '#f8f8f2', '#ff7edb', '#36f9f6'),
     },
     {
       id: 'terminal', label: 'Terminal / CRT', family: 'signature', variants: ['green', 'amber'],
       buildPalette: (_c, variant = 'green') => variant === 'amber'
         ? fixed('#0a0600', '#1a1200', '#ffb000', '#ffc433', '#7a5200')
         : fixed('#001100', '#002200', '#33ff33', '#66ff66', '#0a5a0a'),
     },
   ];
   ```
3. **Directly below the `SIGNATURE` array, add the `fixed()` helper.** It takes a signature's 5 core colors —
   `bg, surface, text, accent1, accent2` — and expands them into the 8-role `Palette` the rest of the engine
   expects, deriving `surfaceAlt`, `textMuted`, and `border` the same way `base()` does. This keeps signature
   palettes structurally identical to generative ones, so `generate.ts` and the swatch preview don't care which
   kind they got.

   In `src/engine/profiles.ts`, **directly below the `SIGNATURE` array**:
   ```ts
   // Helper: build an 8-role palette from a signature's core colors.
   function fixed(bg: string, surface: string, text: string, accent1: string, accent2: string): Palette {
     return {
       bg, surface, surfaceAlt: lighten(surface, 0.04),
       text, textMuted: mix(text, surface, 0.5),
       accent1, accent2, border: mix(surface, text, 0.2),
     };
   }
   ```
4. **Change the `PROFILES` line** from M3's `[...GENERATIVE]` to `[...GENERATIVE, ...SIGNATURE]` so the registry —
   and therefore the gallery — now holds all 13. `profileById` is unchanged (it searches `PROFILES`).

   In `src/engine/profiles.ts`, **replace the existing `export const PROFILES` line** with:
   ```ts
   export const PROFILES: StyleProfile[] = [...GENERATIVE, ...SIGNATURE];
   ```
5. Leave the **import line, `base()`, the whole `GENERATIVE` array, and `profileById`** exactly as M3 wrote them.
   The imports already include everything `fixed()` needs (`lighten`, `mix`).
6. Save. The watch task recompiles; there should be no new errors.

> Why `_c` and not `combo`? A leading underscore is the project convention for a parameter the interface forces on
> you but you don't use (same as `_context`/`_token` in the M1 provider) — here it documents "signature palettes
> don't read the combo." It also keeps the linter from flagging the unused argument.

## Done when (this step)
- `src/engine/profiles.ts` compiles with no errors and now exports `GENERATIVE` (9), `SIGNATURE` (4), and
  `PROFILES` (13).
- **Verify the count without F5** (the engine is pure, so plain Node runs it). From the project root:
  1. Make sure the watch/compile task has produced `out/` (run `npm run compile` if unsure).
  2. Run:
     ```powershell
     node -e "const {PROFILES,SIGNATURE}=require('./out/engine/profiles.js'); console.log(PROFILES.length, SIGNATURE.map(p=>p.id).join(','))"
     ```
  3. Expected output — exactly:
     ```
     13 game-boy,sixteen-bit,synthwave,terminal
     ```
- Optional palette sanity check — the Game Boy DMG background is the classic dark green:
  ```powershell
  node -e "const {profileById}=require('./out/engine/profiles.js'); console.log(profileById('game-boy').buildPalette({},'dmg').bg)"
  ```
  → prints `#0f380f`. (The empty `{}` stands in for a combo the signature ignores.)

## If it breaks
- **`Cannot find module './out/engine/profiles.js'`** → it hasn't compiled yet; run `npm run compile` and confirm
  `tsconfig.json`'s `outDir` is `out` (the M1 scaffold's default). If your `out/` layout differs, adjust the path.
- **`PROFILES.length` prints `9`** → you left the `PROFILES` line as `[...GENERATIVE]`; change it to
  `[...GENERATIVE, ...SIGNATURE]`.
- **Red squiggle: `Property 'family' is missing`** → each profile object must include `family: 'signature'`; it's
  a required field on `StyleProfile` (defined in M3's `types.ts`).
- **`fixed is not defined` / used-before-declaration worry** → `fixed()` is a function *declaration*, so it's
  hoisted; it can sit below `SIGNATURE` and still be called from inside it. Keep it as `function fixed(...)`, not a
  `const fixed = (...) =>`.

---
> Nav: — · [Overview](00_overview.md) · [Externalize the CSS →](02_styles.md)
