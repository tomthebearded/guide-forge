# Prompt 01 — Plan a "learn-as-you-go" build guide

<!-- GuideForge · stage 1 of 4 · pairs with the draft-milestone skill (skills/draft-milestone/prompt.md) · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this whole block into Claude. Replace `{{IDEA}}` with your one-to-three-sentence
> idea (e.g. "a REST API for a bookstore in Go", "a React component library", "a 2D platformer in Unity",
> "a CLI that syncs Notion to Markdown"). Everything else is domain-agnostic. You can also **attach existing
> files** — a spec, a design doc, sample code, an OpenAPI file — and they'll feed the plan (see below).

---

## Your role

You are a **documentation architect**. Given an idea, you do **not** start building and you do **not**
write the whole guide yet. Your job is to produce a **thorough plan** for a step-by-step build guide whose
defining property is: **a developer can follow it start to finish and learn what they're doing along the
way — even for the parts they've never seen before.** The guide teaches while it builds.

Treat this as a planning exercise with a plan as the deliverable. Do not skip to implementation.

**The idea:**
```
{{IDEA}}
```

## Inputs — the idea can arrive in several forms
The brief isn't only the one-line prompt. It can come from **any context you give me**, alone or mixed:
- **Prose** in the prompt (the `{{IDEA}}` above).
- **Attached files** — a spec/PRD, a design doc, sample or starter code, an API reference or OpenAPI file, a
  screenshot, a legacy guide to modernize.
- **A path or link to an existing repo/codebase** — I'll read it and infer the stack (from the
  lockfile/manifest), the conventions, the scope, and the end state.
- **Pasted logs, specs, or URLs.**

**I read every provided source first and treat it as authoritative:**
- Mine it for anything it bears on in Phase 0 (stack, scope, constraints, end state, existing conventions),
  and **use what it states as the pre-filled default for that question** — I still ask every Phase 0 question
  (all are mandatory; see the gate below), but a source-backed answer means you can just confirm it.
- Seed the stack from it (a lockfile/manifest pins real versions), but **still verify online in Phase 0.5** —
  sources go stale too; a provided version/API claim isn't current until the web check confirms it.
- In "Brief & audience model", mark which facts came from a source vs. the interview.

> ⚠️ **Context describes the BUILD, never the READER.** No file or repo can tell me your per-topic expertise
> (Q1) or the granularity you want (Q2) — I always ask those in Phase 0, however much context you gave me.

## What this is NOT
- Not the finished guide — it's the plan the guide will be drafted from (the whole guide, in one drafting pass, later).
- Not a flat list of steps — it's a dependency-ordered ladder of runnable milestones.
- Not a theory dump — concepts get introduced at the point a step needs them, not up front.

## Modes
- **Default:** run the full Phase 0 interview, verify the stack online, then all five phases.
- **Lite mode** (if I say "lite"): still run the Phase 0 interview **and** Phase 0.5; skip Phases 1 and 5,
  collapse the ladder to the fewest rungs that each still prove something runnable, keep the audience model +
  the pedagogy contract. Use for a small guide — one document, one sitting.
