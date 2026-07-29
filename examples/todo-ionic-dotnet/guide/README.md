# Todo (Ionic + .NET) — build a small full-stack to-do app

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md), not here** — this page describes intent; `status.md` states reality.

> _Generated with **GuideForge v1.2.0**._

## Objective
You'll build a small to-do app end to end: an **Ionic-Angular** app running in the browser that lists, adds,
toggles-done, edits, filters, and deletes todos by calling a **.NET 10 minimal API**, whose data lives in an
**EF Core in-memory database** (it resets each time the API restarts). When you're done, `dotnet test` is
green (xUnit v3) and `ng test` is green (Karma/Jasmine), and both apps run together on your machine.

## Stack (summary)
Node 24 LTS · Angular 20.3 (standalone) · @ionic/angular 8.8 · .NET 10 + C# 14 · EF Core InMemory 10 —
full verified table + check date: **[foundation/stack.md](foundation/stack.md)**.

## Key decisions
- **EF Core InMemory as the store, but tests drive real HTTP** — keeps the requested in-memory DB without building the suite on a fake Microsoft discourages. → [foundation/decision-log.md](foundation/decision-log.md#d1--ef-core-inmemory-as-the-store-but-tests-drive-the-real-pipeline)
- **.NET minimal API (not controllers)** — the recommended shape for a small new API. → [foundation/decision-log.md](foundation/decision-log.md#d2--minimal-apis-over-controllers)
- **Frontend follows the Ionic scaffold (Angular 20.3 + Karma), not a forced upgrade** — the guide matches what `ionic start` actually produces today. → [foundation/decision-log.md](foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)

## Updates
- 2026-07-21 — Retrofitted to the GuideForge v1.2.0 pedagogy contract: provenance stamp, glossary hygiene (concept headings + deep-links, `addIcons`/`computed()`→inline comments), code interleaved under its instruction (4.2), existing-file edits shown as fragments (4.3), and "Before you start" starting-state notes (7.1). All milestones flagged for re-verify.
- 2026-07-11 — Audit-fix pass (guide had FAILed on stale version labels): propagated D5 across the front-door docs (no more "Vitest"/"Angular 22" where the guide builds Angular 20.3 + Karma), declared the `angular.json` partial edit, gave the build gates concrete output, reworded title-validation to client-side-only, and backfilled 5 glossary terms.
- 2026-07-10 — Audit pass: fixed the spinner-on-every-mutation flash, a dead anchor, an unpinned test count, a namespace-convention mismatch, and added Ionic-term glosses.
- 2026-07-10 — All milestones M0–M8 drafted (backend then frontend, complete code + verify gates).
- 2026-07-10 — Frontend re-pinned to Angular 20.3 + Karma (what `ionic start` scaffolds today); was Angular 22 + Vitest in the plan. See decision D5.
- 2026-07-10 — Guide created.

## Following this guide
1. Read **[foundation/status.md](foundation/status.md)** first — the single source of truth for what's done and verified.
2. Start at **[Milestone 0](MILESTONE_0_workspace/00_overview.md)**; do the milestones in order (each builds on the last).
3. **Type the code — don't paste it.** The complete files are included so you always have an authoritative
   copy to diff against, *not* so you can paste blindly. You'll learn far more by typing each file, reading it
   as you go, and predicting a step's expected output *before* you run it. Reach for paste only to unstick
   yourself when something won't work.
4. If you're following this a while after it was written, run the **review-before-follow** gate first —
   re-check the stack's "Latest stable" column and reconcile any drift before executing (reality wins).
