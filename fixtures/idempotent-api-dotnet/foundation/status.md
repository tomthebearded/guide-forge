# STATUS — An idempotent Minimal API in .NET

> _Generated with **GuideForge v1.14.1**._
> _Last updated with **GuideForge v1.15.0** on 2026-08-14._

> **This file is the single source of truth for what is actually done.** The guide describes intent; only this
> page states reality. A milestone is ✅ **only** after its Done-when gate has been run and observed — for this
> guide that means `dotnet test` was executed and reported the milestone's tests passing.

## Frontier

- **Current frontier:** the guide is **drafted, and its code has been executed — by audits, not by a reader.**
  On 2026-08-14 an audit followed M1 verbatim and then built the guide's final state end to end on SDK
  10.0.302: the solution compiles clean and **all 13 tests passed**. A second audit the same day re-ran both
  CLI gates *in a terminal* rather than through a captured stream, and found that every gate in the guide
  quoted the redirected rendering of the output (see drift log rows 2 and 3). A later execution run typed all
  19 steps in order and found the three break recipes wrong (rows 5–7); fixing the worst of them **added a
  fourteenth test**, which is the one line of code in this guide that **has never been run** — the suite was
  13 tests when it was last executed. Six defects total have been fixed.
  **No milestone is ✅** — a milestone is verified when someone follows the guide *as written, in order* and
  watches its gate pass; building the end state from the checkpoints is a weaker check that proves the code,
  not the path. Start following at [M1](../MILESTONE_1_skeleton-and-first-test/00_overview.md).
- **Executed through:** nothing yet — every row in [`progress.md`](progress.md) is unticked. *Executed* there
  means "a reader ran this step and watched its Done-when"; the audit and execution runs above are not that,
  which is why the two files can honestly say "13 tests passed" and "nothing is done" at once.

## Source inputs

| Input | Used for | Provided on | Re-checked on |
|-------|----------|-------------|---------------|
| One-line idea + audience assumptions confirmed in conversation | scope, ladder, audience matrix | 2026-08-14 | — |
| Online stack check (Phase 0.5) | versions, docs links, the two verified facts in `stack.md` | 2026-08-14 | — |
| Local SDK probe (`dotnet --version` → 10.0.302) | the pinned SDK version | 2026-08-14 | — |

## Milestone status

| Milestone | Status | Verified on | Notes |
|-----------|--------|-------------|-------|
| M1 — Skeleton + first integration test | ⏳ gates rewritten 2026-08-14, needs re-verification | — | 4 steps + verify. Built and run on SDK 10.0.302 during the first audit (0 failed, 1 total), but every `dotnet build` gate and the step-03 output walkthrough were rewritten afterwards — re-run them as written |
| M2 — Accept a command, read it back | ⏳ gates rewritten 2026-08-14, needs re-verification | — | 4 steps + verify |
| M3 — Idempotency (reality-check gate) | ⏳ gates rewritten 2026-08-14, needs re-verification | — | 3 steps + verify |
| M4 — Durability across a restart | ⏳ gates rewritten 2026-08-14, needs re-verification | — | 4 steps + verify |
| M5 — Errors, validation, conflict | ⏳ gates rewritten 2026-08-14, needs re-verification | — | 4 steps + verify |

<!-- Status key: ✅ verified (Done-when passed by hand) · 📝 drafted · ⏳ in progress · ❌ not started -->

> **Verification honesty note.** Every gate in this guide is machine-checkable — `dotnet test` with an exit
> code, no GUI and no human judgement in the loop. That means there is no excuse for a milestone staying
> un-ticked once someone runs it, and no ambiguity about what "verified" meant. Until then, this table says
> **drafted**, which is not the same claim as **works**.

## Drift log

