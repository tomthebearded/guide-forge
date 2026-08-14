<!--
TEMPLATE: README.md — the guide's FRONT DOOR (foundation doc).
A THIN landing page: what this guide builds, a one-line stack summary, the headline decisions, and a
running Updates log — each section LINKS to the detailed doc rather than duplicating it. It is a summary,
not a source of truth: status.md still owns "what's actually done", stack.md owns the full verified table,
decision-log.md owns the full rationale. Keep it short; when they disagree, the linked doc wins.
Scaffolded by prompt/skill `scaffold-guide`; the Updates log grows as the guide evolves (e.g. `update-stack`).
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
