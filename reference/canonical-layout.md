# Reference — Canonical guide layout (the one true skeleton)

> The single, fixed on-disk shape **every** GuideForge guide uses. `scaffold-guide` stamps it, `draft-milestone`
> fills it, `audit-guide` checks against it. It exists because guides drafted from the same plugin were
> diverging — foundation docs at the root in one guide and under `foundation/` in another, `overview.md` vs
> `00_overview.md`, a README in one and none in the other. A reader (and the audit) should never have to guess
> where a file lives. **Do not invent a different structure per guide.**
>
> Every name and separator below is a **ratified convention**: nothing forces `00_overview.md` over
> `overview.md`, or `·` over `|`. They were chosen deliberately and fixed, and their value *is* that they're
> fixed — the pipeline and the audit both read them literally. Change one here and everywhere, or not at all.

---

## The skeleton

```
<project>/                        ← PROJECT LEVEL
└── <guide-root>/  (the guide/)   ← THE GUIDE FOLDER — every guide-related doc lives here
    ├── README.md                 ← the front door (objective · stack summary · decisions · Updates log)
    ├── PLAN.md                   ← the approved plan (written by plan-guide; scaffold fills the guide in around it)
    ├── feedback-log.md           ← append-only field log of reader friction (seeded by scaffold; appended by /log-feedback)
    ├── foundation/               ← the cross-cutting docs, read first
    │   ├── stack.md              ← Verified stack (pinned versions + official docs + check date)
    │   ├── status.md             ← THE status authority (single source of truth for progress)
    │   ├── glossary.md
    │   ├── conventions.md
    │   └── decision-log.md
    ├── MILESTONE_0_<slug>/       ← one folder per milestone, in ladder order
    │   ├── 00_overview.md        ← the milestone map (from templates/milestone-overview.md)
    │   ├── 01_<slug>.md          ← atomic step files, numbered in performance order
    │   ├── 02_<slug>.md
    │   └── NN_verify.md          ← the milestone's verify step (from templates/verify.md)
    ├── MILESTONE_1_<slug>/
    │   └── …
    └── …
```

## Naming rules (exact — load-bearing)
- **Milestone folders:** `MILESTONE_<N>_<slug>` — the literal word `MILESTONE_` + the integer + `_` + a short
  kebab/underscore slug (e.g. `MILESTONE_0_environment`, `MILESTONE_3_verify-tokens`). Numbered from
  `MILESTONE_0` (or `MILESTONE_1`) upward, one per ladder rung.
- **Milestone map:** always **`00_overview.md`** — the `00_` prefix sorts it first in the folder. Never
  `overview.md`. It is a **map, not a lesson**: goal, prerequisite, steps at a glance, and a compact index of
  the concepts/decisions folded in — nothing a step already explains. The milestone's **Done-when gate** and
  its **handoff** are not here; both live in `NN_verify.md`, at the point the reader needs them. One gate,
  one file.
- **Step files:** `NN_<slug>.md`, `NN` zero-padded to two digits (`01`, `02`, …), numbered in the exact order
  the reader performs them.
- **Verify step:** always **`NN_verify.md`** — the last file in the milestone folder (its `NN` is the next
  number after the last step). It carries the milestone's **one Done-when gate**, the file checkpoint, the
  troubleshooting table, and — last — the **handoff** (cumulative state · what's left open · the next
  milestone). The gate and the handoff appear here and nowhere else; a gate quoted in two files drifts in one
  of them, and a handoff written before the work is a recap of something the reader hasn't done yet. Its
  **file checkpoint** renders the **complete** contents of every
  **guide-authored** file the milestone *created or modified*, and its completeness claim covers **only those
  files**. A **pre-existing file the milestone only adds to** (rule 4.3) is the one exception — it's shown as its
  added region + unique placement anchor, never reproduced whole (that would invite the reader to overwrite
  their real code); list it under "Pre-existing files modified". A file the milestone didn't touch is listed as
  unchanged (named, not rendered) — never swept into a blanket "authoritative copy of every file" claim the
  checkpoint doesn't actually keep. A guide-authored file named as touched but shown only as a fragment is a
  broken checkpoint. (Observed: guides over-claimed completeness.)
- **Foundation docs** live under **`foundation/`**, never loose at the guide root. Their filenames are exactly
  `stack.md`, `status.md`, `glossary.md`, `conventions.md`, `decision-log.md`.
