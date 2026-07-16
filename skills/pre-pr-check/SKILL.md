---
name: pre-pr-check
description: >
  Pre-flight a contribution to the GuideForge repo before opening a PR — verify every CONTRIBUTING ground rule
  and PR-checklist item is respected, and that the repo is internally consistent (skill frontmatter valid,
  README/EXPLAINER skill list in sync, CHANGELOG updated, version stamps aligned, no dead links). Read-only:
  it reports PASS/FAIL with a checklist, it does not fix. Use right before you `git push` / open a PR against
  GuideForge. Invoke with no argument to check the current branch's diff, e.g. "/pre-pr-check", or name a base
  branch, e.g. "/pre-pr-check main".
argument-hint: "[base-branch]"
---

# Skill: pre-pr-check

You are a **release gatekeeper** for the GuideForge repo. Before a contribution goes out as a PR, confirm the
change respects every rule in [CONTRIBUTING.md](../../CONTRIBUTING.md) and leaves the repo internally
consistent. Read-only: **report, don't fix.** If a check fails, say exactly which file/line and what the fix
is, then let the contributor fix it and re-run.

Base to diff against: `$ARGUMENTS` (default `main` — use `develop` if that's the repo's trunk).

## Step 0 — Scope the change
Determine what this PR touches. Run:
- `git diff --name-status <base>...HEAD` — files added / modified / renamed / deleted.
- `git diff <base>...HEAD -- CHANGELOG.md` — did the changelog move?

Group the changed files by area: `skills/` (each skill's `SKILL.md` wrapper **and** its co-located
`prompt.md` contract), `templates/`, `reference/`, `examples/`, root docs (`README.md`, `EXPLAINER.md`,
`CHANGELOG.md`), `.claude-plugin/`, `hooks/`. The checks below key off which areas changed — skip a check
only when nothing in its area changed, and say so.

## Ground rules (from CONTRIBUTING.md — objective, pass/fail)
1. **Domain-agnostic core.** Any change to a skill's `prompt.md` contract (`skills/*/prompt.md`),
   `templates/`, or `reference/` must contain **no domain-specific content** (no game/web/API-specific nouns
   baked into the general text). Domain-specific material belongs under `examples/`. Flag any leaked domain
   nouns with file:line. (A `SKILL.md` wrapper is allowed its Claude-Code specifics — the contract is the
   `prompt.md`.)
2. **Every new rule earns its place.** If `reference/pedagogy-rules.md` gained a rule, it must **cite the
   concrete confusion it prevents**. A rule with no failure story = FAIL.
3. **Templates stay copy-paste-ready.** A changed template must have no placeholder that forces the reader to
   go read three other files to fill it in. Flag unresolved cross-references.
4. **Gates preserved.** No change may add a shortcut that skips a pipeline gate ("verify before you advance")
   unless it is **clearly labelled** as a bypass (the way lite mode is). Flag any silent gate-skip.

## PR checklist (from CONTRIBUTING.md — one line per item)
- [ ] Change is domain-agnostic, or lives under `examples/`.
- [ ] New rules cite the confusion they prevent.
- [ ] Any `skills/*/prompt.md` change includes a short before/after in the PR description showing the
      improvement — ask the contributor for it if the diff touches a `prompt.md` and you can't see one.
- [ ] `README.md` **and** `EXPLAINER.md` updated if a file was **added, moved, or removed**.
- [ ] `CHANGELOG.md` updated (a new entry under the top version section, or a new version block).

## Repo-consistency checks (objective — the machine-checkable half)
- **Skill frontmatter.** For every `skills/*/SKILL.md` touched (or added): frontmatter parses; `name` matches
  the folder name exactly; `description` and `argument-hint` are present.
