# Contributing to GuideForge

Thanks for wanting to make GuideForge better. This project is small and opinionated on purpose — the
value is concentrated in the **pedagogy rules** and the **gated pipeline**, so contributions that
sharpen those are especially welcome.

## Ways to contribute

- **A new worked example.** Pick a domain we don't cover (mobile, data pipeline, embedded, front-end), run the
  pipeline on it, and publish the output as **your own repository** — then open a PR adding it to
  [examples/real-examples.md](examples/real-examples.md): a heading, the link, **the GuideForge version you generated it with**, and two
  lines — everything else belongs in your project's own README. This repo ships the method, so guide content
  lives in its own repo and gets linked, not vendored. File it under **Followed to the end** only if someone
  actually built the whole thing from it; otherwise **Guide only**, which is a perfectly good thing to
  contribute — just not the same claim. Real output is what convinces people the toolkit works.
- **A new pedagogy rule** — but only if it comes from a *real* point of confusion. Every rule in
  [reference/pedagogy-rules.md](reference/pedagogy-rules.md) exists because a reader got stuck on
  something specific. Include the confusion it prevents.
- **A prompt refinement.** If a prompt produces vague or off-target output, propose the fix with a
  before/after transcript.
- **Translations / domain adapters** — a variant of the prompts tuned for a specific stack.

## Ground rules

1. **Keep it domain-agnostic** in each skill's `prompt.md` contract, `templates/`, and `reference/`.
   The repo ships the method, not guides written with it — no game/web/API-specific nouns baked into the
   general text.
2. **Every rule earns its place.** No speculative rules — tie each to a concrete failure it prevents.
3. **Templates stay copy-paste-ready.** No placeholders that require reading three other files to fill in.
4. **Preserve the pipeline's gates.** The whole design rests on "verify before you advance." Don't add
   a shortcut that skips a gate without labelling it clearly (like lite mode does).
5. **Branch off `develop`, never off `main`.** `develop` is where the work happens and where PRs are opened
   and merged; `main` holds released state only — it moves when a release is cut, and every version tag lives
   on it. Nothing lands on `main` except a merge of `develop` at release time, so a fresh clone's `main`
   always matches the newest `v<x.y.z>` tag and the top released `CHANGELOG.md` header.
6. **Read everything the AI produces before you submit it.** GuideForge exists so that people keep control of
   — and keep learning from — the work, rather than shipping output they don't understand. Hold your own
   contributions to that standard: if Claude drafted a prompt, rule, or example for you, read it line by line,
   make sure you understand *why* it says what it says, and edit it until it's genuinely yours. Don't open a PR
   with AI output you haven't fully reviewed.

## Developing on the plugin (read this first — it will save you an afternoon)

**Installing the plugin *copies* it into a cache; it does not run from your working tree.** When you
`/plugin install`, Claude Code copies the repo to
`~/.claude/plugins/cache/guide-forge/guide-forge/<version>/` and loads skills, templates, and reference docs
from **that copy**. Editing files here in your clone has **no effect** on the running plugin until you
reinstall — a stale cache is the single most common way to spend an hour confused about why a change "isn't
working."

- **See whether your cache is stale:** `node scripts/doctor.mjs` diffs your working tree against the installed
  cache and tells you if they differ (and lists any leftover older-version cache dirs).
- **Pick up your edits:** re-run `/plugin` → reinstall **guide-forge** from the `guide-forge` marketplace, then
  restart the session. (The marketplace already points at your local checkout.)
