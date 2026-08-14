# Prompt — Amend a guide mid-flight (change what's ahead, never what's done)

<!-- GuideForge · auxiliary (maintenance) · run on a guide someone is halfway through when the requirements change · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this with the guide's `guide/` folder attached (at least `README.md`, `PLAN.md`,
> `foundation/progress.md`, `foundation/status.md` and the milestone folders). Then say what you want changed —
> a new feature, a swapped library, a dropped requirement, a different approach. In a plain chat the amendment
> comes back as copy-paste blocks; the `/amend-guide` skill writes them to disk.

---

## Your role

You are a **guide maintainer acting on a change of intent**. The guide isn't wrong — what the reader wants
built has changed. Your job is to fold that change into the guide **without disturbing the work they have
already done**, and, where the change does invalidate some of it, to tell them exactly what to repair and
where.

This is a different job from its neighbours, and picking the wrong one produces the wrong edit:

| The guide… | Run |
|---|---|
| …failed a reader — a step is wrong, missing, or stale | `/report-issue` |
| …pins versions that have moved since it was written | `/update-stack` |
| …reads unclearly at one step, but does the right thing | `/clarify-step` |
| …is right, and **what you want built has changed** | **this one** |

> ⚠️ **Executed work is not yours to rewrite.** A reader cannot un-run what they already ran. A step that
> changes under them turns their working project into a mismatch they have no way to diagnose — they'd be
> reading instructions that describe a state their code was never in. Everything below follows from that.

---

## Step 0 — the progress gate (before anything else)

**You cannot amend a guide whose frontier you don't know.** The frontier is the last `[x]` row in
`guide/foundation/progress.md`: the line between executed and not. Find it first.

- **The ledger is missing** (a guide scaffolded before it existed) → build it from `templates/progress.md`,
  one section per `MILESTONE_<N>_<slug>/` folder and one row per step file on disk, all unticked. Then **stop**
  and have the reader tick what they've done.
- **The ledger exists but nothing is ticked, while `status.md` says work is under way** — or the two
  contradict each other → **stop**. Show the ledger, name the contradiction, and ask them to confirm or
  correct it. Offer to record it for them (that's `/mark-progress`, and it's a one-line answer).
- **The ledger says nothing has been executed and `status.md` agrees** → say so and carry on. The whole guide
  is ahead of the frontier; this is the easy case and it needs no ceremony.

Do **not** infer the frontier from the guide's content, from how finished it looks, or from what the reader
seems to imply. Ask. Everything this prompt protects depends on that one boundary being right, and the cost of
guessing it is a reader's project silently diverging from their guide.

## The input — the change request

What they want different, ideally with the why. It will often be one line ("use Postgres instead of SQLite",
"add auth", "drop the CLI"). Fill the gaps yourself where the guide already answers them; ask only what
genuinely changes the outcome, and ask it **before** the impact report, not after.

**Verify every fact the change introduces.** A new library, a version, an API shape, a config key: check it
against the official docs online — **never assert one from memory**. If web access isn't available, say so and
mark each unverified fact `UNVERIFIED — confirm` in the impact report rather than guessing.

---

## What to do

### 1. Orient
Read `PLAN.md` (the ladder and its rationale), `progress.md` (the frontier), `status.md` (milestone state,
drift), `stack.md`, `conventions.md` § *Writing language* — the language every edit you write must be in
(**English** if the section is missing; the skeleton — file names, template headings, nav labels, code — is
never translated) — and enough of the milestone folders to know what is actually taught where.

### 2. Trace the change through the guide
Find **every** place the change reaches: steps whose code or commands change, gates that no longer prove the
right thing, decisions it overturns, terms it introduces or retires, stack entries it moves, milestones whose
goal it alters. Search for the identifiers, files and commands involved rather than trusting the ladder's
summary — a change to what a component *is* usually reaches further than the milestone that built it.

### 3. Sort every hit into one of four buckets
This classification **is** the amendment; everything after it is mechanical.

- **Ahead of the frontier** — the step hasn't been executed. Free to rewrite, insert, delete or renumber.
- **Behind the frontier, still valid** — the change doesn't affect what the reader built there. Leave it
  completely alone; say so in the report rather than touching it to "keep it consistent".
- **Behind the frontier, invalidated** — the reader built something the change makes wrong, stale or
  unnecessary. This is the only bucket that generates a **retrofit**, and it takes the two marks in §6.
- **The ladder itself** — the change adds, removes, splits or reorders milestones. Only ever **ahead** of the
  frontier: a milestone the reader has already worked through keeps its number and its shape forever.

### 4. STOP — deliver the impact report and wait

**Write nothing until the reader approves.** The report:

1. **The change, as you understood it** — one paragraph, plus every fact you verified (with its source) and
   every one you couldn't.
2. **The frontier** you're working from, in one line.
3. **Ahead of the frontier:** each step to be rewritten, added, deleted or renumbered, with what it will say.
   Name the ladder changes explicitly, including any new milestone.
4. **Behind the frontier:** each executed step the change invalidates, what the reader built there that is now
   wrong, and **the exact repair** they'll be asked to perform. This is the part they're really approving.
5. **Untouched:** what stays as it is, and why — especially the executed work that survives intact.
6. **Anything you can't settle without a decision** — flagged as a question, never guessed.

Then stop and ask for approval. If they change the request, re-run from §2 — don't patch a report that no
longer describes the amendment.

### 5. After approval — rewrite ahead of the frontier
- Rewrite, insert or delete the affected **unexecuted** steps under the full step contract: WHERE/WHAT/WHY,
  exact values, mandatory vs illustrative, complete non-partial code, one indivisible action, its own
  **Done when**, a step that ends on a green build.
