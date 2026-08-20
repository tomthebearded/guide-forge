# Prompt — Scaffold a guide's folders + foundation docs

<!-- GuideForge · auxiliary (setup) · run after a plan is approved, before drafting · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this with the **approved plan** (or attach `PLAN.md`). You get the guide's folder
> skeleton and its six foundation docs, pre-filled from the plan. In a plain chat these come back as
> copy-paste blocks; the `/scaffold-guide` skill writes them to disk.

---

## Your role

You lay down the **skeleton** of a GuideForge guide from an approved plan so drafting can start immediately.
You do **not** write step content — only the scaffolding.

## Inputs
- The **approved plan** (ladder, Verified stack, audience model, conventions, folder layout). It already lives
  at **`guide/PLAN.md`** — `plan-guide` writes it there, inside the guide folder. Read it from there. (It may
  also be attached or pasted.) If there is no plan anywhere, ask for it (or run `plan-guide` first). **Leave
  `guide/PLAN.md` in place** — you scaffold the rest of the guide *around* it; don't move or overwrite it.

## Produce — under `guide/` (follow the canonical layout exactly)
Use the one canonical skeleton — don't invent a per-guide structure. The fixed tree + naming rules:
`README.md`, `PLAN.md`, and `feedback-log.md` at the guide root; foundation docs under
`foundation/`; one `MILESTONE_<N>_<slug>/` folder per milestone with `00_overview.md` … `NN_verify.md`.

1. **`README.md` at the guide root** — the front door (objective ← Target end state; one-line stack summary
   linking to `foundation/stack.md`; the headline decisions — the ones a reader must know before starting —
   linking to `foundation/decision-log.md`; a
   **provenance line** stamping the GuideForge version used (see the version rule below); an **Updates** log
   seeded with `<date> — Guide created with GuideForge v<x.y.z>.`). Thin: it summarizes and links, it doesn't
   duplicate. Its **How a step is built** section and its **Following this guide** list are **fixed
   boilerplate** — carry them over from `templates/readme.md` as they stand (the one adaptation is language:
   the whole page follows the guide's prose language, and the heading names in the left column of the
   step-anatomy table are the **mapped** ones — that table exists to tell the reader what they will meet on the
   page, so naming `## Do this` in a guide whose steps say `## Fai così` points them at a section that isn't
   there). They
   are the only orientation the reader gets before their first step, so a guide that drops them sends someone
   into a step file having never been told what its sections are for.
2. **Foundation docs under `foundation/`**, from the templates, **pre-filled from the plan**:
   - `stack.md` — the Verified stack table (versions + docs + check date) verbatim from the plan.
   - `status.md` — the **two provenance lines** stamping the GuideForge version used (see the version rule
     below); frontier = first milestone (not started); the milestone-status table seeded from the ladder; a
     **Source-inputs** row per file the plan cited.
   - `progress.md` — the reader's execution ledger, from `templates/progress.md`: one `## MILESTONE_<N> —
     <title>` section per rung of the ladder, in order, each carrying the single placeholder row
     `- [ ] _steps not drafted yet_` (no step file exists yet, and a row naming one that doesn't exist is a
     lie the amendment skills would read as truth). `draft-milestone` replaces each placeholder with the real
     step rows as it writes them; `/mark-progress` ticks them. Fill **Current position** with
     `Last executed: nothing yet` and the first milestone's first step as *Next up* — written as the milestone
     ID alone until a step file exists.
   - `glossary.md`, `conventions.md`, `decision-log.md` — seeded with whatever the plan already decided.
     If the plan carries a **build-vs-borrow table** (Phase 2.5), write one `decision-log.md` entry per row
     now — the capability, which way it went, why, and the revisit-if — rather than leaving them for drafting;
     they are decisions, and this is the file that holds decisions. Otherwise: seeded with what the plan has,
     otherwise the empty template with headings. Two `conventions.md` sections are **never left empty**,
     because a later skill running in a fresh session can only read them from there:
     § **Writing language** — **both** settings the plan settled in Q7 (English for both if the plan doesn't
     say), without which every skill silently defaults to English: the **prose language** and the **code
     language** (identifiers, comments, user-facing strings); and § **Commit messages** — the format every
     step's `## Suggested commit` block follows (rule 4.5): fill it from the plan if the plan decided one,
     otherwise seed the **Conventional Commits** default (`<type>(<scope>): <subject>`, imperative, no trailing
     period, ≤72 characters, one step one commit), written in the **code** language, not the prose one.
     § *Writing language* also carries the **heading map**, and you are the only skill that writes it — see
     *Write the heading map*, below. Write the scaffold's own prose, and every heading you stamp into a
     `README.md` or an `00_overview.md`, in the prose language, through that map.
     In `glossary.md`, every term is a **`### <term>` heading**
     (never a bullet) so `../glossary.md#<slug>` deep-links from steps resolve natively on GitHub — bulleted
     terms have no anchor and the links silently fail. (Observed: a guide had dead `glossary.md#term`
     links because terms were bullets.)
