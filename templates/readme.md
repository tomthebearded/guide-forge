<!--
TEMPLATE: README.md — the guide's FRONT DOOR (foundation doc).
A THIN landing page: what this guide builds, a one-line stack summary, the headline decisions, a running
Updates log, and the two orientation sections every guide carries verbatim — "How a step is built" and
"Following this guide". Each section LINKS to the detailed doc rather than duplicating it. It is a summary,
not a source of truth: status.md still owns "what's actually done", stack.md owns the full verified table,
decision-log.md owns the full rationale. Keep it short; when they disagree, the linked doc wins.
Scaffolded by prompt/skill `scaffold-guide`; the Updates log grows as the guide evolves (e.g. `update-stack`).

LANGUAGE — THE HEADINGS BELOW ARE CANONICAL, NOT LITERAL. Every section heading and inline marker in this
template is the English string the skills know the section by. What you WRITE into the file is the guide's own
version of it, copied byte for byte from foundation/conventions.md § Writing language → Heading map (for an
English guide the two are identical). Never translate a heading on the fly, and never leave one in English on
a page whose prose is not — the reader reads the furniture too. Untranslated regardless: file/folder names,
code, commands, paths, doc URLs, the `·` separator and the `[ ]` marks.
-->

# <Guide title> — build <the one-line what-you'll-build>

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md) and [foundation/progress.md](foundation/progress.md), not
> here** — this page describes intent; those two state reality (what the guide has verified, and which steps
> you have actually run).

> _Generated with **GuideForge v<x.y.z>** on <YYYY-MM-DD>._
<!-- Provenance: the GuideForge plugin version that produced this guide. Read the `version` field from the
     plugin's `.claude-plugin/plugin.json` at generation time; stamp it verbatim. Lets a reader know which
     revision of the method (which rules, layout, conventions) this guide was built against. -->


## Objective
<!-- The observable "done" — what the reader can run/see at the end (from the plan's Target end state). -->
<one paragraph: what you'll have built, stated as something observable — a running app, a passing suite,
a published package, a deployed URL.>

## Stack (summary)
<!-- One line of pinned versions. The FULL verified table (latest-stable column + official docs + check
     date) lives in stack.md — link it, don't copy it. -->
<language x.y> · <framework x.y> · <key library x.y> — full verified table + check date: **[foundation/stack.md](foundation/stack.md)**.

## Key decisions
<!-- The headline choices only — the ones a reader must know before starting — each linking to its full entry
     in foundation/decision-log.md. -->
- **<short decision>** — <one clause of why>. → [foundation/decision-log.md](foundation/decision-log.md#<anchor>)
- **<short decision>** — <one clause of why>. → [foundation/decision-log.md](foundation/decision-log.md#<anchor>)

## Updates
<!-- Reverse-chronological log of significant changes to the guide itself: stack bumps, scope changes,
     drift reconciliations. One line each: `<YYYY-MM-DD> — <what changed>`. Newest on top. -->
- <YYYY-MM-DD> — Guide created with GuideForge v<x.y.z>.

## How a step is built
<!-- FIXED boilerplate — every guide carries it, stamped by scaffold-guide. It orients the reader before they
     open their first step; it is NOT the contract (../reference/canonical-layout.md and templates/step.md own
     that), so keep it to one line per section and never restate a rule here.
     TRANSLATION: the heading names in the left column must be the ones the reader will ACTUALLY SEE on the
     page — copy them from foundation/conventions.md § Writing language → Heading map, byte for byte. A table
     naming `## Do this` in a guide whose steps say `## Fai così` orients the reader towards a section that
     isn't there. The right column is prose and follows the prose language like everything else.
     Say plainly which sections can be absent: a reader who meets a step with no Glossary block must not read
     it as a broken step. -->
Every step file has the same shape, so you always know where to look:

| Section | What it gives you |
|---|---|
| `> Nav:` | where you are and how to move — at the top **and** the bottom of every file |
| `## Glossary for this step` | the terms this step introduces and where on the page each is explained — only when it introduces any |
| `## Why / design` | what this step accomplishes and why it comes now. Read it before you type |
| `## Do this` | the numbered actions, each with its code block directly underneath and a note of where the code goes |
| `## Code` | the single block, for a step whose code is one small piece — otherwise the code lives under the actions above |
| `## Done when (this step)` | the gate: an action paired with the exact result you should see. Don't move on until every box is true |
| `## Suggested commit` | a ready-made commit message for what this step changed — absent when the step changes no files |
| `## If it breaks` | the failure you're most likely to hit, and the first thing to check |

Two you'll meet less often: a **`## Before you continue — corrections`** section at the top of a step — a
repair to apply *before* the step itself, and only if you executed earlier steps before the date it names —
and a **`⚠️ Superseded`** banner under the nav line, which means the step below it is out of date and points
at the file carrying its correction.

Each milestone ends in a **`NN_verify.md`** with a different shape: the milestone's one Done-when gate, the
complete contents of every file it created or changed (your authoritative copy to diff against), a
troubleshooting table, and the handoff to the next milestone.

## Following this guide
1. Read **[foundation/status.md](foundation/status.md)** first — the single source of truth for what's done and verified.
2. Start at **[Milestone 0](MILESTONE_0_<slug>/00_overview.md)**; do the milestones in order (each builds on the last).
   Tick each step in **[foundation/progress.md](foundation/progress.md)** as you finish it — that ledger is
   what lets the guide be changed later without disturbing the work you've already done.
3. **Type the code — don't paste it.** The complete files are included so you always have an authoritative
   copy to diff against, *not* so you can paste blindly. You'll learn far more by typing each file, reading it
   as you go, and predicting a step's expected output *before* you run it. Reach for paste only to unstick
   yourself when something won't work.
4. If you're following this a while after it was written, run the **review-before-follow** gate first —
   re-check the stack's "Latest stable" column and reconcile any drift before executing (reality wins).
