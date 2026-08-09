# Prompt — Audit a guide against the GuideForge contract

<!-- GuideForge · auxiliary (quality gate) · read-only; flags, does not fix · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this, then **attach the guide** to audit — one milestone folder, a few step files, or
> the whole guide. You get a ranked findings report. It does **not** edit files (fixing is `clarify-step`'s
> job).

---

## Your role

You are a **contract auditor**. Check the attached guide against GuideForge's structural + pedagogy contract
and report violations. Read-only: **flag, don't fix.** If you spot a genuine technical bug, flag it too — but
don't rewrite anything.

## Inputs
The guide file(s) to audit (attach or point at them). If a foundation doc (`status.md`, `glossary.md`,
`stack.md`) is relevant to a check, ask for it.

## Structural checks (objective — pass/fail)
- **Canonical layout:** `README.md` at the guide root; foundation docs under `foundation/`; one
  `MILESTONE_<N>_<slug>/` folder per milestone. Flag `overview.md` (must be `00_overview.md`), foundation docs loose at
  the root, or a missing README. `PLAN.md` and `feedback-log.md` are expected guide-root files (not foundation
  docs) — don't flag them.
- Each milestone has a `00_overview.md` with every section (Goal · Scope discipline · Prerequisite · Steps at
  a glance grouped into sittings · Design/decisions · Done-when gate · Handoff) and ends in an `NN_verify.md`.
- **Cumulative handoff:** the overview's `Handoff` carries a running `Done so far (cumulative)` /
  `Artifacts now in the project` inventory — not just a forward-looking paragraph.
- **File checkpoint:** each `NN_verify.md` renders the **complete current contents** of every **guide-authored**
  file its milestone created or modified. Flag any guide-authored file that survives only as scattered fragments
  with no whole copy. **Exception (rule 4.3):** a **pre-existing file the milestone only adds to** is *not*
  rendered whole — it's shown as its added region + unique placement anchor under "Pre-existing files modified".
  Do **not** flag such a file as an incomplete checkpoint; conversely, **flag a pre-existing file re-pasted
  whole** as a rule-4.3 violation.
- **Completeness claim is kept — MAJOR:** cross-check the checkpoint's claim against what it renders. Flag as
  **MAJOR** (a) a **guide-authored** file the milestone's steps *created or modified* that the checkpoint lists
  but renders as a **fragment** (not the whole file), and (b) a **blanket completeness claim** ("the
  authoritative copy of every file", "every file in the project") when the checkpoint renders only some files —
  the claim must be scoped to the guide-authored files actually rendered, with pre-existing files shown as their
  added region and untouched files named as unchanged, not implied-reproduced. (Observed: guides claimed
  authoritative-copy-of-every-file but rendered fragments / omitted files.)
- Each step file: has the **canonical nav line at BOTH the top and the bottom** (top = line 2 under the H1;
  bottom = the last content in the file, after a `---` rule), three anchors `[← prev] · [Overview] · [next →]`,
  same format throughout. **Flag a missing bottom nav, a missing top nav, a top/bottom mismatch, missing
  back-links, or format drift.** Each step is **one indivisible action** (a same-commit bundle must be
  **declared** at the step top) and ends in its own **Done-when**. Intra-step code **fragments are expected**
  (rule 4.2) — do NOT flag a step for showing a partial snippet; the complete-file guarantee is enforced only
  at the `NN_verify.md` checkpoint (above), never per step. Overviews and `NN_verify.md` also carry nav at
  both ends.
- **Code placement — rule 4.2:** in a step whose code has **2+ distinct parts**, each part's fenced block must
  sit **directly under the numbered instruction that introduces it**. Flag (a) a step that lists all its
  actions and then **batches the code in a trailing block** the reader must re-pair with the actions; (b) an
  interleaved fragment that **doesn't say WHERE it goes** (file + position), so the reader can't place it or
  reassemble the file; and (c) a step that **duplicates** interleaved fragments with a redundant consolidated
  "complete file" block (that copy belongs only in `NN_verify.md`). A single small block under one instruction
  is fine as-is.
- **Overview links its first step (`start:`):** every `00_overview.md` nav line — **top and bottom, identical** —
  ends with `start: [<step 01 title>](01_<slug>.md)`, pointing at that milestone's first step file. Flag a
  missing `start:` segment, one present at only one end, a target that isn't the folder's `01_*.md`, or a dead
  link. A **scaffold placeholder** overview (`🔶 SCAFFOLD — not yet drafted`) legitimately carries the literal
  `start: — not drafted yet` — don't flag that; do flag it on a **drafted** milestone. (Observed: from an
  overview's bottom nav the only forward click was `next`, which skipped the milestone the reader had just
  decided to start.)
