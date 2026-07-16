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
- **Built-ins count as terms.** When the reader is New/Beginner on a language or engine, its **built-in
  library methods and objects** are first-use terms too — `Math.round()`, `Math.PI`, `Number.toFixed()`,
  `ctx.fillRect()` for JS-new; `Transform`, `Clear Flags`, `IL2CPP` for Unity-new. Gloss them at first use,
  at the topic's depth. Keep the bar consistent: if the guide glosses `const`, it must gloss `toFixed()` on
  the next line too. (Observed: web-platformer glossed `const` but left `toFixed`/`Math.round`/`Math.PI`
  bare; unity left `Transform`/`IL2CPP`/`Clear Flags` unglossed.)
- **Track each concept's first appearance — gloss + point forward if it's taught later.** As you draft in
  order, note where each concept first *appears* (a config key, a code comment, a value), not just where you
  plan to *teach* it. If a concept surfaces before its dedicated teaching step, give it a **one-line mini-gloss
  plus a forward pointer** at that first appearance (e.g. "*delta time* — seconds since the last frame; you'll
  build it fully in step 05") — never leave it bare because "step 05 explains it." The deep-dive stays where the
  ladder puts it. (Observed: web-platformer named *delta time* in M1/02's `maxDt` comment but only taught it in
  M1/05.)
- **Granularity:** cut steps to the setting — **Terse** bundles more per step and skips obvious sub-actions;
  **Standard** is default atomic; **Highly granular** splits further and spells out every sub-action.

## Build against the Verified stack — and re-check it
- **Use the pinned versions from the Verified stack for every command and code block.** Same versions across
  every milestone so the guide stays internally consistent. Never mix versions between steps.
- **Verify APIs against the current official docs before you write code.** For each API, function, flag, or
  config key a step uses, confirm online (fetch the docs page from the Verified stack) that it exists and has
  that signature/name in the pinned version. Do **not** write code from memory — memory is stale. If an API
  moved or was renamed since your training data, use what the docs say now and note it.
- **Link the official docs** in each "New concept" callout (rule 1), deep-linking to the exact page when
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
  gold-plating. (Observed: spotify-angular M8/05 built M11's marker system, leaving dead members.)
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
> the reader following in order hits a build that cannot pass. (Observed: spotify-angular M9→M10.)

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

1. Explain every concept on first use — inline gloss, or a "New concept" callout right above the line (then link the glossary). 2. Say WHERE each action happens. 3. Say WHAT
it does and WHY. 4. Exact values, not ranges (and say when a value is free). 5. Separate mandatory from
illustrative. 6. Say which fields to change and which to leave at default. 7. Teach the recurring mental
model at the point of use. 8. Flag load-bearing vs cosmetic names. 9. Numbered lists, not arrow-chains.
10. Name the likely failure and its usual cause.

**Voice — address the reader as "you".** The guide-follower is always second person. Never call them "the
Human"/"the human"/"the user"/"the developer"/"the reader"/"one" — write every action and gate as something
**you** do and see. (Third-person is fine only for a *different* actor: the app's end-user, a teammate.)

Plus the structural rules — the ones drafters most often drop:
- **Draft every step in full — never stub, summarize, or collapse.** Each atomic step gets its own complete
  file, even when steps are repetitive or mechanical. Never elide with "steps 3–6 follow the same pattern",
  "(similar to above)", "…", "TODO", or any placeholder — a reader can't follow a step that isn't there. If a
  milestone has so many near-identical steps that writing them all out feels wasteful, that's a signal to
  re-check the **granularity** setting (bundle more per step), *not* a licence to skip them.
- **Complete code, never partial snippets.** A reader must be able to paste a whole file. A step may teach an
  edit as a fragment ("add below `foo`"), but every file a milestone creates or modifies MUST appear
  **complete** by the milestone's end — render the full current contents of each touched file in
  `NN_verify.md`'s "Files after this milestone" checkpoint. Never let a file's final state exist only as
  scattered fragments. Short files fully written in one step are shown complete inline.
- **Canonical nav line, at the top AND bottom of every step/overview/verify — generated from the template,
  not hand-written.** Line 2, directly under the H1, exactly:
  `> Nav: [← <prev>](<prev>.md) · [Overview](00_overview.md) · [<next> →](<next>.md)` — same format in every
  milestone. The middle anchor label is **exactly `Overview`** — never `Milestone overview` or any other
  wording (that drift spread across 140 files in one guide). The **first step of a milestone** has **`—` (a
  bare em-dash, no link) as its prev** — the Overview anchor already points there, so a prev→`00_overview.md`
  link is redundant: `> Nav: — · [Overview](00_overview.md) · [<next> →](<next>.md)`. `NN_verify.md`'s
  `next →` = the next milestone's `../MILESTONE_<n+1>_<slug>/00_overview.md`. Milestone→milestone links are
  clickable, never prose. **Repeat the same nav line verbatim at the very bottom of the file, after a `---`
  rule** — top and bottom must be identical. (Observed: spotify-angular mixed `[Overview]`/`[Milestone overview]`
  labels and gave first steps a redundant prev.)
- **Cumulative handoff.** The overview's `Handoff` carries `Done so far (cumulative)` and `Artifacts now in
  the project` — the running inventory carried forward from the previous milestone and appended — not just a
  forward-looking "what the next milestone assumes" paragraph.
- **Glossary deep-links must resolve.** When a gloss or "New concept" callout links a term, use
  `../glossary.md#<slug>` where `<slug>` is the term's heading slug (lowercase, spaces → `-`, punctuation
  dropped). Every term in `glossary.md` is a `### <term>` heading, never a bullet — bulleted terms have no
  anchor and the link silently fails. Add the term as a heading when you introduce it. (Observed: spotify-angular
  shipped 39 dead `glossary.md#term` links because the glossary used bullets.)
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
  the action actually shows. (Observed: spotify-angular M5 claimed determinism without re-querying.)
- **Commands are cross-platform for the targeted shells.** Every command in a step or a `Done when` must run on
  **every** shell listed in `stack.md`'s *Target OS / shell(s)*. When a command differs between shells, give
  the variant for each (e.g. bash `grep -q` **and** PowerShell `Select-String -Quiet`) — never a Unix-only
  command as the sole gate check when the guide also targets Windows/PowerShell. (Observed: spotify-angular M0's
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
- `00_overview.md` has all its sections and a **cumulative** handoff (`Done so far` / `Artifacts now`);
- `NN_verify.md` renders the **complete current contents** of every file this milestone touched — no file left
  as scattered fragments;
- **no step is stubbed or summarized**, and no code block is a partial snippet;
- no required code hides in an "If it breaks" note; every milestone→milestone link is clickable and resolves;
- **no step crossed the scope-discipline gate** — every step stays inside the milestone's declared Scope
  discipline; anything out of scope was deferred and flagged, not silently absorbed;
- **no forward reference** — every load-bearing symbol a step uses has its **first definition** in this
  milestone or an earlier one, and this milestone's gate is satisfiable from the current + earlier code alone
  (dependency-ordering gate);
- **every Done-when shows its expected output** — a concrete observable result, not "it works";
- **versions and load-bearing names are consistent** — every command/code block uses the pinned Verified-stack
  versions, and every recurring name/path/identifier matches how earlier steps spelled it (no drift).

(This is the `audit-guide` structural checklist run on your own output — passing it here saves a round-trip.)

**Reconcile front-door claims (whole-guide pass, after drafting).** Once every milestone exists, re-read the
**front-door** documents — `README.md`, `foundation/decision-log.md`, and `MILESTONE_0`'s `00_overview.md` —
against what the milestones **actually do**, and fix any promise the content contradicts. Absolute framings
("no C# until M3", "no code before the setup milestone", "everything is data-driven") are the usual offenders:
if M1 already writes a C# script, the "no C# until M3" promise is false and must be **qualified** ("you write
your first *gameplay* script in M3; M1 has a one-line bootstrap") or dropped. Check each headline claim against
the milestone that first breaks it; reword the front-door, not the milestone (the build wins). (Observed: unity
W1 promised "no C# until M3" while M1 wrote a script.)

Then, once the **whole guide** is drafted, **stop** and tell me:
- a per-milestone summary of the **Done-when** checklists — the gates the reader will verify as they build, and
- that the guide is complete and ready to follow: the reader now builds against it, verifying each gate as they
  go, and can run the `clarify-step` skill (`skills/clarify-step/prompt.md`) on any step that reads unclearly, or
  the `review-before-follow` skill (`skills/review-before-follow/prompt.md`) before executing against real tooling.

(When you drafted only a single named milestone, scope the summary and hand-off to that one milestone instead.)
