# STATUS — Todo (Ionic + .NET)

> _Generated with **GuideForge v1.2.0**._

## Frontier
- **Current frontier:** M0 — Workspace & tooling — ⬜ not started.

## Source inputs
<!-- The guide was planned from the idea + audience interview alone; no source files were provided. -->
_Planned from the idea and the audience interview alone — no external source files. Omit re-checks._

## Milestone status
| Milestone | Status | Verified on | Notes |
|-----------|--------|-------------|-------|
| M0 — Workspace & tooling | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |
| M1 — Backend read path | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |
| M2 — Backend full CRUD + CORS | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |
| M3 — Backend tests (xUnit v3) | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |
| M4 — Frontend scaffold | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |
| M5 — Frontend read path | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |
| M6 — Frontend CRUD UI (reality-check gate) | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |
| M7 — Frontend tests (Karma/Jasmine) | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |
| M8 — Polish & full-stack ship-check | ⬜ | — | 2026-07-21: pedagogy-contract retrofit — needs re-verify |

<!-- Status key: ✅ verified (Done-when passed by hand) · ⏳ in progress · ⬜ not started -->

## Drift log
| Date | Where | Guide said | Reality is | Action taken |
|------|-------|-----------|-----------|--------------|
| 2026-07-13 | Audit-fix pass (M4 + status.md) | Assorted low warnings | — | M4/04 now acknowledges `ng generate environments` also added a `fileReplacements` block to the build target (not just the serve target's `proxyConfig`); softened M4/01's rigid `@angular/core 20.3.x` Done-when to match M4/04's reality-wins hedge; unified the status glyph to match PLAN section 3. **M4 needs re-verification (never mark verified without a Done-when run by hand).** _(+ 2026-07-13 re-audit follow-up: first-step nav `prev → —` applied across every milestone's `01_*.md` — cosmetic nav-line only, no Done-when impact.)_ |
| 2026-07-10 | Frontend stack (M4–M8) | Angular 22 + Vitest (approved plan) | `ionic start` scaffolds Angular 20.3 + Karma/Jasmine; ionicons 7; TS 5.9 | Re-pinned to Angular 20.3 + Karma per [decision D5](decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade); updated stack.md, README, conventions, audience-model. |
| 2026-07-11 | README objective, status M7 row, M0/01 Node WHY, decision-log D3 | Still said "Vitest" / "Angular 22" (D5 not fully propagated) | D5 pins Angular 20.3 + Karma/Jasmine | Fixed the stray D5 labels incl. D3's "Angular 22 is standalone-by-default / matches the app's architecture" (caught by re-audit); added a whole-file "superseded by D5" banner + §2 footnote to PLAN.md (kept as historical). |

## Session log
- 2026-07-21 — Retrofitted to the GuideForge v1.2.0 pedagogy contract (provenance stamps, glossary concept-headings + deep-links with `addIcons`/`computed()` demoted to inline comments, 4.2 interleaved code, 4.3 existing-file fragments, 7.1 "Before you start" notes). Foundation docs done this pass; step files retrofitted separately. **All milestones M0–M8 flagged for re-verify — none marked verified.**
- 2026-07-10 — Guide planned and scaffolded. Backend (M0–M3) drafted. Frontend re-pinned to Angular 20.3 + Karma (drift D5) before drafting M4–M8. **Whole guide (M0–M8) now drafted** — 45 step files, dead-link + nav-line + milestone-completeness checks pass. Awaiting a person to follow it and verify each Done-when gate (all milestones remain ⬜ until run by hand).
- 2026-07-11 — Cleared the last re-audit nit: backfilled dedicated glossary entries for every Ionic component / Angular-template term the steps teach (`@for`, `AlertController`, `computed()`, `ion-button/checkbox/input/item-sliding/list/segment/spinner/text`, `ionChange`, Ionic page shell), so "See glossary" pointers now resolve term-specifically rather than to the generic `ion-*` umbrella.
- 2026-07-11 — `audit-guide` re-run (had FAILed: 3 blockers) → **all findings fixed**. Blockers: propagated D5 (removed stray "Vitest"/"Angular 22" from README objective, status M7 row, M0/01 Node WHY; footnoted PLAN §2 as historical). Warnings: declared the `angular.json` serve-target edit as a deliberate partial-of-a-generated-file + rendered the full serve block in M4/04; gave the three "`dotnet build` succeeds" gates the concrete `Build succeeded` form. Lows: reworded the title-required claim to client-side-only (M2 overview + conventions.md — API does no server-side validation); backfilled 5 glossary terms (`addIcons`, `HttpTestingController`, Ionic CLI, Ionic standalone starter, `TestBed`); fixed a garbled sentence (M6/02) and a test mislabel (M3/03). Milestones stay ⬜ pending verification by hand.
- 2026-07-10 — `audit-guide` run (PASS-WITH-WARNINGS: 0 blockers). **All 9 findings fixed**: (W1) mutations now `load(false)` so the list doesn't flash to a spinner; (W2) M6 verify now renders final `home.page.*`; (W3) fixed dead anchor in M8/04; (W4) test count unpinned (3-or-4) in M7/M8; (W5) conventions no longer claims file-scoped namespaces (code uses global namespace by design); (N1–N4) added Ionic-term glosses (`ionic serve`, page shell/checkbox/label, `ion-button`, `ion-spinner`/`ion-text`). Re-checked: all links + anchors + nav lines pass. Milestones stay ⬜ pending verification by hand.
