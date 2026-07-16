---
name: audit-guide
description: >
  Lint/QA a drafted learn-as-you-go guide against the GuideForge contract and report violations, ranked by
  severity — structural (missing Done-when, no nav line, partial code, dead links, no overview) and pedagogy
  (undefined terms, missing WHERE/WHY, arrow-chains, vague values). Read-only: it flags, it does not fix. Use
  when the user wants to check/QA/review a guide before shipping it. Invoke with the guide, e.g.
  "/audit-guide M2/", attaching the file(s) to audit.
argument-hint: "<guide-or-milestone> [file ...]"
---

# Skill: audit-guide

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The guide, milestone, or steps
  to audit are `$ARGUMENTS` below (plus any attached files). Read the target files yourself where you can.
- **Read-only** — produce the findings report as your reply; **never edit the guide**.
- Where the prompt points at another prompt by filename, use the sibling **skill** of the same name
  (`/clarify-step`, `/review-before-follow`).

Guide to audit:
```
$ARGUMENTS
```

**Gate:** flag, don't fix — point the user at `/clarify-step` for the pedagogy issues you find.

**Log the run:** you're read-only on guide *content*, but the cost ledger is metadata — append this run to
`guide/TOKEN_USAGE.md` anyway (that one file is exempt from your no-edit promise) and update the `TOTAL`;
change nothing else. Row = date + time (UTC), `audit-guide`, what it did, an **estimated** token breakdown +
cost. See [reference/token-tracking.md](../../reference/token-tracking.md). Estimates only (Claude can't meter
its own tokens mid-run) — label them so.