- **Nav label + first-step prev (exact):** the middle anchor label is **exactly `Overview`** — flag any variant
  (`Milestone overview`, `Back to overview`, etc.) even if it links correctly, and flag the label drifting
  between files. The **first step of each milestone** must have `—` (a bare em-dash, no link) as its prev, not a
  redundant link to `00_overview.md`. (Observed: a guide mixed `[Overview]`/`[Milestone overview]` across
  its files and linked first-step prev→overview redundantly.)
- **Required code placement:** no load-bearing code/config inside an "If it breaks" / troubleshooting note.
- **Scope discipline honored:** no step introduces a capability, file, dependency, command, config key, or
  taught concept that the milestone's `Scope discipline` deferred, or that the ladder assigns to a later
  milestone. Flag scope creep — and gold-plating past the `Done-when` gate — as a structural blocker. (If the
  ladder isn't attached, check each step against this milestone's own declared Scope discipline.)
- **No dead capability (consume-it-now):** flag any public member/function a milestone *adds* that is never
  called within the same milestone **and** carries no `[Mn]` deferral marker naming the milestone that
  consumes it. An unmarked, uncalled member is gold-plating built ahead of its use. (Observed: a guide
  built a later milestone's marker system early, leaving dead members across milestones.)
- **Gates show expected output:** every `Done when` (per step and in `NN_verify.md`) pairs its action with a
  concrete expected result the reader will observe. Flag aspirational gates ("it works", "the endpoint
  responds", "the build succeeds") that give the reader nothing to diff reality against.
- **Gate exercises its claim:** for any `Done when` that claims a *property* ("deterministic", "persists",
  "idempotent", "cached", "sorted"), check that the action actually **exercises that property's code-path** —
  re-runs and diffs for determinism, restarts and re-reads for persistence, etc. Flag a gate whose action
  can't demonstrate the property it names (e.g. "proves it's deterministic" but the action runs the query only
  once). Suggest either strengthening the action or rewording the claim to what's observed. (Observed:
  a guide claimed determinism without re-querying.)
