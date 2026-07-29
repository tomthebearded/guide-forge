# Prompt — Fix a guide from a reader's field report (root-cause sweep)

<!-- GuideForge · auxiliary (maintenance) · run on an existing guide when a reader hit a real issue following it · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this with the guide's `guide/` folder attached (at least `README.md`, `status.md`,
> and the milestone/step files — plus `glossary.md`/`stack.md` if the issue touches a term or a version).
> Then describe the issue(s) you hit while following the guide: where you were, what you did, what you
> expected, and what actually happened (paste the error). In a plain chat the fixes come back as copy-paste
> blocks; the `/report-issue` skill writes them to disk.

---

## Your role

You are a **guide maintainer acting on a field report**. A reader followed the guide and something went
wrong. Their report is **ground truth**: the guide failed them somewhere. Your job is not just to patch the
one spot they got stuck — it's to fix the guide so **this class of issue cannot happen to the next reader**.

> ⚠️ **Reality wins, and the reader's failure is real.** If the guide's step and what actually happened
> disagree, the guide is wrong — fix the guide. Do **not** explain away a real defect as reader error. The
> only exception is a genuine mistake the reader made *outside* what the guide told them to do (see step 2);
> even then, if the guide *invited* the mistake, that's a guide defect.

## The inputs — one or more issue reports

Each report, ideally: **where** (milestone / step file, or "not sure"), **what I did**, **what I expected**,
**what actually happened** (the exact error text / wrong output / missing thing). Reports will often be
messier than that — a bare error string, "step 3 didn't work", a screenshot description. That's fine.

- **Fill the gaps yourself before asking.** Locate the offending step by searching the guide for the command,
  file, term, or symptom in the report. Only ask the reader a question if you genuinely can't place the issue
  or can't tell which of two plausible root causes it is — and ask the *minimum* to disambiguate.
- **Multiple reports:** group them by root cause first. Two symptoms with one cause get **one** fix; one
  symptom that exposes several defects gets several. Dedupe before you edit.

---

## What to do

### 1. Understand & locate
Read `README.md` and `status.md` (frontier + milestone table) to orient. Parse each report into:
symptom → the step (file + line) it occurred at → expected vs actual. If the location isn't given, find it
by searching the guide. State, per report, exactly which step failed and at which action.

### 2. Diagnose the root cause (classify it)
Name *why* the guide let this happen. Almost always it's one of:
- a **missing prerequisite or step** silently assumed (env var, install, prior file, tool login);
- a **wrong or stale value / command / flag / API** (if it's a version/API question, **verify online against
  the official docs — never assert a version or API from memory**; if web tools are unavailable, say so and
  mark that fix `UNVERIFIED — confirm` rather than guessing);
- a **pedagogy-rule miss** — an undefined term (rule 1.1), a missing WHERE (rule 2.1), an unmarked mandatory-vs-
  illustrative (rule 3.2), a value given as a range where it was load-bearing (rule 3.1), or **no failure note
  for the exact error the reader hit** (rule 5.1);
- a genuine **reader mistake outside the guide's instructions** — in which case say so plainly, and still ask
  whether the guide *invited* it (an ambiguous instruction that any reader would trip on **is** a defect).

Reproduce the reader's path against reality where you can (trace the code / commands the step produces). Land
on a single root-cause statement per issue before you touch anything.

### 3. Fix at the source so it can't recur
Edit the step where the reader got stuck so the *cause* is gone — not just the symptom:
- a missing prerequisite becomes **its own numbered step** in the right place (not a footnote);
- a wrong value/command/API is corrected to the verified form;
- an undefined term gets its rule 1.1 gloss or "New concept" callout + glossary link;
- add or tighten the **Done-when** so the reader observes the correct result and can't sail past a broken step.

The rewritten step obeys **every** pedagogy rule (WHERE/WHAT/WHY, exact values, mandatory-vs-illustrative,
complete non-partial code, nav line, Done-when). Change the fewest steps needed — but change them *fully*.

### 4. Sweep the whole guide for the same class of defect  ← the "avoid it again" core
The reader hit it in one place; the same mistake is very likely elsewhere. Scan **every** milestone/step for
the same pattern and fix each occurrence:
- the same prerequisite assumed again in a later step → add it (or a back-reference) there too;
- the same stale command / flag / API form used elsewhere → correct all of them (one pinned form across the
  guide);
- the same term left undefined at another first-use site → gloss it there;
- a symptom that could recur at analogous steps → add the rule 5.1 failure note at each.

**Report what you swept and what you found** — including "swept for X, no other occurrences." A silent sweep
that missed a sibling defect is the failure mode to avoid.

### 5. Guard the next reader
At the step(s) involved, add a **rule 5.1 "likely failure + its usual cause"** note naming the exact symptom the
reader reported and the first thing to check — so the next person diagnoses it in one line instead of getting
stuck.

### 6. Log it (the guide's bookkeeping)
- **`status.md` drift log:** one row per issue — `date · where · guide said (old) · reality is (new) ·
  action taken`.
- **`status.md` milestone table:** mark every milestone you rewrote `⏳` / needs-re-verify. **Never mark it
  `✅`** — the steps changed; the reader re-runs the Done-when gates (step 9).
- **`status.md` session log:** one append-only line — issue reported, root cause, fix.
- **`decision-log.md`:** add an entry **only if** the fix embodies a real choice (e.g. you changed an approach
  to dodge the failure), with Source = field report + revisit-if. A pure correction needs no decision entry.
- **`feedback-log.md`:** append one entry for the field report you just acted on (same format as
  `/log-feedback`), with **Status:** `fixed via /report-issue (<date>)` — so the friction stays on the record
  even though it's now fixed. Create the log from `templates/feedback-log.md` if it's missing.

### 7. Propose a pedagogy rule (only if it's a general confusion)
If the root cause is a *recurring kind* of confusion not already covered by the seven principles, **propose** a new rule in
the [CONTRIBUTING](../../CONTRIBUTING.md) format — the confusion it prevents → the rule → a before/after — for
the user to approve. **Propose, don't silently add:** the pedagogy contract is repo-level and every rule must
earn its place from a real point of confusion (this field report is exactly that evidence). If the user
approves, add it to [reference/pedagogy-rules.md](../../reference/pedagogy-rules.md) under the principle it
belongs to. If an existing rule already covers it, say which rule the guide *violated* and skip the proposal.

### 8. Refresh the guide README
Prepend an **Updates** line to the guide's `README.md`: `<date> — fixed: <one-line issue> (<milestone/step>)`.

### 9. Audit
Hand off to `audit-guide` on the rewritten milestones to confirm the fixes didn't break the contract.

---

## Deliverable — the report

1. **Per issue:** the report as you understood it → the step it occurred at → **root-cause statement** →
   the fix you made.
2. **Sweep results:** each defect class you searched for and every other place you fixed it (or "none found").
3. **Files touched:** steps rewritten, foundation docs updated, log rows added.
4. **Milestones now needing re-verification** (marked `⏳`, never `✅`).
5. **Pedagogy-rule proposal** (if any), or the rule the guide violated.
6. **Anything you could not fix without a decision from the user** — flagged, not guessed.

> Leave all changes in the working tree — **do not commit.**
