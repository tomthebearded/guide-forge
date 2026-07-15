---
name: report-issue
description: >
  A reader hit a real issue while following a learn-as-you-go guide — report it and fix the guide so the
  issue can't recur. Diagnoses the root cause, fixes the step where they got stuck, then sweeps the WHOLE
  guide for every other place the same class of defect appears and fixes those too, adds a failure-note
  guard, logs it in status.md + decision-log.md, proposes a pedagogy rule if it's a general confusion, marks
  affected milestones for re-verification (never ✅), and hands off to audit-guide. Use when a reader got
  stuck, hit an error, or found something wrong following the guide. Invoke with the issue(s), e.g.
  "/report-issue M2/03 — npm run dev fails, needs .env first".
argument-hint: "<issue description> [file ...]"
---

# Skill: report-issue

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The issue report(s) are
  `$ARGUMENTS` below (plus any attached files — an error log, a screenshot description, the real project
  file the reader was working in). Read the guide's `guide/` files yourself where you can.
- **You have file tools here** — **edit the guide on disk** under `guide/` (steps, `status.md`,
  `decision-log.md`, `README.md`, and a `feedback-log.md` entry for the report) as the prompt directs, rather
  than only printing fenced blocks.
- **Locate before you ask.** Search the guide for the command, term, or symptom to place the issue yourself;
  only ask the reader a question when you genuinely can't place it or can't disambiguate two root causes.
- When the prompt proposes a **pedagogy rule** (step 7), propose it and wait for approval before editing
  `reference/pedagogy-rules.md` — that file is repo-level, domain-agnostic content.
- When the prompt hands off to `audit-guide` (step 9), use the sibling **skill** `/audit-guide`.

Issue report(s) / args:
```
$ARGUMENTS
```

**Gate:** the reader's failure is real — fix the guide, don't explain it away; fix the root cause everywhere
it appears, not just where they hit it; never mark a rewritten milestone `✅` (the reader must re-run the
Done-when gates); propose pedagogy rules, don't silently add them. Leave all changes in the working tree — do
not commit.

**Log the run:** before you finish, append this run to `guide/token-usage.md` — date + time (UTC),
`report-issue`, what it did, an **estimated** token breakdown + cost — and update the `TOTAL`. See
[reference/token-tracking.md](../../reference/token-tracking.md); create the ledger from its template if it's
missing. Numbers are estimates (Claude can't meter its own tokens mid-run) — label them so.
