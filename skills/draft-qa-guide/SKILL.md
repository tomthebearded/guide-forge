---
name: draft-qa-guide
description: >
  Read a whole codebase — large ones area by area, in parallel — and draft a QA test guide a tester follows
  through the software's own interface: every limit, error branch, role check and lifecycle the code declares
  becomes a case with exact test data and an observable expected result, edge cases first (boundaries, invalid
  classes, timing, roles, failures the tester can cause). It follows every dialog or panel an action opens and
  every journey across screens, and tells the tester where each control sits and what it looks like — region,
  neighbours, colour, icon — as the code establishes it. Expected results are tagged SPEC or CODE; where the
  code looks wrong it raises a question for development instead of certifying the bug. Gates on a coverage map
  before writing, then writes one Markdown file or one per area plus runs (smoke, full, regression), with CSV
  or other formats on request. Read-only on the code. Invoke with the scope, e.g. "/draft-qa-guide",
  "/draft-qa-guide checkout and sign-in", or "/draft-qa-guide regression since v2.3.0".
argument-hint: "[scope: all | <areas> | since <ref>] [format ...]"
---

# Skill: draft-qa-guide

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The scope and any format
  preferences are `$ARGUMENTS` below (plus any attached files). Read the codebase yourself; ask only the
  interview questions the arguments and the repository don't already answer, in one round.
- **Large codebases: fan out.** After the Phase 1 survey, give each functional area to its own read-only
  agent (the `Explore` agent type where available), several in one message so they run in parallel, each
  handed the Phase 2 inventory list and told to return it with `path:line` sources. Merge their inventories
  yourself, de-duplicate shared components, and keep the coverage ledger honest about anything an agent
  sampled rather than read.
- **Use version control** for the regression scope (`git diff --stat <ref>..HEAD`, `git log` on an area) when
  the argument names a ref.
- **Stop at the Phase 4 gate** and wait for the user's approval before writing the guide.
- **Write the files on disk** in the agreed layout (default `qa/` at the codebase root). For a spreadsheet,
  use the `xlsx` skill if one is available; a CSV you write directly.
- **Read-only on the codebase** — never edit source, configuration or data, never run against production,
  and leave everything in the working tree: do not commit.

Scope / args:
```
$ARGUMENTS
```

**Gate:** map before you write — no guide until the coverage map is approved; every expected result sourced
SPEC or CODE; a suspected defect becomes a question for development, never an expected result.
