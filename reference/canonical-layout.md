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
    ├── README.md                 ← the front door (objective · stack summary · decisions · Updates log ·
    │                               how a step is built · how to follow the guide)
    ├── PLAN.md                   ← the approved plan (written by plan-guide; scaffold fills the guide in around it)
    ├── feedback-log.md           ← append-only field log of reader friction (seeded by scaffold; appended by /log-feedback)
    ├── foundation/               ← the cross-cutting docs, read first
    │   ├── stack.md              ← Verified stack (pinned versions + official docs + check date)
    │   ├── status.md             ← THE status authority (the guide's state: milestones, drift, sessions)
    │   ├── progress.md           ← the reader's execution ledger, step by step (ticked by /mark-progress)
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
  `stack.md`, `status.md`, `progress.md`, `glossary.md`, `conventions.md`, `decision-log.md`.
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

## Progress, and what may be edited behind it

Two files track progress, and they answer different questions. Keeping them apart is what lets a guide be
changed while someone is halfway through it:

- **`foundation/progress.md`** — what the reader has **executed**, one row per step file. Step granularity.
  Seeded by `scaffold-guide`, given its step rows by `draft-milestone`, ticked by `/mark-progress`.
- **`foundation/status.md`** — the state of the **guide**: the milestone table, the drift log, the session
  log, the provenance stamps. It remains the authority on *"is this milestone verified"*; its **Frontier** and
  its milestone table are **derived** from `progress.md` and never written in disagreement with it.

The last `[x]` row in `progress.md` is **the frontier** — the line between executed and not. It is the only
thing that decides what a maintenance skill may rewrite:

- **Ahead of the frontier** (steps not yet executed): free to rewrite, insert, delete, renumber — regenerating
  every affected nav line, top and bottom.
- **Behind the frontier** (steps already executed): **only the superseded banner below.** No instruction, no
  value, no code, no file name and no step number is ever changed there. A reader cannot un-run what they
  already ran, and a step that silently changes under them turns their working project into a mismatch they
  have no way to diagnose.

**This binds an amendment — a change of intent — and that is `/amend-guide`.** It is not a general freeze on
executed steps, because the other maintenance skills answer a different question. `/report-issue` corrects a
step that was **wrong**: reality never matched it, so leaving it standing preserves nothing worth preserving.
`/update-stack` and `/clarify-step` likewise repair a step against facts or against the writing contract. Each
of them already logs the change as drift and sends the milestone back for re-verification. An amendment is the
one case where the step was **right**, the reader followed it, and it worked — and rewriting *that* is what
strands them.

### The superseded banner (the one edit allowed behind the frontier)
Placed directly under the step's **top** nav line (so line 3), never at the bottom, never in place of any
existing content:

```
> ⚠️ **Superseded <YYYY-MM-DD>** — <what changed, one line>. Don't follow this step as written: the correction
> that brings it up to date is under *Before you continue — corrections* in [<NN_slug>.md](<NN_slug>.md).
```

It is **signage, not instruction**: it says the step is stale and where the repair lives. It also does the
work the corrections section can't — a *fresh* reader, starting the guide after the amendment, meets this step
before they ever reach the corrections, and the banner is the only thing that stops them following it blind.

### The corrections section (where the repair actually lives)
Canonical heading, English like the rest of the skeleton: **`## Before you continue — corrections`**. It goes
at the top of the **first step ahead of the frontier**, directly under the nav line (and above
`## Glossary for this step`). It opens with the condition that makes it skippable, because a reader who
started the guide after the amendment must not apply it:

```
## Before you continue — corrections
> Applies only if you executed <steps> before <YYYY-MM-DD>. Started the guide after that date? Skip this
> section — your project already matches.
```

Then numbered actions under the ordinary step contract — WHERE, WHAT + WHY, exact values, mandatory vs
illustrative — and it closes with a `**Corrected when:**` checklist so the reader can confirm the repair
before continuing. It is deliberately **not** a `## Done when` heading: the step keeps its own single gate,
and a second one would be a second gate to drift.

Below that checklist comes **one** `**Suggested commit:**` block (rule 4.5) — the repair is one change to the
reader's project, so it gets one message, separate from the step's own `## Suggested commit`. A later pass
appending its dated sub-heading updates that single message rather than adding a second one.

## Writing language (the whole page translates; the file names don't)

A guide is written in **one** language and *everything the reader reads is in it* — the sentences **and the
page furniture**: section headings, the `New here:` / `New concept —` / `Build vs borrow —` markers, the
nav-line vocabulary, the checklist labels. Italian prose under an English `## Do this` is a half-translated
page, and the reader meets the English half at the exact moment they are least equipped to read past it.

Two settings carry this, both recorded in **`foundation/conventions.md` § Writing language** — the only place
later skills can read them from. `plan-guide` asks for both once (Phase 0, Q7) and `scaffold-guide` writes
them. `draft-milestone`, `clarify-step`, `amend-guide`, `report-issue`, `update-stack`, `review-before-follow`,
`mark-progress` and `log-feedback` each run in their own session, so a language agreed only in conversation is
a language the next skill silently drops. **Neither setting recorded → English for both.**

1. **Prose language** — every sentence and every heading the reader sees on a step, an overview, a verify or
   the README.
2. **Code language** — whether the code the guide has the reader *write* is in that language too:
   **identifiers, comments and user-facing strings**. Default **English**, and deliberately independent of the
   prose — a guide written in Italian teaching English-named code is a normal, common choice, and it is the
   reader's own repository that lives with the answer. Whatever the answer, what the **platform** fixes is
   never translated: language keywords, standard-library and framework API names, framework-mandated
   identifiers (lifecycle methods, config keys, route/DI names), package names and file names. Rule 3.6
   (self-describing identifiers) applies **in the code language** — `tempoTrascorsoMs`, never `t`.

### The heading map — translate once, then read it

Headings translated freely would break every skill that has to *find* a section (`audit-guide` checking for a
Done-when, `amend-guide` inserting a corrections block, `clarify-step` rewriting a glossary line). So the
translation is decided **once** and written down: `conventions.md` § *Writing language* carries a **heading
map** — canonical English string on the left, the exact string this guide uses on the right.

- `scaffold-guide` writes the map, complete, at scaffold time. For an English guide the right column simply
  repeats the left.
- **Every other skill reads the right column and reproduces it byte for byte.** No skill ever translates a
  heading on the fly, and no skill matches on the English string when a map exists — that is how two steps end
  up with two different translations of the same section.
- A guide that needs a heading the map doesn't list: **add the row first**, then use it.

The map covers exactly the reader-facing furniture — the step, overview, verify and README section headings,
the inline markers (`New here:`, `New concept —`, `Build vs borrow —`, `Corrected when:`, `Suggested commit:`,
the `⚠️ Superseded` banner), and the nav vocabulary (`Nav`, `Overview`, `prev:`, `next:`, `start:`,
`milestone K of N`). See `templates/conventions.md` for the full table.

### What never translates, in any guide

- **File and folder names** — `README.md`, `00_overview.md`, `NN_verify.md`, `MILESTONE_<N>_<slug>/`,
  `foundation/`, and the step slugs. They are paths, not prose; the pipeline resolves them literally and a
  translated slug dead-links every nav line pointing at it.
- **Code, commands, paths and doc URLs** — subject to the *code language* setting above for the parts the
  guide authors itself.
- **The `foundation/` docs' own section headings and table column keys** — `§ Writing language`,
  `§ Commit messages`, `## Frontier`, `## Milestone status`, the `stack.md` / `status.md` / `progress.md`
  columns and marks. These are the schema the skills look things up by, and § *Writing language* is where the
  map itself lives: translate that heading and nothing can find the translation of anything else. The **prose
  inside** those docs still follows the prose language. Same for `feedback-log.md`'s field labels and its
  fixed `Suspected class` / `Severity` / `Status` values — the vocabulary the log is analysed by.
- **The `·` separator, the `—` bare-prev dash, and the `[ ]` / `[x]` marks.**

### Commit messages follow the *code* language

The message inside a `## Suggested commit` block (rule 4.5) is an artifact of the reader's repository, so it
takes the **code language**, not the prose language — English by default, including in a guide whose prose is
not. A guide that chose to write its code in the prose language writes its commit subjects there too. The
*format* is separate and lives in `conventions.md` § *Commit messages*; the `<type>` and `<scope>` tokens of
Conventional Commits are the convention's own vocabulary and stay English regardless.

> This layout is not optional styling — it is the contract the whole pipeline and the audit rely on.
