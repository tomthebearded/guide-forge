# Milestone 3 — Backend tests (xUnit v3)
> Backend · milestone 4 of 9 · prev: [M2 Backend CRUD + CORS](../MILESTONE_2_backend-crud-cors/00_overview.md) · next: [M4 Frontend scaffold](../MILESTONE_4_frontend-scaffold/00_overview.md)

## Goal
An xUnit v3 test project that drives the real HTTP pipeline via `WebApplicationFactory<Program>` and locks in
every endpoint's behavior. `dotnet test` runs them all green.

## Scope discipline
Tests only — no changes to the API's behavior (if a test reveals a bug, fix the API and note it, but don't
add features). Backend tests **do not** treat the InMemory provider as a database fake — they go through the
real app ([decision D1](../foundation/decision-log.md#d1--ef-core-inmemory-as-the-store-but-tests-drive-the-real-pipeline)).
No frontend work here.

## Prerequisite
[M2](../MILESTONE_2_backend-crud-cors/00_overview.md) complete: all endpoints work via curl. The
`public partial class Program { }` line from M1 must be present (the test host needs it).

## Steps at a glance
**Sitting 1 — create the test project (01)**
1. [Install xUnit v3 templates + create `Api.Tests`](01_create-test-project.md)

**Sitting 2 — write the tests (02–03)**
2. [Test the read + create paths](02_list-and-create-tests.md)
3. [Test update, toggle, delete, and 404](03_update-toggle-delete-tests.md)

**Sitting 3 — checkpoint (04)**
4. [Verify the milestone](04_verify.md)

## Design / decisions folded in
- **xUnit v3 via `xunit.v3.templates`** — `dotnet new xunit` still scaffolds v2 ([stack.md](../foundation/stack.md)).
- **`WebApplicationFactory<Program>`** integration tests over the real pipeline — [D1](../foundation/decision-log.md#d1--ef-core-inmemory-as-the-store-but-tests-drive-the-real-pipeline).
- **`global.json` `test.runner`** — on the .NET 10 SDK, xUnit v3 runs on the Microsoft Testing Platform, which
  `dotnet test` needs told about (see step 01). Get this wrong and `dotnet test` finds zero tests.

## Done-when gate
- [ ] `dotnet test` (from `backend/Api.Tests`) passes with 6 tests:
  ```text
  Passed!  - Failed: 0, Passed: 6, Skipped: 0
  ```
- [ ] The suite covers list, create, update, toggle, delete, and the 404 path.

## Handoff
### Recap
Added an xUnit v3 project that spins up the app in-process and asserts each endpoint's contract.
### Done so far (cumulative)
- Toolchain (M0); read + seed (M1); full CRUD + CORS (M2); **now** a green backend test suite.
### Artifacts now in the project
- `backend/global.json` (new — MTP runner setting)
- `backend/Api.Tests/Api.Tests.csproj` (new)
- `backend/Api.Tests/TodosApiTests.cs` (new)
- (unchanged: everything under `backend/Api/`)
### Decisions / open issues
- Tests share one in-memory store per test class, so each test creates its own todo and never asserts exact
  list counts — a deliberate isolation choice.
### Next milestone
[M4 — Frontend scaffold](../MILESTONE_4_frontend-scaffold/00_overview.md): the backend is done; now stand up
the Ionic app. Done-when: `ionic serve` shows the shell and `/api` proxies to `:5080`.
