# STATUS — Live Recolor (VS Code extension)

> _Generated with **GuideForge v1.2.0**._

## Frontier
- **Current frontier:** whole guide (M1→M5) **drafted + audited (twice) + fixes applied; F5 hand-verification pending**. `/audit-guide` ran 2026-07-10 → PASS-WITH-WARNINGS; all findings fixed; re-audit confirmed 4/4 resolved with zero structural/consistency/pedagogy issues. No milestone is ✅ yet — a person must run each Done-when gate (F5 flow + `vsce package`) by hand before any milestone is marked verified.

## Source inputs
| Input file | Used for (stack / scope / decisions) | Provided on | Re-checked on |
|------------|--------------------------------------|-------------|---------------|
| User idea brief (in-prompt spec) | scope, features, milestone ladder seed, starter combos, 13 styles | 2026-07-10 | — |

## Milestone status
| Milestone | Status | Verified on | Notes |
|-----------|--------|-------------|-------|
| M1 — Scaffold + sidebar panel | ⏳ needs re-verify | — | drafted (10 steps + verify); not yet F5-verified by hand; **2026-07-13: audit-fix — M1/09 rendered as a complete file (doc-only, no behavior change)**; **2026-07-21: flagged for re-verify by the pedagogy-contract retrofit** |
| M2 — Non-destructive backbone | ⏳ needs re-verify | — | drafted (5 steps + verify); not yet F5-verified by hand; **2026-07-13: audit-fix — count-reconciliation note added to 06_verify (doc-only)**; **2026-07-21: flagged for re-verify by the pedagogy-contract retrofit** |
| M3 — Color-formula engine (chrome) | ⏳ needs re-verify | — | drafted (7 steps + verify); engine is Node-checkable, F5 not yet run; **2026-07-13: audit-fix — count-reconciliation note added to 08_verify (doc-only)**; **2026-07-21: flagged for re-verify by the pedagogy-contract retrofit** |
| M4 — Preset gallery + panel UX (reality-check gate) | ⏳ needs re-verify | — | drafted (5 steps + verify); not yet F5-verified by hand; **2026-07-13: double-apply bug fixed in `main.js`**; **2026-07-21: flagged for re-verify by the pedagogy-contract retrofit** |
| M5 — Tokens, persistence, packaging | ⏳ needs re-verify | — | drafted (9 steps + verify); not yet F5-verified / packaged by hand; **2026-07-13: double-apply bug fixed in final `main.js`**; **2026-07-21: flagged for re-verify by the pedagogy-contract retrofit** |

<!-- Status key: ✅ verified (Done-when passed by hand) · ⏳ in progress · ❌ not started -->

> **Verification honesty note:** this guide builds a VS Code extension whose "done" is observed in a running
> Extension Development Host (F5) — a GUI + editor-host process that is **not** headlessly simulatable here. The
> `src/engine/` color math **is** Node-runnable and unit-checkable without VS Code; the API/webview/apply
> behavior must be verified by a person pressing F5. When a milestone is marked ✅, state which parts were
> machine-verified (engine) vs. observed-in-editor (everything touching `vscode`).

## Drift log
| Date | Where | Guide said | Reality is | Action taken |
|------|-------|-----------|-----------|--------------|
| 2026-07-13 | Audit-fix pass (M1, M2, M3, M4, M5 + conventions) | Assorted minor/low audit findings | — | Non-major audit fixes: noted the `resolveWebviewView` `_context`/`_token` param drop (M4/04 + M5/06); removed the never-used "command ids" from conventions.md load-bearing names + casing example (the extension contributes no commands); reconciled overview-vs-walkthrough check counts (M2/06, M3/08, M4/06 verify); rendered M1/09's `ThemePanelProvider.ts` as a complete file (was the lone partial snippet). **M1-M5 need F5 re-verification (never mark verified without a Done-when run by hand).** _(+ 2026-07-13 re-audit follow-up: first-step nav `prev → —` applied across every milestone's `01_*.md` — cosmetic nav-line only, no Done-when impact.)_ |
| 2026-07-13 | M4/03 + M4/06 verify, M5/07 + M5/10 verify (`media/webview/main.js`) | `render()` ended with `apply()` **and** every chip handler called `render(); apply();` | That fires two identical `apply` messages per pick → the provider snapshots twice → the first **Revert** looks inert (contradicts the M4/06 "one snapshot per apply" gate) | Removed the `apply()` at the end of `render()` (now pure draw); apply once in each click handler plus one apply after the first `render()` in the `init` handler. Reconciled the M4/06 gate + M5/10 Revert check and added an R10 guard in M4/03. |