- **Contributors never touch the version.** Put your changelog entry under `## [Unreleased]` and stop there —
  don't bump `plugin.json`, don't run `release.mjs`, don't tag. Cutting the release is the maintainer's step
  (two PRs both claiming `1.9.0` would collide, and you can't tag this repo anyway).
- **Maintainers: never hand-bump either.** The version lives in three places (`.claude-plugin/plugin.json`,
  the `README.md` badge, the top released `CHANGELOG.md` header) and drifts if edited by hand — which is why
  `package.json` is private and carries **no** `version` field; `check-consistency.mjs` fails if one appears.
  Move it only with `node scripts/release.mjs <x.y.z>`, which updates all three and promotes
  `## [Unreleased]`. Run it on `develop`, merge `develop` into `main`, then tag **that merge commit on `main`**
  with `git tag v<x.y.z>` — the tag belongs to the branch a fresh clone lands on, so `main` and the newest tag
  never disagree. **Push the commit and the tag together** — `git push origin main v<x.y.z>` — not `git push`
  followed by `git push --tags`, which leaves the remote holding a release commit nobody can find by version.
  No script enforces this: the tag can't exist before the commit it points at, so a check running on that push
  could never see it. It's on you. Push `develop` too, so the two don't drift.
- **Before pushing:** `npm test` runs `check-version` + `check-consistency` (version stamps aligned,
  skill frontmatter valid, wrappers delegate, counts agree, every contract mirror states every rule, no dead
  links or anchors). Nothing runs it for you — the repo has no CI — and it only covers the **deterministic
  half** anyway. The judgment half (is the change domain-agnostic? does the new rule cite a real confusion? is
  a gate quietly skipped?) no script can decide, which is why `/pre-pr-check` is still asked of you (next
  section).

## Which number moves — MAJOR, MINOR or PATCH

Versions are semver. The question is never "how big was the change?" but **what breaks for someone who
already uses GuideForge** — a guide author mid-project, or a reader following a guide that was generated with
an earlier release. What counts as the public surface here is unusual, so it's spelled out:

> the slash-command names · each skill's `prompt.md` contract (what it produces) · the canonical guide layout
> (`reference/canonical-layout.md` — folder and file naming, nav lines) · the pedagogy **rule ids** · the
> template structures · the plugin identity (`plugin.json` name, marketplace id).

**MAJOR** — an existing user has to change something to keep working.

- A skill is removed or renamed, so a `/slash-command` someone scripted or documented disappears.
- The canonical layout changes such that **already-generated guides no longer conform** — a folder or file
  naming rule, a nav-line format. Every guide out there is suddenly non-compliant, and `/audit-guide` starts
  failing files it used to pass.
- A pedagogy rule is **renumbered or removed**. Ids are cited across the prompts, in `/audit-guide` output and
  in generated guides' decision logs, so shifting `3.6` breaks every reference to it.
- A template's required structure changes incompatibly, or the plugin's install identity changes.

**MINOR** — new capability; everything that worked still works.

- A new skill, or a new option on an existing one.
- A **new** pedagogy rule appended under an existing principle (this is the common case — `4.4` in 1.7.0).
- A new template, reference doc, or root doc.
- A prompt-contract change that improves what gets *drafted from now on* without invalidating existing guides.

**PATCH** — nothing changes about what the toolkit produces.

- Wording, typos, formatting, dead links, clarifications that don't alter a skill's output.
- Repo-internal tooling a contributor sees but a user never does: the check scripts, `.gitignore`,
  `package.json`.
- A fix that restores the behaviour the contract already promised.

Two rules that settle most of the arguments:

1. **A large internal change with no user-visible effect is a PATCH.** Effort is not a version — rewriting a
   script wholesale, with identical results, moves the last number.
2. **A one-character rename of a public name is MAJOR.** Reach is not size.

If you're genuinely torn, say which two you're weighing in the PR and let the maintainer decide. Releases
before 1.10.0 predate this policy and weren't all classified this way; it applies going forward.

## Opening a PR, end to end

**You need:** Node 18+ (for the check scripts) and Claude Code (for `/pre-pr-check`).

1. **Fork** this repo on GitHub, then clone your fork and branch:
   `git clone https://github.com/<you>/guide-forge && cd guide-forge && git checkout -b my-change`
2. **Install the plugin from your checkout** — this is what makes `/pre-pr-check` exist as a slash command;
   cloning alone doesn't register it. In Claude Code: `/plugin marketplace add /path/to/your/guide-forge`,
   then `/plugin install guide-forge@guide-forge` (same steps as the README's *Quick start*, Option B).
   (Remember the cache: after editing, reinstall before you trust a manual test — see the section above.)
3. **Make your change**, following the ground rules.
4. **Add a `CHANGELOG.md` entry under `## [Unreleased]`** — what changed and *why*. Leave the version alone.
5. **Run `/pre-pr-check`.** Fix every blocker, re-run until it passes.
6. **Push to your fork and open the PR**, describing the confusion or defect your change addresses. If you
   touched a `prompt.md`, include a short before/after in the description.

## PR checklist

> **Before you open the PR, run `/pre-pr-check`** (the repo-maintenance skill in `skills/pre-pr-check/`). It
> runs the automated checks (`npm test`) and verifies every item below plus repo consistency — valid skill
> frontmatter, README/EXPLAINER skill list in sync, version stamps aligned **and tagged**, no dead links — and
> reports PASS/FAIL. It's read-only; fix any blockers it flags, re-run until it passes, then open the PR.
>
> A passing `npm test` is **not** a substitute. It checks the deterministic half and nothing more; every
> judgment item on the list below is invisible to it. A PR that is green but unchecked arrives unverified and
> costs the maintainer the review instead. Run it.

- [ ] Change is domain-agnostic.
- [ ] New rules cite the confusion they prevent.
- [ ] Any prompt change includes a short before/after showing the improvement.
- [ ] `README.md` and `EXPLAINER.md` updated if you added or moved a file.
- [ ] `CHANGELOG.md` updated **under `## [Unreleased]`** — version and tag left untouched.
- [ ] `/pre-pr-check` run and passing.

## Style

- Markdown, with prose wrapped so diffs stay readable line-by-line. Match the file you're editing.
- Callouts: `>` blockquotes for notes, emoji sparingly and consistently with existing files.
- Link between files with relative paths so navigation works on GitHub and locally.
