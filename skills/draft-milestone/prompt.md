# Prompt 02 — Draft the guide into atomic step files

<!-- GuideForge · stage 2 of 4 · run after prompt 01's plan is approved · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this after the plan from the `plan-guide` skill (`skills/plan-guide/prompt.md`) is approved. By default
> I draft the **whole guide** — every milestone in the approved ladder, in one pass — so you have the finished guide before you
> build. Name a specific milestone (e.g. "draft milestone M1") only when you want just one re-drafted or fixed.

---

## Your role

You are drafting an approved learn-as-you-go build guide into folders of **atomic step files** — by default
the **whole guide** (every milestone in the ladder), or a single named milestone when you're re-drafting one.
You are expanding the plan, not re-deciding it: honor the approved ladder, scope, audience model,
conventions, and writing contract. If following the plan reveals a real problem (a missing prerequisite, an
impossible order), **stop and flag it** rather than silently deviating.

**What to draft:** the whole guide unless a specific milestone is named (e.g. "M2 — persistence layer").

## Draft the whole guide in one pass
Unless told to draft a single milestone, walk the approved ladder **in order** — M0, M1, … Mn — and produce
**every** milestone's folder back-to-back in this one run, applying the entire per-milestone contract below to
each. Do **not** stop between milestones to wait for the reader to implement one; the reader builds against
the finished guide afterward and verifies each Done-when gate as they go. Carry state forward as you write:
each milestone's cumulative handoff (`Done so far` / `Artifacts now`) is the input to the next, so treat the
milestone you just finished as the "previous milestone" for the one you're about to write. Every load-bearing
name, path, version, and identifier must stay identical across all milestones — you're writing them all, so
there's no excuse for drift.

## Inputs you should already have
- The **approved plan** (ladder, templates, writing contract) from prompt 01.
- The **Verified stack** table (pinned versions + official doc links + check date) from Phase 0.5.
- The **audience model** — the **per-topic expertise matrix** (topic → level → depth policy) and the
  **granularity** setting. Calibrate every explanation and every step size to them.
- The **conventions** and **glossary** the guide has established so far.
- The **handoff** of the *previous* milestone — for the first milestone, the scaffold/plan starting state;
  for each later one, the handoff you wrote in this same pass.
- **Attached files (optional).** If I attach reference material for this milestone — a spec section, sample
  code, the actual file a step will edit, an API page — read it and build against it (still re-verify each API
  against the live docs, per below).

If any of these is missing from the conversation, ask for it before drafting.

## Honor the audience dials
- **Per-topic depth:** for each concept a step introduces, look up its topic in the matrix and explain it at
  that level — **Expert** (name only, no gloss/link), **Intermediate** (one-line reminder + doc link),
  **Beginner** (define + link + why), **New** (define + link + short deep-dive callout + extra failure notes).
  Don't explain concepts in a topic the reader is Expert in — over-explaining is a defect too.
- **Built-ins count as terms — but explain a *function* with an inline comment, not a glossary entry.** When
  the reader is New/Beginner on a language or engine, its **built-in library methods and objects** are
  first-use terms too — `Math.round()`, `Number.toFixed()`, `ctx.fillRect()` for JS-new. Explain them at first
  use, at the topic's depth. Keep the bar consistent: if the guide explains `const`, it must explain `toFixed()`
  on the next line too. **A function's explanation goes in an inline code comment on its line — never as a
  glossary `### entry`** (the glossary holds words/concepts only): this covers built-in methods *and*
  functions you write (`spawnEnemy()`). Non-function concept terms — `Math.PI`, `Transform`, `Clear Flags`,
  `IL2CPP` — are words and still go in the glossary. (Observed: a guide glossed `const` but left
  `toFixed`/`Math.round`/`Math.PI` bare; another left `Transform`/`IL2CPP`/`Clear Flags` unglossed.)
