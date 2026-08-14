# Milestone 3 — Idempotency
> Core · milestone 3 of 5 · prev: [Accept a command](../MILESTONE_2_accept-and-read-back/00_overview.md) · next: [Durability](../MILESTONE_4_durability/00_overview.md) · start: [Require an Idempotency-Key](01_require-the-key.md)

## Goal

Make a retry harmless. A client sends `POST /commands` with an `Idempotency-Key` header; if the same key
arrives again, the service returns the **same response** it returned the first time and stores **no second
record**. By the end, a test proves both halves of that sentence.

## Prerequisite

[Milestone 2](../MILESTONE_2_accept-and-read-back/00_overview.md) complete: `dotnet test` green with four
tests, `POST /commands` answering `201` with a `Location` header.

## Steps at a glance

**Sitting 1 — the whole milestone (01–04)**
1. [Require an `Idempotency-Key`](01_require-the-key.md)
2. [Replay the stored response](02_replay-the-stored-response.md)
3. [Prove it: the idempotency tests](03_the-idempotency-test.md)
4. [Verify](04_verify.md)

## Design / decisions folded in

- `idempotency key`, `idempotent` — taught in [step 01](01_require-the-key.md); defined in [../foundation/glossary.md](../foundation/glossary.md).
- Header binding with `[FromHeader]` — taught in [step 01](01_require-the-key.md).
- Changing a method signature fixes its call sites in the same step — taught in [step 02](02_replay-the-stored-response.md); the rule is in [../foundation/conventions.md](../foundation/conventions.md).
- A test that asserts on totals owns its own application — taught in [step 03](03_the-idempotency-test.md).
- Reusing a key with a *different* body is a `409`, not a replay — deferred to [M5](../MILESTONE_5_errors-and-conflict/00_overview.md); recorded as D4 in [../foundation/decision-log.md](../foundation/decision-log.md).

> **This is the guide's reality-check gate.** When the milestone's gate passes, stop and read what you built
> before going further: everything after this makes it durable and well-mannered, but the idea is done here.

---
> Core · milestone 3 of 5 · prev: [Accept a command](../MILESTONE_2_accept-and-read-back/00_overview.md) · next: [Durability](../MILESTONE_4_durability/00_overview.md) · start: [Require an Idempotency-Key](01_require-the-key.md)
