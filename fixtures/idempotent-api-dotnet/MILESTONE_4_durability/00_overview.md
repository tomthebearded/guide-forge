# Milestone 4 — Durability across a restart
> Core · milestone 4 of 5 · prev: [Idempotency](../MILESTONE_3_idempotency/00_overview.md) · next: [Errors and conflict](../MILESTONE_5_errors-and-conflict/00_overview.md) · start: [Put a seam in front of the store](01_the-store-seam.md)

## Goal

Move the store to disk, so a command outlives the process that created it. The gate proves it twice over: a
command written through one application is readable through a **freshly built** one, **and** it is physically
present in the data file.

## Prerequisite

[Milestone 3](../MILESTONE_3_idempotency/00_overview.md) complete: `dotnet test` green with seven tests, and
you have watched the idempotency gate fail and pass.

## Steps at a glance

**Sitting 1 — the seam and the implementation (01–02)**
1. [Put a seam in front of the store](01_the-store-seam.md)
2. [Write the file-backed store](02_the-file-store.md)

**Sitting 2 — the swap and the gate (03–05)**
3. [Swap in the file store](03_swap-in-the-file-store.md)
4. [Prove it survives a restart](04_the-restart-test.md)
5. [Verify](05_verify.md)

## Design / decisions folded in

- `JSON Lines` as the on-disk format — taught in [step 02](02_the-file-store.md); defined in [../foundation/glossary.md](../foundation/glossary.md).
- A file, not a database, and what that costs — recorded as D1 in [../foundation/decision-log.md](../foundation/decision-log.md).
- Configuration read through `builder.Configuration`, so a test can point the app at its own directory — taught in [step 03](03_swap-in-the-file-store.md).
- Why the gate asserts the **file contents** as well as the reload — taught in [step 04](04_the-restart-test.md); the risk is recorded as D5 in [../foundation/decision-log.md](../foundation/decision-log.md).

---
> Core · milestone 4 of 5 · prev: [Idempotency](../MILESTONE_3_idempotency/00_overview.md) · next: [Errors and conflict](../MILESTONE_5_errors-and-conflict/00_overview.md) · start: [Put a seam in front of the store](01_the-store-seam.md)
