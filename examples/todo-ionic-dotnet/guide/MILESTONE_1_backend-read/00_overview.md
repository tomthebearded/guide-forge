# Milestone 1 — Backend read path
> Backend · milestone 2 of 9 · prev: [M0 Workspace](../MILESTONE_0_workspace/00_overview.md) · next: [M2 Backend CRUD + CORS](../MILESTONE_2_backend-crud-cors/00_overview.md)

## Goal
A .NET 10 minimal API that, on `GET http://localhost:5080/api/todos`, returns a JSON array of seeded todos
read from an EF Core in-memory database. This is the first runnable, observable slice of the backend — you
hit one URL and see real data.

## Scope discipline
Read only. This milestone does **not** add create/update/delete endpoints or CORS (both are
[M2](../MILESTONE_2_backend-crud-cors/00_overview.md)), and no tests (that's
[M3](../MILESTONE_3_backend-tests/00_overview.md)). The `Todo` shape and the `/api/todos` route are
established here and must not change later.

## Prerequisite
[M0](../MILESTONE_0_workspace/00_overview.md) complete: .NET 10 SDK verified, `backend/` folder exists.

## Steps at a glance
**Sitting 1 — create the project (01)**
1. [Create the API project + add EF Core InMemory](01_create-api-project.md)

**Sitting 2 — model, endpoint, run (02–04)**
2. [Define the `Todo` entity and `TodoDb` context](02_todo-and-dbcontext.md)
3. [Add the GET endpoint](03_endpoints-get.md)
4. [Wire up `Program.cs`: register, seed, run](04_program-seed-run.md)

**Sitting 3 — checkpoint (05)**
5. [Verify the milestone](05_verify.md)

## Design / decisions folded in
- **Minimal APIs, not controllers** — [decision D2](../foundation/decision-log.md#d2--minimal-apis-over-controllers).
- **EF Core InMemory as the store** — [decision D1](../foundation/decision-log.md#d1--ef-core-inmemory-as-the-store-but-tests-drive-the-real-pipeline).
- **Endpoints in a `TodoEndpoints` extension**, `Program.cs` stays thin — [conventions](../foundation/conventions.md#backend-c-rules).
- The `Todo` contract (`id`/`title`/`isDone`) is defined in [conventions](../foundation/conventions.md#the-todo-contract-load-bearing--identical-on-both-sides).

## Done-when gate
- [ ] `dotnet run` from `backend/Api` starts and logs `Now listening on: http://localhost:5080`.
- [ ] `GET http://localhost:5080/api/todos` → HTTP 200 with:
  ```json
  [{"id":1,"title":"Buy groceries","isDone":false},{"id":2,"title":"Walk the dog","isDone":true}]
  ```

## Handoff
### Recap
Built a minimal API whose `GET /api/todos` returns two seeded todos from an in-memory EF Core store.
### Done so far (cumulative)
- Toolchain verified (M0).
- A runnable .NET 10 API at `http://localhost:5080` with a working read endpoint and seeded data.
### Artifacts now in the project
- `backend/Api/Api.csproj`
- `backend/Api/Todo.cs`
- `backend/Api/TodoDb.cs`
- `backend/Api/TodoEndpoints.cs` (GET only)
- `backend/Api/Program.cs`
- `backend/Api/Properties/launchSettings.json` (pins port 5080)
### Decisions / open issues
- The in-memory store resets on every restart — by design; seeding re-runs on startup.
- Writes (POST/PUT/PATCH/DELETE) and CORS are not here yet — next milestone.
### Next milestone
[M2 — Backend full CRUD + CORS](../MILESTONE_2_backend-crud-cors/00_overview.md): every verb works and the
browser origin is allowed. Done-when: each of POST/PUT/PATCH/DELETE succeeds via curl and the CORS header is present.