| Date | Where | Guide said | Reality is | Action taken |
|------|-------|-----------|-----------|--------------|
| 2026-08-14 | M1 step 04 (`04_expose-program.md`), `stack.md` "two verified facts", `glossary.md` *top-level statements*, `PLAN.md` §2, and the `Program.cs` checkpoint in all five verify files | A whole step taught appending `public partial class Program { }`, because "the generated `Program` class is **not** public … the code will not compile" without it. `stack.md` listed it as a **verified fact** | On .NET 10 the generated class **is** public — `typeof(Program).IsPublic` returns `true`, and a clean rebuild with the line removed compiles and passes. The claim came from Microsoft's integration-tests article, which still says the line is required and has not caught up with the SDK | Step deleted; M1 renumbered to 4 steps + verify. The fact is now taught in step 04 as *why the line you've seen everywhere isn't here*, with the .NET 9 fallback named. `stack.md` fact 1 inverted and marked verified-by-execution; glossary entry rewritten; `PLAN.md` corrected with a dated note; the declaration stripped from every code checkpoint |
| 2026-08-14 | Every `Done when` in the guide (18 gates) | Gates quoted the runner's summary as `Passed!  - Failed: 0, Passed: N` | The line is column-padded with **variable width**: `Failed:     0, Passed:     1` early, `Passed:    13` at the end. No fixed string can match at every gate. **Partly wrong, superseded by the row below** — that padded line is the *redirected* rendering, not what a reader's terminal prints at all | Gates now assert the **values** (`0 failed, N total`) instead of a line to match character by character, and M1 step 03 shows a summary line once, with a note to read the numbers rather than the spacing |
| 2026-08-14 | Every `dotnet build` gate (24, all five milestones), the six `Passed: N` gates, four troubleshooting rows, and the M1 step 03 output walkthrough | `dotnet build` "prints `0 Error(s)`", and `dotnet test` prints `Passed!  - Failed:     0, Passed:     1, …` — presented as *the* summary line every gate is read from | Since .NET 9 the CLI uses the **terminal logger** whenever stdout is a terminal, which is the reader's case. It prints `Build succeeded in 1.5s` with **no error/warning counts**, and `Test summary: total: 1, failed: 0, succeeded: 1, skipped: 0`. The `0 Error(s)` block and the padded `Passed!` line appear **only when the output is redirected** — a pipe, a file, a CI log. Both earlier audit runs captured the output through a pipe, which is precisely why two passes missed it. Confirmed by executing both commands on SDK 10.0.302, the guide's pinned version | All 24 build gates now read `Build succeeded`; the six `Passed: N` gates and four troubleshooting rows converted to the `0 failed, N total` / `total: N` values; M1 step 01 shows the real build output and names the redirected variant in the gate itself; M1 step 03 shows the real test summary and names the redirected variant; a rule-5.1 note added at both steps for the reader who sees the other rendering. Recorded as D6 |
| 2026-08-14 | M5 step 04 *Done when*, action 3 — the guide's headline break recipe | Changing the `||` in the conflict guard to `&&` "must fail" `PostCommand_SameKeyDifferentPayload_ReturnsConflict`, receiving `201` instead of `409` | **The suite stays green — 0 failed, 13 total — with the mutation in place.** The only conflict test posts `("charge","42")` then `("refund","99")`: *both* fields differ, so `existing.Type != request.Type && existing.Payload != request.Payload` is still true and the `409` still fires. The recipe was the symptom; the defect is that **no test in the guide covered a reused key with exactly one field changed**, so nothing in the suite pinned the `||` — the branch the whole milestone is about was half-proven, in a guide whose thesis is that the tests are the proof | A fifth error test added, `PostCommand_SameKeyOnlyPayloadChanged_ReturnsConflict` — same type, different payload — which the `&&` mutation does fail. The suite is now **14 tests**, and the recipe names exactly which one goes red and why the other stays green. Counts updated at M1/03, M5/04 and M5/05, and the M5/05 checkpoint carries the new test. **The fourteenth test has never been executed**: the run that found this was on the 13-test suite |
| 2026-08-14 | M4 step 04 *Done when*, action 3 · M4 `05_verify.md` gate | Commenting out `File.AppendAllText(...)` makes `Command_IsOnDisk_AndReadableFromAFreshlyBuiltApplication` "fail on the **file** assertion" | **Two** tests fail, and the named one does not reach an assertion at all: `File.ReadAllLinesAsync` throws `System.IO.FileNotFoundException` one line before `Assert.Single(lines)`, and `IdempotencyKey_StillReplays_AfterAReload` fails on the id comparison. The point the recipe makes survives; its description of the evidence does not | Both rewritten to the failure the reader actually sees, with a line naming the general case — a test can fail by *throwing* before it asserts, and "which assertion failed" is the wrong question then |
| 2026-08-14 | M3 step 03 *Done when*, action 3 | Commenting out the replay branch makes `PostCommand_SameKeyTwice_ReplaysResponseAndStoresOneCommand` fail "on `Assert.Single`" | It fails on the **body comparison** three lines earlier — `Assert.Equal() Failure: Strings differ` — because xUnit stops a test at its first failing assertion. The named `Assert.Single` never runs, on a page whose whole purpose is teaching the reader to trust what the output says | Rewritten to name the assertion that actually fails and to state the rule behind it. The M3/04 gate needed no change: it points at the step rather than repeating the assertion |
| 2026-08-14 | M1 step 04 (`WebApplicationFactory` callout), M2 `00_overview.md` *Prerequisite*, M2 step 03 action 3 | Three sentences still referred to a `public partial class Program { }` the guide deliberately does not have: "the `Program` you made public **in step 04**", "`Program` public so `WebApplicationFactory<Program>` can find it", and "…`Run()`, **then the partial class**" | Nothing in the guide ever asks the reader to write that declaration — the step that did was deleted in the first drift-log row above, and only the *code* checkpoints were swept then. M2 step 03 action 3 was the worst of the three: it asked the reader to verify a line that is not in their file | The three sentences rewritten to describe what is actually there. Swept the whole guide for `partial class` / "made public": the only remaining mentions are the deliberate ones in M1 step 04's *Why / design*, its `CS0122` failure note, `stack.md` fact 1 and the glossary — all of which teach *why the line is absent* |

