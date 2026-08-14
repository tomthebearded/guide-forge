# Feedback log

> Append-only record of friction readers hit while following this guide. One dated entry per report, added by
> `/log-feedback`. **Logging is not fixing** — an entry here records what happened; changing the guide is
> `/report-issue`'s job, and it links back to the entry that prompted it.

## 2026-08-14 — M5/04, the `||` → `&&` break recipe leaves the suite green

- **Where:** `MILESTONE_5_errors-and-conflict/04_the-error-tests.md`, *Done when* action 3.
- **Reader:** an end-to-end execution run of the whole guide — all 19 steps typed in order on the pinned
  toolchain (SDK 10.0.302, Windows), no step skipped and no code taken from a `NN_verify.md` listing. Not a
  human following the ladder; the audience matrix is irrelevant here, since the defect is in what the page
  claims the machine does. Context for all three entries from this run: **every gate passed exactly as
  stated** — 1, 1, 4, 7, 9, 13 tests, green twice in a row, `dotnet build` clean, and the final files matching
  the M5/05 checkpoint character for character.
- **What happened:** the step says to change the `||` in the conflict comparison to `&&`, re-run, and that
  `PostCommand_SameKeyDifferentPayload_ReturnsConflict` **must** fail with `201` instead of `409`. It does
  not: `Passed!  - Failed:     0, Passed:    13, Skipped:     0, Total:    13`. The suite is fully green with
  the mutation in place, because the only conflict test posts `("charge","42")` and then `("refund","99")` —
  *both* fields differ, so `existing.Type != request.Type && existing.Payload != request.Payload` is still
  true and the `409` still fires. The reader is told to expect a failure and sees success, with nothing on the
  page to tell them whether they misapplied the edit or the guide is wrong.
- **Suspected class:** pedagogy-gap — the break recipe doesn't exercise what it claims, and the reason is a
  real hole behind it: **no test in the guide covers a reused key with only one field changed**, so nothing
  in the suite actually pins the `||`. A guide whose thesis is "the tests are the proof" leaves its most
  important branch half-proven.
- **Severity:** slowed-down
- **Tags:** `gate` `break-recipe` `test-coverage` `M5` `idempotency` `conflict`
- **Status:** fixed via `/report-issue` (2026-08-14)
- **Quote:** "Changed `||` to `&&`. `Failed: 0, Passed: 13`. The gate the guide told me to break did not
  break."

## 2026-08-14 — M4/04, the durability break recipe fails differently than described

- **Where:** `MILESTONE_4_durability/04_the-restart-test.md`, *Done when* action 3.
- **Reader:** same execution run.
- **What happened:** commenting out `File.AppendAllText(...)` as instructed does make the milestone fail —
  but not in the shape the page promises. It says
  `Command_IsOnDisk_AndReadableFromAFreshlyBuiltApplication` "must fail on the **file** assertion"; what
  actually happens is **two** tests fail, and neither fails on an assertion:
  `System.IO.FileNotFoundException : Could not find file '…\commands.jsonl'` thrown by
  `File.ReadAllLinesAsync` before `Assert.Single(lines)` is reached, plus
  `IdempotencyKey_StillReplays_AfterAReload` failing on the id comparison. The point the recipe is making —
  the gate reads the disk, not memory — survives intact; the description of the evidence doesn't.
- **Suspected class:** unclear-wording — the observed failure is real and diagnostic, only its description on
  the page is wrong (one test vs two, an assertion vs an exception).
- **Severity:** confusing
- **Tags:** `gate` `break-recipe` `M4` `durability` `exception-vs-assertion`
- **Status:** fixed via `/report-issue` (2026-08-14)

## 2026-08-14 — M3/03, the idempotency break recipe names the wrong assertion

- **Where:** `MILESTONE_3_idempotency/03_the-idempotency-test.md`, *Done when* action 3 (repeated in the
  M3/04 gate checklist).
- **Reader:** same execution run.
- **What happened:** commenting out the replay branch does make
  `PostCommand_SameKeyTwice_ReplaysResponseAndStoresOneCommand` fail, as promised — but the page says it
  fails "on `Assert.Single`", and it does not get that far. xUnit stops at the first failing assertion, which
  is the body comparison three lines earlier: `Assert.Equal() Failure: Strings differ`. A reader who scrolls
  the output looking for the named `Assert.Single` failure won't find it, on a page whose whole purpose is to
  teach them to trust what they read in that output.
- **Suspected class:** unclear-wording — the gate behaves correctly; the guide names an assertion that a
  later one shadows.
- **Severity:** confusing
- **Tags:** `gate` `break-recipe` `M3` `assertion-order` `xunit`
- **Status:** fixed via `/report-issue` (2026-08-14)

## 2026-08-14 — M1/01 and M1/03, then every `Done when` in the guide

- **Reader:** `/audit-guide`, running the guide's own gates on the pinned toolchain (SDK 10.0.302) — not a
  human following the ladder. Expertise irrelevant here: the defect is in what the page claims the machine
  prints.
- **What happened:** ran `dotnet build` in a terminal expecting the gate's `0 Error(s)`, and got
  `Build succeeded in 1.5s` with no error or warning counts anywhere in the output. Same shape one step later:
  M1/03 shows `Passed!  - Failed:     0, Passed:     1, …` and teaches the reader to read its column padding,
  but the terminal prints `Test summary: total: 1, failed: 0, succeeded: 1, skipped: 0`. Both renderings are
  real — the padded ones appear only when the output is **redirected**, which is how both earlier audit runs
  captured it. 24 build gates and 6 test gates named output that does not exist in the reader's shell.
- **Suspected class:** masked gate — the environment the guide prescribes (an interactive terminal) renders the
  gate's channel differently from the environment the author observed it in (a pipe).
- **Severity:** blocker
- **Tags:** `gate` `dotnet-cli` `terminal-logger` `authoring-environment` `rule-6.2`
- **Quote:** "`0 Error(s)` is not in the output. Neither is `Passed!`. The build succeeded."
- **Status:** fixed via `/report-issue` (2026-08-14) — drift log row 3, decision D6.

## 2026-08-14 — M1/04, M2 overview, M2/03

- **Reader:** same audit pass, reading the guide in order.
- **What happened:** three sentences still refer to a `public partial class Program { }` that the guide
  deliberately does not have and never asks for — the step that did was deleted earlier the same day. M1/04
  says "the `Program` you made public **in step 04**" three paragraphs after explaining that the line is
  unnecessary; M2/03 action 3 asks the reader to read `Program.cs` top to bottom and find "the partial class"
  at the end of it. A reader who complies either goes hunting for a step they never did, or adds the line —
  after which their file stops matching the M2/05 checkpoint.
- **Suspected class:** stale cross-reference — a deleted step swept out of the code checkpoints but not out of
  the prose.
- **Severity:** friction
- **Tags:** `stale-reference` `deleted-step` `checkpoint-drift`
- **Quote:** "Which step made `Program` public? There isn't one."
- **Status:** fixed via `/report-issue` (2026-08-14) — drift log row 4.

<!-- Entry format:

## YYYY-MM-DD — <where: milestone/step>
- **Reader:** <who they are, in terms of the audience matrix>
- **What happened:** <what they did, what they expected, what they got>
- **Suspected class:** <undefined term · missing WHERE · silently-assumed prerequisite · stale API · masked gate · …>
- **Severity:** blocker | friction | nit
- **Tags:** <free tags>
- **Quote:** "<their words, verbatim>"
-->
