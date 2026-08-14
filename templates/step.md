<!--
TEMPLATE: atomic step file. One step = one indivisible action.
Exception: code files created in the SAME commit may be bundled here under one sub-heading each — and the step
says so at the top ("this step touches N files, committed together: …").
Delete these comments and any section that doesn't apply (Glossary/Code are omittable; the corrections section
below exists only on a step an amendment touched).
Every step must obey the pedagogy principles — see ../reference/pedagogy-rules.md.

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
BUILD VS BORROW (rule 3.7): if this step writes from scratch a self-contained capability a mature library in
this stack already solves (colour maths, dates/timezones, parsing, retry, diffing, validation, money), put the
one-line callout right above that work — see "Do this" below. The choice itself was made at plan time
(plan-guide Phase 2.5) and recorded in foundation/decision-log.md; this file only has to SAY it. Name a
verified library or none at all. Not for three-line helpers.
GREEN BUILD (rule 4.4): this step must END with the project compiling. If its edit breaks call sites (a changed
signature, a rename, a moved file), FIX THEM IN THIS STEP — a longer step that ends green beats two short steps
with a broken interval, and this outranks the granularity setting. NEVER write "this error is expected; step NN
fixes it". Where the stack has a compiler/type-checker, the Done-when below ends with the build clean.
-->

# <Milestone ID> · Step NN of <TOTAL> — <single action title>
> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)

<!-- SUPERSEDED BANNER — written by /amend-guide ONLY, and only on a step the reader has ALREADY EXECUTED.
     It goes here, directly under the top nav line, and it is the ONLY edit such a step ever receives: signage,
     never instruction. Nothing else in the file changes — not a value, not the code, not the file name, not
     the step number. Its job is the reader who meets this step FRESH, long before they reach the correction:
> ⚠️ **Superseded <YYYY-MM-DD>** — <what changed, one line>. Don't follow this step as written: the correction
> that brings it up to date is under *Before you continue — corrections* in [<NN_slug>.md](<NN_slug>.md).
-->

## Before you continue — corrections
<!-- OMIT THIS SECTION unless an amendment left work to repair. /amend-guide writes it at the top of the FIRST
     step the reader has NOT yet executed, so the repair lands before anything is built on top of the work it
     fixes. The condition line is mandatory: a reader who started the guide after the amendment must skip it.
     Ordinary step contract applies to the actions — WHERE, WHAT + WHY, exact values, mandatory vs illustrative.
     It closes with **Corrected when:** and NOT a "## Done when" heading — the step keeps its own single gate.
     A later amendment APPENDS a dated sub-heading here rather than opening a second section. -->
> Applies only if you executed <steps> before <YYYY-MM-DD>. Started the guide after that date? Skip this
> section — your project already matches.

1. In `<where>`, <change what the amendment invalidated> — <why it changed>.

**Corrected when:**
- [ ] <action> → <exact expected result>.

## Glossary for this step
<!-- AN INDEX, NOT A SECOND SET OF DEFINITIONS (rule 1.1b). Lists only the terms THIS step introduces —
     WORDS/CONCEPTS only, never a function (functions get an inline code comment where they're used). Each term
     is deep-linked to ../glossary.md#<slug> and says WHERE ON THIS PAGE it is taught. Do NOT write the
     definition here: the term is defined ONCE, in the body, as an inline gloss or a "New concept" callout
     (> New concept — **term**: definition.) at the point the reader meets it. Defining it in both places makes
     the reader read the same term twice before they can act.
     THIS BLOCK IS ALSO THE ONE PLACE THE GLOSSARY IS LINKED — body glosses/callouts do NOT append a
     "see glossary" link (deep-link the term's official docs in the callout only if it's an external API).
     Every term listed here MUST have its definition somewhere in the body; if one doesn't, add the gloss or
     callout — don't put the definition back up here. Omit the heading if the step introduces no terms. -->
> New here: **[<term>](../glossary.md#<slug>)** (defined under *<where on this page>*) ·
> **[<term>](../glossary.md#<slug>)** (defined in *Why / design*).

## Why / design
<!-- The rationale the reader needs to understand this step (rule 2.2). What it accomplishes and why now.
     Introduce any recurring mental model here at its point of use (rule 1.2). Omit if pure mechanics. -->

## Do this
<!-- Numbered actions (rule 4.1 — never arrow-chains). Each action says WHERE (rule 2.1), WHAT+WHY (rule 2.2),
     EXACT values (rule 3.1), MANDATORY vs illustrative (rule 3.2), change-vs-default (rule 3.3),
     load-bearing vs cosmetic names (rule 3.4), SELF-DESCRIBING identifiers in every snippet (rule 3.6 — name
     what it holds/does: `elapsedMs`, `applyPaletteToSettings()`, never `d`/`data`/`temp`/`handle()`; keep the
     ecosystem's own idiom `ctx`/`req`/`res`/`i`).
     RULE 4.2 — code goes HERE, interleaved: when an action introduces code, put its fenced block right under
     that action, labelled with WHERE it lands. The block is a FRAGMENT (the part this action adds), not the
     whole file. Don't stack all the code in a trailing section.
     RULE 3.7 — hand-rolling something the ecosystem solves? The callout goes on its own line right above that
     action, same plain-text style as "New concept" (no emoji):
> Build vs borrow — **<library> <version>** does this in production (<official docs URL>): you're writing it
> by hand here to learn <the mechanism>. Swap it in when <condition>.
     Borrowing instead? No callout — just one clause in the action saying what the library does for the reader,
     so the dependency isn't a black box either. -->
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
     output, show it: the exact action → the exact result the reader should see. Not "it works".
     RULE 6.2 — check the ENVIRONMENT you told the reader to observe in doesn't mask the signal: a debug
     session repainting the UI, dev mode disabling caching, strict mode double-invoking effects, hot-reload
     hiding "survives a restart". If it does, observe an unmasked channel, set the environment-specific
     variant too, or state HERE what that environment shows — never leave it to "If it breaks", which a
     reader whose code works will never read.
     RULE 4.4 — if the stack has a compiler/type-checker/bundler, the LAST box is the build being clean. -->
- [ ] <action> → <exact expected output the reader should see>.
- [ ] `<build command>` → exits 0 / the watch task reports **0 errors**.   <!-- rule 4.4; drop only if the
      stack has no build step. Never replace it with "an error here is expected". -->

## If it breaks
<!-- Rule 5.1: the likely failure and the first thing to check. Omit only if truly nothing can go wrong. -->
- **<symptom>** → <usual cause / first thing to check>.

<!-- BOTTOM NAV — the SAME line as line 2, after a --- rule, as the last thing in the file. -->
---
> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)
