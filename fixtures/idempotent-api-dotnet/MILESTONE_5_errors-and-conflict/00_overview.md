# Milestone 5 — Errors, validation, conflict
> Polish · milestone 5 of 5 · prev: [Durability](../MILESTONE_4_durability/00_overview.md) · next: — · start: [Give every failure a body](01_problem-details.md)

## Goal

Make the service's failures as well-defined as its successes. Every error answers with a `ProblemDetails`
body instead of a bare status code, an invalid command is rejected before it is stored, and reusing an
idempotency key with a **different** payload becomes a `409 Conflict` rather than a silent replay of
someone else's command.

That last one is what separates an idempotency key from a cache, and it is the milestone's most important
test.

## Prerequisite

[Milestone 4](../MILESTONE_4_durability/00_overview.md) complete: `dotnet test` green with nine tests, twice
in a row.

## Steps at a glance

**Sitting 1 — the whole milestone (01–05)**
1. [Give every failure a body](01_problem-details.md)
2. [Validate the request](02_validate-the-request.md)
3. [Reject a reused key with a changed payload](03_the-conflict-case.md)
4. [Test every failure](04_the-error-tests.md)
5. [Verify](05_verify.md)

## Design / decisions folded in

- `ProblemDetails` — taught in [step 01](01_problem-details.md); defined in [../foundation/glossary.md](../foundation/glossary.md).
- Validate before storing, never after — taught in [step 02](02_validate-the-request.md).
- Key reuse with a changed body is a `409`, not a replay — recorded as D4 in [../foundation/decision-log.md](../foundation/decision-log.md); taught in [step 03](03_the-conflict-case.md).

---
> Polish · milestone 5 of 5 · prev: [Durability](../MILESTONE_4_durability/00_overview.md) · next: — · start: [Give every failure a body](01_problem-details.md)
