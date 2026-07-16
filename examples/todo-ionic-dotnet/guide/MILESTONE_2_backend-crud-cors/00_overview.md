# Milestone 2 — Backend full CRUD + CORS
> Backend · milestone 3 of 9 · prev: [M1 Backend read path](../MILESTONE_1_backend-read/00_overview.md) · next: [M3 Backend tests](../MILESTONE_3_backend-tests/00_overview.md)

## Goal
Every CRUD verb works against the in-memory store — create, read-one, update, toggle-done, delete — and the
API allows requests from the Ionic dev origin (`http://localhost:8100`) via a named CORS policy. After this
milestone the backend is feature-complete for the app.

## Scope discipline
Backend only. No tests yet ([M3](../MILESTONE_3_backend-tests/00_overview.md)); no frontend. No auth,
pagination, or **server-side validation** — the API stores whatever title it's sent; the *non-empty title*
rule is a client-side guard we add in the frontend ([M6](../MILESTONE_6_frontend-crud/00_overview.md)), not
enforced here. All out of scope per [the plan](../PLAN.md). The `Todo` shape and `/api/todos` routes from M1
do not change; we only add verbs.

## Prerequisite
[M1](../MILESTONE_1_backend-read/00_overview.md) complete: the API runs and `GET /api/todos` returns seeded data.

## Steps at a glance
**Sitting 1 — request shapes + endpoints (01–02)**
1. [Add the request DTOs](01_dtos.md)
2. [Add the CRUD endpoints](02_crud-endpoints.md)

**Sitting 2 — allow the browser + checkpoint (03–04)**
3. [Enable CORS for the frontend origin](03_cors.md)
4. [Verify the milestone](04_verify.md)

## Design / decisions folded in
- **DTOs for request bodies**, the entity for responses — [conventions](../foundation/conventions.md#backend-c-rules).
- **Named CORS policy `"frontend"`** + a dev proxy as belt-and-suspenders — [decision D4](../foundation/decision-log.md#d4--dev-proxy-on-the-frontend-instead-of-relying-on-cors).
- The full [API contract](../foundation/conventions.md#api-contract-load-bearing) (verbs, routes, status codes).

## Done-when gate
- [ ] `POST /api/todos` with `{"title":"Test"}` → 201, `Location` header, body `{"id":3,"title":"Test","isDone":false}`.
- [ ] `PUT /api/todos/3` with `{"title":"Test edited","isDone":true}` → 200, body reflects both changes.
- [ ] `PATCH /api/todos/3/toggle` → 200, `isDone` flips to `false`.
- [ ] `DELETE /api/todos/3` → 204; a following `GET /api/todos/3` → 404.
- [ ] A request with header `Origin: http://localhost:8100` gets `Access-Control-Allow-Origin: http://localhost:8100` back.

## Handoff
### Recap
Added create/read-one/update/toggle/delete endpoints and a CORS policy for the Ionic dev origin.
### Done so far (cumulative)
- Toolchain (M0); read endpoint + seed (M1); **now** the full verb set + CORS.
### Artifacts now in the project
- `backend/Api/Dtos.cs` (new)
- `backend/Api/TodoEndpoints.cs` (expanded to all verbs)
- `backend/Api/Program.cs` (CORS added)
- (unchanged: `Todo.cs`, `TodoDb.cs`, `launchSettings.json`, `Api.csproj`)
### Decisions / open issues
- CORS is configured *and* the frontend will also proxy `/api` in dev — both, deliberately (D4).
### Next milestone
[M3 — Backend tests (xUnit v3)](../MILESTONE_3_backend-tests/00_overview.md): lock this behavior with tests.
Done-when: `dotnet test` green across every endpoint.

---
> Backend · milestone 3 of 9 · prev: [M1 Backend read path](../MILESTONE_1_backend-read/00_overview.md) · next: [M3 Backend tests](../MILESTONE_3_backend-tests/00_overview.md)
