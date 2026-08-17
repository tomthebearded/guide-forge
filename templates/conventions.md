<!--
TEMPLATE: conventions.md — the style/architecture rules the whole guide follows.
One place, referenced by every step, so no step re-argues a decision. The drafter (prompt 02) reads this
and makes every step conform. Fill with YOUR stack's rules.
-->

# Conventions — <project name>

> The rules every step in this guide follows. If a step seems to contradict one of these, the convention
> wins — fix the step.

## Voice
<!-- FIXED across every GuideForge guide: address the reader directly as "you" (second person). Never refer to
     the guide-follower in the third person — not "the Human", "the human", "the user", "the developer", "the
     reader", or "one". Third-person is fine only for a DIFFERENT actor (the app's end-user, a teammate).
     See ../reference/pedagogy-rules.md § The voice principle. -->
- Address the reader as **you**; never "the Human"/"the user"/"the reader".

## Writing language
<!-- The language the guide's PROSE is written in — decided once in the plan (plan-guide Q7) and recorded
     here, because this file is the only place the later skills (scaffold-guide, draft-milestone, clarify-step,
     amend-guide, report-issue, update-stack, review-before-follow, mark-progress, log-feedback) can read it
     from in a fresh session. If this line is missing, every skill defaults to English.
     FIXED across every GuideForge guide, whatever the prose language: the skeleton stays English — file and
     folder names, the template section headings (`## Do this`, `## Done when (this step)`, …), the nav-line
     vocabulary (`Nav`, `Overview`, `prev:`/`next:`/`start:`), stack/status table column keys, and of course
     code, commands, identifiers and URLs. See ../reference/canonical-layout.md § Writing language. -->
- Prose language: **<e.g. English>**. Everything a reader reads as a sentence is written in it.
- Untranslated in every guide: file/folder names, template section headings, nav-line labels, table column
  keys, code, commands, identifiers, paths, doc URLs, and the commit messages in `## Suggested commit`.

## Commit messages
<!-- The format every step's `## Suggested commit` block follows (rule 4.5). Seeded by scaffold-guide with the
     Conventional Commits default below — change it HERE, once, if the project this guide builds uses another
     convention, and every step follows the change. The message is written in ENGLISH whatever the guide's
     prose language: it is an artifact of the reader's repository, not prose (see ../reference/canonical-layout.md
     § Writing language). Steps that change nothing under version control carry no commit block at all. -->
- Format: **`<type>(<scope>): <subject>`** (Conventional Commits).
- Types: `feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `build`, `chore`, `ci`.
- Scope: the part of the project the step touched — <e.g. `api`, `ui`, `store`, `project-settings`>.
- Subject: imperative mood, no trailing period, ≤72 characters, says **what** changed.
- One step, one commit — including a step that only changes settings, assets or config.

## Naming
<!-- e.g. file naming, symbol casing, which names are load-bearing by convention. -->

## Structure / architecture
<!-- e.g. folder layout, module boundaries, the core patterns (data-driven? layered? event-based?). -->

## Data vs code
<!-- e.g. "new content = new data file, never a new code branch" — the extensibility rule, if any. -->

## Language / framework specifics
<!-- Version-pinned API choices, idioms to prefer, idioms to avoid. -->

## Commands / shells (cross-platform)
<!-- Which shells the guide targets (must match stack.md's "Target OS / shell(s)"). RULE: every command in a
     step or a Done-when gate must run on EVERY targeted shell — give a variant per shell when they differ
     (e.g. a bash `grep -q zone.js package.json` AND its PowerShell `Select-String -Quiet zone.js package.json`).
     Never ship a Unix-only command as the sole gate check when the guide also targets Windows/PowerShell.
     (Observed: a guide's zone.js check was bash `grep` only, which fails on the reader's PowerShell.) -->

## Testing / verification
<!-- How "done" is proven in this project (the shape of Done-when gates). -->