## Session log
- 2026-07-10 — Plan approved; scaffolded skeleton (README, 6 foundation docs, 5 milestone overview placeholders, feedback log, token ledger). No step content drafted.
- 2026-07-10 — Drafted M1 (Scaffold + sidebar panel): 10 atomic steps + verify, full file checkpoint. Built against stack.md's same-day-verified API facts. **Not executed** — GUI/F5 flow is not headlessly simulatable here; awaiting F5 verification by hand.
- 2026-07-10 — Drafted M2–M5 in one pass (cadence change) via 4 parallel subagents against a locked CODE_SPEC (scratchpad) so code can't drift. M2 (5+verify), M3 (7+verify), M4 (5+verify, reality-check gate), M5 (9+verify). All code verbatim from the spec; subagents reported no logic deviations (M3 dropped an unused `rotate` import from `profiles.ts` — to reconcile vs M4's copy in the audit). Dead-link check clean. **Audit paused** pending user go. Nothing executed/packaged — awaiting F5 + `vsce package` by hand.
- 2026-07-10 — Ran `/audit-guide` over the whole guide: **PASS-WITH-WARNINGS**. Structure/format/link-integrity/scope/code-fidelity essentially spotless across 45 files. Fixed all findings: (1) compile blocker — `applyTheme(set)` was a type error (`SavedSet` ≠ `ThemeResult`); widened `applyTheme` to `Pick<ThemeResult,'chrome'|'tokens'|'semantic'>` and typed `SavedSet.{chrome,tokens,semantic}` as `ChromeColors`/`TokenColors`/`SemanticColors` (also fixed a latent error in the `save` handler) — in M5/03, M5/05, M5/10 + spec; (2) M4 `profiles.ts` unused `rotate` import removed (M4/01, M4/06) so M3→M4 is a clean no-op; (3) pedagogy: glossed "gamma-corrected" (M3/01), tightened "~20 keys" → exact "20" (M3 gates). Re-verified: no stale patterns; the three imported color types are exported by M5 types.ts. Still nothing executed — awaiting F5 + `vsce package` by hand.
- 2026-07-10 — Re-ran `/audit-guide` after the fixes: **PASS-WITH-WARNINGS**, 4/4 prior findings RESOLVED, type chain compiles, 0 structural blockers, 0 cross-milestone drift, 0 pedagogy violations. Only item was this frontier line being stale ("Audit not yet run") — now corrected. Guide is ready for a person to follow. Still nothing executed.
- 2026-07-13 — **Report-issue: double-apply bug.** The webview `render()` ended with `apply()` while every chip handler also called `apply()`, so each pick posted two `apply` messages → two history snapshots → the first Revert looked inert (broke the M4/06 "one snapshot per apply" gate). Fix: `render()` is now pure draw; apply once per click handler + once from `init`. Applied to M4/03, M5/07 and both verify checkpoints; gate/Revert wording reconciled; R10 guard added. M4/M5 flagged ⚠ re-verify. Nothing executed — awaiting F5 by hand.
- 2026-07-13 — Confirmation re-audit of the double-apply fix: **PASS** (no bare `apply()` in `render()`, init applies once in all 4 files, fences balanced, no new dead links). Still awaiting F5 by hand.
- 2026-07-21 — **Retrofit to the GuideForge v1.2.0 pedagogy contract.** Foundation-docs pass (Part 1): stamped provenance on README/status, converted `foundation/glossary.md` from bullets to `### <term>` concept headings so `#slug` deep-links resolve, and removed the `acquireVsCodeApi()` entry (it's a function → inline code comment, not a glossary concept; per rule 1.1d). Step files (code-under-instruction 4.2, existing-file edits as fragments 4.3, "Before you start" starting-state notes 7.1, and the `acquireVsCodeApi()` inline comment) are handled by a separate step-files pass. All milestones M1–M5 flagged ⏳ needs re-verify; nothing executed — F5 hand-verification still pending.
