# Prompt examples — the auxiliaries

Skills you reach for around a guide rather than to produce one: QA it, keep it current, convert something that
already exists, track how far you've got through it, check that what you built matches what it told you to
build, change it around work you've already done, and capture what readers hit. Plain-chat form is the same everywhere — paste the skill's
`prompt.md`, then the argument, then the files.

---

## `audit-guide` — QA before shipping

```
/audit-guide M2/
```

**Attach:** the files to audit.

Lints a drafted guide against the contract and reports violations ranked by severity — **BLOCKER** when the
reader is stopped or proceeds on a false signal, **WARNING** when they're merely worse off. Read-only: it
flags, it doesn't fix. Findings it can't settle from the guide alone are marked *unconfirmed* rather than
downgraded.

Whole guide, which is what you want after a full drafting pass:

```
/audit-guide guide/
```

---

## `update-stack` — the versions have moved

```
/update-stack
```

Re-verifies every tool's latest stable version online, rewrites `stack.md`, then rewrites **only** the steps
the bump actually affects — using the new version's features, not a find-and-replace of the number. The drift
lands in `status.md` and `decision-log.md`, and it hands off to `audit-guide` to QA its own edits.

Scope it when you know what moved:

```
/update-stack Go modernc.org/sqlite
```

---

## `modernize-guide` — you already have a tutorial

```
/modernize-guide README.md
```

**Attach:** the source document, and any real code it's supposed to produce.

For an existing flat tutorial, runbook, or legacy guide: it reverse-engineers the implicit ladder, diagnoses
the document against the pedagogy principles, verifies the (probably stale) stack online, and re-casts it as a
plan with a source-map back to the original. Use `plan-guide` instead when you're starting from an idea — this
one needs something to convert.

---

## `mark-progress` — record what you actually executed

```
/mark-progress M2/03 done
```

Ticks that row in `guide/foundation/progress.md`, rewrites *Current position*, and reconciles `status.md`'s
frontier, milestone table and session log with it. Two files, nothing else — it never edits a step.

A whole milestone, gate included:

```
/mark-progress through M1, the verify gate passed
```

Only the gate earns a `✅`. Claim the milestone without mentioning the verify and it asks the one question
before writing, because a milestone marked verified by nobody's observation is the one lie the status file
must never carry.

---

## `check-my-work` — did I actually build what the steps said?

```
/check-my-work M6
```

**Attach:** nothing in Claude Code — it reads the guide and your real project itself.

The only skill that treats the **project** as the thing to be checked. It reads the milestone checkpoints (the
complete-file sections of each `NN_verify.md`), diffs your real files against them, cross-checks
`progress.md` against your version-control history to catch steps ticked on days nothing was touched, re-runs
the gate checks that need no human, and sorts every difference into **cosmetic / deliberate / defect / never
executed** — so a rename you made everywhere is one line in the report and the half-applied edit under it
isn't buried.

Wider scope when you've lost track of where you are:

```
/check-my-work everything I've executed
```

Read-only on both sides: it changes neither your project nor the guide. You repair your own code — that is
what following a guide is for — and it names the sibling that owns anything else (`/mark-progress` to record,
`/report-issue` for a guide defect, `/amend-guide` for a deviation you want to keep).

**Before `mark-progress`, not instead of it.** One step just finished, mark it. A run of steps, a whole
milestone, or work from last week: check first, then mark what the check confirmed.

---

## `amend-guide` — the requirements changed mid-build

```
/amend-guide swap SQLite for Postgres — I need real concurrent writes
```

**Attach:** the guide, `foundation/progress.md` included.

The one skill that assumes someone is **halfway through**. It reads the ledger to find the frontier, verifies
online anything the change introduces, and then **stops** with an impact report: what gets rewritten ahead of
you, what you already built that the change invalidates, and the exact repair for it. Nothing is written until
you approve.

On approval: steps ahead of the frontier are rewritten freely (`PLAN.md` and the ladder with them), executed
steps get a superseded banner and **nothing else**, and the repair lands as a *Before you continue —
corrections* section at the top of the first step you have not yet opened.

Dropping scope works the same way:

```
/amend-guide drop the CLI entirely — the HTTP API is the only surface now
```

**Which maintenance skill?** `report-issue` when the guide is *wrong*, `update-stack` when its *versions*
moved, `amend-guide` when the guide is right and *what you want built* changed.

---

## `report-issue` — a reader got stuck, fix the guide

```
/report-issue M2/03 — npm run dev fails, needs .env first
```

Diagnoses the root cause and fixes the step — then sweeps the **whole** guide for every other place the same
class of defect appears and fixes those too. It adds a failure-note guard, logs the fix in `status.md` and
`decision-log.md`, proposes a pedagogy rule if the confusion is general, marks affected milestones for
re-verification (never ✅), and hands off to `audit-guide`.

Several at once is fine — the sweep is per class, not per report:

```
/report-issue M1/02 — the install command is Linux-only; M3/05 — the port is 3000 in the step and 8080 in the verify
```

---

## `log-feedback` — record it, don't fix it yet

```
/log-feedback M2/03 — reader confused by the token step, expected a value
```

Appends one dated, structured entry to `guide/feedback-log.md` — where · reader · what happened · suspected
class · severity · tags · quote — and changes nothing else. Use it while watching someone work, when you want
the friction captured without stopping to redesign the step. Its severity scale is the reader-facing one
(`blocker` / `slowed-down` / `confusing` / `cosmetic`), finer than the audit's two levels.

**Which of the two?** `log-feedback` records, `report-issue` repairs. Logging a dozen snags in a session and
then running `report-issue` on the pattern beats fixing each one as it appears.

---

## `pre-pr-check` — contributors only

```
/pre-pr-check
```

Not for guides — for this repository. Verifies a contribution against every `CONTRIBUTING.md` ground rule and
the PR checklist before you push. Read-only, PASS/FAIL. Name a base branch to compare against:

```
/pre-pr-check main
```
