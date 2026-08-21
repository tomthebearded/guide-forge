---
name: check-my-work
description: >
  Reconcile the REAL project against the learn-as-you-go guide you have been following — does what you built
  actually contain what the steps you executed told you to write? Reads the milestone checkpoints (the
  complete-file sections of each NN_verify.md), diffs them against your files while ignoring cosmetic
  differences, cross-checks foundation/progress.md against version-control history to catch steps ticked but
  never performed, re-runs only the gate checks that need no human, and classifies every difference as
  cosmetic / deliberate / defect / never executed. Read-only: it changes neither the project nor the guide.
  Use when you doubt you followed the guide correctly, before a milestone gate, or when you ask to mark a run
  of steps or a whole milestone done and want the claim checked before /mark-progress records it. Invoke with
  the scope, e.g. "/check-my-work M6" or "/check-my-work everything I've executed".
argument-hint: "<step|milestone|range> [file ...]"
---

# Skill: check-my-work

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The scope to check is
  `$ARGUMENTS` below (plus any attached files). Read the guide's `guide/` files and **the project's real
  files** yourself rather than asking for them to be pasted.
- **You have tools here, so use the two the prompt leans on:** read version control directly (which commits
  touched which files, and when) to answer *was this step ever performed*; and actually **run** the gate
  checks that need no human, then diff their output against the expected output the gate prints.
- **Read-only, on both sides.** Do not edit the project, and do not edit any guide file — including
  `progress.md` and `status.md`. If the check ends in something that must be written, name the sibling
  **skill** that owns it: `/mark-progress` (the ledger), `/report-issue` (a guide defect), `/amend-guide`
  (a deliberate deviation that should become the plan), `/log-feedback` (friction worth recording).
- When the reader asked to **mark** a run of steps or a whole milestone, check first and hand the confirmed
  result to `/mark-progress` — a single step just finished doesn't need this skill at all.

Scope to check / args:
```
$ARGUMENTS
```

**Gate:** report only what you actually verified. A check you couldn't run is **unrun**, never passed; a
difference you can't tell apart from a rename is **cosmetic**, not a finding; and a milestone is never called
verified here, because you did not watch its gate — you re-ran the half of it a machine can.