3. **One folder per milestone**, named `MILESTONE_<N>_<slug>/` (`MILESTONE_0_…/`, `MILESTONE_1_…/`, …), each
   with a **placeholder `00_overview.md`** carrying that milestone's Goal from the ladder, its prerequisite,
   and a `SCAFFOLD — not yet drafted` banner. Nothing else: the overview is a short map, and the milestone's
   Done-when gate belongs to the `NN_verify.md` that `draft-milestone` will write — don't seed a copy of it
   here (two copies of a gate is one gate that drifts). Give the placeholder its canonical milestone nav line at **both**
   the top (line 2) and the bottom (after a `---`), identical — see `reference/canonical-layout.md`. That line
   ends with a `start:` segment linking the milestone's first step; at scaffold time no step file exists yet, so
   write it as the literal text **`start: — not drafted yet`** — in the guide's own words for that
   segment, as the heading map records them (no link — a link to a missing `01_*.md` would be
   a dead link). `draft-milestone` replaces it with `start: [<step 01 title>](01_<slug>.md)`.
4. **`feedback-log.md` at the guide root**, from `templates/feedback-log.md` — the empty append-only field log
   for reader friction (header only, no entries yet). It's later appended by `/log-feedback` and `/report-issue`.

Do not invent content the plan didn't decide — leave template headings empty rather than guessing.

## Write the heading map (you are the only skill that writes it)

The guide's prose language covers **everything the reader reads** — not only the sentences but the section
headings, the inline markers and the nav vocabulary. Translating those ad hoc would give one section two
different names in two steps, and leave every later skill (`audit-guide` looking for a Done-when, `amend-guide`
inserting a corrections block, `clarify-step` rewriting a glossary line) matching on a string that isn't
there. So the translation is decided **once, here**, and written into `conventions.md` § *Writing language* as
the **heading map**: canonical English string on the left, the exact string this guide uses on the right.

- Copy the table from `templates/conventions.md` **whole** — every row, in that order. A missing row is a
  heading the drafter will end up translating on the fly.
- **English guide → the right column repeats the left, verbatim.** Write it anyway: the map's presence is what
  tells the later skills there is nothing to look up, and its absence is what `audit-guide` flags.
- Translate for a **developer reading in that language** — the term the local ecosystem actually uses, not a
  dictionary calque. Keep each heading's *shape*: a heading stays a heading at the same level, `New concept —`
  keeps its em-dash and its no-emoji plain-text form, `Nav:` keeps its colon, and the `·` separator, the `—`
  bare-prev dash and the `[ ]` marks are untouched.
- Names that are **not** prose stay put in every language: file and folder names, the `foundation/` docs' own
  section headings and table column keys (they are the schema the skills look things up by — and § *Writing
  language* is where this map lives), commands, paths, doc URLs.
- Use the map yourself immediately: the `README.md` you stamp and the placeholder `00_overview.md` files are
  the first pages written through it.

## Stamp the GuideForge version (provenance rule)
Every guide records **which version of the GuideForge plugin produced it** — the same way `stack.md` pins the
*subject* tools, this pins the *method*. Read the `version` field from the plugin's
**`.claude-plugin/plugin.json`** and stamp it verbatim (e.g. `v1.2.0`) into the `README.md` provenance line
and its Updates-log seed, and into **both** of `status.md`'s provenance lines. Use the same value everywhere;
at scaffold time the two `status.md` lines are identical.

The two lines answer different questions and age differently:
- **`Generated with …`** — set once, here, and never touched again. It marks the method revision the guide was
  built against.
- **`Last updated with …`** — the version and date of the most recent skill run that *changed* the guide.
  Every later skill that writes to the guide (`draft-milestone`, `clarify-step`, `amend-guide`,
  `report-issue`, `update-stack`, `review-before-follow`, `mark-progress`) rewrites it. You only seed it.
  (`log-feedback` is the exception: it appends to `feedback-log.md` and changes no guide content.)

If you genuinely can't read the version (e.g. a plain-chat paste with no file access), ask for it rather than
inventing one.

## Deliverable
Every file in its own fenced block labelled with its path (the skill writes them to disk). Then tell me the
guide is scaffolded and ready to draft — run `draft-milestone` to draft the **whole guide** in one pass (every
milestone, M0→Mn) — and that **the scaffold banners are never a source of truth for progress**: `status.md`
owns the guide's state, `progress.md` owns what the reader has executed, and `/mark-progress` is what moves
either of them.
