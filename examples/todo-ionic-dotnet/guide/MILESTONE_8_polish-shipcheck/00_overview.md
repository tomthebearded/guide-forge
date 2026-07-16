# Milestone 8 — Polish & full-stack ship-check
> Frontend · milestone 9 of 9 · prev: [M7 Frontend tests](../MILESTONE_7_frontend-tests/00_overview.md) · next: —

## Goal
The app handles **loading**, **empty**, and **error** states gracefully instead of showing a blank screen or
failing silently; both servers run together from documented commands; and a final acceptance pass confirms the
whole thing works end to end. A troubleshooting sheet captures the traps a first-timer hits.

## Scope discipline
Polish + docs only. No new features (still just CRUD + filter). This is the last milestone — anything beyond
it (auth, real persistence, deployment, native/Capacitor) is explicitly **out of scope** per [the plan](../PLAN.md)
and listed as "later" in the handoff.

## Prerequisite
[M7](../MILESTONE_7_frontend-tests/00_overview.md) complete: app works and tests pass.

## Steps at a glance
**Sitting 1 — UX states + run docs (01–02)**
1. [Add loading / empty / error states](01_loading-empty-error.md)
2. [A run-both README for the project](02_run-both.md)

**Sitting 2 — troubleshooting + final acceptance (03–04)**
3. [Write the troubleshooting sheet](03_troubleshooting.md)
4. [Verify the whole app](04_verify.md)

## Design / decisions folded in
- **Loading/error state lives on the service** (signals), so the page just reads it — consistent with the
  signal-based state in [conventions](../foundation/conventions.md#frontend-angularionic-rules).
- **Angular `@if / @else if`** control flow renders exactly one of loading / error / empty / list.

## Done-when gate
- [ ] A cold load shows a spinner, then the list.
- [ ] With no todos, an empty-state message renders (not a blank page).
- [ ] With the backend down, an error message renders (not a silent failure).
- [ ] Both servers start with the README's commands and the full CRUD flow works end to end.

## Handoff
### Recap
Added graceful UX states, a project run-README, and a troubleshooting sheet; verified the full stack.
### Done so far (cumulative)
- Backend + tests (M0–M3); frontend app + tests (M4–M7); **now** polished and shippable for local use.
### Artifacts now in the project
- `frontend/src/app/todo-api.service.ts` (loading/error signals)
- `frontend/src/app/home/home.page.ts` + `home.page.html` (state rendering)
- `README.md` at the **project root** (run instructions)
### Decisions / open issues — the "later" list (all out of scope here)
- **Persistence** — swap EF InMemory for SQLite/Postgres ([D1](../foundation/decision-log.md#d1--ef-core-inmemory-as-the-store-but-tests-drive-the-real-pipeline) has the one-line hook).
- **Auth**, **pagination**, **deployment/hosting**, **Capacitor native builds** — none included; each is a natural next project.
### Next milestone
None — this is the final milestone. 🎉 You have a working, tested Ionic + .NET to-do app.

---
> Frontend · milestone 9 of 9 · prev: [M7 Frontend tests](../MILESTONE_7_frontend-tests/00_overview.md) · next: —
