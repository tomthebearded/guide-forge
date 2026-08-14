# PROGRESS — An idempotent Minimal API in .NET

> _What has actually been **executed**, step by step. The guide describes intent, [`status.md`](status.md)
> states the guide's state — this file states **where you are in it**._
>
> Tick a step the moment you finish it, not at the end of a sitting: every maintenance skill that must avoid
> rewriting work you have already done reads this file to find the boundary. An unticked step is treated as
> **not done**, and an unticked guide is a guide those skills cannot safely amend.

> **Nothing below is ticked, and that is the honest state of this guide.** Its code *has* been compiled and
> tested — twice, by audits, from the checkpoints — but **nobody has followed the guide**, which is the only
> thing this ledger counts. A row is ticked when a reader executed that step as written and watched its
> **Done when**, not when the code it produces is known to work. See [`status.md`](status.md).

## Legend
| Mark | Meaning |
|------|---------|
| `[ ]` | not executed yet |
| `[x]` | executed, and the step's **Done when** was observed |
| `[~]` | executed, but the **Done when** did not pass (or was skipped) — the row says what is outstanding |
| `[!]` | executed, then **invalidated** by a later change to the guide — the row names the retrofit that repairs it |

## Current position
- **Last executed:** nothing yet.
- **Next up:** M1 / `01_create-the-solution.md`.

## MILESTONE_1 — Skeleton and the first passing integration test
- [ ] `01_create-the-solution.md` — Create the solution and the API project
- [ ] `02_the-health-endpoint.md` — Replace the template endpoint with `/health`
- [ ] `03_the-test-project.md` — Add the test project
- [ ] `04_first-integration-test.md` — Write the first integration test
- [ ] `05_verify.md` — milestone gate

## MILESTONE_2 — Accept a command, read it back
- [ ] `01_the-command-model.md` — Give the app's data shapes a home
- [ ] `02_the-in-memory-store.md` — Add the in-memory store
- [ ] `03_post-and-get-endpoints.md` — Add the POST and GET endpoints
- [ ] `04_the-round-trip-test.md` — Test the round trip
- [ ] `05_verify.md` — milestone gate

## MILESTONE_3 — Idempotency
- [ ] `01_require-the-key.md` — Require an `Idempotency-Key`
- [ ] `02_replay-the-stored-response.md` — Replay the stored response
- [ ] `03_the-idempotency-test.md` — Prove it: the idempotency tests
- [ ] `04_verify.md` — milestone gate

## MILESTONE_4 — Durability across a restart
- [ ] `01_the-store-seam.md` — Put a seam in front of the store
- [ ] `02_the-file-store.md` — Write the file-backed store
- [ ] `03_swap-in-the-file-store.md` — Swap in the file store
- [ ] `04_the-restart-test.md` — Prove it survives a restart
- [ ] `05_verify.md` — milestone gate

## MILESTONE_5 — Errors, validation, conflict
- [ ] `01_problem-details.md` — Give every failure a body
- [ ] `02_validate-the-request.md` — Validate the request
- [ ] `03_the-conflict-case.md` — Reject a reused key with a changed payload
- [ ] `04_the-error-tests.md` — Test every failure
- [ ] `05_verify.md` — milestone gate