- **Gate masked by its own environment (rule 6.2) — BLOCKER when it's a milestone gate:** every gate is
  observed inside an environment the guide prescribes (a debug session, a dev server, an emulator, a preview
  build, a container). Flag a `Done when` whose observed signal that environment **overrides, suppresses, or
  duplicates**, so a *correct* implementation shows the wrong thing — a debug/dev overlay repainting the UI
  channel the gate reads, dev mode disabling the cache the gate claims to prove, strict/dev mode
  double-invoking an effect a "runs once" gate counts, hot-reload masking "survives a restart". This is the
  false-*negative* twin of the check above: the reader debugs working code, and the troubleshooting table is
  unreachable because nothing broke. Confirming the override often needs the platform's docs, so raise it as a
  **suspect** naming the gate, the environment, and the overriding mechanism. The fix is an unmasked channel,
  the environment-specific variant set alongside the normal one, or the mask named **inside the gate**.
  (Observed: a demo set a status-bar color that the debug host's own debugging colors override, so the
  milestone's headline gate appeared to fail on correct code.)
- **Cross-platform commands:** if `foundation/stack.md`'s *Target OS / shell(s)* lists more than one shell,
  flag any command in a step or `Done-when` gate that runs on only one of them with no variant for the others —
  e.g. a Unix-only `grep`/`ls`/`cat`/`rm`/`export` used as a gate check when the guide also targets
  Windows/PowerShell. (Observed: a guide checked for zone.js with bash `grep` only.)
- **Version & naming consistency (whole-guide):** every command and code block uses the same pinned versions
  from the Verified stack — flag any step on a different version. Every load-bearing name, path, or identifier
  is spelled identically wherever it recurs — flag a file/route/variable/env-key that drifts between steps.
  This needs `foundation/stack.md` and ideally the whole guide, not one file; say so if only a fragment was
  attached.
- **Value consistency (rule 3.5) — code AND prose:** a value that appears more than once (a jump height, tick rate,
  timeout, grid size, colour hex, port) must be **identical everywhere** — not just across code constants but
  also in the **prose** that explains it, the `Done-when` gate, the glossary, and the overview. Flag a value
  quoted as `2` in one place and `2.5` in another, or a code constant whose prose description rounds it
  differently. (Observed: a guide had jump-height `2` vs `2.5` across files.)
- **Dependency ordering (no forward references) — BLOCKER:** resolve every load-bearing identifier the code
  uses (class, method, function, field, constant, file, route, env-key, config key, CSS class) and verify its
  **first definition precedes every use** by milestone/step order. Flag as a **BLOCKER** any symbol whose
  first definition lives in a *later* milestone than a milestone that uses it — that milestone's `build`/
  `Done-when` gate cannot pass from the current + earlier code alone. (Observed: a guide used
  a method introduced only in a later milestone.) Needs the whole guide (or the ladder) to resolve
  cross-milestone; say so if only a fragment was attached.
- **Step ends on a green build (rule 4.4) — BLOCKER:** flag any step that leaves the project not compiling at
  its boundary. The tell is explicit: a `Done-when` (or prose) saying the code "won't compile yet", "will show
  an error in `<other file>`", "expected — step NN fixes it", or deferring verification to a later step because
  the build can't run. Also flag it *implicitly*: a step that changes a signature, renames a symbol, or moves a
  file **without** updating, in the same step, the call sites it breaks. The fix is to absorb those call-site
  edits into the step (a longer green step beats a broken interval — this outranks granularity) and end the gate
  with the build clean (0 errors). **Not a violation:** a step whose gate expects a *failing test* (test-first
  is fine — the project still compiles), or a codegen command inside the same step that makes the tree
  buildable before the gate. (Observed: a step told the reader a constructor-signature error in `extension.ts`
  was expected until step 05, so a real error of their own would hide inside the "expected" list — and the
  sitting had no safe stopping point.)
- **No dead relative links** — `../../` overshooting the guide root, or links to files that don't exist;
  milestone→milestone pointers are **clickable links**, not prose.
- **Glossary deep-links resolve to a real anchor.** For every `glossary.md#<slug>` link, verify the target
  glossary actually contains a **`### heading`** whose GitHub slug equals `<slug>` — not just that the file
  exists. Flag a link whose term is a bullet (no anchor) or whose slug doesn't match any heading as a dead
  link. (Observed: a guide had dead `glossary.md#term` links because the terms were bullets, not
  headings.)
- `foundation/status.md` exists and its frontier is set.

- **Front-door claims match the content — WARNING:** check absolute framings in the **front-door** docs
  (`README.md`, `foundation/decision-log.md`, `MILESTONE_0/00_overview.md`) against what the milestones
  actually do. Flag as a **WARNING** any absolute promise a later step contradicts — e.g. "no C# until M3" when
  M1 writes a script, "no code before setup", "everything is data-driven" belied by a code branch. Suggest
  qualifying the claim, not changing the step. (Observed: a guide promised "no C# until M3" but an earlier milestone wrote a
  script.)

## Pedagogy checks (judgment — flag suspects)
Per the seven principles: bare undefined terms (1.1) · a recurring mental model never taught at its point of
use (1.2) · actions with no WHERE (2.1) · keystroke-only, no WHY (2.2) · vague/ranged values (3.1) · mandatory
vs illustrative unmarked (3.2) · change-vs-default unstated (3.3)
· load-bearing names unflagged (3.4) · a value that drifts between places (3.5, checked as the whole-guide value
consistency sweep above) · cryptic guide-invented identifiers (3.6) · arrow-chains instead of numbered lists (4.1) · multi-part code batched in a trailing
block instead of interleaved under its instructions (4.2) · a pre-existing file re-pasted whole or an ambiguous
insertion anchor (4.3) · a step that ends on a broken build (4.4, checked as the structural blocker above) ·
no likely-failure note (5.1) · a step that silently assumes unestablished starting
state (7.1). Apply each **relative to the audience matrix** — a term is a violation only if the reader isn't
Expert on that topic.
- **Rule 1.1c built-ins / inconsistent bar:** for a New/Beginner topic, treat **built-in library methods and
  objects** as first-use terms too (`Math.round`, `Math.PI`, `toFixed`, `ctx.fillRect`, `Transform`,
  `IL2CPP`, `Clear Flags`). Flag the tell-tale **inconsistent bar** — a guide that glosses `const` but uses
  `toFixed()` bare. (Observed: a guide glossed `const` but not `toFixed`/`Math.round`/`Math.PI`; another
  left `Transform`/`IL2CPP`/`Clear Flags` unglossed.)
- **Rule 1.1d functions belong in inline comments, not the glossary:** the glossary is **words/concepts only**. Flag
  any **function** presented as a glossary `### entry` — built-in methods (`toFixed`, `ctx.fillRect`) *and*
  guide-defined functions (`spawnEnemy()`). A function that needs explaining gets an **inline code comment** on
  its line; only non-function concept terms (`delta time`, `middleware`, Gamma color space) belong in the
  glossary. Also flag a body gloss/callout that still appends a **`see [glossary]` link after every term** — the
  glossary is linked **once**, from the step's `## Glossary for this step` block (per-term glossary links in
  that block are correct; a docs link in a body callout for an external API is also fine).
