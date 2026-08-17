# Changelog

All notable changes to GuideForge are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project uses date-stamped versions.

## [Unreleased]

### Added

- **Rule 6.6 — a gate that samples one case cannot assert the class.** New rule under P6. A gate is trusted for
  what its **label** says, not for what it measures, and the two drift apart quietly: the label names a set —
  *the theme*, *the config*, *the endpoints*, *the locales* — while the expression under it reads a single
  member. Such a gate cannot fail. It goes green on the one case that passes, says nothing about the rest, and
  because it is green nobody looks — which makes it strictly worse than having no gate at all, since a missing
  gate leaves the reader uncertain and a sampling gate leaves them confidently wrong. It also shelters every
  other defect in the same area, because the readout meant to catch them is the thing looking the wrong way.
  The fix: measure the **worst case of the set the label names** and report which member lost, or narrow the
  label to the case actually measured; where the set is enumerable, sweep it and print one assertion.
  *(Found in a VS Code theme-generator guide whose panel badge graded a single color pair. Of the 85 themes its
  engine could produce, **66 failed WCAG AA on a pair the badge never read** — an inactive tab label as low as
  1.55:1 — and three separate engine defects had shipped underneath the green badge: a contrast floor set at
  3:1, which is WCAG's threshold for large text and not for code; a chrome mapper that never clamped its
  foregrounds at all; and a clamp helper that picked its search direction from the background's luminance and
  so could not converge on mid-tone backgrounds.)*

## [1.16.0] — 2026-08-14

### Added

- **Rule 6.4 — anchor to what your code does, not to what the tool generated.** New rule under P6, and the
  first one produced by *executing* fixtures rather than reading them. Every guide sits on a scaffold, a CLI or
  a bundler that emits text nobody in the guide wrote — a generated config line, a template's demo page, a file
  listing, a bundle size, a laid-out box — and that text is a moving target the guide does not control. It is
  also what authors most often describe from reasoning rather than from looking: a size that "must be bigger"
  because something was added, a width read off the stylesheet instead of off the element. Either way the reader
  is told to edit a line that is not in their file, or to tick a gate their correct build just failed. 6.3 is
  the same tool rendering differently for the author; **6.4 is the tool's own output never being observed at
  all — or having moved since it was.** The fix: an edit instruction says what the file must **read** and
  handles the anchor's absence; a gate reads the effect of the reader's code; any number quoted about the
  running system was measured.
  *(Found by following the two colour-picker fixtures end to end: an `outputPath` line the Angular CLI does not
  write, a `create-vite` demo page whose heading, button label and file list had all changed, a gate promising
  a bigger bundle where the same step's deletion made it smaller, and a panel gated at "240px wide" that
  measures 266px.)*

- **Rule 6.5 — a break recipe must be run, and must name the failure the reader sees first.** New rule under
  P6. "Break this and watch the gate go red" is the strongest evidence P6 has — it proves the gate *can* fail,
  which no green run does — and it is the only claim in a guide that **no clean run ever exercises**, so a wrong
  one survives every build and every reading audit. Two shapes, both observed in one guide: the mutation leaves
  the suite **green** because nothing covers the branch it breaks, or it fails somewhere other than the page
  says, because the runner stops at the *first* failing assertion or an exception is thrown before any assertion
  is reached. The rule's teeth are in the first case: **a mutation nothing catches is missing coverage, not a
  wording problem** — add the test, don't soften the sentence.
  *(Found by executing the .NET fixture's 19 steps in order: all three of its break recipes were wrong, and
  fixing the worst one added the fourteenth test to a suite whose thesis is that the tests are the proof.)*

  Both rules are synced across the contract set: `reference/pedagogy-rules.md`, the `plan-guide` (Phase 5),
  `draft-milestone` (writing contract *and* self-audit checklist), `clarify-step` (P6 carve-out, now 6.1–6.5)
  and `audit-guide` (two new checks, each telling the auditor to settle it by running something rather than by
  reading) prompts, `EXPLAINER.md` §7, `templates/step.md` and `templates/verify.md` — whose gate block now
  carries an optional break-recipe line. `review-before-follow` gained both pre-execution checks and
  `report-issue` both root-cause classes, including the note that an uncovered branch makes the fix
  milestone-scope rather than sentence-scope.

- **Rule 6.3 — quote the output the reader's shell prints, not the one your capture produced.** New rule under
  P6 (*prove the gate*), and the first one this repo's own fixture produced. You observe a command through a
  pipe, a redirect, a CI job, or a tool that captures stdout; modern CLIs **detect that** and switch renderer,
  so the gate you write is faithful to what you saw and unreachable for the reader. What makes it worth a rule
  rather than a footnote is that it is **self-confirming**: re-running your own check reproduces your capture,
  not their terminal, so the defect survives re-verification. Rule 6.2 already covered the environment masking
  the *reader*; 6.3 is the same failure turned on the author.
  The fix is always the same shape — gate on **values** (a count, a status, an exit code), never on a line to
  match character by character; where showing the output is the lesson, show the terminal's rendering and name
  the captured variant beside it, **in the gate**.
  Synced across the contract set: `reference/pedagogy-rules.md`, the `plan-guide` (Phase 5), `draft-milestone`
  (writing contract *and* self-audit checklist), `clarify-step` (P6 carve-out, now 6.1–6.3) and `audit-guide`
  (a new BLOCKER check that tells the auditor to run the command in a terminal, and to mark the finding
  *unconfirmed* when it can only capture the output) prompts, `EXPLAINER.md` §7, `templates/step.md` and
  `templates/verify.md`. `review-before-follow` gained the pre-execution version of the check and
  `report-issue` the root-cause class.

