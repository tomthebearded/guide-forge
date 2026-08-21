# The frontier gate — informed consent before rewriting executed work

<!-- GuideForge · reference · the shared contract every guide-editing skill runs before it writes -->

A guide has two halves, and only one of them is text. Everything **ahead** of the frontier is instructions
nobody has followed yet: rewriting it costs nothing. Everything **behind** it has been *executed* — it exists
as files on someone's disk, and the guide is the only record of how they got there. Editing that half does not
change a document, it **desynchronizes a project from its instructions**, and the person holding that project
is usually the person who invoked the skill.

They are entitled to know that before it happens. This file is the gate that tells them.

> **The gate is not a veto.** Some edits behind the frontier are right — a defect fix usually is, because the
> step was never correct and the next reader must not be taught it. What is never right is making that call
> *for* the reader, silently, in a pass they asked for something else. The gate converts an invisible side
> effect into a decision they took.

## Which skills run it

| Skill | Why it can reach behind the frontier | Form of the gate |
|---|---|---|
| `/amend-guide` | the requirements changed | **strictest** — executed steps are never rewritten at all; see its own §0 and §6, which this file does not relax |
| `/report-issue` | a defect's root cause is usually taught in an early step, and the sweep follows the defect class wherever it appears | full gate, three routes |
| `/update-stack` | a version bump rewrites the step that pins it, whenever it was executed | full gate, three routes |
| `/clarify-step` | the step named for clarification may be one the reader has already followed | reduced gate — see *Clarity is a special case* |

A skill that only reads (`/audit-guide`, `/review-before-follow`, `/check-my-work`, `/pre-pr-check`,
`/log-feedback`) never runs this gate. A skill that writes only ahead by construction (`/plan-guide`,
`/scaffold-guide`) doesn't either.

## Step 0 — establish the frontier before you plan any edit

The frontier is the **last `[x]` row in `guide/foundation/progress.md`**: the line between executed and not.
Read the ledger first, and read all of it — the executed set is not always a prefix, and `[~]` (executed, gate
not passed) and `[!]` (executed, then invalidated) rows are **behind** the frontier like any other executed
work.

- **The ledger is missing** (a guide scaffolded before it existed) → do not guess. Say so, offer to build it
  from `templates/progress.md`, and **stop**: with no ledger, every edit you make is one you cannot classify.
- **The ledger and `status.md` disagree** — nothing ticked while the status table says work is under way, or a
  frontier line that names a different step → **stop**, show both, and ask which is true. Offer
  `/mark-progress`, which settles it in one line.
- **Nothing is executed and `status.md` agrees** → say so in one line and carry on. The whole guide is ahead of
  the frontier; there is nothing to protect and no gate to run.

Never infer the frontier from how finished the guide looks, from the newest date in the session log, or from
what the invoker seems to imply. Ask.

## Step 1 — classify every planned edit before you make it

Take the edit list you were about to apply — the step where the defect was found, every sibling the sweep
turned up, every file checkpoint that copies the changed code — and sort it:

- **Ahead of the frontier** — free. Rewrite, insert, delete, renumber.
- **Behind the frontier, cosmetic** — prose, a gloss, a failure note, a troubleshooting row. Nothing the reader
  typed changes. Free, but list it in the notice so they can see it was not code.
- **Behind the frontier, load-bearing** — code, a command, a value, a file name, a `Done-when` assertion, a
  gate's expected output. **This is the bucket the gate exists for.** Each of these is a diff the reader must
  re-apply by hand before their project matches their guide again.

A file checkpoint (`NN_verify.md`) that reproduces changed code counts as load-bearing: it is what the reader
diffs their own file against.

## Step 2 — STOP and present the notice

**If the load-bearing bucket is empty, there is no gate** — say "nothing behind the frontier changes" in one
line and carry on. Do not manufacture a question.

If it isn't, write nothing until they answer. The notice, in this order:

1. **The frontier**, one line, quoted from the ledger: last executed step, next step up.
2. **The finding**, one line — what you diagnosed, not how you'll fix it.
3. **What reaches behind the frontier** — every load-bearing step by id, and what changes in each. This is the
   part they are actually deciding about, so it is a list, not a count.
