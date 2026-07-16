# Milestone 7 — Frontend tests (Karma/Jasmine)
> Frontend · milestone 8 of 9 · prev: [M6 Frontend CRUD UI](../MILESTONE_6_frontend-crud/00_overview.md) · next: [M8 Polish & ship-check](../MILESTONE_8_polish-shipcheck/00_overview.md)

## Goal
`TodoApiService` and the home page are covered by tests running on the Karma/Jasmine setup the Ionic scaffold
ships. `ng test` runs them green.

## Scope discipline
Tests only — no behavior changes to the app. We use the scaffolded **Karma + Jasmine** runner as-is (not
Vitest — [decision D5](../foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)).
No new features. We replace the scaffold's stale `home.page.spec.ts` (it still tests the deleted "Blank" page).

## Prerequisite
[M6](../MILESTONE_6_frontend-crud/00_overview.md) complete: the app's CRUD works. Chrome must be installed
(Karma launches it).

## Steps at a glance
**Sitting 1 — write the specs (01–02)**
1. [Test `TodoApiService` with `HttpTestingController`](01_service-spec.md)
2. [Test the home page rendering](02_home-spec.md)

**Sitting 2 — checkpoint (03)**
3. [Verify the milestone](03_verify.md)

## Design / decisions folded in
- **Karma + Jasmine** as scaffolded ([D5](../foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)).
- **`HttpTestingController`** mocks HTTP so tests never hit the real backend — [Angular HTTP testing](https://angular.dev/guide/http/testing).
- **`TestBed`** stands up the component with its real dependencies (a mocked `HttpClient`).

## Done-when gate
- [ ] `ng test --watch=false --browsers=ChromeHeadless` (from `frontend/`) exits **0** with all specs passing:
  ```text
  TOTAL: <N> SUCCESS
  ```
  `<N>` is the two service specs + one home-page spec you wrote, **plus** the scaffold's `app.component.spec.ts`
  if it's still there — so expect **3 or 4**. The real gate is "all green, exit 0", not a specific count.

## Handoff
### Recap
Added a service spec (HTTP mocked) and a home-page render spec; replaced the stale scaffold spec.
### Done so far (cumulative)
- Backend + tests (M0–M3); frontend app (M4–M6); **now** frontend tests green.
### Artifacts now in the project
- `frontend/src/app/todo-api.service.spec.ts` (new)
- `frontend/src/app/home/home.page.spec.ts` (replaced)
### Decisions / open issues
- Tests assert on light-DOM text, not Ionic's internal shadow rendering — robust across Karma/Chrome.
### Next milestone
[M8 — Polish & full-stack ship-check](../MILESTONE_8_polish-shipcheck/00_overview.md): loading/empty/error
states and the final run-both acceptance. Done-when: graceful states + full flow works end to end.

---
> Frontend · milestone 8 of 9 · prev: [M6 Frontend CRUD UI](../MILESTONE_6_frontend-crud/00_overview.md) · next: [M8 Polish & ship-check](../MILESTONE_8_polish-shipcheck/00_overview.md)
