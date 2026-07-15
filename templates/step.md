<!--
TEMPLATE: atomic step file. One step = one indivisible action.
Exception: code files created in the SAME commit may be bundled here under one sub-heading each — and the step
says so at the top ("this step touches N files, committed together: …").
Delete these comments and any section that doesn't apply (Glossary/Code are omittable).
Every step must obey the 10 pedagogy rules — see ../reference/pedagogy-rules.md.

NAV LINE IS CANONICAL AND REQUIRED: line 2, directly under the H1, in this EXACT format, the SAME in every
step of every milestone. The middle anchor label is EXACTLY "Overview" — never "Milestone overview", "Back to
overview", or any other wording (that inconsistency spread across 140 files in one guide). A verify step's
"next →" points at the next milestone's ../MILESTONE_<n+1>_<slug>/00_overview.md.
FIRST STEP OF A MILESTONE: its "prev" is a bare em-dash "—" (NOT a link) — the Overview anchor already points
there, so a prev→00_overview.md link is redundant. So the first step's nav is:
  > Nav: — · [Overview](00_overview.md) · [<next> →](<next>.md)
Generate the nav from this template mechanically; don't hand-write it per file. See reference/canonical-layout.md.
Editing an EXISTING file? Show the whole updated file if it's short; a long file grown across steps is shown
complete in that milestone's NN_verify.md checkpoint — never leave it as fragments only.
-->

# <Milestone ID> · Step NN of <TOTAL> — <single action title>
> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)

## Glossary for this step
<!-- Only the terms THIS step introduces (rule 1). One line each. Link ../glossary.md. Omit the heading if none.
     Alternative for a term that first appears on a command/menu/code line below: skip this block for it and put a
     "New concept" callout on its own line right above that line — > 📚 New concept — [term](../glossary.md#term): definition. -->
> **<term>** — <one-sentence plain-language definition>.

## Why / design
<!-- The rationale the reader needs to understand this step (rule 3). What it accomplishes and why now.
     Introduce any recurring mental model here at its point of use (rule 7). Omit if pure mechanics. -->

## Do this
<!-- Numbered actions (rule 9 — never arrow-chains). Each action says WHERE (rule 2), WHAT+WHY (rule 3),
     EXACT values (rule 4), MANDATORY vs illustrative (rule 5), change-vs-default (rule 6),
     load-bearing vs cosmetic names (rule 8). -->
1. In `<where>`, <do the thing> — <why>.
2. …

## Code
<!-- Complete file(s), never partial snippets. One sub-heading + one fenced block per file. Omit if no code. -->
### `<path/to/file>`
```<lang>
// complete file
```

## Done when (this step)
<!-- The observable sub-slice of the milestone gate this step satisfies. Where the step produces observable
     output, show it: the exact action → the exact result the reader should see. Not "it works". -->
- [ ] <action> → <exact expected output the reader should see>.

## If it breaks
<!-- Rule 10: the likely failure and the first thing to check. Omit only if truly nothing can go wrong. -->
- **<symptom>** → <usual cause / first thing to check>.