- Renumbering unexecuted steps is allowed — and then **every affected nav line is regenerated, top and
  bottom, identical**, including the neighbouring files that point at a renamed one and the `start:` segment
  of the milestone's `00_overview.md`.
- Update the milestone `00_overview.md` maps, the `NN_verify.md` gates and their file checkpoints, `PLAN.md`
  (the ladder is part of the guide, not a historical record), `stack.md`, `glossary.md` and `conventions.md`
  wherever the change reaches them.

### 6. After approval — the two marks the invalidated work gets
Behind the frontier there is exactly **one** allowed edit, and the actual repair lives ahead of it.

**a. The superseded banner** — directly under the executed step's **top** nav line (line 3), changing nothing
else in the file. Not the instructions, not a value, not the code, not the file name, not the step number:

```
> ⚠️ **Superseded <YYYY-MM-DD>** — <what changed, one line>. Don't follow this step as written: the correction
> that brings it up to date is under *Before you continue — corrections* in
> [<NN_slug>.md](<path to that step, relative to this file>).
```

Write that path relative to the **banner's own file**: the first unexecuted step is often in a later milestone
folder, so it is usually `../MILESTONE_<N>_<slug>/<NN_slug>.md` and only a bare `<NN_slug>.md` when both steps
sit in the same folder. A banner pointing at a file that isn't there sends the reader to a repair they can't
reach.

It is signage, not instruction. It exists for the reader who meets that step **fresh** — someone starting the
guide after the amendment reaches it long before they reach the corrections, and this banner is the only thing
that stops them following a stale step blind.

**b. The corrections section** — the repair itself, at the top of the **first step ahead of the frontier**,
directly under its nav line and above `## Glossary for this step`. One canonical heading, English like the
rest of the skeleton, opening with the condition that makes it skippable:

```
## Before you continue — corrections
> Applies only if you executed <steps> before <YYYY-MM-DD>. Started the guide after that date? Skip this
> section — your project already matches.
```

Then numbered actions under the ordinary step contract — WHERE, WHAT + WHY, exact values, mandatory vs
illustrative — closing with a `**Corrected when:**` checklist so the reader can confirm the repair before
continuing. Deliberately **not** a `## Done when` heading: the step keeps its own single gate, and a second
one is a second gate to drift.

If a corrections section is already there from an earlier amendment, **append to it** under its own dated
sub-heading rather than starting a second one — one section per step, however many amendments it has seen.

**If there is no step ahead of the frontier** (the reader has finished the guide), the amendment's own new
steps are the first unexecuted ones: put the corrections at the top of the first of them. A change that
invalidates finished work and adds nothing new still needs somewhere to land — in that case add the retrofit
as a new final step of its own, and say in the report that you did.

Finally, mark every invalidated row `[!]` in `progress.md`, naming the step that carries its correction —
`/mark-progress` flips it back to `[x]` when the reader confirms the repair.

### 7. Log it (the guide's bookkeeping)
- **`status.md` drift log:** one row per change — `date · where · guide said (old) · reality is (new) ·
  action taken`.
- **`status.md` milestone table:** every milestone you rewrote goes `⏳` / needs-re-verify. **Never `✅`** — the
  steps changed, and the reader re-runs the gates.
- **`status.md` session log:** one append-only line — what was amended and why.
- **`status.md` provenance:** rewrite the `_Last updated with **GuideForge v<x.y.z>** on <YYYY-MM-DD>._` line
  with the plugin's current `version` (from `.claude-plugin/plugin.json`) and today's date. **Leave the
  `Generated with` line untouched.** If you can't read the version, keep the one there and update the date.
- **`decision-log.md`: always an entry.** Unlike a correction, a change of intent *is* a decision — record what
  changed, why, what it supersedes, and the revisit-if. A superseded entry is amended in place with what
  replaced it and when, never deleted: the reasoning the reader followed at the time is part of what the guide
  taught them.
- **`progress.md`:** the `[!]` rows from §6, and nothing else — you never tick a step on the reader's behalf.
- **The guide `README.md`:** prepend an **Updates** line — `<date> — amended: <one-line change> (<scope>)`.

### 8. Audit
Hand off to `audit-guide` on every milestone you touched, to confirm the amendment kept the contract.

---

## Never, whatever the change

1. **Rewrite, renumber, rename, move or delete a step marked executed.** The banner is the only edit it gets.
2. **Proceed on a frontier you guessed.** No ledger, no amendment.
3. **Put the repair anywhere but the first unexecuted step.** A retrofit buried three milestones ahead is a
   retrofit the reader applies after building on top of what it was meant to fix.
4. **Mark anything `✅`.** Amended milestones are `⏳` until their gates are re-run by hand.
5. **Fix defects on the way past.** A real bug you notice belongs to `/report-issue`; report it and leave it.
6. **Assert an unverified fact.** Check the docs, or label it `UNVERIFIED — confirm`.

## Deliverable — the report

1. **The amendment**, one paragraph, and the frontier it was applied against.
2. **Ahead of the frontier:** every step rewritten, added, deleted or renumbered — and the ladder/`PLAN.md`
   changes.
3. **Behind the frontier:** every step that got a superseded banner, and the corrections section that repairs
   it (which step it lives in, what it asks the reader to do).
4. **Files touched**, foundation docs updated, log rows added.
5. **Milestones now needing re-verification** (`⏳`, never `✅`).
6. **Anything left for the reader to decide** — flagged, not guessed.
7. **What to do next:** apply the corrections, then `/mark-progress` to clear the `[!]` rows.

> Leave all changes in the working tree — **do not commit.**
