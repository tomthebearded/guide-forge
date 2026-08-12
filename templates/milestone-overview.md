<!--
TEMPLATE: 00_overview.md — the milestone MAP. One per milestone folder.
KEEP IT SHORT — it orients, it does not teach. Everything this milestone builds is explained in the step that
builds it, so never explain here what a step explains: the reader either reads it twice or reads it once with
no code in front of them, and both are wasted. Say what the milestone proves, what must already work, and
which steps are in it. Then get out of the way.
The milestone's acceptance gate and its handoff are NOT here — both live in NN_verify.md, where the reader
needs them (after doing the work). One gate, one place.
Target: the whole file fits on one screen.
-->

# Milestone <ID> — <title>
> <Phase/Section · milestone K of N · prev: [<prev>](../<prev>/00_overview.md) · next: [<next>](../<next>/00_overview.md) · start: [<step 01 title>](01_<slug>.md)>
<!-- The nav line ALWAYS ends with `start:` — a link to this milestone's FIRST step file (01_<slug>.md),
     labelled with that step's title. It is the reader's way in: without it the only forward click on the map
     is `next`, which skips the whole milestone. In a scaffold placeholder (steps not drafted yet) write the
     segment as the literal text `start: — not drafted yet`. -->

## Goal
<!-- What this milestone PROVES — a runnable, observable end state. Two or three sentences, no more. -->

## Prerequisite
<!-- The previous milestone; what must already exist/work before starting this one. One or two lines. -->

## Steps at a glance
<!-- The step files, GROUPED into sittings (natural stopping points, each ending in a checkpoint/commit).
     Titles and links only — no summary of what each step does. -->
**Sitting 1 — <name> (01–0X)**
1. [<step>](01_<slug>.md)
2. …

**Sitting 2 — <name> (0Y–NN)**
- …

## Design / decisions folded in
<!-- A compact INDEX, not an essay: one line per concept or decision — its name, the step that teaches it, and
     the foundation doc that records it (../conventions.md, ../glossary.md, ../decision-log.md). No
     explanation here; the step does the explaining. Omit the section entirely if there's nothing to index. -->
- <concept / decision> — taught in [<step>](NN_<slug>.md); recorded in ../decision-log.md.

<!-- BOTTOM NAV — the SAME line-2 milestone nav, `start:` segment included, after a --- rule, as the last
     thing in the file. -->
---
> <Phase/Section · milestone K of N · prev: [<prev>](../<prev>/00_overview.md) · next: [<next>](../<next>/00_overview.md) · start: [<step 01 title>](01_<slug>.md)>
