<!--
TEMPLATE: status.md — THE STATUS AUTHORITY (the "truth lives in one place" pillar).
This file is the SINGLE SOURCE OF TRUTH for what is actually done and verified.
Guides describe INTENT; only this file states REALITY. When a guide and this file disagree, this file wins.
Read it first every session; update it last.

ITS ONE NEIGHBOUR: foundation/progress.md — the reader's execution ledger, step by step. This file stays the
authority on the GUIDE's state (is this milestone verified? what drifted? what happened this session?), but its
Frontier and its milestone table are DERIVED from that ledger and are never written in disagreement with it.
A milestone is ✅ here only when every one of its rows there is [x] AND its NN_verify.md gate was observed.
/mark-progress writes both files in the same run — that is the only way either should move.

LANGUAGE — this is a `foundation/` doc: its section headings, table column keys and marks are the schema the
skills look things up by, so they stay ENGLISH in every guide, whatever the prose language. The prose you
write inside them follows the guide's prose language (conventions.md § Writing language).
-->

# STATUS — <project name>

> _Generated with **GuideForge v<x.y.z>** on <YYYY-MM-DD>._
> _Last updated with **GuideForge v<x.y.z>** on <YYYY-MM-DD>._
<!-- Provenance — TWO stamps, answering two different questions. Both take the version verbatim from the
     `version` field of the plugin's `.claude-plugin/plugin.json`.
     - **Generated**: the version that scaffolded this guide. Set once, at scaffold time, and never touched
       again — it records the method revision the guide was built against.
     - **Last updated**: the version and date of the most recent skill run that CHANGED the guide (drafting,
       clarifying, an issue fix, a stack bump, a reality reconciliation). Rewrite BOTH of its fields on every
       such run. A guide generated on v1.4 and last touched on v1.11 has been through seven revisions of the
       method, and only this line says so — which is what tells you whether it's worth re-running the
       maintenance skills against it.
     At scaffold time the two lines are identical. -->

## Frontier
<!-- The single most important line: which milestone is currently being worked, and what's the next unverified one.
     Step-level detail lives in progress.md; this line must agree with its "Current position". -->
- **Current frontier:** <milestone ID> — <status: not started / in progress / verified>.
- **Executed through:** <last [x] step in [progress.md](progress.md), or "nothing yet">.

## Source inputs
<!-- Files provided when the guide was planned (spec, design doc, sample code, OpenAPI, legacy guide). They
     fed the plan and CAN drift independently of the guide — re-check them during review-before-follow. Omit
     the section if the guide was planned from the idea alone. -->
| Input file | Used for (stack / scope / decisions) | Provided on | Re-checked on |
|------------|--------------------------------------|-------------|---------------|
| <path/name> | | <date> | <date or —> |

## Milestone status
| Milestone | Status | Verified on | Notes |
|-----------|--------|-------------|-------|
| M1 — <title> | ⏳ / ✅ / ❌ | <date or —> | |
| M2 — <title> | | | |

<!-- Status key: ✅ verified (Done-when passed by hand) · ⏳ in progress · ❌ not started -->

## Drift log
<!-- Every time reality differed from a guide, record it here (from prompt 04). old assumption → real value → date. -->
| Date | Where | Guide said | Reality is | Action taken |
|------|-------|-----------|-----------|--------------|
| | | | | |

## Session log
<!-- Append-only. One line per working session: date, what was attempted, what passed/failed. -->
- <date> — <what happened>.