- **Track each concept's first appearance — gloss + point forward if it's taught later.** As you draft in
  order, note where each concept first *appears* (a config key, a code comment, a value), not just where you
  plan to *teach* it. If a concept surfaces before its dedicated teaching step, give it a **one-line mini-gloss
  plus a forward pointer** at that first appearance (e.g. "*delta time* — seconds since the last frame; you'll
  build it fully in step 05") — never leave it bare because "step 05 explains it." The deep-dive stays where the
  ladder puts it. (Observed: a guide named *delta time* in a `maxDt` comment but only taught it in
  a later step.)
- **Granularity:** cut steps to the setting — **Terse** bundles more per step and skips obvious sub-actions;
  **Standard** is default atomic; **Highly granular** splits further and spells out every sub-action.

## Build against the Verified stack — and re-check it
- **Use the pinned versions from the Verified stack for every command and code block.** Same versions across
  every milestone so the guide stays internally consistent. Never mix versions between steps.
- **Verify APIs against the current official docs before you write code.** For each API, function, flag, or
  config key a step uses, confirm online (fetch the docs page from the Verified stack) that it exists and has
  that signature/name in the pinned version. Do **not** write code from memory — memory is stale. If an API
  moved or was renamed since your training data, use what the docs say now and note it.
- **Verify a capability on the exact name, never on its family.** When the docs grant a behaviour to a *class*
  of things ("all `editor.*` settings", "any hook", "every `/v2` endpoint"), don't carry it to the specific
  member your step uses without confirming it **on that member** — platforms declare capabilities per item and
  docs prose generalizes. The tell is a sentence in your own draft shaped "X works here **because** it's a Y":
  that `because` is an inference, not a citation. If you can't verify the individual name, teach the route that
  doesn't need the capability.
- **Where the reader's toolchain disagrees with the docs about a block's contents, follow the toolchain.** The
  docs describe semantics; the schema validator, compiler, linter, formatter or type-checker you tell the
  reader to run decides what they actually see. When the docs call a manifest/config key optional but the
  shipped schema requires it, write the block that validates clean and add a one-line note on why it differs
  from the docs — a reader who checks the docs must not conclude the guide is wrong. Names, signatures, flags
  and versions still come from the docs.
- **Link the official docs** in each "New concept" callout (rule 1.1), deep-linking to the exact page when
  practical.
- If the web check surfaces something that contradicts the plan (a version is EOL, an API was removed),
  **stop and flag it** — don't quietly work around it.

## Scope-discipline gate — stop before you sprawl

The milestone's `00_overview.md` declares a **Scope discipline**: what it deliberately does *not* do. Treat
that line, plus the later rungs of the approved ladder, as a **hard boundary on what a step may introduce** —
not a suggestion. Check every step against the boundary *before* you draft it:

- A step **crosses the line** when it adds a capability, file, dependency, command, config key, or taught
  concept that this milestone deferred, that the plan assigned to a **later** milestone, or that appears
  **nowhere in the approved plan** at all.
- When a step would cross it, **STOP. Do not draft the out-of-scope material in, and do not quietly widen the
  milestone.** Surface it to me instead — name (a) exactly what crossed the line, (b) which milestone owns it
  (or "not in the plan"), and (c) the options: defer it (the default), or amend the plan/scope with my
  approval before continuing.
- This cuts **both ways**: don't pull a *later* milestone's work forward to "save a trip," and don't
  gold-plate past the Done-when gate with embellishments the milestone doesn't require. If the gate doesn't
  need it, it doesn't belong in this milestone. **Consume-it-now test:** every public member/function a
  milestone adds must be **called within that same milestone** (exercised by its Done-when). The one exception
  is a genuine early definition consumed later — mark it inline with a `[Mn]` comment naming the consuming
  milestone (e.g. `clear() { … } // [M10] used by the reset flow`); an unmarked, uncalled member is
  gold-plating. (Observed: a guide built a later milestone's marker system early, leaving dead members.)
- **Only** exception: a genuine **hard prerequisite** the plan missed — something the milestone literally
  cannot run without. Even then, stop and flag it as a plan gap; don't silently absorb it.

## Dependency-ordering gate — no forward references

A milestone must build from the milestones below it **alone**. Enforce this while you draft, and self-check it
before you close each milestone (see [milestone-design.md](../../reference/milestone-design.md#dependency-ordering--no-forward-references-hard-rule)):

- **Every load-bearing symbol a step references MUST already be introduced in a milestone `<=` the current
  one.** A symbol is any identifier the code names — class, method, function, field, constant, file, route,
  env-key, config key, CSS class. If a step in M*k* calls `X`, the first definition of `X` must live in M*j*
  with `j <= k`.
- **Each milestone's `build`/`Done-when` gate must be satisfiable using ONLY the code of the current and
  earlier milestones.** If the reader stops at the end of this milestone and runs it, it must compile and the
  gate must pass — never "it goes green once M*k+1* lands."
- **Before closing each milestone, run a dependency-ordering self-check:** for every load-bearing identifier
  this milestone's steps *use*, confirm its **first definition** is in this milestone or an earlier one. If
  you find a use whose definition the plan assigns to a **later** milestone, you have a forward reference —
  **STOP and flag it** (like a scope-discipline break): either the definition must move earlier (re-cut the
  ladder with my approval) or the use must move later. Never draft the milestone with the dangling reference.

> **The defect this prevents:** M9 calling `LikedIndex.clear()` when `clear()` isn't introduced until M10 —
> the reader following in order hits a build that cannot pass. (Observed: a guide used a method introduced only in a later milestone.)

---

## What to produce

For **each** milestone in the ladder, a folder `MILESTONE_<N>_<slug>/` containing (follow the fixed canonical layout — README at guide root, foundation docs
under `foundation/`, `00_overview.md` … `NN_verify.md` per milestone):

1. **`00_overview.md`** — from the milestone-overview template:
   Goal · Scope discipline · Prerequisite · Steps-at-a-glance (grouped into sittings) · Design/decisions
   folded in · Done-when gate (aggregated) · Handoff.
2. **`NN_<slug>.md`** — one file per **atomic step** (one indivisible action).
   - Exception: code files created in the *same commit* are bundled into one `NN_scripts.md` with one
     sub-heading + full code block per file — and the step **says so at the top** ("this step touches N files,
     committed together: …").
   - Number in the exact order the reader performs them. Group into the sittings named in the overview.
3. **`NN_verify.md`** — the final step: the full milestone **Done-when** gate + **the file checkpoint** (the
   complete current contents of every file this milestone created or modified, one full block per file) + a
   short troubleshooting list + a **clickable** pointer to the next milestone's `00_overview.md`.

## Every step file MUST obey the writing contract

The principles (rules cited by dotted id; full contract in
[reference/pedagogy-rules.md](../../reference/pedagogy-rules.md)):
- **P1 Explain what's new** — **1.1** explain every concept on first use (inline gloss, or a "New concept"
  callout right above the line; link the glossary ONCE in the step's Glossary block, not after every term; and
  explain a *function* with an inline code comment, never a glossary entry); **1.2** teach the recurring mental
  model at the point of use.
- **P2 Anchor every action** — **2.1** say WHERE each action happens; **2.2** say WHAT it does and WHY.
- **P3 Leave nothing ambiguous** — **3.1** exact values, not ranges (and say when a value is free); **3.2**
  separate mandatory from illustrative; **3.3** say which fields to change and which to leave at default;
  **3.4** flag load-bearing vs cosmetic names; **3.5** reuse a value, define it once — a figure that recurs
  (jump height, tick rate, timeout, colour hex) is identical in the code, prose, gate, glossary, and overview;
  **3.6** every identifier you write is self-describing — variables, functions, classes, files, config keys
  named for what they hold or do (nouns for state, verbs for behavior, units in the name: `timeoutMs`), never
  `d`/`data`/`temp`/`handle()`/`Manager`; the one exception is the ecosystem's own idiom (`ctx`, `req`/`res`,
  a loop `i`), which you match rather than fight.
- **P4 Structure steps & code** — **4.1** numbered lists, not arrow-chains; **4.2** put each code block under
  the instruction it implements; **4.3** don't reproduce an existing file whole to add to it — give the
  fragment + a unique placement anchor; **4.4** every step ends on a **green build** — a step that changes a
  signature/name/path also fixes every call site it breaks, in the same step.
- **P5 Anticipate failure** — **5.1** name the likely failure and its usual cause.
- **P6 Prove the gate** — **6.1** every Done-when exercises the exact property it claims; **6.2** the property
  is observable in the environment the step tells the reader to watch — never let a debug session, dev mode,
  emulator or preview build mask the exact signal the gate reads.
- **P7 Declare the starting state** — **7.1** before the first action, say what must already be
  installed/running/logged-in/built or name the step that established it; never silently assume a prerequisite.

**Voice — address the reader as "you".** The guide-follower is always second person. Never call them "the
Human"/"the human"/"the user"/"the developer"/"the reader"/"one" — write every action and gate as something
**you** do and see. (Third-person is fine only for a *different* actor: the app's end-user, a teammate.)

Plus the structural rules — the ones drafters most often drop:
- **Draft every step in full — never stub, summarize, or collapse.** Each atomic step gets its own complete
  file, even when steps are repetitive or mechanical. Never elide with "steps 3–6 follow the same pattern",
  "(similar to above)", "…", "TODO", or any placeholder — a reader can't follow a step that isn't there. If a
  milestone has so many near-identical steps that writing them all out feels wasteful, that's a signal to
  re-check the **granularity** setting (bundle more per step), *not* a licence to skip them.
- **Interleave code under its instruction (rule 4.2); guarantee the whole file in the checkpoint.** The trigger
  is **two** blocks, not more: the moment a step shows a second block, the reader has to work out which
  instruction each one belongs to — and removing exactly that guesswork is what rule 4.2 is for. When a
  step's code has 2+ distinct parts, put each part's fenced block **right under the numbered instruction that
  introduces it**, labelled with WHERE it lands (file + position) — never stack all the code in a trailing
  `## Code` dump the reader has to re-pair with the actions. A step therefore shows **fragments**, not one
  complete file, and that's correct: the single paste-able copy of every **guide-authored** file a milestone
  creates or modifies MUST appear **complete** by the milestone's end — render the full current contents of each
  such file in `NN_verify.md`'s "Files after this milestone" checkpoint. Never let a guide-authored file's final
  state exist only as scattered fragments with no checkpoint copy, and never append a consolidated "complete
  file" block to a step (it duplicates the checkpoint and re-creates the dump). A step whose code is a single
  small block may keep it under one `## Code` heading. **Rule 4.3 exception:** a **pre-existing file the
  milestone only adds to** is *not* rendered whole (that would invite the reader to overwrite their real code) —
  in both the step and the checkpoint's "Pre-existing files modified" list, show only the added fragment plus a
  **unique** placement anchor (a named function/block or a once-occurring line), never an anchor that matches
  several lines.
- **No step ends on a broken build (rule 4.4).** Cut steps at compiling boundaries: when an edit forces others
  — a changed constructor signature, a rename, a moved file, an extracted interface — the **same** step updates
  every call site it breaks, and its `Done-when` ends with the build clean (`npm run compile` exits 0,
  `tsc --noEmit` silent, the watch task at **0 errors**). Prefer one longer green step over two short ones with
  a broken interval; **this outranks the granularity dial**. **Never draft the sentence "this error is expected;
  step NN fixes it"** — re-cut the step to absorb the fix. A failing *test* is not a broken build (test-first is
  fine, and the gate names the failing test); a codegen command that makes the tree buildable belongs in the
  same step, before the gate. (Observed: a step told the reader a constructor-signature error in another file
  was "expected until step 05", so a real error of their own would have hidden inside the expected list.)
- **Canonical nav line, at the top AND bottom of every step/overview/verify — generated from the template,
  not hand-written.** Line 2, directly under the H1, exactly:
  `> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)` — same format in every
  milestone. The middle anchor label is **exactly `Overview`** — never `Milestone overview` or any other
  wording (that drift spread across a guide's files). The **first step of a milestone** has **`—` (a
  bare em-dash, no link) as its prev** — the Overview anchor already points there, so a prev→`00_overview.md`
  link is redundant: `> Nav: — · [Overview](00_overview.md) · [<next> →](<next>.md)`. `NN_verify.md`'s
  `next →` = the next milestone's `../MILESTONE_<n+1>_<slug>/00_overview.md`. Milestone→milestone links are
  clickable, never prose. **Repeat the same nav line verbatim at the very bottom of the file, after a `---`
  rule** — top and bottom must be identical. (Observed: a guide mixed `[Overview]`/`[Milestone overview]`
  labels and gave first steps a redundant prev.)
- **The overview's nav line ends with `start:` — a link to the milestone's first step.** `00_overview.md`'s
  nav (top *and* bottom, identical) is
  `> <Phase> · milestone K of N · prev: [<prev>](../MILESTONE_<n-1>_<slug>/00_overview.md) · next: [<next>](../MILESTONE_<n+1>_<slug>/00_overview.md) · start: [<step 01 title>](01_<slug>.md)`.
  The `start:` anchor points at **`01_<slug>.md`**, labelled with step 01's title — it's the reader's way *into*
  the milestone. Without it the map's only forward click is `next`, which **skips the milestone entirely**, and
  a reader who reached the bottom nav has to scroll back up into "Steps at a glance" to find where to begin.
  If the milestone folder you're drafting still carries a scaffold placeholder overview with
  `start: — not drafted yet`, replace that text with the real link.
- **Cumulative handoff.** The overview's `Handoff` carries `Done so far (cumulative)` and `Artifacts now in
  the project` — the running inventory carried forward from the previous milestone and appended — not just a
  forward-looking "what the next milestone assumes" paragraph.
- **Glossary deep-links must resolve — and live in the step's Glossary block, once.** The `## Glossary for this
  step` block deep-links each term with `../glossary.md#<slug>` (`<slug>` = the term's heading slug: lowercase,
  spaces → `-`, punctuation dropped). Every term in `glossary.md` is a `### <term>` heading, never a bullet —
  bulleted terms have no anchor and the link silently fails; add the term as a heading when you introduce it.
  Body glosses/callouts do **not** repeat a `see [glossary]` link after each term (the block is the one door to
  the glossary). And the glossary holds **words/concepts only** — never a **function**; a function that needs
  explaining gets an inline code comment on its line. (Observed: a guide shipped dead
  `glossary.md#term` links because the glossary used bullets.)
- **Required code lives in a step, never in "If it breaks."** The failure section lists diagnoses only; if a
  fix needs new code/config, it's a numbered step (or a clearly-flagged optional one).
- **Every step ends in its own "Done when"** — the sub-slice of the milestone gate it satisfies.
- **Every gate shows its expected output.** Each `Done when` — per step and in `NN_verify.md` — pairs the
  action with the exact result the reader will observe (response body, console line, exit code, or the precise
  on-screen state). "It works" / "the server responds" is not a gate; give the reader something concrete to
  diff reality against. Describe visual outcomes exactly.
- **Gates prove what they claim.** When a `Done when` names a *property* (deterministic, persistent,
  idempotent, cached), its action must **exercise that property's code-path** — re-run and diff for
  determinism, restart and re-read for persistence. If the property isn't observable, reword the claim to what
  the action actually shows. (Observed: a guide claimed determinism without re-querying.)
- **Gates are observable in the environment you prescribe (rule 6.2).** Every gate is watched *somewhere* — a
  debug session, a dev server, an emulator, a preview build. Before you write it, ask what that environment
  does to the exact signal the gate reads: dev/debug overlays repaint UI, dev mode disables caching, strict
  mode double-invokes effects, hot-reload hides "survives a restart". If it masks the signal, either observe an
  unmasked channel, or set the environment-specific variant alongside the normal one so the effect shows up
  where the reader is looking, or say **in the `Done when` itself** what that environment displays and how to
  see the real effect. Never leave the mask to the troubleshooting table — a reader whose code works has no
  reason to read it. (Observed: a demo set a status-bar color the debug host overrides, so a correct
  implementation showed the host's own color and the milestone's headline gate appeared to fail.)
- **Commands are cross-platform for the targeted shells.** Every command in a step or a `Done when` must run on
  **every** shell listed in `stack.md`'s *Target OS / shell(s)*. When a command differs between shells, give
  the variant for each (e.g. bash `grep -q` **and** PowerShell `Select-String -Quiet`) — never a Unix-only
  command as the sole gate check when the guide also targets Windows/PowerShell. (Observed: a guide's
  zone.js check was bash `grep` only, unrunnable on the reader's PowerShell.)
- **Keep versions and names consistent.** Every command and code block uses the pinned Verified-stack versions
  (never mix versions between steps), and every load-bearing name, path, or identifier is spelled **identically**
  to how earlier steps spelled it — a file/route/variable/env-key that drifts between steps is a classic
  multi-milestone break.
- **Honor scope discipline** — enforce the scope-discipline gate above: if something belongs to a later
  milestone (or isn't in the plan), defer it and flag it; never silently draft it in.

---

## Deliverable

Output every milestone's folder in ladder order (M0 → Mn), and within each folder its files each in its own
fenced block labelled with its path, in order: `00_overview.md`, then `01_*.md` … `NN_verify.md`. When
drafting a single named milestone, output just that one folder.

**Self-audit before you hand off.** Re-read what you just produced against the structural contract and fix any
miss *before* showing it — run this check on **each** milestone you drafted, and don't ship one you'd flag
yourself. Confirm:
- every step file has the canonical **nav line at both top (line 2) and bottom (after a `---`), identical**,
  three anchors, and its own **"Done when"**;
- `00_overview.md` has all its sections and a **cumulative** handoff (`Done so far` / `Artifacts now`), and its
  nav line — top **and** bottom — ends with `start: [<step 01 title>](01_<slug>.md)`, resolving to the first
  step file you actually wrote;
- `NN_verify.md` renders the **complete current contents** of every **guide-authored** file this milestone
  touched — no such file left as scattered fragments; a **pre-existing file the milestone only added to** (rule
  4.3) is shown as its added region + unique anchor under "Pre-existing files modified", never reproduced whole;
- **no step is stubbed or summarized**; multi-part code is interleaved under its instructions (rule 4.2), not
  batched in a trailing block, and no step carries a redundant consolidated "complete file" copy; **no
  pre-existing file is re-pasted whole and no insertion anchor is ambiguous** (rule 4.3);
- no required code hides in an "If it breaks" note; every milestone→milestone link is clickable and resolves;
- **no step crossed the scope-discipline gate** — every step stays inside the milestone's declared Scope
  discipline; anything out of scope was deferred and flagged, not silently absorbed;
- **no forward reference** — every load-bearing symbol a step uses has its **first definition** in this
  milestone or an earlier one, and this milestone's gate is satisfiable from the current + earlier code alone
  (dependency-ordering gate);
- **no step ends on a broken build (rule 4.4)** — walk the steps in order and ask "if the reader stops here,
  does the project still compile?"; every signature/rename/move is accompanied by its call-site fixes in the
  **same** step, and no step says an error is "expected" until a later one;
- **every Done-when shows its expected output** — a concrete observable result, not "it works";
- **no gate is masked by its own environment (rule 6.2)** — for each gate, the debug session / dev server /
  emulator / preview build the step runs in does **not** override, suppress, or duplicate the exact signal the
  gate reads; where it would, the step observes an unmasked channel, sets the environment-specific variant too,
  or names what that environment shows **inside the gate**;
- **versions and load-bearing names are consistent** — every command/code block uses the pinned Verified-stack
  versions, and every recurring name/path/identifier matches how earlier steps spelled it (no drift);
- **recurring values are consistent (rule 3.5)** — a figure quoted more than once (jump height, tick rate, timeout,
  colour hex, port) reads identically in the code, the prose, the gate, the glossary, and the overview;
- **every identifier you invented is self-describing (rule 3.6)** — re-read each code block with the prose
  covered: no `d`, `arr`, `data`, `temp`, `handle()`, `Manager`; units in names where they prevent a mistake;
  and the same concept called the same thing in the code, the prose, and the gate (ecosystem idioms like
  `ctx`/`req`/`res`/`i` are kept as-is);
- **every step declares its starting state (rule 7.1)** — no step's first action silently assumes a tool, service,
  login, env file, or prior artifact that wasn't established (or back-referenced) earlier;
- **no capability is claimed on family resemblance** — search your own prose for "because it's a/an …" and for
  wildcard families (`foo.*`, "all hooks", "every `/v2` route"): each such claim must have been checked against
  the **individual** name it's applied to, not the class the docs describe.

(This is the `audit-guide` structural checklist run on your own output — passing it here saves a round-trip.)

**Reconcile front-door claims (whole-guide pass, after drafting).** Once every milestone exists, re-read the
**front-door** documents — `README.md`, `foundation/decision-log.md`, and `MILESTONE_0`'s `00_overview.md` —
against what the milestones **actually do**, and fix any promise the content contradicts. Absolute framings
("no C# until M3", "no code before the setup milestone", "everything is data-driven") are the usual offenders:
if M1 already writes a C# script, the "no C# until M3" promise is false and must be **qualified** ("you write
your first *gameplay* script in M3; M1 has a one-line bootstrap") or dropped. Check each headline claim against
the milestone that first breaks it; reword the front-door, not the milestone (the build wins). (Observed: a guide
promised "no C# until M3" while an earlier milestone wrote a script.)

Then, once the **whole guide** is drafted, **stop** and tell me:
- a per-milestone summary of the **Done-when** checklists — the gates the reader will verify as they build, and
- that the guide is complete and ready to follow: the reader now builds against it, verifying each gate as they
  go, and can run the `clarify-step` skill (`skills/clarify-step/prompt.md`) on any step that reads unclearly, or
  the `review-before-follow` skill (`skills/review-before-follow/prompt.md`) before executing against real tooling.

(When you drafted only a single named milestone, scope the summary and hand-off to that one milestone instead.)
