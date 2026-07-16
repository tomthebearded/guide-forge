---
name: log-feedback
description: >
  A reader hit friction while following a learn-as-you-go guide — capture it to the guide's feedback log
  WITHOUT changing the guide. Appends one dated, structured entry (where · reader · what happened · suspected
  class · severity · tags · quote) to guide/feedback-log.md, so friction becomes durable data for improving the
  guide and the GuideForge method later. Log-only: it does not diagnose or fix (that's /report-issue). Use when
  you want to record a reader's snag, confusion, or error without editing the guide yet. Invoke with the
  report, e.g. "/log-feedback M2/03 — reader confused by the token step, expected a value".
argument-hint: "<what the reader hit> [step ...]"
---

# Skill: log-feedback

The complete, canonical contract for this skill is the paste-prompt it wraps, inlined here — **follow it in
full:**

!`cat "${CLAUDE_SKILL_DIR}/prompt.md"`

(If the block above came back empty or errored, read `prompt.md` in this skill folder — it sits beside this `SKILL.md` — and follow that.)

As you follow it, adapt for the fact that you're a Claude Code skill, not a pasted prompt:

- **You're already invoked** — skip its "How to use / paste this" preamble. The field report(s) are
  `$ARGUMENTS` below (plus any attached files — an error log, a screenshot description, the file the reader was
  working in). Read the guide's `guide/` files yourself to place the report.
- **You have file tools here** — **append the entry to `guide/feedback-log.md` on disk**, rather than only
  printing a fenced block. Create the ledger from `templates/feedback-log.md` if it's missing.
- **Log-only — touch nothing else.** Do **not** edit step files, `status.md`, `decision-log.md`, or the guide
  `README.md`. The only file this skill writes is `guide/feedback-log.md`.
- **Locate to log, not to fix.** Search the guide to fill **Where** accurately; do not edit the step you find.
- When a real fix is warranted, hand off to the sibling **skill** `/report-issue` — say so; don't fix here.

Field report(s) / args:
```
$ARGUMENTS
```

**Gate:** this skill captures, it does not repair — append to `guide/feedback-log.md` and change nothing else;
one entry per distinct piece of friction, faithful to what the reader experienced, guesses labelled as
guesses; point the user to `/report-issue` if the guide should actually be fixed. Leave the entry in the
working tree — do not commit.

**Log the run:** before you finish, append this run to `guide/TOKEN_USAGE.md` — date + time (UTC),
`log-feedback`, what it did, an **estimated** token breakdown + cost — and update the `TOTAL`. See
[reference/token-tracking.md](../../reference/token-tracking.md); create the ledger from its template if it's
missing. Numbers are estimates (Claude can't meter its own tokens mid-run) — label them so.
