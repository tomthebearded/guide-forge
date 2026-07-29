# Prompt — Scaffold a guide's folders + foundation docs

<!-- GuideForge · auxiliary (setup) · run after a plan is approved, before drafting · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this with the **approved plan** (or attach `PLAN.md`). You get the guide's folder
> skeleton and its five foundation docs, pre-filled from the plan. In a plain chat these come back as
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
`README.md`, `PLAN.md`, `TOKEN_USAGE.md`, and `feedback-log.md` at the guide root; foundation docs under
`foundation/`; one `MILESTONE_<N>_<slug>/` folder per milestone with `00_overview.md` … `NN_verify.md`.

1. **`README.md` at the guide root** — the front door (objective ← Target end state; one-line stack summary
   linking to `foundation/stack.md`; 2–4 headline decisions linking to `foundation/decision-log.md`; a
   **provenance line** stamping the GuideForge version used (see the version rule below); an **Updates** log
   seeded with `<date> — Guide created with GuideForge v<x.y.z>.`). Thin: it summarizes and links, it doesn't
   duplicate.
2. **Foundation docs under `foundation/`**, from the templates, **pre-filled from the plan**:
   - `stack.md` — the Verified stack table (versions + docs + check date) verbatim from the plan.
   - `status.md` — a **provenance line** stamping the GuideForge version used (see the version rule below);
     frontier = first milestone (not started); the milestone-status table seeded from the ladder; a
     **Source-inputs** row per file the plan cited.
   - `glossary.md`, `conventions.md`, `decision-log.md` — seeded with whatever the plan already decided;
     otherwise the empty template with headings. In `glossary.md`, every term is a **`### <term>` heading**
     (never a bullet) so `../glossary.md#<slug>` deep-links from steps resolve natively on GitHub — bulleted
     terms have no anchor and the links silently fail. (Observed: a guide had dead `glossary.md#term`
     links because terms were bullets.)
3. **One folder per milestone**, named `MILESTONE_<N>_<slug>/` (`MILESTONE_0_…/`, `MILESTONE_1_…/`, …), each
   with a **placeholder `00_overview.md`** carrying that milestone's Goal + Done-when from the ladder and a
   `🔶 SCAFFOLD — not yet drafted` banner. Give the placeholder its canonical milestone nav line at **both**
   the top (line 2) and the bottom (after a `---`), identical — see `reference/canonical-layout.md`.
4. **`feedback-log.md` at the guide root**, from `templates/feedback-log.md` — the empty append-only field log
   for reader friction (header only, no entries yet). It's later appended by `/log-feedback` and `/report-issue`.

Do not invent content the plan didn't decide — leave template headings empty rather than guessing.

## Stamp the GuideForge version (provenance rule)
Every guide records **which version of the GuideForge plugin produced it** — the same way `stack.md` pins the
*subject* tools, this pins the *method*. Read the `version` field from the plugin's
**`.claude-plugin/plugin.json`** and stamp it verbatim (e.g. `v1.2.0`) into **both** the `README.md`
provenance line and its Updates-log seed, and the `status.md` provenance line. Use the same value in all three.
It is set once at scaffold time and left as-is on later edits — it marks the method revision the guide was built
against, not the last-touched date. If you genuinely can't read the version (e.g. a plain-chat paste with no
file access), ask for it rather than inventing one.

## Deliverable
Every file in its own fenced block labelled with its path (the skill writes them to disk). Then tell me the
guide is scaffolded and ready to draft — run `draft-milestone` to draft the **whole guide** in one pass (every
milestone, M0→Mn) — and that **only `status.md` is the source of truth for progress** — the scaffold banners
are not.