## Session log

| Date | What happened |
|------|---------------|
| 2026-08-14 | Guide planned, scaffolded and drafted from `PLAN.md` — five milestones, 19 steps, 5 verify gates |
| 2026-08-14 | First audit: followed M1 verbatim, then built the end state on SDK 10.0.302 (13 tests pass). Found the `public partial class Program { }` defect → step deleted, M1 renumbered, `stack.md` fact 1 inverted (drift row 1); found the `dotnet test` summary quoted as a fixed string → gates converted to values (drift row 2) |
| 2026-08-14 | Second audit (`/audit-guide`): FAIL — 2 BLOCKERs, 9 WARNINGs. Both BLOCKERs were the same root cause, the CLI's terminal logger vs its redirected rendering, confirmed by re-running `dotnet build` and `dotnet test` in a terminal on SDK 10.0.302 |
| 2026-08-14 | `/report-issue` on that report: gate renderings fixed guide-wide (drift row 3), deleted-step prose residues swept (drift row 4), missing definitions and doc links added at M2 step 03 and M4 step 03, M1 verify checkpoint claim scoped, build-vs-borrow recorded in `PLAN.md` and as D7. All five milestones set ⏳ — the gates changed, so nobody has watched the current ones pass |
| 2026-08-14 | An execution run typed all 19 steps in order on SDK 10.0.302: **every gate passed exactly as stated** — 1, 1, 4, 7, 9, 13 tests, green twice, final files matching the M5/05 checkpoint character for character — and **all three break recipes were wrong**. Logged, then fixed by `/report-issue`: drift rows 5–7. The M5 one was not a wording defect but a missing test, so the suite gained its fourteenth; that test is the only code here nobody has run. Milestones stay ⏳ |