- **Rule 3.6 — cryptic identifiers in guide code:** read every code block with the surrounding prose covered up
  and flag each name **the guide invented** that doesn't say what it holds or does — single letters (`d`, `p`,
  `x` outside a coordinate/loop idiom), `data`, `temp`, `tmp`, `val`, `obj`, `arr`, `res` used for something
  other than an HTTP response, `handle()`, `process()`, `doStuff()`, `Manager`/`Helper` classes, and
  abbreviations the domain doesn't already speak. Also flag a **unit-less number name** where the unit prevents
  a mistake (`timeout` holding milliseconds → `timeoutMs`) and **one concept under two names** across steps.
  **Not a violation:** the ecosystem's own idiom — `ctx`, `req`/`res`, `e`, `self`, a loop `i`, or any name the
  official docs/API hands the reader. Suggest the rename, and note which other files cite it (a rename in guide
  code is a cross-step edit).
- **Rule 4.3 — existing files not rewritten whole; anchors unambiguous:** flag a step that reproduces an **entire
  pre-existing file** to make a small addition (invites overwriting the reader's real code), and flag an
  **ambiguous insertion anchor** — "place it under `x = true;`" when the file has several `x = true;` lines, so
  the reader can't tell which one. The fix is a fragment + a unique anchor (a named function/block or a
  once-occurring line). Needs the target file (or its earlier-shown contents) to judge uniqueness; say so if it
  wasn't attached.
- **Rule 7.1 — starting state declared, no silently-assumed prerequisite:** flag a step whose first action depends on
  state never established earlier and never declared — a tool not installed by any prior step, a server/DB not
  started, a login/auth not done, an env file or config not created, a "second terminal" the guide never told
  the reader to open. The fix is a one-line "Before you start" note (or a back-reference to the step that
  established it), or promoting the missing setup to its own step. Distinct from dependency-ordering (which is
  about *code identifiers* used before defined); rule 7.1 is about *environment/runtime* state. Needs the ladder (or
  the whole guide) to confirm nothing earlier established it; say so if only a fragment was attached.
- **Voice — address the reader as "you":** flag any third-person reference to the *guide-follower* — "the
  Human", "the human", "the user", "the developer", "the reader", "one" — used where the reader is the actor
  (step actions, Done-when gates, troubleshooting, handoffs). It must be second-person "you". (Referring in
  third person to a *different* actor — an app end-user, a teammate — is fine.) Suggest the direct "you"
  rewrite.
- **Rule 1.1e forward-explained concept:** flag a taught concept whose **full explanation lives in a later step than
  its first appearance** when that first appearance lacks a **mini-gloss + forward pointer**. The first mention
  needs a one-line plain-language definition *and* a link to the step that teaches it fully — leaving it bare
  (or a bare pointer with no definition) is the defect. This needs step order (ideally the whole milestone/
  guide) to resolve; say so if only a fragment was attached. (Observed: a guide named *delta time* in
  a `maxDt` comment but only taught it in a later step.)
- **Sourcing — a declarative block must be clean in its validator, not just correct per the docs:** flag a
  config/manifest block (an editor or plugin manifest, a build/compiler config, a CI or container file, any
  schema-backed JSON/YAML/TOML) that looks **incomplete against the schema the reader's own tooling validates
  it with** — typically a key the docs call optional but the shipped schema requires, or a block the docs
  present abridged. The reader pastes it, gets a warning the guide never mentions, and can't tell whether the
  guide or the tool is wrong. Confirming it needs the validator, so raise it as a **suspect**: name the block,
  the key you suspect is missing, and the tool to re-check it in. The fix is a block that validates clean plus
  a note on why it differs from the docs. (Observed: a guide's manifest snippet, correct per the official
  docs, raised a `Missing property` warning from the editor's bundled schema.)

## Deliverable
1. A **verdict**: PASS / PASS-WITH-WARNINGS / FAIL, with counts.
2. A **findings table**, most-severe first: `file:section · rule · severity · what's wrong · suggested fix`.
3. **Structural blockers** listed separately from pedagogy suggestions.
4. A pointer: run the `clarify-step` skill to fix a flagged pedagogy issue; run `review-before-follow` before
   executing against real tooling.
