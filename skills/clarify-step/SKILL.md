---
name: clarify-step
description: >
  Run the pedagogy pass over ONE existing step of a learn-as-you-go guide to remove confusion —
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

**Gate:** clarity only — never change what the step *does*. Run the prompt's **Step 0 frontier check** and say
in one line whether the step is already executed; if the pass turns out to need a load-bearing edit (a rename,
a changed value, a re-cut step, a gate that would assert something new) on an executed step, **stop and let the
user choose** rather than applying it. If you spot a genuine bug, **flag it, don't silently fix it**.
