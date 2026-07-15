---
name: scaffold-guide
description: >
  Stamp the folder skeleton + five foundation docs (stack, status, glossary, conventions, decision-log) of a
  GuideForge guide from an approved plan, pre-filled from the plan and with a placeholder overview per
  milestone — so drafting can start immediately. Use after a plan is approved and before drafting the first
  milestone. Invoke with the plan, e.g. "/scaffold-guide", attaching PLAN.md.
argument-hint: "[PLAN.md] [file ...]"
---

# Skill: scaffold-guide

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The approved plan is at
  **`guide/PLAN.md`** (written there by `plan-guide`); read it from disk. It may also be `$ARGUMENTS` below
  (attached, pasted, or already in the conversation). **Don't move or overwrite `guide/PLAN.md`** — scaffold
  the rest of the guide around it.
- **You have file tools here** — **write the skeleton to disk** under `guide/` (the prompt describes each
  file), rather than only printing fenced blocks. This includes seeding an empty `guide/feedback-log.md` from
  `templates/feedback-log.md`. Then list what you created.
- Where the prompt hands off to another prompt by filename, use the sibling **skill** of the same name
  (`/draft-milestone`).

Plan / args:
```
$ARGUMENTS
```

**Gate:** write only the skeleton + foundation docs, not step content; leave undecided template headings
empty rather than guessing.

**Log the run (ledger owner):** **create** `guide/token-usage.md` from the template in
[reference/token-tracking.md](../../reference/token-tracking.md) as part of scaffolding, seeded with this run —
date + time (UTC), `scaffold-guide`, what it did, an **estimated** token breakdown + cost — plus a first row
from the plan's `Planning cost (est.)` line if it carries one. Numbers are estimates (Claude can't meter its
own tokens mid-run) — label them so.