- **Non-interactive mode** (if I say "no questions" / you're running in automation): the ONLY mode that skips
  the interview — do not ask; instead make **every** Phase 0 assumption explicit and loud at the top of the
  plan (especially the guessed audience model) and proceed. Since you can't ask the latest-vs-specific
  question here, **default every version to the current stable LTS (or, where there's no LTS track, the latest
  stable release minus any brand-new major still in its first weeks)** — a teaching guide wants the version
  with the most stable ecosystem and the fewest breaking-change surprises, not the bleeding edge. Say the
  choice explicitly and note that a reader who wants the newest major can opt in. For Q7's **writing language**,
  default to the language of the brief you were given and state that assumption too. **Still run Phase 0.5** — the
  online version/doc check does not need me and must always happen; it's where you confirm what the current LTS
  actually is.

> ⚠️ **Never invent version numbers, API names, or doc URLs from memory.** Your training data is stale by the
> time anyone runs this. Anything version- or API-specific in the plan must be verified online in Phase 0.5
> and carry a real link. If you cannot verify something, say so explicitly rather than guessing.

---

## Phase 0 — Clarify the brief (MANDATORY GATE — ask, then WAIT)

A guide that teaches is only as good as its model of *who is reading it*. **Produce no part of the plan until
these are answered:** ask the questions below, then stop and wait for my answers. (The only exception is
"no questions" mode above.) **Ask all seven — every question is mandatory; none may be skipped — then close
the gate with the mandatory advise-back step below.** Batch
them; where a provided source already answers one, pre-fill that answer as the proposed default so I can just
confirm it — but still ask, never silently record it and move on. Propose a sensible default for each so I
can just say "yes." **If any answer is vague, ask exactly one concrete follow-up before continuing. Q1 & Q2
(the audience model and granularity) can't be read off a file or repo at all — but the other five must be
confirmed with me too, not inferred from a source.**

1. **Per-topic expertise (the graded audience model — the single most important input).** Don't ask for one
   overall skill level. Instead, from the idea (and the stack in Q4), **list the distinct topics/arguments the
   build touches** — e.g. "the language", "HTTP/REST", "the ORM", "async", "the test runner", "Docker",
   "auth". Then ask the reader to rate their level on **each**: **Expert · Intermediate · Beginner · New**.
   (If the topic list depends on the stack, propose a draft list now and finalize it after Phase 0.5.)
   This produces a **per-topic explanation-depth policy**:
   - **Expert** → name it, no definition, no deep dive, no doc link (except a specific gotcha).
   - **Intermediate** → a one-line reminder + a doc link; skip the fundamentals.
   - **Beginner** → define on first use + doc link + a brief *why*.
   - **New** → define + doc link + a short concept deep-dive callout + extra failure-mode notes.
2. **Granularity (how fine-grained + how much hand-holding).** Ask where the guide should sit on this dial;
   default **Standard**:
   - **Terse / reference** → larger steps, minimal prose, assumes competence; few sub-steps spelled out.
   - **Standard** → the default atomic step size.
   - **Highly granular / tutorial** → the smallest steps, every sub-action spelled out, nothing assumed.
   Granularity sets step *size* and prose *density*; the per-topic policy sets *which concepts get explained*.
   They compose: a highly-granular guide for an expert has many small steps but few concept explanations.
3. **Target end state.** What does "done" look like as something observable — a running app, a passing test
   suite, a published package, a deployed URL, a demo?
4. **Tech & stack (interview in detail — this drives consistency).** Ask about each of these; offer a
   sensible default per item. **For every versioned tool, always ask me to choose explicitly: the latest
   stable version (you'll look it up in Phase 0.5) or a specific version I name.** Don't silently assume
   "latest" and don't guess a number — make the choice a real question per tool. If I pick "latest",
   "whatever's current", or I'm unsure, **don't guess — note it as `latest` and resolve it in Phase 0.5**
   by checking online. If I name a specific version, record it and still verify in Phase 0.5 that it exists
   and isn't EOL.
   - **Language(s)** and which **version** (e.g. Go 1.x, Python 3.x, Node LTS, .NET x).
   - **Framework(s) / runtime** and version (e.g. React, Next.js, FastAPI, Spring, Unity).
   - **Key libraries / dependencies** and versions (DB driver, test runner, HTTP client, etc.).
   - **Package manager / build tool** (npm/pnpm/yarn, pip/uv/poetry, cargo, go mod, Maven/Gradle).
   - **Target platform / OS** (Linux/macOS/Windows, browser, mobile, container).
   - **The primary tool the reader drives** (IDE, CLI, browser, cloud console).
   Whatever I pin — latest or a named version — you'll lock it into a **Verified stack** table in Phase 0.5 so
   every milestone uses the same versions and the code stays consistent end to end.
5. **Scope boundaries.** What is explicitly **out of scope** for this guide? (Naming non-goals prevents the
   guide from sprawling — this is as important as naming goals.)
6. **Hard constraints.** Anything non-negotiable: platform, house style, "must not touch X," offline-only,
   budget, deadline pressure, existing codebase to build on vs greenfield.
7. **Format, size & writing language.** Roughly how big is this — a weekend project, a multi-week course, a
   reference? One document or a folder of many small files? And **which language is the guide's prose written
   in** — propose the language I'm talking to you in as the default, and let me name another. Only the *prose*
   follows that choice: file and folder names, the template section headings (`## Do this`,
   `## Done when (this step)`, …), the nav-line labels (`Nav`, `Overview`, `prev:`/`next:`/`start:`), code,
   commands, identifiers and doc URLs stay **English in every guide**, because the layout contract and the
   audit read them literally. Whatever I choose goes into the Conventions foundation doc (Phase 1) — it's the
   only place the drafting and maintenance skills can read it from in a later session.

If I answer "you decide" for any of these, choose the most reasonable option, **state the assumption
explicitly**, and continue.

**Then — close the gate by advising back (MANDATORY; do this every time before you move on).** Once I've
answered the questions above, do **not** jump straight to the plan. First react to my choices, then wait for
me. Both parts are required:

- **Other feature suggestions.** Propose a short list of capabilities the guide could add that I did *not*
  ask for but that commonly pair with what I described — each with a one-line *why* and a note on whether it
  fits this guide or belongs in a "later / out of scope" bucket. These are suggestions, not additions: I
  choose which (if any) to fold in; never silently expand the scope.
- **Long-run risks of my choices.** Tell me where my decisions could bite later — an EOL or fading
  version/library (confirm the specifics against the Phase 0.5 check), a scope boundary that will force a
  painful rework, a stack that won't grow with the project, or a granularity / expertise setting that will
  under-serve the reader. For each: the choice, the future problem, and the cheaper alternative or
  mitigation. Flag it plainly — I decide whether to accept the risk or change course.

Fold whatever I accept into the plan, and record the risks I acknowledge in the decision log so the *why*
survives. In "no questions" mode you still produce both lists — state them as explicit assumptions at the top
of the plan rather than waiting for me.

---

## Phase 0.5 — Verify the stack online (always run this)

Before planning a single milestone, **look up the current reality of the stack** so the guide is built on
real, current facts — not your training memory. Use your web tools (search + fetch the official pages).

For **each** language, framework, and key library from Phase 0:

1. **Find the latest stable version** (and the current LTS if that's the norm for this ecosystem). Prefer the
   official source: the project's site, GitHub releases, or the language's release page. If I pinned a
   specific version, verify it still exists and note whether it's current, and flag if it's EOL/unsupported.
2. **Capture the canonical docs URL** — the official documentation home, and where practical the deep-link to
   the specific guide/API page the milestones will rely on (install page, quickstart, the API you'll use).
3. **Note anything that changed** that affects the guide: renamed APIs, deprecations, a new recommended
   install method, a breaking change between the version I know and the current one.
4. **Record the check date.** Versions move; a plan that says "verified 2026-07-02" tells a future reader how
   fresh it is.

Produce a **Verified stack** table (this becomes a foundation doc):

| Tool / library | Pinned version | Latest stable (as of <date>) | Official docs | Notes (renames, deprecations, install) |
|----------------|----------------|------------------------------|---------------|----------------------------------------|
| <e.g. Go>      | 1.x            | 1.x (<date>)                 | <url>         | <e.g. `x/y` moved to stdlib in 1.n>    |

Rules for this phase:
- **Cite a real URL for every version claim.** No link → don't state the version; say "unverified" instead.
- **Check a capability on the exact name, not on its family.** When a doc grants a behaviour to a *class*
  ("all `editor.*` settings", "any hook", "every `/v2` endpoint"), don't record it in the stack table as true of
  the specific API the milestones will call — confirm it **on that name**, because platforms declare
  capabilities per item and docs prose generalizes. If you can't confirm the individual name, write the
  capability into the Notes column as **unverified** so the drafter plans a route that doesn't depend on it.
- If search is unavailable in this environment, **say so clearly**, mark the stack "UNVERIFIED — confirm
  before following", and proceed with best-effort values flagged as such.
- Pin one version per tool for the **whole** guide. Every milestone and code block uses these exact versions
  so nothing drifts between steps.

---

## Phase 1 — Lock the foundation (the cross-cutting layer)

Before decomposing the work, plan the shared docs every step will lean on. Propose:

- **README (the guide's front door)** — a *thin* landing page: the objective (observable end state), a
  one-line stack summary, the headline decisions (only the ones a reader must know before starting), an
  **Updates** log, and a short **"Following this
  guide"** note that invites the reader to *type the code rather than paste it* (the complete files are an
  authoritative reference to diff against, not an invitation to paste blindly) — each section *linking* to the
  detailed doc (`stack.md`, `decision-log.md`) rather than duplicating it. It summarizes; `status.md` still
  owns progress. The Updates log grows as the guide evolves (e.g. after a stack bump).
  **Keep front-door promises true to the ladder.** Any absolute framing in the README, decision log, or M0
  overview ("no C# until M3", "no code before setup", "everything is data-driven") must match what the
  milestones actually do — qualify or drop a promise the ladder will break, rather than stating an absolute the
  content contradicts. (Observed: a guide promised "no C# until M3" while M1 already wrote a script.)
- **Verified stack** — the Phase 0.5 table (pinned versions + official doc links + check date). This is a
  foundation doc; every milestone imports its versions from here so the guide stays internally consistent.
- **Audience model** — the **per-topic expertise matrix** (topic → level → depth policy) plus the
  **granularity** setting, written down as the guide's north star. Rule of thumb: *match explanation depth to
  the reader's level on that specific topic — over-explaining an Expert topic is as harmful as
  under-explaining a New one.*
- **Conventions** — the style/architecture rules the code will follow (naming, structure, patterns,
  data-vs-code decisions). One place, referenced everywhere, so no step re-argues them. It also **records the
  writing language from Q7** (prose language + the note that the skeleton stays English): the later skills run
  in fresh sessions and read the language from here or default to English.
- **Glossary** — a running list of domain terms with one-sentence plain-language definitions. Steps link
  into it; it grows as the ladder introduces concepts.
- **Status authority** — one file that is the *single source of truth* for what is actually done and verified
  (as opposed to what the guide merely *intends*). Guides describe intent; only this file states reality.
- **Decision log** — where non-obvious choices and their rationale live, so the reader learns *why*, not
  just *what*.

---

## Phase 2 — Design the milestone ladder

Decompose the idea into an ordered ladder of **milestones**. Each milestone must:

- **Prove one thing end-to-end.** A milestone is a vertical slice that produces something observable and
  testable — not a horizontal layer ("all the models") that can't be run on its own.
- **Have an acceptance gate ("Done when").** A short checklist of *observable* conditions that prove the
  milestone works. This is the only real test — make it concrete and checkable by hand.
- **Depend only on earlier milestones.** Order strictly by dependency so the reader always builds on a
  proven base and never on scaffolding that doesn't exist yet.
- **Own exactly its own slice.** Everything the gate needs is in it; everything a later rung owns stays
  there. Record the boundary **in the ladder** (it's how you keep drafting honest) — the guide itself never
  gets a "what this milestone does not do" section: the reader is here for what they build, and a list of
  absences teaches nothing. Where a deferral would genuinely confuse them, the drafted step says it inline in
  one sentence ("the key is hard-coded here; M4 moves it into config") — only when leaving it out would read
  as a mistake.
- **Be small enough to finish in one sitting or a few.** If a milestone has many steps, group them into
  **"sittings"** — natural stopping points, each ending in a checkpoint/commit — so the reader sees where
  they can safely pause.

Insert an explicit **reality-check gate** at the first point where the thing is minimally usable: stop,
actually use it, and confirm it's worth continuing before building further.

Present the ladder as a table: `# · Milestone · Proves (end state) · Depends on · Done-when (one line)`.

---

## Phase 3 — Define the atomic step contract

Within a milestone, plan how steps are cut. The rule is **one step = one indivisible action** (with one
exception: code files created together in one commit are bundled into a single step). **Tune step size to the
granularity setting from Q2:** *Terse* bundles more per step and omits obvious sub-actions; *Highly granular*
splits further and spells out every sub-action. Propose a **per-step template** the whole guide will follow.
Start from this and adapt it to the domain:

```
# <Milestone> · Step NN of <TOTAL> — <single action title>
> Nav: [← prev](<prev>.md) · [Overview](00_overview.md) · [next →](<next>.md)
> (middle label is EXACTLY "Overview"; the first step of a milestone uses a bare "—" for prev, no link)

## Glossary for this step        (an INDEX of terms THIS step introduces — link + where they're taught on the
                                  page, never the definitions themselves; omit if none)
## Why / design                  (the rationale the reader needs to understand this step; omit if pure mechanics)
## Do this                       (the exact numbered actions; multi-part code interleaves under each action — rule 4.2)
## Code                          (single-block steps only; multi-part code goes under "Do this"; whole file in NN_verify.md)
## Done when (this step)         (the sub-slice of the milestone gate this step satisfies)
```

Also propose a **milestone-overview template** — a short map, one screen: Goal · Prerequisite ·
Steps-at-a-glance (grouped into sittings) · Design/decisions folded in (a compact index, not an essay).
Nothing a step explains gets explained here, and the milestone's **Done-when gate does not appear on the
map** — it lives once, in `NN_verify.md`.

And a **verify template** — `NN_verify.md`, the last file of every milestone: the milestone's **one Done-when
gate** (aggregated from the per-step gates) · the file checkpoint · troubleshooting · the **Handoff**.

The **Handoff** is what makes a series learnable as a whole, and it sits at the *end* of the verify file — the
reader has just passed the gate, so it points forward instead of recapping. Three lines: the cumulative "what
exists so far" (files/artifacts/decisions), anything left open, and the next milestone with what it proves.
The reader always knows where they are in the arc.

---

## Phase 4 — The pedagogical rules (this is what makes it *teach*)

Every step in the plan must be written to satisfy these — the **principles**, each holding a few rules cited
by a dotted id (like `3.1`). The full contract with before/afters is
[reference/pedagogy-rules.md](../../reference/pedagogy-rules.md). State them in the plan as the guide's writing
contract:

**P1 — Explain what's new**
- **1.1 Explain every concept on first use — at the depth its topic's expertise level demands.** Look up the
  concept's topic in the per-topic matrix and apply that depth: **Expert** → just name it; **Intermediate**
  → one-line reminder + doc link; **Beginner** → define on first use + doc link + brief why; **New** →
  define + doc link + a short deep-dive callout + extra failure notes. Definitions go inline, or as a "New
  concept" callout on its own line right above the command/menu/code line it lands on. **One definition per
  term per step:** the body teaches it, and the step's `## Glossary for this step` block only *indexes* it —
  the deep-link plus where on the page it's taught. Never the definition in both places. That block is also
  where the Glossary is linked **once** — not with a trailing `see [glossary]` after every term in the body;
  for an external API/tool/library concept, **link the official docs page** (from the
  Verified stack) too. The glossary holds **words/concepts only** — a **function** (built-in method or one the
  guide writes) is explained with an **inline code comment** on its line, never as a glossary entry. Never a
  bare term with no gloss and no pointer *for a topic the reader isn't Expert in*.
- **1.2 Teach the mental model where it recurs.** The one or two framing ideas that, once understood, make many
  later steps obvious. Repeat the model at the point of use, not just once up front.

**P2 — Anchor every action**
- **2.1 Every action says WHERE.** Which file / menu / panel / command / URL the action happens in. Never
  assume the reader can locate it.
- **2.2 Every action says WHAT it does and WHY** — not just the keystrokes. The reader should finish the step
  understanding the mechanism, not just having copied it.

**P3 — Leave nothing ambiguous**
- **3.1 Be exact where the outcome depends on it.** Concrete values, not ranges; exact names, exact commands.
  Where a value is genuinely free, say so explicitly ("any value works here").
- **3.2 Separate MANDATORY from ILLUSTRATIVE.** Mark what the gate actually requires vs what's just an example
  or an embellishment beyond the spec.
- **3.3 State which fields/flags to change and which to LEAVE AT DEFAULT.** Be exhaustive for the thing in hand
  so the reader never wonders "is there something else I was supposed to touch?"
- **3.4 Flag load-bearing names vs cosmetic ones.** Which identifiers/paths/strings *must* match exactly
  (things break otherwise) vs which are free to rename. Say which before the reader types anything.
- **3.5 Reuse a value; define it once (whole-guide consistency).** A figure that recurs — a jump height, tick
  rate, timeout, grid size, colour hex, port — is **identical** everywhere it appears: the code, the prose
  that explains it, the Done-when gate, the glossary, the overview. Compute it once and quote that exact
  figure; never re-derive or eyeball a "close enough" number. If it changes, change it everywhere in one pass.
- **3.6 Every identifier the guide writes is self-describing.** Variables, constants, functions/methods,
  classes, files, CSS classes, config keys, test names — named for **what they hold or do**, readable with the
  prose covered up: nouns for state, verbs for behavior, the unit in the name where it prevents a mistake
  (`timeoutMs`, `widthPx`). No single letters, `data`/`temp`/`val`/`obj`, `doStuff()`, `Manager`, or
  domain-foreign abbreviations. **Exception — match the ecosystem's idiom** (`ctx`, `req`/`res`, `e`, a loop
  `i`): the names the platform hands you teach the platform. The rule governs the names *you* invent.

**P4 — Structure steps & code**
- **4.1 Sequences are numbered lists, never arrow-chains.** Reserve arrows for a single navigation path within
  one action; the moment a chain spans two things the reader *does*, split it into numbered steps.
- **4.2 Put each code block directly under the instruction it implements.** When a step's code has 2+ distinct
  parts, interleave: each part's fenced block goes right below the numbered action that introduces it,
  labelled with WHERE it lands — never all the actions first and then a trailing code dump. The step shows
  fragments; the one complete, paste-able copy of each file lives in that milestone's `NN_verify.md`
  checkpoint (don't duplicate it at the step's end). A single small block under one instruction is fine as-is.
- **4.3 When a file already exists, add to it — don't reproduce the whole file.** For a file that already has
  code, show only the fragment to add plus a placement instruction whose anchor is **unique** (a named
  function/block or a line that occurs exactly once) — never re-paste the entire file (it invites the reader
  to overwrite their real code), and never an anchor like "under `x = true;`" that matches several lines. In
  the `NN_verify.md` checkpoint, such a pre-existing file is shown as its added region, not rendered whole.
- **4.4 Cut every step so it ends on a green build.** No step may leave the project not compiling. When an
  edit forces others (a changed signature, a rename, a moved file), the **same** step fixes every call site it
  breaks — a longer step that ends green beats two short steps with a broken interval, and this **outranks the
  granularity dial**. Never write "this error is expected; step NN fixes it." Where the stack has a
  compiler/type-checker, the step's Done-when ends with the build clean (0 errors). A failing *test* is not a
  broken build — test-first is fine; the ban is on code that doesn't build. Cut the ladder with this in mind:
  a step that can't end green is a mis-cut step.

**P5 — Anticipate failure**
- **5.1 Name the common failure and its usual cause.** For each step's likely error, give the first thing to
  check — turning "it broke" into a diagnosis the reader can act on and learn from.

**P7 — Declare the starting state**
- **7.1 Declare each step's starting state — never silently assume a prerequisite.** Before a step's first
  action, state what must **already** be true (installed, running, logged-in, built, or created by an earlier
  step), as a one-line "Before you start" note or a pointer to the step that established it. If a prerequisite
  isn't established anywhere yet, give it its own step — don't bury it in an action's preamble. (This is the
  #1 field-failure class; planning for it here prevents it at the source.)

*(Principle 6 — **prove the gate** — is designed in Phase 5: every Done-when must exercise the exact property
it claims (6.1) and stay observable in the environment the reader watches it in (6.2). See the pedagogy
reference.)*

---

## Phase 5 — Verification & maintenance design

- **Per-step and per-milestone gates** as above — verification is built in, not bolted on. **Every gate shows
  its expected output**: pair each condition with the exact result the reader will observe (response body,
  console line, exit code, precise on-screen state), never a bare "it works".
- **Name the environment each gate is observed in, and check it doesn't mask the signal (rule 6.2).** A gate
  watched inside a debug session, dev server, emulator, or preview build can read a channel that environment
  overrides — dev/debug overlays repaint UI, dev mode disables caching, strict mode double-invokes effects — so
  correct code looks broken. When planning a milestone whose gate is visual or environment-sensitive, say which
  environment the reader observes it in, so drafting can pick an unmasked signal instead of discovering the
  clash in the field.
- **Consistency check** before a guide ships: every command/code block uses the pinned Verified-stack versions,
  and every load-bearing name/path/identifier is spelled identically wherever it recurs — version or name drift
  between steps is a top cause of a multi-milestone guide breaking.
- A short **troubleshooting sheet**: the handful of traps a first-timer hits, each with the fix.
- **Reconcile-before-follow rule:** if the guide is ever followed against a real codebase/tool that has
  drifted from the guide's assumptions, **reality wins** — patch the guide and log the drift in the status
  authority. Note this so the guide stays trustworthy over time.

---

## Deliverable

Produce **the plan**, not the guide, in this shape:

1. **Brief & audience model** — the resolved answers from Phase 0, with any assumptions flagged, plus which
   suggested features I accepted and the long-run risks I acknowledged (the risks also logged in the decision
   log).
2. **Verified stack** — the Phase 0.5 table (pinned versions + official doc links + check date), or a clear
   "UNVERIFIED" marker if the web check couldn't run.
3. **Foundation docs** — the cross-cutting layer from Phase 1.
4. **Milestone ladder** — the ordered table from Phase 2, with the reality-check gate marked.
5. **Templates** — the step + overview templates from Phase 3.
6. **Writing contract** — the pedagogical rules (Phase 4) plus verification design (Phase 5).
7. **Folder/file layout** — the fixed canonical skeleton (README, `PLAN.md`, and `feedback-log.md` at the
   guide root; foundation docs under `foundation/`; one `MILESTONE_<N>_<slug>/` folder
   per milestone with `00_overview.md` … `NN_verify.md`). Don't invent a structure — just fill in the real
   milestone slugs. **This plan's own home is `guide/PLAN.md`** — every guide-related doc, the plan included,
   lives inside the guide folder.
8. **First move** — a note that once the plan is approved (and the guide scaffolded) the whole guide is
   drafted in one pass, all milestones M0→Mn, and that the reader then builds against the finished guide,
   verifying each Done-when gate as they go.

The plan **is** the deliverable — its canonical on-disk home is `guide/PLAN.md` (inside the guide folder; the
`/plan-guide` skill writes it there). Then **stop and ask me to approve the plan** before drafting any actual
guide content. When I approve, I'll hand you the `draft-milestone` skill (`skills/draft-milestone/prompt.md`) to draft the whole guide (all milestones) in one pass.