- **`fixtures/color-picker-component-react/` — a third fixture, and the first *controlled pair*.** The same
  colour picker as the Angular fixture — same brief, same observable end state, same canonical `#3366ff`, same
  browser-watched gates — rebuilt on React 19 + Vite 8 + Node 24 (stack verified online 2026-08-14):
  5 milestones, 23 steps, 5 verify gates, generated with `v1.15.0`. The first two fixtures vary the *gate*
  (exit code vs. a person looking at a page); this one holds everything fixed and varies only the **stack**, so
  a difference between the two guides is attributable to it rather than to taste.
  What the pair actually surfaces is one **build-vs-borrow row inverting**. Angular's framework→custom-element
  bridge is `@angular/elements`, an in-house package versioned with the framework, so the row is *borrow* and
  it is not close. React has no equivalent — the nearest thing is a 1.36 KB third-party wrapper — so the bridge
  is written by hand, and that single row is why the React guide's M1 carries two steps more than Angular's and
  its M4 one more (the `value` property accessors Angular Elements would have generated). One capability,
  incidental plumbing in one guide and the spine of the other.
  Drafting it produced three corrections to its own approved plan, all recorded rather than quietly applied:
  M1's encapsulation probe used `*`, which also matches the host element in the light DOM and so proved
  nothing about the boundary; M5's gate asked the reader to drag an alpha rail to exactly 0.5, which is one
  position on a 240-pixel track; and two step cuts could not end on a green build as proposed. It also caught
  one library README contradicting its own published manifest — the *manifest* is what was recorded.

- **`fixtures/color-picker-component-angular/` — a second fixture, on the opposite kind of gate.** An Angular
  colour picker shipped as a plain HTML custom element: 5 milestones, 23 steps, 5 verify gates, generated with
  `v1.15.0` against Angular 22 / Node 24 (stack verified online 2026-08-14). The .NET fixture was chosen because
  every gate in it is `dotnet test` with an exit code; this one was chosen because **no test runner exists in
  the guide at all**. Every gate is a person reading exact values off a static demo page served over HTTP —
  which is the harder case the contract has to survive, and the case both linked `real-examples.md` guides
  stalled on.
  Being human-gated changes what the contract has to do, and the fixture is where that shows: rule 6.2's
  masking environment is a *browser* here (a cached bundle behind an unhashed filename, an ES module blocked on
  `file://`), and every Done-when names an exact value — `#ff0000`, `rgba(51, 102, 255, 0.5)`,
  `shadowRoot` not `null` — because eyes are the only assertion in the stack.
  Drafting it also produced two corrections **to its own approved plan**, both recorded rather than quietly
  applied: the ladder needed a fifth colour conversion the build-vs-borrow table had not counted, and M2's
  original gate asked the reader to hit a midpoint half a pixel wide. A gate you cannot hit is not a gate.

- **`fixtures/idempotent-api-dotnet/` — a complete generated guide, kept in-repo as a test subject.** An idempotent
  Minimal API on .NET 10: 5 milestones, 19 steps, 5 verify gates, 38 files, generated with `v1.14.1` from a
  `plan-guide` plan. Until now the repo could only describe the canonical layout in prose and check its own
  docs; there was no finished guide in-tree to run anything against. This is that artifact — a target for
  `audit-guide`, a subject for a future deterministic guide checker, and a worked reference for seeing what a
  contract change actually does to a finished guide.
  [`fixtures/README.md`](fixtures/README.md) draws the line the repo needs here: **an example is evidence, a
  fixture is a test subject.** Guides written with the toolkit still live in their own repositories and get
  linked from `examples/real-examples.md`; this one is not offered as proof the method works. Its code
  compiles and its thirteen tests pass, but **nobody has followed it**, so every milestone sits at ⏳ and its
  own `status.md` says exactly that.
  It was generated against a deliberately chosen property: every acceptance gate is `dotnet test` with an exit
  code. Both linked examples stalled with un-ticked gates because their gates needed a human at a browser or a
  debug host, so a fixture whose gates are machine-checkable is the one that can eventually be verified
  end-to-end.

  **It earned its keep on day one.** Auditing the fixture *by reading it* returned PASS-WITH-WARNINGS;
  auditing it by **building and running it** returned a BLOCKER. An entire M1 step taught appending
  `public partial class Program { }`, on the strength of Microsoft's integration-tests article — which still
  says it is required and has not caught up with the SDK. On .NET 10 the generated class is already public
  (`typeof(Program).IsPublic` is `true`), so the step was a no-op justified by a false reason, and
  `stack.md` recorded it as a *verified fact*. The step is gone, M1 is 4 steps, and the fact is now taught as
  *why the line you have seen everywhere is not here*. The same run also showed the runner's summary is
  column-padded at variable width, so the 18 gates quoting it character-for-character could never match; they
  now assert the values. Both fixes are recorded in the fixture's own drift log, and the guide's 13 tests pass
  on a clean rebuild.

  **Then it earned its keep twice.** A third pass re-ran the gates **in a terminal** instead of through a
  captured stream, and every one of them was still wrong — in the other direction. Since .NET 9 the CLI uses
  the terminal logger whenever stdout is a terminal, which is the reader's case and never the tooling's: it
  prints `Build succeeded in 1.5s` with **no** `0 Error(s)` line, and `Test summary: total: 1, failed: 0, …`
  rather than the padded `Passed!  - Failed:     0, …`. The padded renderings the first two audits "confirmed"
  exist only when the output is piped — which is how both of those audits captured it. 24 build gates named an
  output the reader will never see, and the fix from the previous paragraph had been verified against the
  wrong environment. All 24 gates now read `Build succeeded`; M1 steps 01 and 03 show what a terminal prints
  and name the redirected variant inside the gate itself, per rule 6.2. **The lesson the fixture is teaching
  the toolkit: an audit that reads a gate's output through a pipe is running in a different environment from
  the reader, and rule 6.2 applies to the auditor as much as to the guide.**

