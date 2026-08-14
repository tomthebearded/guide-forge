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
`prompt.md` contract), `templates/`, `reference/`, root docs (`README.md`, `EXPLAINER.md`,
`CHANGELOG.md`), `.claude-plugin/`, `scripts/`. The checks below key off which areas changed — skip a check
only when nothing in its area changed, and say so.

## Step 1 — Run the automated gate (do this FIRST, don't eyeball it)
The deterministic checks are **scripts**, not prose you re-perform by hand. Run them and **paste their real
output** into your report; a non-zero exit is a **blocker**, full stop.

- `node scripts/check-version.mjs` — version stamps agree across `plugin.json`, the README badge, and the top
  released `CHANGELOG.md` header. Tagging is not checked (see below); confirm it by eye on a release PR.
- `node scripts/check-consistency.mjs` — skill frontmatter `name` matches folder; every skill with a
  `prompt.md` inlines it via the cat-injection line; the stated skill **count** in `README.md` /
  `marketplace.json` matches the actual folder count; every rule id cited resolves **and** every full-contract
  mirror (the four pipeline prompts + `EXPLAINER.md`) mentions every rule; no dead relative `.md` links and no
  dead `#anchors` in the docs/skills/templates.
- `node scripts/doctor.mjs` — **advisory:** whether your installed plugin cache is stale vs the working tree.
  Not a blocker, but if it reports STALE, remind the contributor their `/plugin` install won't reflect these
  changes until they reinstall — so any "I tested it" claim may be against old code.

If `npm test` (which runs the first two) exits non-zero, the PR is a **FAIL** regardless of the judgment checks
below. The sections that follow are the **judgment half** — the things a script can't decide.

## Ground rules (from CONTRIBUTING.md — objective, pass/fail)
1. **Domain-agnostic core.** Any change to a skill's `prompt.md` contract (`skills/*/prompt.md`),
   `templates/`, or `reference/` must contain **no domain-specific content** (no game/web/API-specific nouns
   baked into the general text) — the repo ships the method, not guides written with it. Flag any leaked
   domain nouns with file:line. (A `SKILL.md` wrapper is allowed its Claude-Code specifics — the contract is the
   `prompt.md`.)
2. **Every new rule earns its place.** If `reference/pedagogy-rules.md` gained a rule, it must **cite the
   concrete confusion it prevents**. A rule with no failure story = FAIL.
3. **Templates stay copy-paste-ready.** A changed template must have no placeholder that forces the reader to
   go read three other files to fill it in. Flag unresolved cross-references.
4. **Gates preserved.** No change may add a shortcut that skips a pipeline gate ("verify before you advance")
   unless it is **clearly labelled** as a bypass (the way lite mode is). Flag any silent gate-skip.

## PR checklist (from CONTRIBUTING.md — one line per item)
- [ ] Change is domain-agnostic.
- [ ] New rules cite the confusion they prevent.
- [ ] Any `skills/*/prompt.md` change includes a short before/after in the PR description showing the
      improvement — ask the contributor for it if the diff touches a `prompt.md` and you can't see one.
- [ ] `README.md` **and** `EXPLAINER.md` updated if a file was **added, moved, or removed**.
- [ ] `CHANGELOG.md` updated (a new entry under the top version section, or a new version block).

## Repo-consistency checks (mostly automated — verify the script covered them, then judge the rest)
These items are enforced by `scripts/check-consistency.mjs` + `check-version.mjs` from Step 1 — you
don't re-perform them by hand; you confirm the scripts passed and add the judgment only where noted.
- **Skill frontmatter.** *(script)* `name` matches folder, frontmatter parses. If a `SKILL.md` you touched is
  missing `description`/`argument-hint`, flag it — those two aren't in the script's assertions.
- **Skill wrappers delegate, don't duplicate.** *(script checks the injection line exists)* Each skill that
  **has** a co-located `prompt.md` must inline it via exactly `` !`cat "${CLAUDE_SKILL_DIR}/prompt.md"` `` — not
  a re-inlined copy of the contract, and never a stale `../../prompts/…` traversal (that path no longer exists)
  or a bare prose `${CLAUDE_SKILL_DIR}/…` outside a `` !`…` `` block (`CLAUDE_SKILL_DIR` only expands inside
  bash injection). **Self-contained skills have no `prompt.md` and are correctly exempt** — currently only
  `pre-pr-check` (the repo-maintenance skill that only runs inside this repo). Your
  judgment add: eyeball a touched wrapper for a re-grown full copy of its prompt's phases/rules (the drift the
  script can't measure).
- **Skill registry in sync.** *(script checks the count)* If a skill was added or removed, confirm the count in
  `.claude-plugin/marketplace.json` `plugins[].description` (e.g. "Thirteen skills, one install") and every
  "N skills" phrasing in `README.md`/`EXPLAINER.md` reflects the new total — and that the skill **tables/lists**
  in both docs actually gained/lost the row (the script counts the number, not the list rows). Report old vs new.
- **Version single-sourced.** *(script)* `plugin.json` `version` is the single source of truth; the README
  badge and top released `CHANGELOG.md` header must match. Tagging is **not** script-enforced — on a release
  PR, check by eye that `v<x.y.z>` will be pushed alongside the commit (`git push origin main v<x.y.z>`), since
  nothing downstream will catch a release that ships untagged. **Never hand-edit the version** — it moves only via
  `node scripts/release.mjs <x.y.z>`. **Prompt headers must NOT stamp a version number** (they point to
  `plugin.json`); flag any `skills/*/prompt.md` header that reintroduces a `vX.Y.Z`. If `version` did **not**
  change but the change is user-visible, flag that a bump is likely needed.
- **Rule ids in sync.** *(script checks id integrity; the sync set is yours)* If
  `reference/pedagogy-rules.md` gained, lost or re-homed a rule, `check-consistency.mjs` already proves every
  cited `rule N.N` resolves and every rule sits under a real `## P#`. Your judgment add: the contract is
  **re-stated inline** in five prompts (that file's **contract sync set**), so confirm the *wording* was
  updated in each — a rule whose id still resolves but whose text says something else is invisible to the
  script. Note that the docs never state a principle *count*, so there is no number to reconcile.
- **No dead links.** *(script covers docs/skills/templates)* The script resolves relative `.md` links in the
  plugin's own docs; flag any target that doesn't exist or overshoots the repo root with `../`.

## Deliverable
1. A **verdict**: PASS / PASS-WITH-WARNINGS / FAIL.
2. The **PR checklist above, rendered with each box ticked or ✗** and a one-line reason for every ✗.
3. A **blockers table**, most-severe first: `file:line · rule/check · what's wrong · exact fix`.
4. Warnings (things worth a look but not blockers) listed separately.
5. If PASS: a one-line "clear to open the PR". If FAIL: "fix the blockers and re-run `/pre-pr-check`."

Do not run `git commit`, `git push`, or open the PR yourself — the contributor does that after a PASS.
