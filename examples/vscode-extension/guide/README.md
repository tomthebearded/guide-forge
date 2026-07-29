# Live Recolor — build a VS Code extension that live-recolors the entire editor

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md), not here** — this page describes intent; `status.md` states reality.

> _Generated with **GuideForge v1.2.0**._

## Objective
You'll build a VS Code extension (TypeScript) with a **sidebar panel in the Activity Bar** that generates and
instantly applies a full editor color theme — **workbench chrome *and* syntax/semantic tokens** — from a
*starter color combination* plus a *visual style preset*. Every apply is **live** (no reload) and
**non-destructive** (a snapshot is taken before every write; Revert steps back, Reset removes everything).
"Done" is observable: press <kbd>F5</kbd>, open the panel, pick a combo + style, and watch the whole editor
recolor live — then Save the result, export/import it as JSON, scope its token colors per language, and Revert
or Reset. The finish line is a packaged **`.vsix`**.

## Stack (summary)
TypeScript 5.9 · VS Code engine `^1.128.0` (`@types/vscode ^1.128.0`) · Node 24 LTS · packaged with `@vscode/vsce` —
full verified table + official docs + check date: **[foundation/stack.md](foundation/stack.md)**.

## Key decisions
- **Non-destructive backbone, introduced small (M2).** The extension writes to your *real* `settings.json`, so
  snapshot-before-every-write is the whole safety story. → [foundation/decision-log.md](foundation/decision-log.md#d1--non-destructive-backbone-is-load-bearing)
- **One write path + a pure engine.** All settings writes funnel through one module; the color math lives in a
  `vscode`-free engine so it's unit-testable. → [foundation/decision-log.md](foundation/decision-log.md#d3--two-layer-architecture-pure-engine--thin-adapter)
- **Per-language scoping is tokens-only.** `workbench.colorCustomizations` can't be language-scoped — a hard API
  limit we teach rather than hide. → [foundation/decision-log.md](foundation/decision-log.md#d2--per-language-scoping-is-tokens-only)
- **All 13 styles taught in full**, via a data-driven `StyleProfile` registry (9 generative + 4 signature). →
  [foundation/decision-log.md](foundation/decision-log.md#d4--all-13-styles-taught-in-full-data-driven)

## Updates
- 2026-07-21 — Retrofitted to the GuideForge v1.2.0 pedagogy contract: provenance stamp, glossary hygiene (concept headings + deep-links, `acquireVsCodeApi()`→inline comment), code interleaved under its instruction (4.2), existing-file edits shown as fragments (4.3), and "Before you start" starting-state notes (7.1). All milestones flagged for re-verify.
- 2026-07-13 — fixed: webview double-apply — `render()` no longer calls `apply()`, so each pick makes exactly one history snapshot (M4/03, M5/07 + verifies; M4/M5 flagged for re-verify).
- 2026-07-10 — M2–M5 drafted in one pass (against a locked code spec). Whole guide now drafted; audit + F5 hand-verification pending.
- 2026-07-10 — M1 (Scaffold + sidebar panel) drafted — 10 steps + verify; awaiting F5 hand-verification.
- 2026-07-10 — Guide created (plan approved, skeleton scaffolded).

## Following this guide
1. Read **[foundation/status.md](foundation/status.md)** first — the single source of truth for what's done and verified.
2. Start at **[Milestone 1](MILESTONE_1_scaffold-sidebar/00_overview.md)**; do the milestones in order (each builds on the last).
3. **Type the code — don't paste it.** The complete files are included so you always have an authoritative copy
   to diff against, *not* so you can paste blindly. You'll learn far more by typing each file, reading it as you
   go, and predicting a step's expected output *before* you run it. Reach for paste only to unstick yourself.
4. If you're following this a while after it was written, run the **review-before-follow** gate first — re-check
   the stack's "Latest stable" column and reconcile any drift before executing (reality wins).