## [1.15.0] — 2026-08-14

### Added

- **Build vs borrow — the guide offers you the library before it writes one.** A planner left alone will
  cheerfully draft a capability the ecosystem solved a decade ago, and nothing in the finished guide reveals
  that it did: the reader types 90 lines of colour conversion with no way to tell a deliberate teaching
  exercise from "this is how it's done", then ships the hand-rolled version into a real project. The gap was
  never in the drafting — it was that the choice was never *offered*.
  It is now a phase of its own. **`plan-guide` Phase 2.5** walks the approved ladder for every self-contained
  capability a mature library already covers, verifies that library to the same standard as the stack itself
  (exists, maintained, compatible with the pinned versions, official docs URL — no link, no row), and puts each
  one to you as a table row you can flip: *what borrowing costs · what building teaches · recommended · your
  call*. The recommendation follows a new **Q8 posture dial** (borrow-first / balanced / build-first, default
  balanced) through one test — **is this capability part of what the guide set out to teach?** — with two
  overrides: correctness-critical domains (colour spaces, dates/timezones, crypto, encodings, locale/text,
  money) default to **borrow** whatever the posture, and a borrow that would leave a milestone proving nothing
  defaults to **build**. Rows land in `decision-log.md` with their revisit-if, so the reasoning survives and
  `/amend-guide` can reverse one later.
  The bar is deliberate: a capability worth a dependency — a named problem, known edge cases, roughly a screen
  of code or more. A three-line helper is not a build-vs-borrow decision, and a table of twelve trivia rows
  buries the two that matter.
- **Rule 3.7 — say when you're hand-rolling something the ecosystem already solves.** The plan-time choice only
  helps if the drafted step admits which way it went, so P3 gains a rule: a step that builds a solved capability
  by hand opens with `> Build vs borrow — **<library> <version>** does this in production (<docs URL>): you're
  writing it by hand here to learn <mechanism>. Swap it in when <condition>.`, and a step that borrows says in
  one clause what the library does for the reader — so the dependency isn't a black box either. It is rule
  3.2's mandatory-vs-illustrative ambiguity applied to an *implementation choice* instead of a value.
  `draft-milestone` carries it in the writing contract and the self-audit, and — because drafting works at step
  resolution while the plan worked at ladder resolution — resolves the cases the table never listed by the same
  test, without stopping, then **reports every call it made that the plan didn't** so you can still flip one.
  `clarify-step` can add a missing callout (clarity) but must flag, not perform, an actual swap (intent).
  `audit-guide` flags a hand-rolled capability with no callout, a borrowed one never explained, and a step that
  contradicts the recorded decision — plus, in the structural pass, a `PLAN.md` carrying **no build-vs-borrow
  section at all**. That last one closes the gap the rest of the feature can't: a plan that never asked the
  question reads exactly like a plan that asked and found nothing, and only the second kind says so in a line.

### Changed

