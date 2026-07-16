---
name: plan-guide
description: >
  Plan a learn-as-you-go, step-by-step developer build guide from a one-line idea. Use when the user wants
  to create a tutorial, course, onboarding doc, or build guide that TEACHES while it builds — for any domain
  (games, libraries, web, CLIs, APIs). Runs an audience interview, then produces a milestone-laddered plan.
  Invoke with the idea as the argument, e.g. "/plan-guide a REST API in Go".
argument-hint: "<idea> [file/repo/link ...]"
---

# Skill: plan-guide

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble and its `{{IDEA}}` placeholder.
  The idea is `$ARGUMENTS` below (plus any attached files, repo path, or link).
- **The deliverable is the plan** — produce it inline as your reply **and**, once you've settled it, write it
  to **`guide/PLAN.md`** (creating the `guide/` folder). That single file is the *only* thing you write now —
  do **not** scaffold `README.md`, `foundation/`, milestones, or any other guide content yet; that's
  `/scaffold-guide`'s job after approval.
- Where the prompt hands off to another prompt by name (e.g. `draft-milestone`), use the
  sibling **skill** of the same name instead (`/draft-milestone`).

The idea:
```
$ARGUMENTS
```

**Gate:** run the Phase 0 interview and **stop and wait** for answers before producing any plan (unless the
user said "no questions"); then stop again for plan approval before any drafting.

**Log the run:** the cost ledger doesn't exist yet (scaffold owns it), so don't write one — even though you
just created `guide/` for `PLAN.md`. End your reply with a `Planning cost (est.)` line — date + time (UTC),
`plan-guide`, an **estimated** token count + cost — so `/scaffold-guide` seeds `guide/TOKEN_USAGE.md`'s first
row from it. See
[reference/token-tracking.md](../../reference/token-tracking.md). It's an estimate (Claude can't meter its own
tokens mid-run) — label it so.
