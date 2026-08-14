# Milestone 1 — Skeleton and the first passing integration test
> Foundation · milestone 1 of 5 · prev: — · next: [Accept a command](../MILESTONE_2_accept-and-read-back/00_overview.md) · start: [Create the solution and the API project](01_create-the-solution.md)

## Goal

Get a two-project solution building, and prove that a test can boot the API **inside the test process** and
call it over HTTP. Nothing about commands or idempotency yet — this milestone exists to make the rest of the
guide checkable, because from here on every acceptance gate is a test.

## Prerequisite

The .NET 10 SDK installed. Check with `dotnet --version`; you should see `10.0.302` or another `10.0.*`
build. Everything else in this milestone is created from scratch.

## Steps at a glance

**Sitting 1 — the projects (01–03)**
1. [Create the solution and the API project](01_create-the-solution.md)
2. [Replace the template endpoint with `/health`](02_the-health-endpoint.md)
3. [Add the test project](03_the-test-project.md)

**Sitting 2 — the first gate (04–05)**
4. [Write the first integration test](04_first-integration-test.md)
5. [Verify](05_verify.md)

## Design / decisions folded in

- Two projects, `src/Api` and `tests/Api.Tests` — recorded in [../foundation/conventions.md](../foundation/conventions.md).
- Tests are the guide's gates, not a supplement — D3 in [../foundation/decision-log.md](../foundation/decision-log.md).
- `Minimal API`, `SUT` — taught in [step 01](01_create-the-solution.md); `camelCase JSON` in [step 02](02_the-health-endpoint.md); all defined in [../foundation/glossary.md](../foundation/glossary.md).
- `integration test`, `content root` — taught in [step 03](03_the-test-project.md); `WebApplicationFactory` and `top-level statements` in [step 04](04_first-integration-test.md).
- Why `public partial class Program { }` is **not** in this guide, though the docs still ask for it — taught in [step 04](04_first-integration-test.md); recorded in [../foundation/stack.md](../foundation/stack.md).
- The default runner stays VSTest — D2 in [../foundation/decision-log.md](../foundation/decision-log.md).

---
> Foundation · milestone 1 of 5 · prev: — · next: [Accept a command](../MILESTONE_2_accept-and-read-back/00_overview.md) · start: [Create the solution and the API project](01_create-the-solution.md)
