---
name: update-stack
description: >
  Re-verify a guide's framework/library versions online and bring the guide up to date. Re-checks each tool's
  latest stable version, rewrites stack.md, then scans the guide and rewrites ONLY the steps whose
  code/commands/APIs/doc-links the bump affects (using the new version's features), logs the drift in
  status.md + decision-log.md, refreshes the README Updates log, and hands off to audit-guide to QA the
  changes. Use when the user wants to update/bump framework or library versions in a guide. Invoke with the
  tools to bump (or none for all), e.g. "/update-stack" or "/update-stack Go modernc.org/sqlite".
argument-hint: "[tool ...] [file ...]"
---

# Skill: update-stack

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble and its `{{TOOLS}}` placeholder.
  The tools to bump are `$ARGUMENTS` below (a subset of tool names, or empty for **all**), plus any attached
  lockfile/manifest. Read the guide's `guide/` files yourself where you can.
- **You have file tools here** — **edit the guide on disk** under `guide/` as the prompt directs, rather than
  only printing fenced blocks.
- When the prompt hands off to `audit-guide` (Phase 7), use the sibling **skill** `/audit-guide`.

Tools to bump / args:
```
$ARGUMENTS
```

**Gate:** touch only what the version bump actually affects; never mark a rewritten milestone `✅` — the code
changed, so the user must re-run the Done-when gates. Leave all changes in the working tree — do not commit.

**Log the run:** before you finish, append this run to `guide/TOKEN_USAGE.md` — date + time (UTC),
`update-stack`, what it did, an **estimated** token breakdown + cost — and update the `TOTAL`. See
[reference/token-tracking.md](../../reference/token-tracking.md); create the ledger from its template if it's
missing. Numbers are estimates (Claude can't meter its own tokens mid-run) — label them so.
