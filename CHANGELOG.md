# Changelog

All notable changes to GuideForge are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project uses date-stamped versions.

## [Unreleased]

### Added

- **CI — `.github/workflows/ci.yml` runs `npm test` on every push to `main` and every PR.** The deterministic
  half of the gate now runs without being asked, which is what the repo needs the moment it takes
  contributions from people who won't run `/pre-pr-check`. Two details are load-bearing: the checkout uses
  **`fetch-depth: 0`**, because the default shallow clone fetches no tags and `check-version.mjs` asserts the
  released version is tagged — without it every run fails; and there is **no install step**, since
  `package.json` has zero dependencies. Added while the repo is still private, deliberately: a workflow's
  first run is where the YAML mistakes surface, and better in private than in front of the first visitor.
- **Release pushes must send the commit and the tag together** (`git push origin main v<x.y.z>`).
  `git push` followed by `git push --tags` triggers CI on a release commit whose tag hasn't landed yet, so the
  tag check fails a build that is actually fine. Documented in `CONTRIBUTING.md`.

### Changed

- **CI green is stated as *not* a substitute for `/pre-pr-check`.** The workflow re-runs `npm test` and
  nothing else; every judgment item on the PR checklist — domain-agnostic prose, a rule citing a real
  confusion, a quietly skipped gate — is invisible to it. `CONTRIBUTING.md` now says so where a contributor
  would otherwise assume a green tick means verified.

## [1.9.0] — 2026-08-09

### Added

- **`package.json` — `npm test` is now a real command.** `CONTRIBUTING.md` and `pre-pr-check` both named
  `npm test` as the pre-push gate, but there was no `package.json`: running it failed with `ENOENT`, so the
  gate a contributor was told to run did not exist. The package is `private` and **deliberately carries no
  `version`** — the version already lives in three places that `release.mjs` moves atomically, and a fourth
  copy here would be invisible to it and silently drift.
- **`check-consistency.mjs` check 3d — `package.json` integrity.** Fails if that file ever grows a `version`
  field (the drift above, caught the moment it appears) or loses its `test` script (which would quietly break
  the gate again). Also indexes `EXAMPLES.md` in `ROOT_DOCS`, so the new root doc is scanned for dead links
  like every other one.
