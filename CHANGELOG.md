# Changelog

All notable changes to GuideForge are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project uses date-stamped versions.

## [Unreleased]

A drafting-cadence change (whole guide in one pass), structural hardening of the skill layer, two correctness
fixes, and a **method-hardening pass** driven by defect classes observed while auditing the worked examples.

### Method hardening (from example audits)

Ten recurring defect classes surfaced across the worked-example audits (spotify-trip, unity, web-platformer).
Each got a rule at the point it's authored **and** a matching lint in `audit-guide`, so the same defect can't
recur. No skill was added or removed.

- **No forward references (build-breaker).** `reference/milestone-design.md` and `draft-milestone` now require
  every load-bearing symbol a milestone uses to have its **first definition in that milestone or an earlier
  one**, and each milestone's build/Done-when gate to be satisfiable from current+earlier code alone; a
  dependency-ordering self-check runs before each milestone closes. `audit-guide` resolves every identifier and
  flags a first-definition-after-use as a **BLOCKER**. (Observed: spotify-trip M9 used `LikedIndex.clear()`
  introduced only in M10.)
- **No gold-plating / build-now-consume-later.** `milestone-design` adds a *consume-it-now* test — every public
  member a milestone adds must be **called within that milestone**, or carry a `[Mn]` marker naming the
  consuming milestone; `draft-milestone` enforces it and `audit-guide` flags unmarked, uncalled members.
  (Observed: spotify-trip M8/05 built M11's marker system, leaving dead members.)
- **Glossary deep-links resolve.** `templates/glossary.md` now uses **`### <term>` headings** (stable GitHub
  anchors) instead of bullets; `scaffold-guide`/`draft-milestone` link terms as `glossary.md#<slug>`, and
  `audit-guide` validates the **anchor**, not just the file. (Observed: spotify-trip shipped 39 dead
  `glossary.md#term` links because terms were bullets.)
- **Checkpoint completeness claims are kept.** `templates/verify.md` and `reference/canonical-layout.md` scope
  the "complete" claim to the files actually rendered (untouched files are *named as unchanged*, never swept
  into a blanket "authoritative copy of every file"); `audit-guide` flags a touched-but-fragmented file, or an
  over-broad claim, as **MAJOR**. (Observed: spotify-trip M10/M11 and unity M7/07 over-claimed.)
- **Canonical nav label + first-step prev.** `templates/step.md`, `plan-guide`, `draft-milestone`, and
  `canonical-layout.md` fix the middle anchor label to exactly **`Overview`** and make the **first step's prev
  a bare `—`** (the Overview anchor already points there); `audit-guide` checks both exactly. (Observed:
  spotify-trip mixed `[Overview]`/`[Milestone overview]` across 140 files and gave first steps a redundant
  prev — the `[Milestone overview]` label originated in `plan-guide`'s step template.)
- **Gates prove what they claim.** `pedagogy-rules.md` adds the gate principle — a `Done-when` action must
  **exercise the property it claims** (re-run for determinism, restart+re-read for persistence) or reword the
  claim; `draft-milestone` and `audit-guide` enforce it. (Observed: spotify-trip M5 claimed determinism without
  re-querying.)
- **Cross-platform gate commands.** `templates/stack.md` gains a **Target OS / shell(s)** field;
  `templates/conventions.md` and `draft-milestone` require a command variant per targeted shell; `audit-guide`
  flags a Unix-only command used as a gate check when the guide also targets Windows/PowerShell. (Observed:
  spotify-trip M0's zone.js check was bash `grep` only.)
- **Front-door claims match the content.** `draft-milestone` adds a post-draft *reconcile front-door claims*
  pass (re-read README + decision-log + M0 overview against what milestones do); `plan-guide` cautions against
  absolute framings the ladder breaks; `audit-guide` flags a contradicted absolute claim as a **WARNING**.
  (Observed: unity W1 promised "no C# until M3" while M1 wrote a script.)
- **No value drift.** `pedagogy-rules.md` R4 adds compute-once-reuse-everywhere for repeated values (code +
  prose + gate + glossary); `audit-guide` extends value-consistency to **prose-cited** values, not just code
  constants. (Observed: unity had jump-height `2` vs `2.5` across files.)
- **Built-ins are R1 terms when the bar is high.** `reference/audience-model.md` and `pedagogy-rules.md` R1
  make **built-in library methods/objects** (`Math.*`, `Number.toFixed`, `ctx.*`, `Transform`, `IL2CPP`)
  first-use terms for New/Beginner topics; `draft-milestone` and `audit-guide` flag the *inconsistent bar*
  (glossing `const` but not `toFixed`). (Observed: web-platformer glossed `const` but not
  `toFixed`/`Math.round`/`Math.PI`; unity left `Transform`/`IL2CPP`/`Clear Flags` unglossed.)

### Changed
- **`draft-milestone` now drafts the whole guide in one pass.** By default it walks the approved ladder and
  produces **every** milestone's folder back-to-back (M0→Mn), instead of drafting one milestone and stopping
  for the reader to implement it before the next. The reader gets the finished guide in hand, then builds
  against it and verifies each *Done-when* gate as they go. Naming a specific milestone still drafts just that
  one — for re-drafting or fixing a single milestone. Each milestone keeps the full per-milestone contract
  (atomic steps, cumulative handoff carried forward, self-audit); only the between-milestone stop-gate is gone.
  Plan-approval remains the one human gate before drafting. Reconciled `plan-guide`, `scaffold-guide`, the
  README pipeline/FAQ/do-don't, and the EXPLAINER diagrams/trade-offs to match.
- **Prompt contracts now live inside each skill folder.** Every `prompts/pipeline/*.md` and
  `prompts/auxiliary/*.md` moved to `skills/<name>/prompt.md`, and the top-level `prompts/` folder is gone.
  Each wrapper now inlines its **co-located** contract via `` !`cat "${CLAUDE_SKILL_DIR}/prompt.md"` `` — no
  `../../` parent-directory traversal (which relied on an undocumented, unreliable path). Every skill folder is
  now self-contained, so hand-copying one into `.claude/skills/` brings its contract with it. The `prompt.md`
  is still the single source of truth and the paste-into-any-chat twin.

### Fixed
- **Token tracker no longer mints a phantom `readme.md` guide.** The attribution regex matched the
  `examples/README.md` index file and credited usage to a bogus guide, creating an `examples/readme.md/`
  directory. It now requires a real guide *directory* (`examples/<name>/…`), skips the index file, and matches
  Windows double-escaped paths. Removed the stray directory and the phantom entry from tracker state.
- **Documentation drift.** `pre-pr-check` said "nine" guide-authoring wrappers (there are ten); `EXPLAINER.md`'s
  file tour omitted `/log-feedback`, the `hooks/` folder, `templates/feedback-log.md`, and
  `reference/token-tracking.md`. All reconciled.

## [1.1.0] — 2026-07-09

Per-guide record-keeping, a feedback-capture skill, and a tighter guide-folder contract.

### Added
- **`/log-feedback`** — a new auxiliary skill (with its `prompts/auxiliary/log-feedback.md` twin) that captures
  the friction a reader hit while following a guide into a per-guide `feedback-log.md`, **without** changing the
  guide. Log-only and decoupled from fixing (that stays `/report-issue`'s job), so field data accumulates for
  improving the guide and the GuideForge method over time. Brings the toolkit to **eleven skills**.
- **`templates/feedback-log.md`** — the append-only field-log template; `scaffold-guide` now seeds it, and
  `report-issue` appends a `fixed via /report-issue` entry when it repairs a reported issue.
- **"Skills at a glance"** recap in both `README.md` and `EXPLAINER.md` — a one-line-per-skill summary of what
  each skill does for the user.

### Changed
- **Token tracking is now per guide.** The bundled hook (`hooks/track-tokens.js`) writes a metered
  `examples/<name>/TOKEN_USAGE.md` per guide (attributed by session → dominant `examples/<name>`) instead of one
  project-root ledger. Work not attributable to a guide — building the plugin itself — is intentionally not
  tracked. A plain single-guide project (no `examples/` dir) still writes one root `TOKEN_USAGE.md`.
- **Every guide-related doc now lives inside the guide folder**, including the initial `PLAN.md` — `plan-guide`
  and `modernize-guide` write it to `guide/PLAN.md`; `scaffold-guide` builds the guide around it. Only the
  hook's metered `TOKEN_USAGE.md` sits at the project level, beside the guide folder. `reference/canonical-layout.md`
  updated to match.

## [1.0.0] — 2026-07-09

Initial release.

### The toolkit
- **A gated, four-stage pipeline** — `plan-guide` → `draft-milestone` → `clarify-step` →
  `review-before-follow` — that turns a one-line idea into a learn-as-you-go build guide, one milestone at a
  time, with an observable check before each stage advances.
- **Auxiliary skills:** `modernize-guide` (convert an existing tutorial into a plan), `audit-guide` (read-only
  lint against the contract), `scaffold-guide` (stamp the folder skeleton + pre-filled foundation docs),
  `update-stack` (re-verify and bump a guide's stack), and `report-issue` (a reader hit a real issue following
  the guide — fix the root cause everywhere it appears, log it, propose a pedagogy rule if it's a general
  confusion, and re-audit). Each guide-authoring skill is a thin wrapper over its `prompts/` twin — one source
  of truth — and `pre-pr-check` guards contributions to this repo.
- **Domain-agnostic core** (`prompts/`, `templates/`, `reference/`); domain-specific worked examples live under `examples/`.

### What makes a guide teach
- **Mandatory audience gate.** `plan-guide` Phase 0 asks all seven brief-clarifying questions and waits: the
  per-topic expertise matrix and granularity dial can't be read off a file, and the other five are confirmed
  with the reader rather than inferred from a provided source. The gate then closes with a mandatory
  **advise-back step** — before any plan, the planner suggests *other features* worth considering and flags
  the *long-run risks* of the reader's choices (EOL/fading versions, scope boundaries that force rework, a
  stack that won't grow), each with a cheaper alternative, logging acknowledged risks in the decision log.
  Phase 0.5 then verifies the stack online and pins versions with official doc links.
- **The 10-rule pedagogy contract** — explain every concept at its topic's expertise depth; say WHERE / WHAT /
  WHY; exact values, not ranges; mandatory vs illustrative; numbered steps, not arrow-chains; name the likely
  failure and its cause.
- **A vertical-slice milestone ladder** with observable Done-when gates, and one canonical on-disk layout
  (README at the guide root, foundation docs under `foundation/`, one `MILESTONE_<N>_<slug>/` folder per
  milestone with `00_overview.md` … `NN_verify.md`).

### Gates that protect the result
- **Scope-discipline gate** — drafting stops and flags anything outside a milestone's declared scope, in
  either direction (no pulling later work forward, no gold-plating past the gate).
- **Expected-output gate** — every Done-when pairs its action with the exact result the reader will observe,
  never a bare "it works".
- **Version & naming-consistency gate** — one pinned stack and identical load-bearing names/paths across the
  whole guide.
- **Full-file checkpoints, cumulative handoffs, a canonical nav line, a drafter self-audit before hand-off,
  and a reconcile-before-follow rule** (reality wins) keep a multi-milestone guide coherent and trustworthy.
- Readers are invited to **type the code rather than paste it** — the complete files are an authoritative
  reference to diff against, not an invitation to paste blindly.