4. **The three routes with their costs**, below.
5. **Your recommendation**, one line, with the reason.

### The three routes

| | What it does to executed steps | What it costs |
|---|---|---|
| **A · Root fix + sweep** | rewritten in place, wherever the defect class appears | the invoker's project silently diverges from the guide until they re-apply diffs **scattered across every rewritten step**; the drift-log row is their only index of what moved |
| **B · Root fix + consolidated retrofit** | corrected for future readers, but each rewritten executed step also gets a **superseded banner**, and every diff the invoker must re-apply is collected into **one** *Before you continue — corrections* section at the top of the first unexecuted step | the guide carries banners and a retrofit section; the fix is applied twice over (at the source and as a repair), which is more writing and one more place to keep true |
| **C · Defer** | untouched — not one character | the guide keeps teaching the defect to every future reader until someone comes back for it; only defensible when the invoker is the guide's only reader, and it is logged as a **known open defect** in `status.md`, never as fixed |

**Recommend B by default** when work has been executed: it is the only route that serves both readers at once —
the one who already built on the broken step, and the one who has not met it yet. Recommend A when nothing
downstream of the change was executed, or when the invoker has said they will re-apply from the drift log.
Recommend C only when they have said the guide has no other readers *and* they want their executed work frozen.

Then stop and wait. If the answer changes the scope, re-classify from Step 1 rather than patching a notice that
no longer describes the edit.

## Step 3 — what each route obliges you to write

**Route A** — the ordinary bookkeeping of the skill you're running, plus: the drift-log row names **every**
executed step whose code changed, in order, so it can be used as the re-apply checklist it has now become. Say
in the report that the invoker's project no longer matches the guide.

**Route B** — the two marks, exactly as `/amend-guide` defines them (its §6 is canonical; do not invent a
second dialect):

- the **superseded banner** under the executed step's top nav line, pointing at the step that carries the
  repair — with, for a defect fix, one extra clause naming what the step now teaches: *"the code below has been
  corrected; if you followed this step before &lt;date&gt;, the repair is under…"*;
- the **corrections section** at the top of the first unexecuted step, holding the diffs in the order they must
  be applied, closing with a `**Corrected when:**` checklist and then **one** `**Suggested commit:**` block for
  the whole repair (rule 4.5) — the reader applies it as a single change to their project, so it is never one
  commit per corrected step, and it is not the host step's own `## Suggested commit`. If a section is already
  there from an earlier pass, append under a dated sub-heading — one section per step, however many passes it
  has seen — and update that single commit message rather than adding a second block.

Then mark every invalidated row `[!]` in `progress.md`, naming the step that carries its correction. Never tick
or untick a row on the reader's behalf beyond that.

**Route C** — no step edits at all. Add a `⚠️ **Known open defect**` row to the `status.md` drift log with
`action taken: deferred by the reader on <date>` and the steps that still carry it, and say plainly in the
report that the guide is now knowingly wrong in those places.

## Clarity is a special case

A pure clarity pass (`/clarify-step`) doesn't change what the reader typed, so an executed step is normally
safe to clarify in place and the gate is a **one-line notice**, not a stop: *"this step is behind the frontier
— prose only, nothing you built changes."*

The stop returns the moment the pass stops being cosmetic: a renamed identifier (rule 3.6), a value quoted
differently (rule 3.5), a re-cut step (rule 4.4), a gate made concrete in a way that changes what it asserts.
Those are load-bearing edits wearing a clarity label — classify them at Step 1 and run the full gate.

## Never

1. **Rewrite a load-bearing executed step without a recorded answer to the notice.** Not "it's obviously
   right", not "it's a small diff", not "the reader will figure it out from the drift log".
2. **Proceed on a frontier you guessed.** No ledger, no gate, no edit.
3. **Present fewer than the routes that actually apply.** Offering only A is the failure this file exists to
   stop.
4. **Mark a milestone `✅` after any route.** Rewritten steps are `⏳` until their gates are re-run by hand;
   under C nothing was fixed at all.
5. **Take route C silently because it is the least work.** Deferring a defect is the invoker's call, logged as
   theirs.
