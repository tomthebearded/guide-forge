---
name: draft-milestone
description: >
  Draft an approved learn-as-you-go build guide into folders of atomic, teaching step files — the WHOLE guide
  by default (every milestone, in one pass), or a single named milestone if one is given (for re-drafts/fixes).
  Use after a plan from the plan-guide skill has been approved. Invoke with no argument to draft the whole guide,
  or a milestone to draft just that one, e.g. "/draft-milestone M2". Honors the approved ladder, audience model,
  conventions, and pedagogy rules.
argument-hint: "[milestone] [file ...]"
---

# Skill: draft-milestone

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. What to draft is `$ARGUMENTS`
  below (plus any attached reference files): **empty → draft the whole guide** (every milestone in the
  approved ladder); **a milestone name (or list) → draft only those**.
- **You have file tools here** — where the prompt says to *output* the milestone files as fenced blocks,
  **write them to disk** in the milestone's folder (named per the canonical layout the prompt points to)
  instead, then summarize what you created.
- Where the prompt hands off to another prompt by filename, use the sibling **skill** of the same name
  (`/clarify-step`, `/review-before-follow`, `/audit-guide`).

What to draft (empty = the whole guide):
```
$ARGUMENTS
```

**Cadence:** by default draft the **whole guide** — every milestone in the approved ladder, in order,
back-to-back in **one pass**, without stopping between milestones. Each milestone is still a complete folder
that honors the full contract, and each milestone's cumulative handoff feeds the next. Do **not** pause for
the reader to "implement one" first — produce the finished guide, then the reader builds against it and
verifies each Done-when gate as they go. Only when `$ARGUMENTS` names a specific milestone (or list) do you
draft just those — for re-drafting or fixing one milestone in an existing guide.

**Log the run:** before you finish, append this run to `guide/token-usage.md` — date + time (UTC),
`draft-milestone`, what it did, an **estimated** token breakdown + cost — and update the `TOTAL`. See
[reference/token-tracking.md](../../reference/token-tracking.md); create the ledger from its template if it's
missing. Numbers are estimates (Claude can't meter its own tokens mid-run) — label them so.
