<!--
TEMPLATE: atomic step file. One step = one indivisible action.
Exception: code files created in the SAME commit may be bundled here under one sub-heading each — and the step
says so at the top ("this step touches N files, committed together: …").
Delete these comments and any section that doesn't apply (Glossary/Code are omittable).
Every step must obey the 7 pedagogy principles — see ../reference/pedagogy-rules.md.

NAV LINE IS CANONICAL AND REQUIRED — AT BOTH TOP AND BOTTOM: line 2 directly under the H1, AND repeated
verbatim at the very bottom of the file after a "---" horizontal rule. Same EXACT format in both places, the
SAME in every step of every milestone. The middle anchor label is EXACTLY "Overview" — never "Milestone
overview", "Back to overview", or any other wording (that inconsistency spread across 140 files in one guide).
A verify step's "next →" points at the next milestone's ../MILESTONE_<n+1>_<slug>/00_overview.md.
FIRST STEP OF A MILESTONE: its "prev" is a bare em-dash "—" (NOT a link) — the Overview anchor already points
there, so a prev→00_overview.md link is redundant. So the first step's nav is:
  > Nav: — · [Overview](00_overview.md) · [<next> →](<next>.md)
Generate the nav from this template mechanically; don't hand-write it per file. The bottom nav is the same
line as the top. See reference/canonical-layout.md.
CODE PLACEMENT (rule 4.2): don't batch code in a trailing block. When a step's code has 2+ distinct parts,
put each part's fenced block RIGHT UNDER the numbered instruction that introduces it (see "Do this" below),
and label every fragment with WHERE it goes (file + position). The step shows fragments, not one complete
file — the whole, paste-able file is rendered in that milestone's NN_verify.md checkpoint. Do NOT also append
a consolidated "complete file" block here. A single small block under one instruction may stay in ## Code.
EXISTING FILES (rule 4.3): if the file already has code, DON'T re-paste the whole file to make a small addition.
Show only the fragment plus a UNIQUE placement anchor — a named function/block or a line that occurs exactly
once (e.g. "after the init() function, the block ending canvas.focus();"), never an anchor that matches several
lines. Reproducing a pre-existing file whole invites the reader to overwrite their real code.
-->

# <Milestone ID> · Step NN of <TOTAL> — <single action title>
> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)

## Glossary for this step
<!-- Only the terms THIS step introduces (rule 1.1) — WORDS/CONCEPTS only, never a function (functions get an
     inline code comment where they're used). One line each, each deep-linked to ../glossary.md#<slug>. THIS
     BLOCK IS THE ONE PLACE THE GLOSSARY IS LINKED — body glosses/callouts define the term but do NOT append a
     "see glossary" link (rule 1.1). Omit the heading if none.
     Alternative for a term that first appears on a command/menu/code line below: skip this block for it and put a
     "New concept" callout on its own line right above that line — > 📚 New concept — **term**: definition.
     (No glossary link in the callout; deep-link the term's official docs there only if it's an external API.) -->
> **[<term>](../glossary.md#<slug>)** — <one-sentence plain-language definition>.

## Why / design
<!-- The rationale the reader needs to understand this step (rule 2.2). What it accomplishes and why now.
     Introduce any recurring mental model here at its point of use (rule 1.2). Omit if pure mechanics. -->

## Do this
<!-- Numbered actions (rule 4.1 — never arrow-chains). Each action says WHERE (rule 2.1), WHAT+WHY (rule 2.2),
     EXACT values (rule 3.1), MANDATORY vs illustrative (rule 3.2), change-vs-default (rule 3.3),
     load-bearing vs cosmetic names (rule 3.4).
     RULE 4.2 — code goes HERE, interleaved: when an action introduces code, put its fenced block right under
     that action, labelled with WHERE it lands. The block is a FRAGMENT (the part this action adds), not the
     whole file. Don't stack all the code in a trailing section. -->
1. In `<where>`, <do the thing> — <why>.
   ```<lang>
   // the fragment this action adds — labelled above with where it goes in the file
   ```
2. …

## Code
<!-- OMIT this section when the step's code is multi-part — rule 4.2 puts those fragments under their
     instructions in "Do this" above, and the whole file lives in NN_verify.md. Use this heading ONLY for a
     step whose code is a SINGLE small block introduced by one instruction. Never a consolidated dump of a
     multi-part step, and never a duplicate "complete file" copy of interleaved fragments. -->
### `<path/to/file>`
```<lang>
// the single block this step adds
```

## Done when (this step)
<!-- The observable sub-slice of the milestone gate this step satisfies. Where the step produces observable
     output, show it: the exact action → the exact result the reader should see. Not "it works". -->
- [ ] <action> → <exact expected output the reader should see>.

## If it breaks
<!-- Rule 5.1: the likely failure and the first thing to check. Omit only if truly nothing can go wrong. -->
- **<symptom>** → <usual cause / first thing to check>.

<!-- BOTTOM NAV — the SAME line as line 2, after a --- rule, as the last thing in the file. -->
---
> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)
