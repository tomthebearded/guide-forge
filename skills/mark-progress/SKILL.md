---
name: mark-progress
description: >
  Record what you have actually EXECUTED while following a learn-as-you-go guide — step by step — into the
  guide's foundation/progress.md ledger, and reconcile foundation/status.md (frontier, milestone table, session
  log) with it. Marks only: it never edits step files, never fixes anything, and never marks a milestone ✅
  unless its verify gate was observed. This ledger is what /amend-guide reads to know which work must not be
  rewritten. Use when you finish a step, a sitting, or a milestone. Invoke with what you did, e.g.
  "/mark-progress M2/03 done" or "/mark-progress through M1, verify passed".
argument-hint: "<what you executed> [step|milestone ...]"
---

# Skill: mark-progress

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. What the reader executed is
  `$ARGUMENTS` below (plus any attached files). Read the guide's `guide/` files yourself: the ledger, the
  status doc, and the milestone folders you need to name a step correctly.
- **You have file tools here** — **write `guide/foundation/progress.md` and `guide/foundation/status.md` on
  disk**, rather than only printing fenced blocks. Create the ledger from `templates/progress.md` (deriving its
  rows from the step files actually on disk) if it's missing.
- **Marks only — touch nothing else.** Do **not** edit step files, overviews, `glossary.md`, `stack.md`,
  `conventions.md`, `decision-log.md`, or the guide `README.md`. Two files, and no others.
- When the reader wants the guide **changed**, hand off to the sibling **skill** `/amend-guide`; for friction,
  `/log-feedback` or `/report-issue`. Say so; don't do their job here.

What was executed / args:
```
$ARGUMENTS
```

**Gate:** mark exactly what the reader claimed and nothing more — no ticking earlier steps on the assumption
they must be done, no `✅` on a milestone whose `NN_verify.md` gate wasn't confirmed, no silent resolution of a
ledger that already disagrees with `status.md`. Leave the changes in the working tree — do not commit.
