# Reference — Canonical guide layout (the one true skeleton)

> The single, fixed on-disk shape **every** GuideForge guide uses. `scaffold-guide` stamps it, `draft-milestone`
> fills it, `audit-guide` checks against it. It exists because guides drafted from the same plugin were
> diverging — foundation docs at the root in one guide and under `foundation/` in another, `overview.md` vs
> `00_overview.md`, a README in one and none in the other. A reader (and the audit) should never have to guess
> where a file lives. **Do not invent a different structure per guide.**

---

## The skeleton

```
<project>/                        ← PROJECT LEVEL
└── <guide-root>/  (the guide/)   ← THE GUIDE FOLDER — every guide-related doc lives here
    ├── README.md                 ← the front door (objective · stack summary · decisions · Updates log)
    ├── PLAN.md                   ← the approved plan (written by plan-guide; scaffold fills the guide in around it)
    ├── TOKEN_USAGE.md            ← the ONE cost ledger — metered by the bundled hook, estimate-appended by skills when the hook is off (see reference/token-tracking.md)
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
  `overview.md`.
- **Step files:** `NN_<slug>.md`, `NN` zero-padded to two digits (`01`, `02`, …), numbered in the exact order
  the reader performs them.
- **Verify step:** always **`NN_verify.md`** — the last file in the milestone folder (its `NN` is the next
  number after the last step). Its **file checkpoint** renders the **complete** contents of every file the
  milestone *created or modified*, and its completeness claim covers **only those files**. A file the milestone
  didn't touch is listed as unchanged (named, not rendered) — never swept into a blanket "authoritative copy of
  every file" claim the checkpoint doesn't actually keep. A file named as touched but shown only as a fragment
  is a broken checkpoint. (Observed: spotify-angular M10/M11 and unity M7/07 over-claimed completeness.)
- **Foundation docs** live under **`foundation/`**, never loose at the guide root. Their filenames are exactly
  `stack.md`, `status.md`, `glossary.md`, `conventions.md`, `decision-log.md`.
- **`README.md`** sits at the guide root (above `foundation/`).
- **Guide-root files** — every guide-related doc lives **inside the guide folder**: `README.md`, `PLAN.md`
  (the approved plan — written into `guide/` by `plan-guide`, not left at the project root), `TOKEN_USAGE.md`
  (the one cost ledger), `feedback-log.md` (reader-friction log), and `foundation/` + the milestone folders.
  Nothing guide-related lives outside `guide/`.
- **One cost ledger, inside the guide.** There is a single `TOKEN_USAGE.md` per guide, in the guide folder
  beside `README.md`. The bundled hook meters it (rewriting it from real transcript usage); skills append an
  estimate row only when the hook is inactive, which the hook then replaces on its next run. See
  `reference/token-tracking.md`.

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
  must be **identical**. (Foundation docs, `README.md`, `PLAN.md`, `feedback-log.md`, and `TOKEN_USAGE.md`
  carry no step nav and get none.)
- **Overview nav line:** `prev`/`next` point at the sibling milestones' maps
  (`../MILESTONE_<n-1>_<slug>/00_overview.md`, `../MILESTONE_<n+1>_<slug>/00_overview.md`) — at both top and bottom.

> This layout is not optional styling — it is the contract the whole pipeline and the audit rely on.
