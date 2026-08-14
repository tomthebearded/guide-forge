<!--
TEMPLATE: progress.md — THE READER'S EXECUTION LEDGER (step granularity).
This file records what the READER has actually EXECUTED, step by step. It is the only place in the guide
where progress is tracked below milestone level.

THE AUTHORITY SPLIT — read this before writing either file:
  progress.md  = what the reader has EXECUTED. Step granularity. Owned by the reader (written by
                 /mark-progress, read by /amend-guide to find the frontier, checked by /audit-guide
                 against the step files on disk).
  status.md    = the state of the GUIDE. Milestone verified/in-progress, drift log, session log, provenance.
                 Still the authority on "is this milestone verified" — but its frontier and its milestone
                 table are DERIVED from this file, never written in disagreement with it.
A milestone goes ✅ in status.md only when every step below it is [x] here AND its NN_verify.md gate was
observed. Two files that disagree about progress are one file lying: /mark-progress writes both in the same
run, and that is the only way either should move.

Seeded by scaffold-guide (milestone sections, no step rows yet — no step files exist), filled in by
draft-milestone (one row per step file it writes), ticked by /mark-progress.
Write the prose in the guide's language (conventions.md § Writing language); keep file names, the marks and
the section keys exactly as below — they are matched literally.
-->

# PROGRESS — <project name>

> _What has actually been **executed**, step by step. The guide describes intent, [`status.md`](status.md)
> states the guide's state — this file states **where you are in it**._
>
> Tick a step the moment you finish it, not at the end of a sitting: every maintenance skill that must avoid
> rewriting work you have already done reads this file to find the boundary. An unticked step is treated as
> **not done**, and an unticked guide is a guide those skills cannot safely amend.

## Legend
| Mark | Meaning |
|------|---------|
| `[ ]` | not executed yet |
| `[x]` | executed, and the step's **Done when** was observed |
| `[~]` | executed, but the **Done when** did not pass (or was skipped) — the row says what is outstanding |
| `[!]` | executed, then **invalidated** by a later change to the guide — the row names the retrofit that repairs it |

## Current position
<!-- One line, rewritten on every mark. It must agree with status.md § Frontier. -->
- **Last executed:** <M<n> / NN_<slug>.md, or "nothing yet">.
- **Next up:** <M<n> / NN_<slug>.md>.

## MILESTONE_<N> — <milestone title>
<!-- One row per step file, in performance order, ending with the milestone's NN_verify.md.
     Row format:  - [<mark>] `<file name>` — <step title> · <date it was marked, or nothing if unticked>
     scaffold-guide writes the heading with the placeholder row below; draft-milestone replaces it. -->
- [ ] _steps not drafted yet_
- [ ] `01_<slug>.md` — <step title>
- [ ] `02_<slug>.md` — <step title>
- [ ] `NN_verify.md` — milestone gate

## MILESTONE_<N+1> — <milestone title>
- [ ] `01_<slug>.md` — <step title>