- **The two tip lists in `README.md` now name the skill behind each tip**, and gained three of them. Every
  bullet under *Tips for creating a guide* and *Tips for following a guide* ends with the skill that acts on
  it — or an explicit **Skill: none** where the tip is something only the human can do (commit at each step,
  don't hand a milestone to the AI), which is information too. The new tips: **audit the draft as soon as it
  exists** — once, taking the blockers and stopping, since `/audit-guide` hands back a list and not a rewrite
  loop; **mark a step done the moment you finish it** rather than at the end of a sitting, now stated as its
  own habit with `/mark-progress` and the `✅`-needs-an-observed-gate rule attached; and **the goal is the
  thing you're building, not a perfect guide** — past the first audit, another polishing pass buys less than
  the first hour of building, and a defect met while following the guide arrives with the context needed to
  fix it. The old *Close the loop before anyone builds* bullet split into the audit tip and a sharper
  `/review-before-follow` one.

### Fixed

- **`templates/progress.md` claimed readers the ledger doesn't have.** Its header block listed `/report-issue`
  and `/review-before-follow` as consumers of `progress.md`; neither prompt reads it. Corrected to the two that
  do: `/amend-guide` (finds the frontier) and `/audit-guide` (checks the ledger against the step files on disk).
- **The superseded banner in `amend-guide` could emit a dead link.** Its template hard-coded a same-folder
  target — `[<NN_slug>.md](<NN_slug>.md)` — but the first unexecuted step is usually in a *later* milestone
  folder, so the banner sent the reader to a correction they couldn't reach. The placeholder is now a path
  relative to the banner's own file, with the `../MILESTONE_<N>_<slug>/` case spelled out.

### Added

- **`/amend-guide` — change a guide someone is halfway through, without rewriting what they've already built.**
  The toolkit could fix a guide that was wrong (`/report-issue`) and bump a guide whose versions had moved
  (`/update-stack`), but it had nothing for the commonest reason a guide changes: **the requirements changed**.
  Handing that job to either of the existing skills gets the edit wrong, because both are free to rewrite any
  step — which is the right latitude when the step was *wrong*, and the wrong one when it was right and
  someone already followed it. Past the point where a reader has built on a step, rewriting it is worse than
  leaving it stale: they can't un-run what they ran, and instructions describing a state their project was
  never in leave them with a mismatch they have no way to diagnose.
  So the amendment is built around a boundary. It reads the frontier from the new execution ledger and
  **refuses to run without one** — a guessed frontier produces confident edits to finished work, which is the
  one outcome worse than not amending at all. It then verifies online anything the change introduces and
  **stops on an impact report**: what gets rewritten ahead of the reader, what they already built that the
  change invalidates, and the exact repair. Nothing is written until that report is approved.
  On approval the rule is asymmetric. **Ahead of the frontier:** rewrite, insert, delete, renumber, and
  regenerate every nav line — `PLAN.md` and the ladder included. **Behind it:** one edit and one only, a
  `⚠️ Superseded <date>` banner under the step's top nav line, signage that exists for the *fresh* reader who
  meets that step before they ever reach the correction. The repair itself lives ahead of the frontier, in a
  `## Before you continue — corrections` section at the top of the first step the reader hasn't opened —
  opening with the condition that makes it skippable, closing with a `**Corrected when:**` checklist rather
  than a second `Done when` that would drift against the step's own gate. Amended milestones go `⏳`, never
  `✅`, and a change of intent always earns a `decision-log.md` entry (a correction doesn't).
- **`/mark-progress` and `foundation/progress.md` — the execution ledger, at step granularity.** `status.md`
  tracks milestones, which is the wrong resolution for the question "may this step be rewritten?". The sixth
  foundation doc answers it: one row per step file, `[ ]` / `[x]` / `[~]` / `[!]`, ticked by `/mark-progress`
  as the reader works. The two files are deliberately kept apart and deliberately kept in agreement —
  `status.md` remains the authority on the **guide's** state and derives its frontier from the ledger, which
  is the authority on the **reader's**, and `/mark-progress` writes both in one run so neither moves alone. It
  marks only what the reader claimed (no ticking earlier steps on the assumption they must be done) and gives
  a milestone `✅` only when its `NN_verify.md` gate was actually observed.
  `scaffold-guide` stamps the ledger, `draft-milestone` fills in its step rows as it writes the files,
  `audit-guide` checks it against what's on disk — and flags a `✅` milestone whose rows aren't all `[x]` as a
  BLOCKER, since that pair of files disagreeing means one of them is telling the reader a gate passed that
  nothing records passing. A guide scaffolded before the ledger existed gets one built from its own step files
  on first use.

## [1.14.1] — 2026-08-14

### Added

- **The consistency gate now checks the sync set in both directions.** `check-consistency.mjs` already proved
  that every rule id *cited* anywhere resolves to a real heading in `reference/pedagogy-rules.md`; it now also
  proves the reverse — that each mirror claiming to state the **whole** contract (the `plan-guide`,
  `draft-milestone`, `clarify-step` and `audit-guide` prompts, plus `EXPLAINER.md`) mentions **every** canonical
  rule. That is the failure the sync set actually produces: a rule added or re-homed in the canonical file and
  missed in one standalone paste-twin, which passes every other check while quietly teaching an older contract.
  `README.md` and `templates/` cite rules selectively by design and are deliberately outside the set.
- **Dead `#anchors` are a build failure, same as dead links.** The link check resolves fragments against the
  target file's real headings using GitHub's slug rules (each space becomes a hyphen, so
  *"Credits & inspiration"* is `#credits--inspiration`), for same-page and cross-file links alike, with the
  same guide-internal and `<placeholder>` exemptions. This is the discipline the guide contract already
  demands of a generated guide's `../glossary.md#slug` links — a term written as a bullet has no anchor and the
  link fails silently — and the repo's own 43 anchor links were never verified. They all pass; the check keeps
  it that way.

- **`examples/real-examples.md` now separates the guides someone finished from the guides that only exist.**
  Two sections — **Followed to the end** and **Guide only — not followed to the end yet** — because the states
  prove different things: a guide someone built start to finish is evidence the *teaching* worked, while a
  drafted-and-audited guide is evidence only that the *contract* was satisfied. The index previously implied
  the stronger claim for everything in it. `guide-forge-vscode-extension` (Van Code, `v1.2.0`, 7 milestones /
  43 steps, built as far as M5) joins under the second heading — the guide that produced rules 4.4 and 6.2 and
  the sourcing principle's exact-name clause by being run for real.

### Fixed

- **`audit-guide` never cited rule 6.1.** Its *"gate exercises its claim"* check carried the rule's whole
  substance but not its id, so the audit couldn't report the violation by number the way it does for every
  other rule — and the new coverage check flags it. Found by the check on its first run.

### Changed

- **The stated wrap convention now matches the practised one.** `CLAUDE.md` claimed ~100 columns; every file in
  the repo is actually wrapped at ~110, so the number contributors were given disagreed with every file they
  would open. Nav lines, table rows and code fences are called out as single lines by nature. No prose was
  reflowed — the convention was wrong, not the files.
- **The platformer example's step count was wrong.** `README.md` and the index said "~42 steps"; the guide has
  **25** step files plus 7 verify gates across 7 milestones. Corrected in both places.

## [1.14.0] — 2026-08-14

### Added

- **A guide can be written in any language — decided once, in the plan.** `plan-guide` Phase 0 Q7 becomes
  *"Format, size & writing language"*: it proposes the language you're talking in and lets you name another
  (non-interactive mode defaults to the language of the brief and says so). The answer is recorded in
  `foundation/conventions.md` § **Writing language** — a new template section `scaffold-guide` never leaves
  empty — because that file is the only thing a later skill can read it from: `draft-milestone`,
  `clarify-step`, `report-issue`, `update-stack`, `review-before-follow` and `log-feedback` each run in a
  fresh session, so a language agreed only in conversation is a language the next skill silently drops back
  to English from. Each of those prompts now reads the section and writes its prose in it; missing section →
  English. `modernize-guide` asks the same question, defaulting to the source document's language.
- **The skeleton stays English in every guide — new `reference/canonical-layout.md` § Writing language.**
  Only prose is translated. File and folder names, the template section headings (`## Do this`,
  `## Done when (this step)`, …), the nav-line vocabulary (`Nav`, `Overview`, `prev:`/`next:`/`start:`),
  `stack.md`/`status.md` column keys, code, commands, identifiers, paths and doc URLs are matched literally by
  the pipeline and by the audit, so translating one buys cosmetics and breaks the contract every other skill
  depends on. `audit-guide` gains the matching check: prose in another language is not a defect, prose that
  drifts *between* languages inside one guide is — as is any translated heading, nav label or file name.
  `draft-milestone`'s self-audit checks the same thing before handing off.

## [1.13.2] — 2026-08-14

### Added

- **README — "Built something with GuideForge?"** The repo asked for real examples in `CONTRIBUTING.md` and in
  `examples/real-examples.md`, both of which a reader reaches only after deciding to contribute; the README
  itself never said what to do with a finished guide. The new section says attribution is **not** required
  (MIT, and the guide is theirs), gives a one-line credit to copy for anyone who wants it, explains why naming
  the **version** is the part that matters — the layout moves between releases, so it dates the shape of the
  method — and points at the PR that lists a guide in `examples/real-examples.md`, linked from its own repo
  rather than vendored here.

## [1.13.1] — 2026-08-14

### Removed

- **`check-version.mjs` no longer asserts that a released version is tagged.** The arm couldn't work where it
  ran: CI fires on push to `main`, and the tag can only exist once the release commit it points at does — so
  the one job that ever saw a release commit saw it before its tag, and failed a build that was fine. It
  caught no defect it could act on and cost a red run per release. The remaining three checks (plugin.json /
  README badge / top released `CHANGELOG.md` header agree) are untouched. Keeping the tag in step is now
  documented rather than enforced: `git push origin main v<x.y.z>` in one operation, per `CONTRIBUTING.md`.
  `.github/workflows/ci.yml` drops `fetch-depth: 0` with it — it existed only to fetch the tags this arm read.

## [1.13.0] — 2026-08-14

### Changed

- **A term is defined once per step: the body teaches, the step's Glossary block indexes (new rule 1.1b).**
  `## Glossary for this step` and the `New concept —` callout had grown into two lists of the same terms —
  one guide defined `.meta` and GUID three times on a single page (block bullets, *Why / design* prose, then
  the callout) before the reader performed any action, across 48 callouts in 41 files. Both devices were
  individually well-written; they were doing the same job. The block now carries only the
  `../glossary.md#slug` deep-link plus *where on the page* the term is taught, and the definition lives once,
  in the body, at the point the reader meets it — **explained once, findable twice**. `audit-guide` flags both
  a term defined in both places and the mirror defect (a term indexed in the block that the body never
  defines); `draft-milestone` self-audits for it; `clarify-step` cuts the block's copy when it finds one.
  Synced across `reference/pedagogy-rules.md`, `templates/step.md`, `plan-guide`, `draft-milestone` (writing
  contract *and* self-audit), `clarify-step`, `audit-guide`, and EXPLAINER §7–§8.
- **The milestone-overview nav line is literal text again, not one giant placeholder.**
  `templates/milestone-overview.md` wrapped its whole nav line in `<…>` — angle brackets around the entire
  line plus a stray trailing `>` — so a copy-paste produced `> <Phase/Section · milestone K of N · … )>`
  instead of a nav line. It now matches `reference/canonical-layout.md` character for character
  (`../MILESTONE_<n-1>_<slug>/00_overview.md`, one `<placeholder>` per slot), at both top and bottom. The
  dead-link check couldn't catch it: it skips any target containing `<`.

- **The copyright holder and plugin author are now "GuideForge", not a personal name.** Same MIT terms, same
  repository URL — only the named holder changes, in `LICENSE`, the README license footer, and
  `.claude-plugin/plugin.json` (`author`). `.claude-plugin/marketplace.json` (`owner`) goes to the GitHub
  handle `tomthebearded` instead: that field names who *publishes* the marketplace, not who holds the
  copyright, and the handle now matches the URL the field already carried.

### Added

- **Five more "Tips for following a guide" in the README, addressed to the reader rather than the author.**
  The section covered how to *read* a guide but said nothing about the machinery the contract already builds
  for the reader's benefit. Now it does: install the exact versions pinned in `foundation/stack.md` (not
  `latest`); read the milestone's `00_overview.md` before its steps, and each step end-to-end before typing,
  since rule 4.2 interleaves code under the instructions; **commit at every step boundary, named after the
  milestone and step** — rule 4.4 guarantees each one ends on a green build, so every boundary is a restore
  point and `git diff` isolates exactly what a step changed; and don't skip the `NN_verify.md` checkpoint,
  which holds both the hand-checked milestone gate and the only complete copy of every file touched.

- **`.gitattributes` pins the repo to LF, in the index *and* the working tree.** The index was already
  all-LF, but a clone with `core.autocrlf=true` checked the tree out as CRLF — and `scripts/release.mjs`
  rewrites `README.md` with `lines.join('\n')`, so the next release turned a one-token version bump into a
  ~500-line whole-file diff. Markdown is the product here; its bytes are now identical on every platform.
  No content change: `* text=auto eol=lf` is a zero-diff normalisation against the existing index.

## [1.12.0] — 2026-08-12

### Changed

- **The milestone overview is a map again, not a lesson.** `00_overview.md` keeps Goal · Prerequisite · Steps
  at a glance · Design/decisions folded in (now an *index* — concept → the step that teaches it — not prose),
  and is targeted at one screen. Overviews had grown into full explanations of material the reader then met
  again, step by step, with the code in front of them: the first pass taught nothing (nothing to apply it to)
  and the second was a re-read. Explanation belongs where the work is. Synced across
  `templates/milestone-overview.md`, `reference/canonical-layout.md`, `plan-guide` Phase 3, `draft-milestone`
  (what-to-produce, writing contract, self-audit), `scaffold-guide` (the placeholder overview), `audit-guide`
  (a new WARNING for an overview that teaches), README and EXPLAINER §8.
- **One gate, one file: the Done-when gate lives only in `NN_verify.md`.** The overview's aggregated copy is
  gone — the same checklist maintained in two files is a checklist that drifts in one of them, and the reader
  needs it where they verify, not where they plan. `audit-guide` flags a gate on the overview as a **BLOCKER**;
  `scaffold-guide` no longer seeds one into the placeholder.
- **The handoff moved to the end of `NN_verify.md`, and is three lines.** Cumulative "You now have" · what's
  open or deferred · the next milestone and what it proves. It used to open the milestone as a five-subsection
  block on the overview — a recap written *before* the work, read *after* it by nobody. Now the reader reaches
  it having just watched the gate pass, so it points forward instead of re-telling. It stays **cumulative**:
  it's still the state each milestone is drafted from, and `draft-milestone` still carries it forward through
  the whole-guide pass.
- **`foundation/status.md` carries two provenance stamps.** `Generated with GuideForge v<x.y.z>` (set once at
  scaffold, never moved) is joined by `Last updated with GuideForge v<x.y.z> on <date>`, rewritten by every
  skill run that changes the guide — `draft-milestone`, `clarify-step`, `report-issue`, `update-stack`,
  `review-before-follow`. One line says which revision of the method built the guide; the gap between the two
  says how far the method has moved since anyone touched it, which is when re-running the maintenance skills
  pays off. `audit-guide` flags a missing or stale `Last updated`.

### Removed

- **"Scope discipline" as a section of the guide.** A milestone no longer publishes what it deliberately does
  *not* do. The reader is there for what they build; a standing list of absences teaches nothing and reads as
  apology. The **boundary itself is unchanged** — it was never really a reader-facing feature: it lives in the
  ladder and is enforced at drafting time by the renamed **milestone-boundary gate** (`draft-milestone`), which
  now keys off the approved plan's milestone ownership instead of a line in the overview, and by `audit-guide`'s
  "milestone boundary honored" check. The consume-it-now test and the `[Mn]` deferral marker are untouched.
  Where a deferral would genuinely confuse the reader — a hard-coded value a later rung generalizes, a shortcut
  they'd otherwise read as a mistake — it is now **one inline sentence in the step it applies to** ("the key is
  hard-coded here; M4 moves it into config"), never a section, and never a sentence whose only content is an
  absence.
- **README — "On the free plan".** The section and the two cross-references to it (`examples/README.md`,
  `examples/pipeline-prompts.md`) are gone.

## [1.11.0] — 2026-08-10

### Added

- **Pedagogy contract — "verify a capability on the exact name, never on its family"** (sourcing principle in
  `reference/pedagogy-rules.md`, with the sync-set restatements in `plan-guide` Phase 0.5, `draft-milestone`
  writing contract + self-audit checklist, `audit-guide` pedagogy checks, `review-before-follow` check 5,
  `report-issue` root-cause list, and a flag-don't-fix carve-out in `clarify-step`). When docs grant a
  behaviour to a *class* of names ("all `editor.*` settings", "any hook", "every `/v2` endpoint"), carrying it
  to a specific member without checking that member is an inference dressed as a citation — platforms declare
  capabilities per item and docs prose generalizes. The tell is a `because`/`since` clause whose subject is a
  wildcard family. `audit-guide` raises it as a WARNING, or a **BLOCKER** when code or a gate depends on the
  capability. **Origin:** a generated guide taught VS Code's `"[languageId]"` override for
  `editor.tokenColorCustomizations` *because it is an `editor.\*` setting*; the override requires the
  per-setting `language-overridable` scope, which that setting lacks, so the write threw
  `CodeExpectedError: … is not a resource language setting` and the milestone's whole per-language feature was
  unbuildable. This is the first rule aimed at a claim that is **sourced but still wrong**, rather than one
  written from memory.

- **`examples/` — worked invocations of every skill, plus the moved output index.** The folder now holds two
  distinct kinds of example, stated as such in its `README.md`: **input** —
  `plan-guide-prompts.md` (eight briefs for the generation skill, in two shapes: **two fully-specified**
  multi-line briefs for an author who already knows every answer — a Flutter app on a deadline, and a data
  pipeline written for someone *else* to own — then six one-liners that let the interview draw the answers
  out: greenfield service · total beginner · onboarding against an existing codebase · library with expert
  language and unfamiliar domain · lite mode · non-interactive), `pipeline-prompts.md` (scaffold → draft, whole-guide and single-milestone, plus the
  free-plan re-feed packet → clarify → review-before-follow), and `maintenance-prompts.md` (audit ·
  update-stack · modernize · report-issue vs log-feedback · pre-pr-check) — and **output**,
  `real-examples.md`. Each prompt example carries the attachments and the interview answers that shaped it,
  labelled as one filled-in brief rather than a default.
- **`EXAMPLES.md` moved to `examples/real-examples.md`.** Content unchanged; it stops being a root doc and
  joins the folder it indexes. Updated in the README nav, repo map and "See one for real" note,
  `CONTRIBUTING.md`'s worked-example route, and EXPLAINER §5 — where the `Root` table row is replaced by an
  `examples/` section drawing the input/output distinction. Guides are still linked, never vendored.
- **`check-consistency.mjs` scans `examples/`.** Added to `DOC_DIRS` (and `EXAMPLES.md` dropped from
  `ROOT_DOCS`), so the new folder's relative links are dead-link checked like every other doc directory —
  44 markdown files now, up from 40.
- **README — "On the free plan".** Spells out the path for readers without Claude Code: Option A already *is*
  the full toolkit, so what changes is room, not capability. Covers saving every emitted block to disk
  yourself, one prompt file per conversation, opening each new conversation with a re-feed packet
  (`PLAN.md` + `conventions.md` + the previous handoff), and the one place the free plan inverts the standard
  advice — draft milestone by milestone, then buy back the lost cross-milestone checks with an `audit-guide`
  pass and a manual forward-reference read of the ladder. Plus: reach for lite mode early, spend messages on
  the interview and the ladder review, cut scope rather than the contract.

- **README — "Tips for creating a guide".** The counterpart to "Tips for following a guide", covering the two
  places an author's judgement actually decides the outcome: **getting the brief right** (describe the build
  not the document, attach context rather than paraphrase it, rate expertise per topic, pin every version,
  name the non-goals, answer the advise-back gate deliberately) and **dividing the work** (cut vertical slices
  not horizontal layers, read the ladder table against four mechanical checks before approving, keep
  step/sitting/milestone distinct, build capability in the milestone that consumes it, scaffold then re-draft
  narrowly, scale down with lite mode, audit before anyone builds). Existing "Best practices" stays as the
  short do/don't list.

## [1.10.0] — 2026-08-10

### Changed

- **Every arbitrary constant in the toolkit was re-decided by the maintainer or removed.** A sweep looked for
  values the docs asserted without deriving them — numbers a reader would have to take on faith, and an
  authorship placeholder. Each was put to a decision rather than left standing:
  - **The "2–4 headline decisions" cap is gone** (`templates/readme.md`, `plan-guide`, `scaffold-guide`). The
    guide README now asks for "the headline decisions — the ones a reader must know before starting". A bound
    nothing derives is a bound that drifts between the three places it was written.
  - **Lite mode no longer carries numbers.** "A single doc under ~2 hours" becomes "one document, one
    sitting"; "collapse to 2–3 milestones" becomes "collapse to the fewest rungs that each still prove
    something runnable". The trigger and the ladder size were invented thresholds; the properties they were
    proxies for are the real rule.
  - **The README's time estimates are gone** — the "(15 minutes)" in the Quick start heading (and its TOC
    anchor) and the learning path's `Time` column. None had ever been measured against a real reader.
  - **`/audit-guide` has one severity scale, defined once: BLOCKER or WARNING.** It previously asked for a
    `severity` column while using `MAJOR`, `BLOCKER`, `WARNING` and `suspect` ad hoc and never saying what any
    of them meant. BLOCKER now means the reader is *stopped* (or proceeds on a false signal), WARNING means
    the reader is *worse off*; the verdict follows mechanically from the two counts. Findings that can't be
    settled from the guide alone — a gate the debug host may override, a manifest the reader's schema may
    reject — keep their real severity and are marked **unconfirmed**, which was `suspect`'s actual job.
    `feedback-log.md` keeps its finer reader-facing scale (`blocker`/`slowed-down`/`confusing`/`cosmetic`) and
    now states how it maps onto the audit's two.
  - **The contract is no longer advertised as "the 7 principles".** The principles are cited by id (`P1`…,
    rules `N.N`) everywhere; the count was an editorial artefact of the 14→7 regrouping and had to be kept in
    sync across a dozen files by a CI check. The prose says "the pedagogy principles", and
    `check-consistency.mjs` drops the `principle-count` check — the `rule-id` check that actually matters
    (every cited id resolves to a real heading) is untouched.
  - **`check-consistency.mjs` parses number-words 1–99, not nine-to-twenty.** The old window meant a repo
    outside it silently stopped having its stated skill count verified.
  - **Authorship is real.** `plugin.json`, `marketplace.json`, `LICENSE` and the README's copyright line named
    "GuideForge" / "GuideForge contributors" as author; they now name Tommaso Mastroberardino.

