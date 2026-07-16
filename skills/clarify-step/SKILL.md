---
name: clarify-step
description: >
  Run the 10-rule pedagogy pass over ONE existing step of a learn-as-you-go guide to remove confusion —
  without changing what the step does. Use when a step reads unclearly, a reader got stuck, or a term went
  undefined. Invoke with the step to clarify, e.g. "/clarify-step 03_first-route.md".
argument-hint: "<step-file> [file ...]"
---

# Skill: clarify-step

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The step to clarify is
  `$ARGUMENTS` below (plus any attached code files the step references).
- **You have file tools here** — edit the step **in place on disk** rather than only printing the revised
  version, then give the change list.
- Where the prompt hands off to another prompt by filename, use the sibling **skill** of the same name
  (`/review-before-follow`).

Step to clarify:
```
$ARGUMENTS
```

**Gate:** clarity only — never change what the step *does*. If you spot a genuine bug, **flag it, don't
silently fix it**.

**Log the run:** before you finish, append this run to `guide/TOKEN_USAGE.md` — date + time (UTC),
`clarify-step`, what it did, an **estimated** token breakdown + cost — and update the `TOTAL`. See
[reference/token-tracking.md](../../reference/token-tracking.md); create the ledger from its template if it's
missing. Numbers are estimates (Claude can't meter its own tokens mid-run) — label them so.
