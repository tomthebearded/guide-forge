---
name: modernize-guide
description: >
  Restructure an EXISTING flat tutorial / README / runbook / legacy guide into a learn-as-you-go GuideForge
  plan: reverse-engineer its implicit ladder, diagnose it against the pedagogy principles, verify its (likely
  stale) stack online, and re-cast it as a plan with a source-map. Use when the user has an existing
  guide/tutorial to modernize or convert — not a from-scratch idea (that's plan-guide). Invoke with the doc,
  e.g. "/modernize-guide README.md", attaching the source file(s) and any real target code.
argument-hint: "<source-doc> [file ...]"
---

# Skill: modernize-guide

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The source doc to modernize is
  `$ARGUMENTS` below (plus any attached source files and real target code). Read the source yourself where
  you can.
- **The deliverable is a plan + gap report** — produce it inline as your reply **and**, once settled, write
  the plan to **`guide/PLAN.md`** (creating the `guide/` folder). That single file is the only thing you write
  now — do **not** write the finished guide (that's `/scaffold-guide` then `/draft-milestone`).
- Where the prompt hands off to another prompt by filename, use the sibling **skill** of the same name
  (`/draft-milestone`).

Source to modernize:
```
$ARGUMENTS
```

**Gate:** stop and ask the user to approve the plan before any milestone is drafted.