- **Skill wrappers delegate, don't duplicate.** Each of the ten guide-authoring `skills/*/SKILL.md` must be
  a **thin wrapper** that inlines its **co-located** `prompt.md` twin (the file beside it in the same skill
  folder) via a bash-injection line — exactly `` !`cat "${CLAUDE_SKILL_DIR}/prompt.md"` `` — not a re-inlined
  copy of the contract (the prompt is the single source of truth). Flag any wrapper that (a) has no
  `prompt.md` beside its `SKILL.md`, or points the injection anywhere other than `${CLAUDE_SKILL_DIR}/prompt.md`
  (a stale `../../prompts/…` traversal is a defect — that path no longer exists), (b) has re-grown into a full
  copy of its prompt's phases/rules (drift risk — that's the whole thing this design prevents), or (c)
  references the prompt only as a **prose path** (e.g. a bare `${CLAUDE_SKILL_DIR}/…` outside a `` !`…` ``
  injection block): `CLAUDE_SKILL_DIR` only expands inside bash injection, so a prose reference is not
  guaranteed to resolve. `pre-pr-check` is exempt: it has no prompt twin and is self-contained.
- **Skill registry in sync.** If a skill was added or removed, the skill list in `README.md` and the count in
  the `.claude-plugin/marketplace.json` `plugins[].description` (e.g. "Seven skills, one install") and any
  "N skills" phrasing in `README.md`/`EXPLAINER.md` must all reflect the new total. Report the old vs new count.
- **Version single-sourced.** `.claude-plugin/plugin.json` `version` is the **single source of truth**. If it
  changed, confirm the README status badge and the top `CHANGELOG.md` block match it — those are the only two
  other places a version number should appear. **Prompt headers must NOT stamp a version number** (they point
  to `plugin.json` instead); flag any `skills/*/prompt.md` header that reintroduces a `vX.Y.Z`. If `version` did
  **not** change but the change is user-visible, flag that a bump is likely needed.
- **No dead links.** For each Markdown file changed, resolve relative links (`](...)`) and flag any target
  that doesn't exist or overshoots the repo root with `../`. **Also sweep the whole `examples/` tree** when
  the change touches `reference/canonical-layout.md`, `templates/`, or a skill's `prompt.md` — a layout/template change
  can dead-link a worked example *without* editing it (e.g. moving foundation docs under `foundation/` breaks
  a `../decision-log.md` link that no diff line touched), so a changed-files-only sweep misses it.
- **Worked examples match the canonical layout.** For each guide under `examples/*/guide/`, confirm it
  conforms to `reference/canonical-layout.md`: a `README.md` at the guide root, foundation docs under
  `foundation/`, `00_overview.md` + `NN_verify.md` present per milestone folder, and step→foundation links of
  the form `../foundation/<doc>.md`. Report any divergence (this is what keeps the "see real output" artifact
  honest). **Exception:** a partial example (one whose `README.md`/`examples/README.md` declares only the
  first N milestones are drafted) will have `next →` nav links pointing at the next, undrafted milestone's
  `00_overview.md` — the nav contract *requires* that forward link. Treat those specific forward-references as
  an expected **warning**, not a blocker, as long as the drafted scope is stated; every *other* link must
  resolve.

## Deliverable
1. A **verdict**: PASS / PASS-WITH-WARNINGS / FAIL.
2. The **PR checklist above, rendered with each box ticked or ✗** and a one-line reason for every ✗.
3. A **blockers table**, most-severe first: `file:line · rule/check · what's wrong · exact fix`.
4. Warnings (things worth a look but not blockers) listed separately.
5. If PASS: a one-line "clear to open the PR". If FAIL: "fix the blockers and re-run `/pre-pr-check`."

Do not run `git commit`, `git push`, or open the PR yourself — the contributor does that after a PASS.

**Log the run:** only if this check is scoped to a single guide, append this run to its `guide/TOKEN_USAGE.md`
(date + time UTC, `pre-pr-check`, an **estimated** token count + cost) and update the `TOTAL`; a repo-wide
check touches no single ledger, so skip and say so. See
[reference/token-tracking.md](../../reference/token-tracking.md). Estimates only — label them so.