- **The conventions that stay are marked as ratified, not accidental.** `reference/canonical-layout.md` says
  outright that nothing forces `00_overview.md` over `overview.md` or `·` over `|` — the names were chosen and
  fixed, and the value is that they're fixed. The rule-4.2 trigger ("2+ distinct parts") keeps its number and
  now states why two: with a second block the reader starts guessing which instruction owns which code.
- **Invented examples are labelled as invented.** The three reference docs open with a standing note that the
  concrete values below show the *shape* of a good answer and are not recommended values — each note naming
  only what that file actually uses (the bookstore ladder's ports and routes; the topics and reader profiles;
  the jump heights and identifiers) — and the bookstore gate/ladder and the Unity reader profile say so inline.

- **A second sweep, over the files the first one hadn't read.** It found the same class of defect again, plus
  three stale claims the first sweep itself created:
  - **"The five pillars" no longer carries a count, and the pillars are cited by name.** Same case as the
    principles, and worse: `pillar 1`/`pillar 2`/`pillar 5` were used as cross-references from
    `audience-model.md`, `milestone-design.md`, `templates/status.md` and `EXPLAINER.md`, with nothing
    verifying they resolved — renumbering one would have made four files quietly wrong. They now read "the
    *model the reader first* pillar", "the *vertical slices* pillar", "the *truth lives in one place* pillar".
  - **CI runs the Node version the docs promise.** `ci.yml` pinned `node-version: '22'` while `CONTRIBUTING.md`
    told contributors "Node 18+", so the stated floor was never actually exercised. CI now runs `18`, with a
    note to move both together.
  - **`doctor.mjs` prints every differing file.** It capped the list at 40 (with an "… and N more" tail); the
    output is read once before a reinstall, so a cutoff only means running it again.
  - **The `SCAFFOLD — not yet drafted` banner and the `New concept —` callout lost their emoji.** Both are
    fixed strings the contract and `audit-guide` match on; plain text renders identically everywhere, and
    rule 1.1 had already called its emoji optional.
  - **Two undefended style rules relaxed.** `templates/glossary.md` demanded definitions of exactly ONE
    sentence and alphabetical ordering; it now asks for definitions as short as the term allows and notes
    alphabetical as the usual, not required, order. `CONTRIBUTING.md` drops "~100 cols" for "wrapped so diffs
    stay readable — match the file you're editing", which is what the repo actually does.

### Fixed

- **Three docs described a CI check that had just been deleted.** Removing the principle-count check left
  `reference/pedagogy-rules.md` claiming `check-consistency.mjs` "verifies the stated principle count (seven)",
  `skills/pre-pr-check/SKILL.md` telling contributors the script backstops a rule count, and the rules file
  still saying "all seven belong in every finished step". All three now describe the **rule-id integrity**
  check that does exist — every cited `rule N.N` resolves, every rule homed under a real `## P#` — and state
  that nothing counts principles, by design.

## [1.9.1] — 2026-08-09

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

- **`CONTRIBUTING.md` — "Which number moves — MAJOR, MINOR or PATCH".** The repo cut seven releases without a
  written rule for which digit moves, and semver's usual "breaking change" phrasing doesn't map onto a
  toolkit whose output is *other people's documents*. So the public surface is named explicitly (slash-command
  names, each `prompt.md` contract, the canonical layout, the pedagogy **rule ids**, template structures,
  plugin identity) and each level is defined against it: renumbering a rule id is MAJOR because ids are cited
  in generated guides' decision logs; appending a new rule under an existing principle is MINOR; repo tooling
  and wording are PATCH. Plus the two tie-breakers — effort is not a version, reach is not size.

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