- **`CONTRIBUTING.md` — "Opening a PR, end to end".** Six numbered steps: fork and branch, **install the
  plugin from your checkout** (the step that makes `/pre-pr-check` exist as a slash command — cloning alone
  doesn't register it, and without it the gate the whole section rests on is unreachable), make the change,
  add a `[Unreleased]` changelog entry, run `/pre-pr-check` until it passes, open the PR. Prerequisites
  (Node 18+, Claude Code) are now stated.

### Changed

- **The version rule is split by role.** "Move it only with `release.mjs`, then create the tag" read as an
  instruction to *contributors*, who can neither tag this repo nor safely claim a version number — two PRs
  cutting the same release would collide. Contributors now put their entry under `## [Unreleased]` and touch
  nothing else; cutting the release is the maintainer's step.
- **The false CI claim is gone.** `CONTRIBUTING.md` promised "CI runs the same on every PR" and
  `reference/pedagogy-rules.md` said the consistency script is "run by `/pre-pr-check` and CI", but this repo
  has no workflows. Both now say plainly that nothing runs the checks for you and that the gate is a
  **request**: run `/pre-pr-check` before opening the PR.
- **`README.md` repository map** gained `EXAMPLES.md`, `package.json`, and `scripts/` — the last of which had
  never been listed at all, despite holding the four maintenance scripts the docs tell you to run.

### Removed

- **`.claude/scheduled_tasks.lock` is untracked, and local `.claude/` state is ignored.** The file carried a
  machine-local `sessionId`, pid and timestamp. `.gitignore` now excludes everything under `.claude/` while
  allow-listing `.claude/settings.json`, so shareable project settings stay possible.

## [1.8.0] — 2026-08-09

### Added

- **`EXAMPLES.md` — an index of worked examples, linked rather than vendored.** With the bundled `examples/`
  gone, proof that the toolkit produces something real now lives in its own file: each guide the pipeline
  produced is published as its **own repository** and gets a heading, a link, **the GuideForge version that
  generated it**, and **two lines** here — anyone who wants the stack, the ladder or the caveats reads that
  project's README, which is where they're already maintained. The version stamp is not decoration: structure
  and conventions move between releases, so an example built on an older one won't match what the pipeline
  produces today, and a reader comparing the two needs to know that before concluding the guide is wrong.
  First entry:
  [`guide-forge-web-platformer`](https://github.com/tomthebearded/guide-forge-web-platformer), a beginner's
  guide to a vanilla-JS Canvas platformer. Reached from the README header nav, from a pointer under *What you
  can build*, and from the `EXPLAINER.md` file table. A separate file rather than a README paragraph, so a
  second example is a new section instead of a rewrite. `check-consistency.mjs` now scans it for dead links
  along with the other root docs.
- **`CONTRIBUTING.md` — the worked-example contribution route, restored in link-don't-vendor form.** Run the
  pipeline on an uncovered domain, publish the output as your own repo, PR the entry into `EXAMPLES.md`.

### Removed

- **The bundled worked examples (`examples/`).** The four example guides — `spotify-angular`,
  `unity-platformer`, `vscode-extension`, `todo-ionic-dotnet`, 335 files — are gone from the tree. Their
  retirement as a *shipped feature* landed in 1.3.0 ("Worked examples removed as a shipped feature"); this
  deletes the content itself, so the repo now carries only the method. The surviving references went with it:
  in `CONTRIBUTING.md`, the "new worked example" contribution route and the *or lives under `examples/`*
  escape clause in both ground rule 1 and the PR checklist; in `pre-pr-check`, that same clause, the
  `examples/` scope area, and a stale "the last two (examples layout) are still yours to check" note pointing
  at checks that no longer existed; and the `CONTRIBUTING.md` row of the `EXPLAINER.md` file table. The
  domain-agnostic rule itself is unchanged in force — it just no longer has an escape hatch: the repo ships
  the method, not guides written with it. Historical changelog entries keep their `examples/` mentions, since they record what was
  true at the time.

## [1.7.0] — 2026-08-09

### Added

- **Rule 4.4 — cut every step so it ends on a green build.** New rule under P4 (*structure steps & code*): no
  step may leave the project not compiling. The step boundary is the reader's only checkpoint, so a step that
  ends red makes every error ambiguous — a real mistake of their own hides inside the guide's "expected" list,
  the step's own `Done-when` can't be run, and the sitting has no safe stopping point. When an edit forces
  others (a changed signature, a rename, a moved file), the **same** step fixes every call site it breaks; a
  longer green step beats two short steps with a broken interval, and this **outranks the granularity dial**.
  The sentence "this error is expected; step NN fixes it" is now itself the defect. A failing *test* is not a
  broken build (test-first stays legal), and a codegen command that makes the tree buildable belongs in the same
  step, before the gate. (A reader following a VS Code extension guide was told a constructor-signature error in
  `extension.ts` was expected until step 05.)
- **README — "Tips for following a guide".** A new section, sitting after *Best practices* as its counterpart
  and addressed to the *reader* of a generated guide rather than its author: don't copy-paste past the explanation, follow the
  whole guide before layering your own changes (later steps assume the exact state earlier ones left), keep
  the glossary open, read the step's failure note before searching, don't hand a milestone to a model, assume
  the guide can be stale — especially on external platforms whose consoles and dashboards move under it — and
  report the friction you hit. The repo told authors how to write a teaching guide but never told readers how
  to follow one, and the failure modes it names are the ones that waste a reader's afternoon.

### Changed

- **Contract sync for rule 4.4.** `reference/pedagogy-rules.md` (canonical text + before/after),
  `reference/milestone-design.md` (the dependency-ordering gate now states its step-level twin),
  `plan-guide` (P4 writing rules — cut the ladder so every step can end green), `draft-milestone` (contract line,
  a structural drafting bullet, and a self-audit item), `clarify-step` (4.4 as **flag-only** — absorbing the
  broken call sites changes what the step does, so it's out of scope for a clarity pass), `audit-guide` (a
  structural **BLOCKER** check for explicit "won't compile yet" wording *and* the implicit case of an unaccompanied
  signature/rename/move, plus the pedagogy enumeration), `report-issue` (new root-cause class), `templates/step.md`
  (rule comment + a build-clean `Done-when` box), `EXPLAINER.md` §7, `README.md`.

## [1.6.0] — 2026-08-09

### Added

- **Layout rule — a milestone overview links its own first step (`start:`).** Every `00_overview.md` nav line
  now ends with a third anchor, `start: [<step 01 title>](01_<slug>.md)`, repeated identically at the top and
  the bottom of the file. The map's nav offered only sideways moves: a reader who finished the overview and
  scrolled to the bottom found `next` — the *following* milestone — as the nearest forward click, and actually
  beginning the work meant scrolling back up to hunt for step 01 inside "Steps at a glance". A **scaffold
  placeholder** overview carries the segment as the literal text `start: — not drafted yet` (no step file
  exists yet to link), which `draft-milestone` replaces with the real link.

### Changed

- **Contract sync for the `start:` rule.** `reference/canonical-layout.md` (link conventions),
  `templates/milestone-overview.md` (both nav lines + the rule comment), `draft-milestone` (structural nav
  bullet + self-audit checklist), `scaffold-guide` (placeholder text, so the scaffold never stamps a dead link),
  `audit-guide` (a structural check that flags a missing, one-ended, mistargeted, or dead `start:` anchor —
  and exempts scaffold placeholders), `EXPLAINER.md` §8.

## [1.5.0] — 2026-08-07

### Added

- **Rule 6.2 — observe the property where the environment can't mask it.** New rule under P6 (*prove the
  gate*), the false-**negative** twin of 6.1: every gate is watched inside an environment the guide prescribes
  (debug session, dev server, emulator, preview build), and that environment routinely overrides, suppresses or
  duplicates the exact signal the gate reads — so a *correct* implementation shows the wrong thing and the
  reader debugs working code. A guide must observe an unmasked channel, set the environment-specific variant
  alongside the normal one, or name what that environment shows **inside the `Done-when`** — never in the
  troubleshooting table, which a reader whose code works never opens. (A reader's extension wrote the right
  color setting, but the debug host's own status-bar debugging colors masked it: "it works but it applies the
  color only when i close the debug session.")
- **Rule 3.6 — every identifier the guide writes is self-describing.** New rule under P3 (*leave nothing
  ambiguous*): variables, constants, functions/methods, classes, files, CSS classes, config keys and test names
  say what they hold or do when read with the prose covered up — nouns for state, verbs for behavior, the unit
  in the name where it prevents a mistake (`timeoutMs`, `widthPx`) — because the reader meets the code a second
  time in their own project with no paragraph beside it. Banned: single letters, `data`/`temp`/`val`/`obj`,
  `doStuff()`, `Manager`/`Helper`, domain-foreign abbreviations. Explicit exception: the ecosystem's own idiom
  (`ctx`, `req`/`res`, `e`, a loop `i`) is matched, not fought — those names teach the platform.

### Changed

- **Contract sync for both rules.** `plan-guide` (Phase 4 + Phase 5 verification design), `draft-milestone`
  (writing contract, structural bullets, self-audit checklist), `clarify-step` (3.6 with a rename-safety guard;
  P6 stays out of scope and is now *flagged* rather than fixed), `audit-guide` (a 6.2 masked-gate check and a
  3.6 cryptic-identifier check), `review-before-follow` (new check 7: the gate isn't masked by the environment
  you're about to observe it in), `report-issue` (environment-masked gate added to the root-cause classes, plus
  a note that false negatives are guarded *in the gate*, not in "If it breaks"), `templates/step.md`,
  `templates/verify.md`, `README.md`, `EXPLAINER.md` §7.

## [1.4.0] — 2026-08-04

### Added

- **Sourcing principle — when the reader's toolchain contradicts the docs, the toolchain wins.** The principle
  previously resolved only one conflict (docs vs. training memory). It now also covers docs vs. the validator,
  compiler, linter, formatter or type-checker the guide tells the reader to run: the docs describe *semantics*,
  but the toolchain decides what the reader actually sees, so a code or config block is written the way it
  comes out clean, with a note on why it differs from the docs. "The docs win" is scoped to names, signatures,
  flags and versions — not weakened. `reference/pedagogy-rules.md` carries the canonical bullet;
  `draft-milestone` authors to it. (A reader pasted a manifest snippet that matched the official docs and got
  a `Missing property` warning from the editor's bundled schema.)
- **`audit-guide` flags declarative blocks that are correct per the docs but incomplete against their
  schema.** A new pedagogy (judgment) check: for every config/manifest block — an editor or plugin manifest, a
  build/compiler config, a CI or container file, any schema-backed JSON/YAML/TOML — the auditor raises a
  suspect naming the block, the key likely missing, and the validator to re-check it in.

### Removed

- **Token-usage tracking, entirely.** The bundled Stop/SubagentStop hook (`hooks/track-tokens.js` +
  `hooks/hooks.json`, so the whole `hooks/` folder) is gone, along with `reference/token-tracking.md`, every
  generated `guide/TOKEN_USAGE.md` ledger under `examples/`, and the hook's `.claude/.token-usage-state.json`
  scratch state. GuideForge no longer meters, estimates, or records what a guide costs to build.
- **The `TOKEN_USAGE.md` guide-root file.** It is no longer part of the canonical layout
  (`reference/canonical-layout.md`), so `scaffold-guide` no longer stamps it and `audit-guide` no longer
  expects it.
- **The per-skill "Log the run" ledger rule.** Removed from all eleven `SKILL.md` wrappers; skills no longer
  append estimated cost rows, and `plan-guide` / `modernize-guide` no longer emit a `Planning cost (est.)`
  line for `scaffold-guide` to seed from.
- Cost-tracking sections in `README.md` and `EXPLAINER.md`, and the cost-line references in the four example
  guides' `PLAN.md` / `status.md`.

## [1.3.0] — 2026-08-02

Four new pedagogy rules, a glossary-hygiene pass, a provenance rule, a suite of deterministic maintenance
scripts + CI, and a **restructure of the pedagogy contract from a flat rule list into seven named principles**
— most from real reader-friction observations plus two process failures (a drifted/phantom version and a stale
install cache) worth preventing in code, not prose. The contract is now advertised as **7 principles** (holding
the rules as dotted `3.1`-style ids). The bundled **worked example guides and their showcase/tooling were
retired** (see "Worked examples removed" in `Changed`).

> The `Added` items below describe the four new rules by their original `R11`–`R14` ids (how they landed this
> cycle); the restructure at the end of `Changed` re-homes every rule under a principle and gives the new
> ids — R11→4.2, R12→4.3, R13→3.5, R14→7.1.

### Added

- **R11 — Put each code block directly under the instruction it implements.** When a step's code has 2+
  distinct parts, each part's fenced block now sits **immediately below the numbered action that introduces
  it** (interleaved), not batched in a trailing `## Code` dump. `reference/pedagogy-rules.md` gains the rule
  with a before/after; `plan-guide`, `draft-milestone`, and `clarify-step` author to it; `audit-guide` flags a
  trailing code dump, an interleaved fragment with no location, and a redundant consolidated "complete file"
  copy.
- **R12 — When a file already exists, add to it; don't reproduce the whole file.** For a file that already has
  code, a step shows only the fragment to add plus a **unique** placement anchor (a named function/block or a
  once-occurring line) — never the entire file re-pasted (which invites overwriting the reader's real code), and
  never an anchor like "under `x = true;`" that matches several lines. `reference/pedagogy-rules.md` gains the
  rule with a before/after; `plan-guide`, `draft-milestone`, and `clarify-step` author to it; `audit-guide`
  flags a whole pre-existing file re-pasted and an ambiguous anchor. Two new `EXPLAINER.md` table rows
  (R11 + R12) plus updates across `README.md`, `templates/step.md`, `templates/verify.md`, and the skills.
- **R13 — Reuse a value; define it once (whole-guide consistency).** Split out of R4, which conflated a
  *per-step* "be exact" rule with a *cross-step* "same figure everywhere" property. A figure that recurs (jump
  height, tick rate, timeout, colour hex, port) must read identically in the code, prose, gate, glossary, and
  overview. `reference/pedagogy-rules.md` gains R13 (R4 slimmed, with a cross-reference); `plan-guide`,
  `draft-milestone`, `clarify-step` author to it; `audit-guide` checks it as a whole-guide value-consistency
  sweep.
- **R14 — Declare the step's starting state (don't silently assume a prerequisite).** The proactive,
  authoring-time twin of the review-gate "list implied/missing steps" corollary, targeting the #1 field-failure
  class (`report-issue`'s most common root cause). A step states what must already be installed/running/
  logged-in/built — or points to the step that established it — before its first action. Added to
  `reference/pedagogy-rules.md`, `plan-guide`, `draft-milestone` (contract + self-audit), `clarify-step`, and
  `audit-guide` (flags a first action depending on unestablished environment/runtime state).
- **Deterministic maintenance scripts + CI (`scripts/`, `package.json`, `.github/workflows/ci.yml`).** The
  version-drift and stale-cache problems that motivated this release are now guarded by code, not prose:
  `check-version.mjs` (stamps agree **and** a released version is git-tagged — catches a phantom bump),
  `check-consistency.mjs` (skill frontmatter, wrapper delegation, skill/rule counts, dead links),
  `doctor.mjs` (installed cache vs working tree — surfaces staleness), `release.mjs` (the *only* way the version
  moves: bumps `plugin.json` + README badge + promotes `## [Unreleased]` atomically). `npm test` runs
  `check-version` + `check-consistency`; CI runs them on every PR.
- **Provenance rule — every guide records the GuideForge version that produced it.** Just as `stack.md` pins
  the *subject* tools, a guide now pins the *method*: `scaffold-guide` reads the `version` field from the
  plugin's `.claude-plugin/plugin.json` and stamps it verbatim into the `README.md` (a provenance line + the
  Updates-log seed, `Guide created with GuideForge v<x.y.z>.`) and into `foundation/status.md` (a provenance
  line). It's set once at scaffold time and left as-is on later edits — it marks the method revision the guide
  was built against. Documented in `skills/scaffold-guide/prompt.md` + `SKILL.md`, `templates/readme.md`, and
  `templates/status.md`. Not enforced by `audit-guide` (documented convention, not a lint check).

### Changed

- **Fixed: the plugin failed to load — removed the redundant `hooks` key from the manifest.**
  `.claude-plugin/plugin.json` declared `"hooks": "./hooks/hooks.json"`, but Claude Code auto-loads the
  standard `hooks/hooks.json` path; re-declaring it double-loaded and threw *"Duplicate hooks file detected"*,
  marking the whole plugin **failed to load**. Dropped the key — the bundled Stop/SubagentStop hook still
  auto-loads from the standard path, so token tracking is unaffected. `README.md`'s "turn it off" note updated
  (delete/rename `hooks/hooks.json` or `claude plugin disable`, since there's no longer a key to remove).
- **The complete-file guarantee moved entirely to the checkpoint.** The old step-level rule *"any code block
  is a complete file, no partial snippets"* is retired — intra-step **fragments are now expected** for
  multi-part code. The single authoritative, paste-able copy of every file a milestone touches is guaranteed
  **only** by that milestone's `NN_verify.md` checkpoint (unchanged; its MAJOR completeness lint is now the
  sole guarantor). Each interleaved fragment must state **where it goes** (file + position) so the reader can
  still reassemble the whole. Updated in `templates/step.md`, `templates/verify.md`, `plan-guide`,
  `draft-milestone`, `clarify-step`, `audit-guide`, and `EXPLAINER.md`.
- **Glossary is words/concepts only — functions get an inline code comment.** R1 no longer sends functions to
  the glossary: a **function** (built-in method like `toFixed()`/`ctx.fillRect()` *and* one the guide writes
  like `spawnEnemy()`) is explained with an inline code comment on its line, never a glossary `### entry`.
  Non-function concept terms (`delta time`, `middleware`, `Transform`, Gamma color space) still go in the
  glossary. Updated in `reference/pedagogy-rules.md`, `templates/glossary.md`, `plan-guide`, `draft-milestone`,
  `clarify-step`, and `audit-guide` (which now flags a function used as a glossary entry).
- **The glossary is linked once, from the step's block — not after every term.** Body inline-glosses and "New
  concept" callouts stop appending a `see [glossary](…)` link; the `## Glossary for this step` block is the one
  door to the glossary (its per-term `../glossary.md#slug` deep-links and the audit's anchor-resolution check
  are unchanged). An external-API *docs* link in a body callout is still fine (the sourcing principle).
  Updated in `reference/pedagogy-rules.md`, `templates/step.md`, `plan-guide`, `draft-milestone`, `clarify-step`.
- **Checkpoint carve-out for pre-existing files.** The `NN_verify.md` file checkpoint renders whole only the
  files the **guide authored**; a pre-existing file the milestone only adds to is shown as its added region +
  unique anchor under a new "Pre-existing files modified" list, not reproduced whole. Reconciled in
  `templates/verify.md`, `reference/canonical-layout.md`, `audit-guide`, and `draft-milestone`.
- **`pre-pr-check` now runs the scripts instead of describing the checks.** Its "machine-checkable half" was
  prose a model re-performed by hand (and had miscounted before); it now runs `check-version.mjs` +
  `check-consistency.mjs` + `doctor.mjs` as a hard gate and only applies judgment where a script can't. Its
  wrapper-delegation check exempts the self-contained `pre-pr-check` (no `prompt.md`), matching the script's
  "only skills with a `prompt.md`" logic.
- **Non-interactive `plan-guide` defaults to the current stable LTS, not bleeding-edge `latest`.** A teaching
  guide wants the most stable ecosystem and fewest breaking-change surprises; Phase 0.5 still confirms what the
  current LTS actually is, and a reader can opt into the newest major.
- **Token-hook rates single-sourced.** The per-model USD rates now live only in `MODEL_RATES` in
  `hooks/track-tokens.js`; `reference/token-tracking.md` and `README.md` point to the code instead of
  restating figures that had already drifted (the docs listed only Opus while the code priced Sonnet/Haiku
  too). The hook also prunes `state.seen` to the most-recent 5000 message ids so the dedup state can't grow
  unbounded.
- **Contract sync set documented.** `reference/pedagogy-rules.md` is the canonical rule text; the skill prompts
  deliberately re-state it inline to stay usable as standalone paste-prompts. A "contract sync set" note now
  lists every file a rule change must touch, and `check-consistency.mjs` enforces that the stated rule/skill
  counts agree — a half-applied change fails CI instead of shipping.
- **CONTRIBUTING gains a "Developing on the plugin" section.** Explains that install *copies* the plugin to a
  cache (so working-tree edits need a reinstall — the exact trap that let weeks of edits run against a July-7
  copy), and documents `doctor.mjs`, `release.mjs`, and `npm test`.
- **The pedagogy contract is restructured from a flat 14-rule list into seven named principles.** A review
  found the flat numbering hid real hierarchy (R12 was "R2 + R11 for existing files", R13 was split from R4,
  R14 twinned a review corollary) and that R1 alone bundled five sub-rules. The rules are now grouped under
  **P1 Explain what's new · P2 Anchor every action · P3 Leave nothing ambiguous · P4 Structure steps & code ·
  P5 Anticipate failure · P6 Prove the gate · P7 Declare the starting state**, cited by dotted ids
  (`principle.rule`, e.g. `3.1`). R1's five clauses are now named `1.1a`–`1.1e`; the former standalone "gate
  principle" is promoted to a numbered rule (`6.1`). **Full old→new map:** R1→1.1, R2→2.1, R3→2.2, R4→3.1,
  R5→3.2, R6→3.3, R7→1.2, R8→3.4, R9→4.1, R10→5.1, R11→4.2, R12→4.3, R13→3.5, R14→7.1, gate→6.1. Applied
  across `reference/pedagogy-rules.md`, `EXPLAINER.md` §7 (regrouped table), `README.md` ("pedagogy in one
  screen" is now genuinely one screen — the 7 principles), all skill prompts + self-audit, `templates/`, and
  the count docs. The advertised count is **7 principles** (not a flat rule count); `check-consistency.mjs`
  now verifies the principle count.
- **Worked examples removed as a shipped feature.** The bundled example guides are being retired, so the plugin
  no longer showcases or tools them: dropped the `examples/`-facing docs (the README repo-map row and the
  EXPLAINER §5 "worked runs" section), the cross-guide dashboard (`scripts/guide-status.mjs` + `examples/INDEX.md`
  and its `guide-status` npm script), the `/harvest-feedback` skill (its only data source was example
  feedback-logs), and `pre-pr-check`'s "worked examples match the canonical layout" check + `examples/` link
  sweep. Specific-guide names in the pedagogy rules' `(Observed: …)` provenance notes were **generalized** — the
  concrete lesson kept, the guide name dropped. **Skill count 12 → 11.** The domain-agnostic-core /
  domain-content-lives-under-`examples/` architecture principle stays; only the shipped worked guides and their
  machinery are gone.

## [1.2.0] — 2026-07-16

A drafting-cadence change (whole guide in one pass), structural hardening of the skill layer, two correctness
fixes, a **method-hardening pass** driven by defect classes observed while auditing the worked examples, and a
layout/navigation/voice pass (one in-guide cost ledger, top-and-bottom nav, first-use concept glosses, a
direct-address voice rule) with two worked examples renamed.

### Method hardening (from example audits)

Ten recurring defect classes surfaced across the worked-example audits (spotify-angular, unity, web-platformer).
Each got a rule at the point it's authored **and** a matching lint in `audit-guide`, so the same defect can't
recur. No skill was added or removed.

- **No forward references (build-breaker).** `reference/milestone-design.md` and `draft-milestone` now require
  every load-bearing symbol a milestone uses to have its **first definition in that milestone or an earlier
  one**, and each milestone's build/Done-when gate to be satisfiable from current+earlier code alone; a
  dependency-ordering self-check runs before each milestone closes. `audit-guide` resolves every identifier and
  flags a first-definition-after-use as a **BLOCKER**. (Observed: spotify-angular M9 used `LikedIndex.clear()`
  introduced only in M10.)
- **No gold-plating / build-now-consume-later.** `milestone-design` adds a *consume-it-now* test — every public
  member a milestone adds must be **called within that milestone**, or carry a `[Mn]` marker naming the
  consuming milestone; `draft-milestone` enforces it and `audit-guide` flags unmarked, uncalled members.
  (Observed: spotify-angular M8/05 built M11's marker system, leaving dead members.)
- **Glossary deep-links resolve.** `templates/glossary.md` now uses **`### <term>` headings** (stable GitHub
  anchors) instead of bullets; `scaffold-guide`/`draft-milestone` link terms as `glossary.md#<slug>`, and
  `audit-guide` validates the **anchor**, not just the file. (Observed: spotify-angular shipped 39 dead
  `glossary.md#term` links because terms were bullets.)
- **Checkpoint completeness claims are kept.** `templates/verify.md` and `reference/canonical-layout.md` scope
  the "complete" claim to the files actually rendered (untouched files are *named as unchanged*, never swept
  into a blanket "authoritative copy of every file"); `audit-guide` flags a touched-but-fragmented file, or an
  over-broad claim, as **MAJOR**. (Observed: spotify-angular M10/M11 and unity M7/07 over-claimed.)
- **Canonical nav label + first-step prev.** `templates/step.md`, `plan-guide`, `draft-milestone`, and
  `canonical-layout.md` fix the middle anchor label to exactly **`Overview`** and make the **first step's prev
  a bare `—`** (the Overview anchor already points there); `audit-guide` checks both exactly. (Observed:
  spotify-angular mixed `[Overview]`/`[Milestone overview]` across 140 files and gave first steps a redundant
  prev — the `[Milestone overview]` label originated in `plan-guide`'s step template.)
- **Gates prove what they claim.** `pedagogy-rules.md` adds the gate principle — a `Done-when` action must
  **exercise the property it claims** (re-run for determinism, restart+re-read for persistence) or reword the
  claim; `draft-milestone` and `audit-guide` enforce it. (Observed: spotify-angular M5 claimed determinism without
  re-querying.)
- **Cross-platform gate commands.** `templates/stack.md` gains a **Target OS / shell(s)** field;
  `templates/conventions.md` and `draft-milestone` require a command variant per targeted shell; `audit-guide`
  flags a Unix-only command used as a gate check when the guide also targets Windows/PowerShell. (Observed:
  spotify-angular M0's zone.js check was bash `grep` only.)
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

### Layout, navigation & voice (2026-07-16)

- **One token ledger, inside the guide.** The two per-guide cost files collapsed into a single
  **`guide/TOKEN_USAGE.md`** (previously a metered `examples/<name>/TOKEN_USAGE.md` at the project level *plus*
  an estimate `guide/token-usage.md`). The bundled hook now writes the in-guide file and is authoritative
  (rewrites it each run); skills append an estimate row to the same file only when the hook is inactive, which
  the hook then replaces. Removing the second filename also dissolves the old Windows case-collision. Updated
  `hooks/track-tokens.js`, `reference/token-tracking.md`, `reference/canonical-layout.md`, every skill's
  log-the-run step, README/EXPLAINER, and migrated the 5 drafted example guides.
- **Nav at the bottom of every navigable file.** Steps, `00_overview.md`, and `NN_verify.md` now repeat their
  canonical nav line **verbatim at the bottom**, after a `---` rule, identical to the line-2 top nav — so you
  can move on without scrolling back up. `templates/{step,verify,milestone-overview}.md`, `canonical-layout.md`,
  `draft-milestone`, and `scaffold-guide` require it; `audit-guide` now flags a missing/desynced bottom nav
  (it previously flagged *bottom-only* nav). Retrofitted across all 5 example guides (336 files).
- **Explain a concept at its first appearance, not later.** `pedagogy-rules.md` R1 gains the
  *forward-explained concept* case — a concept used before its dedicated teaching step must get a **one-line
  mini-gloss + a forward pointer** at first use; `draft-milestone` tracks first-appearance and `audit-guide`
  flags a bare first-use whose full treatment lives in a later step. (Observed: web-platformer named *delta
  time* in M1/02's `maxDt` comment but only taught it in M1/05.)
- **Address the reader as "you" (voice principle).** `pedagogy-rules.md` adds a voice principle: the
  guide-follower is always second person — never "the Human", "the user", "the reader", "the developer", or
  "one". `templates/conventions.md` codifies it as fixed house style, `draft-milestone` enforces it, and
  `audit-guide` flags third-person references to the reader. Retrofitted across all 5 example guides.
- **Examples renamed.** `vscode-live-recolor` → **`vscode-extension`** and `spotify-trip` → **`spotify-angular`**
  (the latter a full rebrand — the taught Angular app name changed too). Folders, all in-repo references, and
  the hook's per-guide state keys were updated so metered history carries over.

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
  hook's i `TOKEN_USAGE.md` sits at the project level, beside the guide folder. `reference/canonical-layout.md`
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