- **`README.md`** sits at the guide root (above `foundation/`).
- **Guide-root files** — every guide-related doc lives **inside the guide folder**: `README.md`, `PLAN.md`
  (the approved plan — written into `guide/` by `plan-guide`, not left at the project root), `feedback-log.md`
  (reader-friction log), and `foundation/` + the milestone folders. Nothing guide-related lives outside
  `guide/`.

## Link conventions (so nothing dead-links)
- From a **step or overview** to a foundation doc: `../foundation/<doc>.md` (steps live one level below root).
- From the **README** to a foundation doc: `foundation/<doc>.md`.
- **Step nav line** (canonical, at the top of every step — see `templates/step.md`):
  `> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)`.
  - The middle anchor label is **exactly `Overview`** — never `Milestone overview` or any other wording.
  - The **first step's prev is a bare em-dash `—`** (not a link): `> Nav: — · [Overview](00_overview.md) · [<next> →](<next>.md)`.
    The Overview anchor already points at `00_overview.md`, so a prev→overview link is redundant.
  - `NN_verify.md`'s `next →` points at the **next milestone's** map: `../MILESTONE_<n+1>_<slug>/00_overview.md`.
- **Nav appears at BOTH ends.** Every navigable file (steps, `NN_verify.md`, `00_overview.md`) repeats its
  nav line **verbatim at the very bottom**, after a `---` horizontal rule, so a reader who scrolls to the end
  can move on without scrolling back up. Top nav is line 2; bottom nav is the last content in the file. The two
  must be **identical**. (Foundation docs, `README.md`, `PLAN.md`, and `feedback-log.md` carry no step nav and
  get none.)
- **Overview nav line:** `prev`/`next` point at the sibling milestones' maps
  (`../MILESTONE_<n-1>_<slug>/00_overview.md`, `../MILESTONE_<n+1>_<slug>/00_overview.md`) — at both top and bottom.
- **The overview links its own first step — `start:`.** Every `00_overview.md` nav line ends with a third
  segment pointing at the milestone's **first step file**, `01_<slug>.md`, labelled with that step's title:
  `> <Phase> · milestone K of N · prev: [<prev>](../MILESTONE_<n-1>_<slug>/00_overview.md) · next: [<next>](../MILESTONE_<n+1>_<slug>/00_overview.md) · start: [<step 01 title>](01_<slug>.md)`
  — in **both** the top and the bottom nav, identical like the rest of the line. The overview is the door into
  the milestone, and its nav offered only sideways moves: a reader who finished the map had no forward link at
  hand, so from the bottom nav the nearest click was **`next` — the following milestone** — and starting the
  work meant scrolling back up to hunt for step 01 inside "Steps at a glance". `start:` is the one move the
  overview was missing. A **scaffold placeholder** overview (steps not drafted yet) carries the segment as the
  literal text `start: — not drafted yet` (no link, nothing to point at); `draft-milestone` replaces it with the
  real link when it writes `01_<slug>.md`.

## Writing language (the prose translates; the skeleton doesn't)

A guide's **prose** may be written in any language. `plan-guide` asks for it once (Phase 0, Q7) and the answer
is recorded in **`foundation/conventions.md` § Writing language** — the only place later skills can read it
from. `draft-milestone`, `clarify-step`, `report-issue`, `update-stack`, `review-before-follow` and
`log-feedback` each run in their own session, so a language agreed only in conversation is a language the next
skill silently drops. **No recorded language → English.**

The **skeleton stays English in every guide**, whatever the prose language, because the pipeline and the audit
read it literally — exactly like the naming rules above:

- file and folder names — `README.md`, `00_overview.md`, `NN_verify.md`, `MILESTONE_<N>_<slug>/`,
  `foundation/`, and the step slugs;
- the template section headings — `## Do this`, `## Code`, `## Done when (this step)`, `## Why / design`,
  `## Glossary for this step`, `## If it breaks`, `## Handoff`, `## Frontier`, and the rest;
- the nav-line vocabulary and separator — `Nav`, `Overview`, `prev:`, `next:`, `start:`, `milestone K of N`,
  `·`;
- the fixed table column keys in `stack.md` / `status.md`;
- code, identifiers, commands, paths and doc URLs.

So an Italian guide reads as Italian sentences under an English `## Do this`. Translating a heading buys
cosmetics and breaks the one string every other skill matches on.

> This layout is not optional styling — it is the contract the whole pipeline and the audit rely on.
