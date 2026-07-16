---
name: review-before-follow
description: >
  Reconcile a learn-as-you-go guide (or one step) against reality BEFORE you execute it — catch stale APIs,
  moved files, renamed UI, missing prerequisites. Use right before acting on a guide written a while ago, or
  against a codebase/tool that may have moved. Invoke with the step to review, e.g.
  "/review-before-follow M2/03_persist.md", optionally attaching the real project files to check against.
argument-hint: "<step-or-guide> [file ...]"
---

# Skill: review-before-follow

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The step or guide to review is
  `$ARGUMENTS` below (plus any attached real project/tool files to reconcile against).
- **You have file tools here** — when reality requires a patch, edit the step **on disk** and append the
  drift line to `status.md`, rather than only printing them. Read the real files yourself where you can.
- Where the prompt hands off to another prompt by filename, use the sibling **skill** of the same name.

Step / guide to review:
```
$ARGUMENTS
```

**Gate:** end with a clear **go / no-go** before anything executes — when the guide and reality disagree,
reality wins.

**Log the run:** before you finish, append this run to `guide/TOKEN_USAGE.md` — date + time (UTC),
`review-before-follow`, what it did, an **estimated** token breakdown + cost — and update the `TOTAL`. See
[reference/token-tracking.md](../../reference/token-tracking.md); create the ledger from its template if it's
missing. Numbers are estimates (Claude can't meter its own tokens mid-run) — label them so.
