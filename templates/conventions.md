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
<!-- TWO settings, decided once in the plan (plan-guide Q7) and recorded here, because this file is the only
     place the later skills (scaffold-guide, draft-milestone, clarify-step, amend-guide, report-issue,
     update-stack, review-before-follow, mark-progress, log-feedback) can read them from in a fresh session.
     Missing → every skill defaults to English for both.
     PROSE covers everything the reader reads: sentences AND page furniture (section headings, the inline
     markers, the nav vocabulary, the checklist labels). Nothing reader-facing is left in English.
     CODE covers the code the guide has the reader write: identifiers, comments, user-facing strings. It is
     independent of the prose — an Italian guide teaching English-named code is a normal choice.
     See ../reference/canonical-layout.md § Writing language. -->
- Prose language: **<e.g. English>**. Every sentence and every heading the reader sees is written in it.
- Code language: **<English | same as the prose>**. Applies to identifiers, comments and user-facing strings
  in the code this guide writes. Never translated either way: language keywords, standard-library and
  framework API names, framework-mandated identifiers (lifecycle methods, config keys, route/DI names),
  package names, file names. Rule 3.6 (self-describing identifiers) applies **in the code language**.
- Untranslated in every guide, whatever the two settings say: file and folder names, the `foundation/` docs'
  own section headings and table column keys (they're the schema the skills look things up by — and § *Writing
  language* is where the map below lives), commands, paths, doc URLs, the `·` separator, the `—` bare-prev
  dash, and the `[ ]` / `[x]` marks.

### Heading map
<!-- WRITTEN ONCE by scaffold-guide, complete. Left column = the canonical English string the skills know a
     section by; right column = the exact string THIS guide uses on the page. For an English guide the right
     column repeats the left, verbatim.
     EVERY OTHER SKILL READS THE RIGHT COLUMN AND REPRODUCES IT BYTE FOR BYTE — no skill translates a heading
     on the fly, and none matches on the English string once this table exists. That is how one section ends
     up with two different translations across two steps. Need a heading that isn't listed? Add the row first,
     then use it. -->

| Canonical (what the skills call it) | As written in this guide |
|-------------------------------------|--------------------------|
| `## Before you continue — corrections` | `<…>` |
| `## Glossary for this step`            | `<…>` |
| `## Why / design`                      | `<…>` |
| `## Do this`                           | `<…>` |
| `## Code`                              | `<…>` |
| `## Done when (this step)`             | `<…>` |
| `## Suggested commit`                  | `<…>` |
| `## If it breaks`                      | `<…>` |
| `## Goal`                              | `<…>` |
| `## Prerequisite`                      | `<…>` |
| `## Steps at a glance`                 | `<…>` |
| `## Design / decisions folded in`      | `<…>` |
| `Sitting <N> — <name>`                 | `<…>` |
| `## Done-when gate (the real test — check every box by hand)` | `<…>` |
| `## Files after this milestone (the checkpoint)` | `<…>` |
| `### Pre-existing files modified`      | `<…>` |
| `### Unchanged this milestone`         | `<…>` |
| `## Troubleshooting`                   | `<…>` |
| `## Handoff`                           | `<…>` |
| `## Objective`                         | `<…>` |
| `## Stack (summary)`                   | `<…>` |
| `## Key decisions`                     | `<…>` |
| `## Updates`                           | `<…>` |
| `## How a step is built`               | `<…>` |
| `## Following this guide`              | `<…>` |
| `New here:`                            | `<…>` |
| `New concept —`                        | `<…>` |
| `Build vs borrow —`                    | `<…>` |
| `**Corrected when:**`                  | `<…>` |
| `**Suggested commit:**`                | `<…>` |
| `⚠️ **Superseded <YYYY-MM-DD>**`        | `<…>` |
| `Nav:`                                 | `<…>` |
| `Overview`                             | `<…>` |
| `prev:` / `next:` / `start:`           | `<…>` |
| `milestone K of N`                     | `<…>` |
| `start: — not drafted yet`             | `<…>` |

## Commit messages
<!-- The format every step's `## Suggested commit` block follows (rule 4.5). Seeded by scaffold-guide with the
     Conventional Commits default below — change it HERE, once, if the project this guide builds uses another
     convention, and every step follows the change. The message is written in the CODE language above (English
     by default), not the prose language: it is an artifact of the reader's repository (see
     ../reference/canonical-layout.md § Writing language). The `<type>` and `<scope>` tokens are Conventional
     Commits' own vocabulary and stay English regardless. Steps that change nothing under version control carry
     no commit block at all. -->
- Format: **`<type>(<scope>): <subject>`** (Conventional Commits).
- Types: `feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `build`, `chore`, `ci`.
- Scope: the part of the project the step touched — <e.g. `api`, `ui`, `store`, `project-settings`>.
- Subject: imperative mood, no trailing period, ≤72 characters, says **what** changed, in the code language.
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
