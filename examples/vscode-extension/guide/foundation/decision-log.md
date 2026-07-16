# Decision log — Live Recolor (VS Code extension)

> Why the guide is the way it is. Each entry: the decision, the reasoning, and what it rules out.
> Seeded from the plan's Phase 0 interview and Phase 0.5 web check; append-only (supersede, don't delete).

## D1 — Non-destructive backbone is load-bearing
- **Date:** 2026-07-10
- **Source:** hard constraint from the idea brief + Phase 0 risk advise-back.
- **Decision:** Every apply snapshots the prior color settings *before* writing. A Revert history steps back
  through snapshots; Reset removes all customizations entirely. Introduced *small* in M2 (one workbench color)
  before any generation exists.
- **Why:** the extension writes to the user's **real** `settings.json` (during F5 dev, your own editor). Without
  an airtight snapshot/revert story, a bad palette is a destructive edit to the reader's environment.
- **Rules out / trade-off:** a "just apply, no history" shortcut; history costs a little state and one write path.
- **Revisit if:** VS Code ever exposes a first-class transactional theme-preview API that supersedes manual snapshots.

## D2 — Per-language scoping is tokens-only
- **Date:** 2026-07-10
- **Source:** Phase 0.5 web check (VS Code settings + language-override docs).
- **Decision:** Per-language scoping (feature 9) applies to `editor.tokenColorCustomizations` and
  `editor.semanticTokenColorCustomizations` only; workbench chrome stays global. The guide teaches *why*.
- **Why:** `workbench.colorCustomizations` is a workbench setting, **not** language-overridable via the
  `"[languageId]"` syntax — a hard API limit, not a choice. Hiding it would make M5 promise something VS Code
  won't do.
- **Rules out / trade-off:** per-language chrome recoloring. Considered and rejected: reframing as per-*workspace*
  theming (chrome can vary per workspace) — a different feature, noted as a possible extension.
- **Revisit if:** VS Code makes workbench colors language-scopable.

## D3 — Two-layer architecture: pure engine + thin adapter
- **Date:** 2026-07-10
- **Source:** conventions decision (audience: color math = Beginner, VS Code API = New).
- **Decision:** Color math + the 13 profiles live in a `vscode`-free `src/engine/`; all API/side-effect code lives
  in the adapter (`extension.ts`, `panel/`, `theme/`). One `theme/` module is the sole settings write path.
- **Why:** lets the reader unit-test the hardest-to-eyeball part (the color formulas) in plain Node without F5,
  and keeps the "non-destructive" guarantee enforceable at one choke point.
- **Rules out / trade-off:** a quicker all-in-`extension.ts` build; costs a little upfront structure.
- **Revisit if:** the engine ever needs VS Code APIs (it shouldn't — colors are strings in, strings out).

## D4 — All 13 styles taught in full (data-driven)
- **Date:** 2026-07-10
- **Source:** Phase 0 interview (reader chose "all 13 in full" over a taught-subset).
- **Decision:** Every one of the 13 styles gets a worked section. Sprawl is bounded structurally: one shared
  engine, 9 seed-driven generative profiles + 4 fixed-identity signature presets, each a short patterned data
  entry in one registry; grouped into sittings across M3/M4.
- **Why:** the reader explicitly wanted full coverage; the data-driven registry keeps the repetition bounded and
  each profile short rather than an essay.
- **Rules out / trade-off:** the tighter "teach 3–4, ship the rest as data" option; costs more length in M3/M4.
- **Revisit if:** the guide proves too long in practice — collapse the least-instructive profiles to data-only.

## D5 — Pin TypeScript 5.9.x, not 7.0
- **Date:** 2026-07-10
- **Source:** Phase 0.5 web check.
- **Decision:** Pin TypeScript `^5.9.0`.
- **Why:** TS 7.0 (the native compiler) shipped 2026-07-08 — 2 days before the check. Bleeding-edge for a
  beginner-audience guide; 5.9.x is mature and what a fresh `yo code` scaffold most likely still resolves.
- **Rules out / trade-off:** 7.0's ~10× faster builds; not worth the risk here.
- **Revisit if:** a future `/update-stack` run and 7.x has settled into the default scaffold.

## D6 — Pin VS Code engine to current stable (`^1.128.0`)
- **Date:** 2026-07-10
- **Source:** Phase 0.5 web check + acknowledged risk.
- **Decision:** Pin `engines.vscode` and `@types/vscode` to `^1.128.0`.
- **Why:** one consistent teaching target across all milestones. The Webview-View + color APIs have been stable
  since 1.49, so this is a teaching choice, not an API requirement.
- **Rules out / trade-off:** wider install reach — a reader on an older VS Code can lower the floor to `^1.100.0`
  safely (noted so they know it's optional).
- **Revisit if:** the guide targets Marketplace reach (out of scope here) — then lower the floor deliberately.
