# Contributing to GuideForge

Thanks for wanting to make GuideForge better. This project is small and opinionated on purpose — the
value is concentrated in the **pedagogy rules** and the **gated pipeline**, so contributions that
sharpen those are especially welcome.

## Ways to contribute

- **A new worked example.** The highest-value contribution. Pick a domain we don't cover
  (mobile, data pipeline, embedded, front-end) and run the pipeline on it, then add the output under
  `examples/<your-domain>/`. Real output is what convinces people the toolkit works.
- **A new pedagogy rule** — but only if it comes from a *real* point of confusion. Every rule in
  [reference/pedagogy-rules.md](reference/pedagogy-rules.md) exists because a reader got stuck on
  something specific. Include the confusion it prevents.
- **A prompt refinement.** If a prompt produces vague or off-target output, propose the fix with a
  before/after transcript.
- **Translations / domain adapters** — a variant of the prompts tuned for a specific stack.

## Ground rules

1. **Keep it domain-agnostic** in each skill's `prompt.md` contract, `templates/`, and `reference/`.
   Domain-specific content lives in `examples/`.
2. **Every rule earns its place.** No speculative rules — tie each to a concrete failure it prevents.
3. **Templates stay copy-paste-ready.** No placeholders that require reading three other files to fill in.
4. **Preserve the pipeline's gates.** The whole design rests on "verify before you advance." Don't add
   a shortcut that skips a gate without labelling it clearly (like lite mode does).
5. **Read everything the AI produces before you submit it.** GuideForge exists so that people keep control of
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
- **Never hand-bump the version.** The version lives in three places (`.claude-plugin/plugin.json`, the
  `README.md` badge, the top released `CHANGELOG.md` header) and drifts if edited by hand. Move it only with
  `node scripts/release.mjs <x.y.z>`, which updates all three and promotes `## [Unreleased]`; then create the
  matching `git tag v<x.y.z>` (a "released" version with no tag fails `scripts/check-version.mjs`).
- **Before pushing:** `npm test` runs `check-version` + `check-consistency` (version stamps aligned + tagged,
  skill frontmatter valid, wrappers delegate, counts agree, no dead links). CI runs the same on every PR.

## PR checklist

> **Before you open the PR, run `/pre-pr-check`** (the repo-maintenance skill in `skills/pre-pr-check/`). It
> runs the automated checks (`npm test`) and verifies every item below plus repo consistency — valid skill
> frontmatter, README/EXPLAINER skill list in sync, version stamps aligned **and tagged**, no dead links — and
> reports PASS/FAIL. It's read-only; fix any blockers it flags, re-run until it passes, then open the PR.

- [ ] Change is domain-agnostic, or lives under `examples/`.
- [ ] New rules cite the confusion they prevent.
- [ ] Any prompt change includes a short before/after showing the improvement.
- [ ] `README.md` and `EXPLAINER.md` updated if you added or moved a file.
- [ ] `CHANGELOG.md` updated.
- [ ] `/pre-pr-check` run and passing.

## Style

- Markdown, wrapped ~100 cols for prose where practical.
- Callouts: `>` blockquotes for notes, emoji sparingly and consistently with existing files.
- Link between files with relative paths so navigation works on GitHub and locally.
