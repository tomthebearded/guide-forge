---
name: amend-guide
description: >
  The requirements changed while someone is halfway through a learn-as-you-go guide — fold the change in
  WITHOUT rewriting the work they've already executed. Reads foundation/progress.md to find the frontier
  (and stops to have it confirmed if it's missing or stale), verifies any new fact online, then delivers an
  impact report and WAITS for approval. On approval it rewrites only what's ahead of the frontier, leaves
  executed steps untouched except for a superseded banner, and puts the repair for invalidated work in a
  "Before you continue — corrections" section at the top of the first unexecuted step. Use when what you want
  built has changed — not when the guide is wrong (that's /report-issue) or its versions moved
  (/update-stack). Invoke with the change, e.g. "/amend-guide swap SQLite for Postgres".
argument-hint: "<what you want changed> [file ...]"
---

# Skill: amend-guide

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The change request is `$ARGUMENTS`
  below (plus any attached files). Read the guide's `guide/` files yourself: `progress.md` and `status.md`
  first, then `PLAN.md` and the milestone folders the change reaches.
- **You have file tools here** — **write the amended files to disk** rather than only printing fenced blocks.
  Create `foundation/progress.md` from `templates/progress.md` if it's missing.
- **The gate is real, and it is the point.** Deliver the impact report and **stop**. Write nothing until the
  user approves — not the "obvious" edits, not the foundation docs, not a placeholder. Step 0's progress gate
  is the same: if the frontier is unknown or contradicted, stop and ask before anything else.
- **Executed steps are read-only** except for the superseded banner. Never renumber, rename, move or delete a
  file that `progress.md` marks executed.
- **You have web access** — verify every version, API and config key the change introduces against the official
  docs. Never assert one from memory.
- Hand off to the sibling **skills**, not the prompt files: `/mark-progress` to record what's been executed (or
  to clear an `[!]` row once the reader applies a correction), `/report-issue` for a defect you noticed on the
  way past, `/audit-guide` on the milestones you touched.

Change request / args:
```
$ARGUMENTS
```

**Gate:** no frontier, no amendment — and no writes before the impact report is approved. Rewrite only ahead of
the frontier, banner-only behind it, the repair in the first unexecuted step, amended milestones `⏳` and never
`✅`. Leave all changes in the working tree — do not commit.
