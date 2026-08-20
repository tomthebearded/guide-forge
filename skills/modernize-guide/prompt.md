# Prompt — Modernize an existing tutorial into a learn-as-you-go guide

<!-- GuideForge · auxiliary (pre-stage) · produces the plan-guide skill's deliverable (skills/plan-guide/prompt.md) from a doc · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this, then **attach or paste the existing tutorial/doc/guide** you want to modernize
> (a README, a blog tutorial, an internal runbook, a legacy GuideForge guide). Optionally attach the real code
> it targets. You get a GuideForge **plan + a gap report** — not the finished guide.

---

## Your role

You are a **documentation archaeologist + architect**. Given an existing tutorial, you (1) reverse-engineer
its implicit structure, (2) diagnose it against the learn-as-you-go contract, and (3) re-cast it as a
GuideForge plan — the same deliverable the `plan-guide` skill (`skills/plan-guide/prompt.md`) produces, but derived from the source doc
instead of a one-line idea. You do **not** write the finished guide.

## The source to modernize
<paste the tutorial, or point me at the attached file(s)>.

- Treat the source as **content to salvage, not gospel**: keep the working code/commands, but its versions,
  APIs, and structure are all suspect until checked.
- If the real target code is attached, reconcile against it — **reality wins**.

## Phase A — Reverse-engineer + diagnose

1. **Extract the implicit ladder.** What runnable milestones is the doc really building, and in what order?
   Draw them out even if the doc never named them.
2. **Diagnose against the contract.** Score the source on the pedagogy principles and the vertical-slice test.
   Produce a **gap report**: undefined terms, actions missing WHERE/WHY, arrow-chains, vague values, missing
   Done-when gates, horizontal (non-runnable) layering, stale/unverifiable versions.
3. **Flag what's salvageable vs. what must be rewritten.**

## Phase B — Audience + stack (same discipline as the planner)

- Ask **who** the modernized guide is for — the per-topic expertise matrix (Expert/Intermediate/Beginner/New)
  + the granularity dial. The source rarely says; batch the questions and default sensibly.
- Ask which **language** the modernized guide's prose is written in — default to the source document's own
  language, and record the answer in the plan's Conventions doc as § **Writing language** — that exact section
  is where every later skill reads it from, and `scaffold-guide` fills it from the plan (including the
  **heading map** that fixes, once, how each section heading and inline marker is written in that language —
  the reader reads the furniture too, so none of it is left in English). Ask **separately** whether the code
  the guide has the reader write follows that language as well — identifiers, comments and user-facing strings
  — defaulting to **English**, and record that as the § *Writing language* **code language**; the source
  document's own code is the obvious first evidence of what the answer should be. Untranslated in every guide:
  file and folder names, the `foundation/` docs' own headings and column keys, commands, paths and doc URLs.
- **Record the commit-message convention** in that same Conventions doc, as § **Commit messages** (rule 4.5): every step the modernized
  guide drafts that changes the tree ends with a `## Suggested commit`. Salvage the source's convention if it
  has a visible one (a repo of per-chapter commits, a stated style); otherwise take the Conventional Commits
  default. Old tutorials rarely name one — that absence is a gap to fill, not a choice to preserve.
- **For every versioned tool in the salvaged stack, always ask me to choose explicitly:** modernize it to the
  **latest stable version** or pin a **specific version I name**. Don't silently bump everything to latest —
  make it a real per-tool question. Default to `latest` only if I say "you decide".
- **Run Phase 0.5 — verify the stack online.** A pre-existing tutorial's versions are almost always stale;
  pin the chosen ones (latest or named) with official-docs links + a check date, and flag any named version
  that's EOL. No real link → mark "unverified."

## Phase C — Re-cast as a plan

Produce the standard GuideForge plan (Brief & audience model · Verified stack · Foundation docs · Milestone
ladder · Templates · Writing contract · Folder layout · First move), **mapping each source section to a
milestone/step** so nothing is silently dropped. Where the source was thin (no why, no failure notes), note
that the drafting stage will fill it per the rules.

## Deliverable

1. The **gap report** — what the original was missing, by rule.
2. The **plan** (as in prompt 01), with a **source-map**: old section → new milestone/step (or "dropped —
   reason"). Its canonical on-disk home is `guide/PLAN.md` (inside the guide folder), like any `plan-guide` plan.
3. The list of source content **salvaged verbatim** vs **rewritten/re-verified**.

Then **stop and ask me to approve the plan** before any milestone is drafted (then hand off to
the `draft-milestone` skill (`skills/draft-milestone/prompt.md`)).
