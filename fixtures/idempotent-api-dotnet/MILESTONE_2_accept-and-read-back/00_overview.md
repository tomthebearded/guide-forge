# Milestone 2 — Accept a command, read it back
> Foundation · milestone 2 of 5 · prev: [Skeleton and the first test](../MILESTONE_1_skeleton-and-first-test/00_overview.md) · next: [Idempotency](../MILESTONE_3_idempotency/00_overview.md) · start: [Give the app's data shapes a home](01_the-command-model.md)

## Goal

Give the service something to do: accept a command over `POST /commands` and hand it back over
`GET /commands/{id}`. By the end, the write/read contract is proven over real HTTP — the status codes, the
`Location` header, and the JSON body all asserted by tests rather than eyeballed.

No idempotency yet. Post the same command twice here and you get two records; making that impossible is
milestone 3's whole job.

## Prerequisite

[Milestone 1](../MILESTONE_1_skeleton-and-first-test/00_overview.md) complete: `dotnet test` green with one
passing health test, driven through `WebApplicationFactory<Program>`.

## Steps at a glance

**Sitting 1 — the shapes and the store (01–02)**
1. [Give the app's data shapes a home](01_the-command-model.md)
2. [Add the in-memory store](02_the-in-memory-store.md)

**Sitting 2 — the endpoints and their gate (03–05)**
3. [Add the POST and GET endpoints](03_post-and-get-endpoints.md)
4. [Test the round trip](04_the-round-trip-test.md)
5. [Verify](05_verify.md)

## Design / decisions folded in

- Records for data, `sealed class` for behaviour — recorded in [../foundation/conventions.md](../foundation/conventions.md).
- `ConcurrentDictionary` over `Dictionary`, because handlers run concurrently — taught in [step 02](02_the-in-memory-store.md).
- `201 Created` + a `Location` header as the create contract — taught in [step 03](03_post-and-get-endpoints.md).
- The store is in memory and disappears on exit; [M4](../MILESTONE_4_durability/00_overview.md) puts it on disk — recorded as D1 in [../foundation/decision-log.md](../foundation/decision-log.md).

---
> Foundation · milestone 2 of 5 · prev: [Skeleton and the first test](../MILESTONE_1_skeleton-and-first-test/00_overview.md) · next: [Idempotency](../MILESTONE_3_idempotency/00_overview.md) · start: [Give the app's data shapes a home](01_the-command-model.md)
