# An idempotent Minimal API in .NET — proven by `dotnet test`

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md), not here** — this page describes intent; `status.md` states
> reality.

> _Generated with **GuideForge v1.14.1**._

## Objective

You'll build a small HTTP service that accepts *commands* carrying an `Idempotency-Key` header. Send the same
command twice with the same key and you get the same response back and exactly **one** stored record — not
two. The state survives a restart, because it lives on disk rather than in memory.

"Done" is observable as a single command: **`dotnet test`**. Every acceptance gate in this guide is an
integration test that drives the real HTTP pipeline in-process — routing, model binding, serialization — so
there is no browser to open, no second terminal to keep alive, and no `curl` to type. If the suite is green,
the guide's claims are true on your machine.

## Stack (summary)

.NET 10 (LTS, supported to 2028-11-14) · ASP.NET Core Minimal APIs · xUnit ·
`Microsoft.AspNetCore.Mvc.Testing` for in-process integration tests · no database, no external service to
install. Full verified table with official docs and check date:
**[foundation/stack.md](foundation/stack.md)**.

## Key decisions

- **The store is a file, not a database.** It is a teaching device that makes "survives a restart" provable
  without asking you to install anything. It would not survive two writers. Recorded as D1 in
  [foundation/decision-log.md](foundation/decision-log.md).
- **Idempotency is written by hand.** ASP.NET Core ships no idempotency filter or store — verified, not
  assumed. That is why this guide exists: the logic is the lesson.
- **Tests are the gates.** Not a supplement to the guide, the guide's proof. See D3.

Full rationale, including the risks accepted when the plan was approved:
[foundation/decision-log.md](foundation/decision-log.md).

## Following this guide

**Type the code, don't paste it.** Each step says *where* a fragment goes and *why* it's there, and that
context is the thing you're here for. The complete file contents rendered in each milestone's `NN_verify.md`
are an authoritative reference to diff against when you suspect you've drifted — not an invitation to paste
your way to the end.

Commit at the end of every step. Every step is cut so the project still builds when it ends, which makes each
step boundary a free restore point.

Start at [Milestone 1](MILESTONE_1_skeleton-and-first-test/00_overview.md).

## Updates

| Date | What changed |
|------|--------------|
| 2026-08-14 | Fixed: all three break recipes described a failure the reader does not get. The M5 one did not fail at all — the `||`→`&&` mutation left the suite green, because no test covered a reused key with **one** field changed. A fifth error test now pins that branch, so the suite is **14 tests** (M5/04, M5/05, M1/03). The M4 and M3 recipes now name the failure that actually appears first — an exception before an assertion, and the assertion that shadows the one they named. |
| 2026-08-14 | Fixed: every gate quoted CLI output that only appears when the output is redirected — `0 Error(s)` for `dotnet build`, the padded `Passed!  - Failed:` line for `dotnet test`. All 24 build gates and the M1/03 walkthrough now name what a terminal prints (all milestones). |
| 2026-08-14 | Fixed: three prose leftovers from the deleted "expose `Program`" step (M1/04, M2 overview, M2/03). |
| 2026-08-14 | Guide planned and drafted against .NET 10 (SDK 10.0.302), stack verified online. |
