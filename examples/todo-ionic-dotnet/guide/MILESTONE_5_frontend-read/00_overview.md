# Milestone 5 — Frontend read path
> Frontend · milestone 6 of 9 · prev: [M4 Frontend scaffold](../MILESTONE_4_frontend-scaffold/00_overview.md) · next: [M6 Frontend CRUD UI](../MILESTONE_6_frontend-crud/00_overview.md)

## Goal
The home page fetches todos from the live backend through a `TodoApiService` and renders them in an Ionic
list. This is the first end-to-end vertical slice: browser → proxy → API → in-memory store → back to the
browser.

## Scope discipline
Read only. **No add/edit/toggle/delete/filter UI yet** (all [M6](../MILESTONE_6_frontend-crud/00_overview.md)) —
the checkbox shown here is display-only. No loading/empty/error states yet ([M8](../MILESTONE_8_polish-shipcheck/00_overview.md)).
No tests ([M7](../MILESTONE_7_frontend-tests/00_overview.md)).

## Prerequisite
[M4](../MILESTONE_4_frontend-scaffold/00_overview.md) complete: the Ionic app runs and the proxy forwards
`/api` to the backend.

## Steps at a glance
**Sitting 1 — model + service (01–02)**
1. [Define the `Todo` model](01_todo-model.md)
2. [Create the `TodoApiService`](02_todo-api-service.md)

**Sitting 2 — render + checkpoint (03–04)**
3. [Render the list on the home page](03_home-list.md)
4. [Verify the milestone](04_verify.md)

## Design / decisions folded in
- The **`Todo` shape matches the backend** contract exactly ([conventions](../foundation/conventions.md#the-todo-contract-load-bearing--identical-on-both-sides)).
- **State lives in a signal** on the service ([conventions](../foundation/conventions.md#frontend-angularionic-rules)).
- **Standalone Ionic list components** imported from `@ionic/angular/standalone` ([D3](../foundation/decision-log.md#d3--standalone-ionic-components-over-ionicmodule)).

## Done-when gate
- [ ] With both servers running, `http://localhost:8100` shows a "Todos" page listing **Buy groceries** and
      **Walk the dog**, each in an `ion-item`, "Walk the dog" with a checked (but non-interactive) checkbox.
- [ ] The list is real API data: stop the backend, reload — the list is empty and a console error appears
      (confirming it wasn't hard-coded).

## Handoff
### Recap
Added the `Todo` model, a `TodoApiService` that GETs the list into a signal, and a home page that renders it.
### Done so far (cumulative)
- Backend complete (M0–M3); Ionic shell + proxy (M4); **now** the app shows live todos.
### Artifacts now in the project
- `frontend/src/app/todo.ts` (new)
- `frontend/src/app/todo-api.service.ts` (new)
- `frontend/src/app/home/home.page.ts` (rewritten)
- `frontend/src/app/home/home.page.html` (rewritten)
### Decisions / open issues
- Checkbox is display-only until M6 wires the toggle.
### Next milestone
[M6 — Frontend CRUD UI](../MILESTONE_6_frontend-crud/00_overview.md): add/toggle/edit/delete/filter from the
UI. Done-when: full CRUD works from the browser and survives a refresh.
