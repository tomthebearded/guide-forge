# Milestone 0 — Workspace & tooling
> Setup · milestone 1 of 9 · prev: — · next: [M1 Backend read path](../MILESTONE_1_backend-read/00_overview.md)

## Goal
The toolchain is installed and verified, and the project root exists with a `backend/` folder ready for the
API. By the end you can prove Node, the .NET SDK, and the Ionic CLI are all the right versions. No app code
yet — this milestone only makes the ground solid so nothing later fails for a missing tool.

## Scope discipline
This milestone does **not** create any application code, the .NET project (that's [M1](../MILESTONE_1_backend-read/00_overview.md)),
or the Ionic app (that's [M4](../MILESTONE_4_frontend-scaffold/00_overview.md) — `ionic start` creates the
`frontend/` folder itself, so we deliberately do **not** pre-create it here). No xUnit templates yet
(installed in [M3](../MILESTONE_3_backend-tests/00_overview.md), where they're first used).

## Prerequisite
None — this is the first milestone. You need a terminal and permission to install global tools.

## Steps at a glance
**Sitting 1 — verify the toolchain (01–02)**
1. [Verify Node, .NET, and install the Ionic CLI](01_prerequisites.md)
2. [Create the project folder skeleton](02_folder-skeleton.md)

**Sitting 2 — checkpoint (03)**
3. [Verify the milestone](03_verify.md)

## Design / decisions folded in
- Versions come from [foundation/stack.md](../foundation/stack.md) — Node 24 LTS, .NET 10, Ionic CLI 7.2.
- Two-folder repo layout (`backend/` + `frontend/`) per [foundation/conventions.md](../foundation/conventions.md#repo-layout).

## Done-when gate
- [ ] `node -v` → prints `v24.` followed by the patch, e.g. `v24.15.0`.
- [ ] `dotnet --version` → prints `10.0.` followed by the patch, e.g. `10.0.100`.
- [ ] `ionic -v` → prints `7.2.` followed by the patch, e.g. `7.2.1`.
- [ ] The project root contains a `backend/` folder (empty for now); `frontend/` does **not** exist yet.

## Handoff
### Recap
Toolchain verified; the project root and `backend/` folder exist.
### Done so far (cumulative)
- Node 24, .NET 10 SDK, and Ionic CLI 7.2 confirmed present at the right versions.
- Project root created with an empty `backend/` folder.
### Artifacts now in the project
- `todo-ionic-dotnet/` (project root)
- `todo-ionic-dotnet/backend/` (empty)
### Decisions / open issues
- `frontend/` is intentionally absent until M4 (`ionic start` creates it).
### Next milestone
[M1 — Backend read path](../MILESTONE_1_backend-read/00_overview.md): a .NET 10 minimal API that returns
seeded todos from an EF Core in-memory database. Done-when: `GET /api/todos` returns the seeded JSON array.

---
> Setup · milestone 1 of 9 · prev: — · next: [M1 Backend read path](../MILESTONE_1_backend-read/00_overview.md)
