# Milestone 6 — Frontend CRUD UI (reality-check gate ⭐)
> Frontend · milestone 7 of 9 · prev: [M5 Frontend read path](../MILESTONE_5_frontend-read/00_overview.md) · next: [M7 Frontend tests](../MILESTONE_7_frontend-tests/00_overview.md)

## Goal
The full to-do experience works from the UI: **add** a todo, **toggle** it done, **edit** its title, **delete**
it, and **filter** by All / Active / Done — each change persisted to the backend and reflected after a refresh.

## ⭐ Reality-check gate
This is the first milestone where you have a genuinely usable app. When it's done, **stop and actually use
it** for a minute: add a few real todos, complete some, delete some. Confirm it's worth finishing (tests +
polish) before moving on. If something feels wrong about the app itself, fix it here.

## Scope discipline
UI + the service mutations only. **No loading/empty/error states yet** ([M8](../MILESTONE_8_polish-shipcheck/00_overview.md)) —
the app assumes the backend is up. No tests ([M7](../MILESTONE_7_frontend-tests/00_overview.md)). No
auth/persistence (out of scope, [the plan](../PLAN.md)).

## Prerequisite
[M5](../MILESTONE_5_frontend-read/00_overview.md) complete: todos render from the API.

## Steps at a glance
**Sitting 1 — service + add/toggle (01–02)**
1. [Add the mutation methods to `TodoApiService`](01_api-mutations.md)
2. [Add-todo input + working toggle](02_add-and-toggle.md)

**Sitting 2 — edit/delete/filter + checkpoint (03–05)**
3. [Edit + delete via a sliding item](03_edit-and-delete.md)
4. [Filter with a segment](04_filter.md)
5. [Verify the milestone](05_verify.md)

## Design / decisions folded in
- **Every mutation calls `load()` afterwards** to re-sync the signal with the server — simple and always correct.
- **Edit uses an `AlertController` prompt**; **delete/edit live behind an `ion-item-sliding`** row.
- **Filtering is a `computed()`** over the todos signal + a filter signal — [conventions](../foundation/conventions.md#frontend-angularionic-rules).

## Done-when gate
- [ ] Typing a title + Add (or Enter) creates a todo that appears in the list and survives a page reload.
- [ ] Tapping a todo's checkbox flips its done state; it survives a reload.
- [ ] Sliding a row left reveals Edit and Delete; Edit opens a prompt that saves a new title; Delete removes the row.
- [ ] The All / Active / Done segment shows the correct subset.
- [ ] **You used the app and it works as a real to-do list.**

## Handoff
### Recap
Wired the full CRUD + filter UI to the backend through `TodoApiService`.
### Done so far (cumulative)
- Backend (M0–M3); Ionic shell + proxy (M4); read path (M5); **now** a working to-do app.
### Artifacts now in the project
- `frontend/src/app/todo-api.service.ts` (mutations added)
- `frontend/src/app/home/home.page.ts` + `home.page.html` (full CRUD + filter)
### Decisions / open issues
- No error handling yet — if the backend is down, actions silently fail. M8 adds loading/empty/error states.
### Next milestone
[M7 — Frontend tests (Karma/Jasmine)](../MILESTONE_7_frontend-tests/00_overview.md): lock the service + page
behavior. Done-when: `ng test` green.
