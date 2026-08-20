<div align="center">

# GuideForge

**Turn any idea into a step-by-step build guide that _teaches while it builds_.**

A prompt-and-skill toolkit that plans, drafts, and hardens **learn-as-you-go** developer guides — built for Claude. For games, libraries, web apps, CLIs, APIs, anything. The reader follows it start to finish and *understands what they're doing*, even for the parts they've never seen.

`MIT License` · `Works with Claude | Claude Code` · `Domain-agnostic` · `v1.16.0` · `PRs welcome`

[Quick start](#quick-start) · [The toolkit](#the-toolkit) · [Learning path](#learning-path) · [Examples](examples/README.md) · [Explainer](EXPLAINER.md) · [FAQ](#faq)

</div>

---

In the age of AI, it has never been easier to ship code you don't understand. You describe a feature, the
model produces a working diff, you merge it — and step by step you lose contact with your own codebase. The
code runs, but *you* couldn't have written it, can't reason about it, and can't fix it when reality drifts
from the happy path. The skill that atrophies isn't typing; it's **understanding how things actually work.**

GuideForge takes your idea and turns it into a guide that builds the thing and explains how it works as it
goes — every action placed, every term defined, every milestone proven runnable before the next begins. The
model still does the planning and drafting; the intent is that the output leaves you able to reason about and
maintain the result, not just run it.

> **Read what the model produces.** Every plan, step, and generated guide is meant to be read and understood,
> not merged on faith. If you skim the output and ship it blind, you lose the main benefit the toolkit is
> meant to provide.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [What you get](#what-you-get)
- [Skills at a glance](#skills-at-a-glance)
- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [The toolkit](#the-toolkit)
- [Repository map](#repository-map)
- [Learning path](#learning-path)
- [What you can build](#what-you-can-build)
- [The pedagogy in one screen](#the-pedagogy-in-one-screen)
- [Best practices](#best-practices)
- [Tips for creating a guide](#tips-for-creating-a-guide)
- [Tips for following a guide](#tips-for-following-a-guide)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [Built something with GuideForge?](#built-something-with-guideforge)
- [Credits & inspiration](#credits--inspiration)
- [License](#license)

---

## Why this exists

Most AI-generated tutorials are a **flat wall of steps**. They tell you *what to type* but not *where*, *why*, or *what breaks if you get it wrong*. You copy, it works, and you've learned nothing. The moment reality drifts from the tutorial, you're stuck.

The best hand-written guides are different. They:

- **model who's reading** and calibrate every explanation to that person,
- **build in vertical slices** that each *prove something runnable*,
- **define jargon the first time it appears**,
- **say where every action happens and why**,
- and **gate every milestone with an observable acceptance test**.

GuideForge encodes that discipline as reusable prompts and skills, so what comes out is a guide that *teaches*, not one that dictates.

> A guide is only as good as its model of the reader; most of the design follows from that.

---

## What you get

| | |
|---|---|
| **A planning meta-prompt** | Turns a one-line idea into a full, milestone-laddered build plan — with an audience + stack interview up front. |
| **Per-topic expertise + granularity dials** | Rates the reader **per topic** (Expert → New) so an expert gets names-only and a junior gets definitions, doc links, and deep dives — on that exact topic. A separate granularity dial sets how finely steps are cut. |
| **Live stack verification** | Interviews you for languages/versions/stack, then **checks the web** for the latest stable versions and pins them with official doc links — so the guide is built on current facts, not stale training memory. |
| **Your language, one contract** | The plan interview asks two language questions: which language the guide's **prose** is in — headings, `New here:` markers and nav labels included, so no page is half-translated — and whether the **code** follows it too (identifiers, comments, strings; English by default, keywords and framework APIs never). Both are recorded in `conventions.md`, along with a **heading map** that fixes each section's translation once, so every later skill writes the same words and the audit still matches them. File names, commands, paths and URLs stay English in every guide. |
| **A drafting prompt** | Expands one approved milestone into atomic, teaching step-files — built against the pinned versions, APIs re-checked against the live docs. |
| **A clarity prompt** | Runs the pedagogy pass over any existing step to remove confusion. |
| **A review-before-follow prompt** | The gate you run before *acting on* any guide, so stale/ambiguous steps get fixed first. |
| **A Claude Code plugin** | Installs as one plugin — twelve guide-authoring slash-command skills (the four pipeline stages plus `/modernize-guide`, `/audit-guide`, `/scaffold-guide`, `/update-stack`, `/amend-guide`, `/mark-progress`, `/report-issue`, `/log-feedback`), each also accepting optional attached files, plus `/pre-pr-check` for contributors to the plugin itself. |
| **Copy-paste templates** | Guide README (front door), milestone overview, step file, verified-stack table, status authority, execution ledger, glossary, conventions, decision log. |
| **Reference docs** | The pedagogy rules, milestone-design method, and audience-modeling method — all explained. |
| **[EXPLAINER.md](EXPLAINER.md)** | Every file, every rule, every design decision — explained from scratch. Start here if you want the *why*. |

---

## Skills at a glance

Thirteen skills, one plugin. What each does *for you* — invoke any as a `/slash-command`, or paste its twin prompt in a plain chat.

**Build a guide (the pipeline):**

| Skill | What it does for you |
|---|---|
| `/plan-guide` | Turns a one-line idea into a full milestone-laddered build plan — after an audience + live-stack interview. |
| `/draft-milestone` | Expands the approved plan into atomic, teaching step-files — the whole guide (all milestones) in one pass, built against the pinned versions. |
| `/clarify-step` | Runs the pedagogy pass over one existing step to remove confusion — without changing what it does. |
| `/review-before-follow` | Reconciles a guide with reality *before* you follow it — catches stale APIs, moved files, renamed UI. |

**Set up, QA & maintain:**

| Skill | What it does for you |
|---|---|
| `/scaffold-guide` | Stamps the guide's folder skeleton + six foundation docs from the approved plan, so drafting starts immediately. |
| `/audit-guide` | Lints a drafted guide against the GuideForge contract and reports violations, ranked by severity (read-only). |
| `/update-stack` | Re-verifies framework/library versions online and bumps the guide to current releases — asking first if the bump would rewrite a step you've already executed. |
| `/modernize-guide` | Converts an existing tutorial / README / runbook into a learn-as-you-go GuideForge plan. |
| `/amend-guide` | The requirements changed while you're halfway through → folds the change into what's ahead of you, leaves what you've already built alone, and tells you exactly what to repair where it can't. |
| `/mark-progress` | Ticks what you've actually executed into the guide's `progress.md` ledger — the frontier every other maintenance skill reads. |
| `/report-issue` | A reader hit a real issue → fixes the root cause *everywhere* it appears and logs the fix — stopping first if "everywhere" reaches a step you've already executed, so you choose how the repair is delivered. |
| `/log-feedback` | Captures reader friction to the guide's `feedback-log.md` — a durable record for improving the guide and the method — **without** changing the guide. |

**Contribute to GuideForge:**

| Skill | What it does for you |
|---|---|
| `/pre-pr-check` | Pre-flights a contribution to this repo before you open a PR (ground rules, registry sync, dead links). |

---

## How it works

GuideForge's core is a **pipeline of four prompts** (plus eight auxiliary tools — see [the toolkit](#the-toolkit)). You stay in the loop between each stage — nothing runs end-to-end unattended.

```mermaid
flowchart LR
    A([Your idea]) --> P1[["01 · plan-guide<br/>per-topic expertise + granularity + stack"]]
    P1 --> W[["verify stack online<br/>pin versions + doc links"]]
    W --> G1{Approve<br/>the plan?}
    G1 -- no --> P1
    G1 -- yes --> P2[["02 · draft-milestone<br/>whole guide → all milestones' step files"]]
    P2 --> D([Finished guide])
    D --> R[["04 · review-before-follow<br/>reconcile vs reality"]]
    R --> F[["follow it: build &<br/>verify each Done-when gate"]]
    F --> G2{A step reads<br/>unclearly?}
    G2 -- yes --> P3[["03 · clarify-step<br/>pedagogy pass"]]
    P3 --> F
    G2 -- no --> Done([Built ✓])
```

The plan is drafted into the **whole guide in one pass**, so you have it in hand before you build. Each milestone still ends in a **gate** — an observable *Done-when* check you verify as you follow the guide — so verification is built into the guide rather than added at the end.

---

## Quick start

### Option A — Plain Claude (any chat, no install)

1. Open [`skills/plan-guide/prompt.md`](skills/plan-guide/prompt.md).
2. Copy the whole file into a new Claude conversation.
3. Replace `{{IDEA}}` with your idea, e.g. *"a REST API for a bookstore in Go"*.
4. Answer the 7 audience/scope questions Claude asks. *(Optional: attach an existing spec, design doc, or
   sample code — Claude reads them and folds them into the plan.)*
5. You get a complete build plan. Approve it, then paste [`skills/draft-milestone/prompt.md`](skills/draft-milestone/prompt.md) to draft the whole guide (all milestones) in one pass.

### Option B — Claude Code (install as a plugin)

GuideForge ships as a Claude Code **plugin** — install it once and all the skills come with it (the twelve
guide-authoring skills plus `/pre-pr-check` for contributors; each keeps its own slash command). Point Claude
Code at a checkout, then install:

```
/plugin marketplace add /path/to/guide-forge
/plugin install guide-forge@guide-forge
```

> Installed as a plugin, the commands may be **namespaced** — `/guide-forge:plan-guide` — if a bare
> `/plan-guide` is ambiguous with another plugin. Copied into `.claude/skills/` (below), the bare names
> always work.

Prefer to hand-pick? Copy skill folders into `.claude/skills/`. Each skill folder is **self-contained** — its
`SKILL.md` wrapper and its `prompt.md` contract sit side by side — so there's nothing else to copy:

```bash
mkdir -p .claude/skills
cp -r skills/* .claude/skills/      # or copy only the ones you want — each carries its own prompt.md
```

Then in Claude Code:

```
/plan-guide a CLI that syncs Notion pages to local Markdown
```

### Option C — Always-on (paste into CLAUDE.md)

Append the pedagogy rules (the writing contract) from [`reference/pedagogy-rules.md`](reference/pedagogy-rules.md) to your `~/.claude/CLAUDE.md` so *every* guide Claude writes for you follows the rules by default.

> **Small guide?** If your idea fits one document and one sitting, tell Claude *"lite mode"* — it skips the heavy foundation/verification phases and collapses the ladder to the fewest rungs that each still prove something runnable. See [the lite-mode note](reference/milestone-design.md#lite-mode).

---

## The toolkit

| # | Tool | Invoke | Persistence | Use it when… |
|---|------|--------|-------------|--------------|
| 01 | [plan-guide](skills/plan-guide/prompt.md) | paste prompt / `/plan-guide` | one-shot | You have an idea and need the whole plan before writing anything. |
| 02 | [draft-milestone](skills/draft-milestone/prompt.md) | paste prompt / `/draft-milestone` | one-shot (or per-milestone re-draft) | The plan is approved and you're drafting the whole guide (name a milestone to re-draft just one). |
| 03 | [clarify-step](skills/clarify-step/prompt.md) | paste prompt / `/clarify-step` | per-step | A finished step is confusing, stale, or a reader got stuck. |
| 04 | [review-before-follow](skills/review-before-follow/prompt.md) | paste prompt / `/review-before-follow` | before acting | You're about to *execute* a guide and need it reconciled vs reality first. |

**Auxiliary tools** (outside the linear pipeline):

| Tool | Invoke | Use it when… |
|------|--------|--------------|
| [modernize-guide](skills/modernize-guide/prompt.md) | paste prompt / `/modernize-guide` | You have an existing tutorial / README / runbook to convert into a learn-as-you-go guide. |
| [audit-guide](skills/audit-guide/prompt.md) | paste prompt / `/audit-guide` | You want to QA a drafted guide against the contract before shipping it (read-only). |
| [scaffold-guide](skills/scaffold-guide/prompt.md) | paste prompt / `/scaffold-guide` | The plan is approved and you want the folders + foundation docs stamped out. |
| [update-stack](skills/update-stack/prompt.md) | paste prompt / `/update-stack` | A guide's framework/library versions have moved and you want them re-verified, the guide brought up to date, and re-audited. |
| [amend-guide](skills/amend-guide/prompt.md) | paste prompt / `/amend-guide` | What you want built has changed while someone is partway through the guide, and the work already done must survive it. |
| [mark-progress](skills/mark-progress/prompt.md) | paste prompt / `/mark-progress` | You finished a step, a sitting, or a milestone and want it recorded — the ledger `amend-guide` reads to know what it must not rewrite. |
| [report-issue](skills/report-issue/prompt.md) | paste prompt / `/report-issue` | A reader hit a real issue following the guide and you want the root cause fixed everywhere it appears, not just where they got stuck. |
| [log-feedback](skills/log-feedback/prompt.md) | paste prompt / `/log-feedback` | A reader hit friction and you want it recorded in the guide's `feedback-log.md` for later analysis — captured, not fixed (that's `report-issue`). |

**Repo maintenance** (for contributors to GuideForge itself — skill-only, no paste prompt):

| Tool | Invoke | Use it when… |
|------|--------|--------------|
| [pre-pr-check](skills/pre-pr-check/SKILL.md) | `/pre-pr-check` | You're about to open a PR against GuideForge and want every CONTRIBUTING rule + repo-consistency check confirmed first (read-only). |

**Templates** (in [`templates/`](templates/)): `readme.md`, `milestone-overview.md`, `step.md`, `verify.md`, `stack.md`, `status.md`, `progress.md`, `glossary.md`, `conventions.md`, `decision-log.md`, `feedback-log.md`.

**Reference** (in [`reference/`](reference/)): the deep-dives — [pedagogy rules](reference/pedagogy-rules.md), [milestone design](reference/milestone-design.md), [audience model](reference/audience-model.md), [canonical layout](reference/canonical-layout.md).

---

## Repository map

```
guide-forge/                      ← a single project = one Claude Code plugin
├── .claude-plugin/               ← plugin manifest + local marketplace (install as one unit)
│   ├── plugin.json
│   └── marketplace.json
├── README.md                     ← you are here (the storefront)
├── EXPLAINER.md                  ← everything explained from scratch — read this second
├── LICENSE                       ← MIT
├── CHANGELOG.md
├── CONTRIBUTING.md
├── package.json                  ← repo tooling only (`npm test`); deliberately carries no version
│
├── skills/                       ← one folder per tool: a SKILL.md wrapper + its prompt.md contract
│   │                               (prompt.md = the paste-in-any-chat twin AND the single source of truth)
│   ├── plan-guide/               ← pipeline 01 · SKILL.md + prompt.md
│   ├── draft-milestone/          ← pipeline 02 · SKILL.md + prompt.md
│   ├── clarify-step/             ← pipeline 03 · SKILL.md + prompt.md
│   ├── review-before-follow/     ← pipeline 04 · SKILL.md + prompt.md
│   ├── modernize-guide/          ← auxiliary · SKILL.md + prompt.md
│   ├── audit-guide/              ← auxiliary · SKILL.md + prompt.md
│   ├── scaffold-guide/           ← auxiliary · SKILL.md + prompt.md
│   ├── update-stack/             ← auxiliary · SKILL.md + prompt.md
│   ├── amend-guide/              ← auxiliary · SKILL.md + prompt.md
│   ├── mark-progress/            ← auxiliary · SKILL.md + prompt.md
│   ├── report-issue/             ← auxiliary · SKILL.md + prompt.md
│   ├── log-feedback/             ← auxiliary · SKILL.md + prompt.md
│   └── pre-pr-check/SKILL.md     ← repo maintenance (self-contained; no prompt.md)
│
├── templates/                    ← copy-paste scaffolds a generated guide uses
│   ├── readme.md                  ← the generated guide's front door (objective · stack · updates · step anatomy)
│   ├── milestone-overview.md      ← the 00_overview.md map (one screen: goal · prerequisite · steps · design index)
│   ├── step.md
│   ├── verify.md                  ← the NN_verify.md gate + full-file checkpoint + the milestone handoff
│   ├── stack.md                   ← verified versions + official doc links (from the web check)
│   ├── status.md                  ← the guide's state (milestones, drift, sessions) — the status authority
│   ├── progress.md                ← the reader's execution ledger, step by step (ticked by /mark-progress)
│   ├── glossary.md
│   ├── conventions.md
│   ├── decision-log.md
│   └── feedback-log.md            ← append-only reader-friction log (seeded by scaffold-guide)
│
├── reference/                    ← the method, explained
│   ├── pedagogy-rules.md
│   ├── milestone-design.md
│   ├── audience-model.md
│   ├── frontier-gate.md           ← what every editing skill asks you before it rewrites executed work
│   └── canonical-layout.md        ← the one fixed on-disk skeleton every guide uses
│
├── fixtures/                     ← complete generated guides, kept in-repo as TEST SUBJECTS
│   ├── idempotent-api-dotnet/            ← the canonical layout as actual files (5 milestones · 19 steps)
│   ├── color-picker-component-angular/   ← a browser-gated guide: no test runner, every gate is a page
│   └── color-picker-component-react/     ← the same picker on React: a controlled pair, stack the only variable
│
├── examples/                     ← what to type, and what came out
│   ├── real-examples.md           ← guides the pipeline produced, each linked in its own repo
│   ├── plan-guide-prompts.md      ← eight worked briefs, fully-specified and one-line
│   ├── pipeline-prompts.md        ← scaffold · draft · clarify · review-before-follow
│   └── maintenance-prompts.md     ← audit · update-stack · modernize · amend · mark-progress · report-issue · log-feedback
│
└── scripts/                      ← repo maintenance (run via `npm test` / `npm run …`)
    ├── check-version.mjs          ← the three version stamps agree (plugin.json / badge / CHANGELOG)
    ├── check-consistency.mjs      ← frontmatter, wrappers, counts, rule coverage, dead links/anchors
    ├── release.mjs                ← the ONLY intended way the version moves
    └── doctor.mjs                 ← is your installed plugin cache stale vs this working tree?
```

---

## Learning path

New here? Follow this order.

| Step | Read / do | You'll understand… |
|------|-----------|--------------------|
| 1 | [EXPLAINER.md](EXPLAINER.md) → "Philosophy" | Why learn-as-you-go beats a wall of steps. |
| 2 | [reference/audience-model.md](reference/audience-model.md) | The single most important input to any guide. |
| 3 | [reference/milestone-design.md](reference/milestone-design.md) | How to cut a ladder that always builds on a proven base. |
| 4 | [reference/pedagogy-rules.md](reference/pedagogy-rules.md) | The principles that make a step *teach*. |
| 5 | Run [skills/plan-guide/prompt.md](skills/plan-guide/prompt.md) on your own idea | The whole thing, hands-on. |

---

## What you can build

| You want… | Feed the idea… | You'll get a guide that teaches… |
|-----------|----------------|----------------------------------|
| A learning course | "a 2D platformer in Godot for a web dev" | Game-loop concepts, scene trees, physics — bridged from web mental models. |
| Onboarding docs | "our internal deploy pipeline for new hires" | Your house tooling, with the tribal knowledge made explicit. |
| A library tutorial | "a rate-limiter library in Rust" | Ownership, trait design, and testing — as the library grows. |
| A workshop | "build a RAG chatbot in an afternoon" | Embeddings, vector search, and prompt design, milestone by milestone. |
| A migration runbook | "move our REST API to gRPC" | The *why* behind each change, not just the diff. |

**See one for real.** [**examples/real-examples.md**](examples/real-examples.md) indexes guides the pipeline
produced, each published as its own repo — starting with a 25-step one that takes a total beginner to a
working 2D browser platformer, built end to end from the guide. The index separates those from guides that are
drafted and audited but **not yet followed through**, because only the first kind is evidence the teaching
works. For what to *type* rather than what comes out, see
[examples/plan-guide-prompts.md](examples/plan-guide-prompts.md).

---

## The pedagogy in one screen

Every generated step obeys the **pedagogy principles** (full detail + before/after in [reference/pedagogy-rules.md](reference/pedagogy-rules.md)):

1. **Explain what's new** — define every concept on first use at its topic's depth (inline, or a "New concept" callout right above the line); teach the recurring mental model where it first bites.
2. **Anchor every action** — say WHERE it happens (file / menu / command / URL), and WHAT it does and WHY.
3. **Leave nothing ambiguous** — exact values not ranges; mandatory vs illustrative marked; what to change vs leave at default; load-bearing vs cosmetic names flagged; a recurring value defined once and identical everywhere; every identifier the guide writes self-describing (`elapsedMs`, not `d`).
4. **Structure steps & code** — numbered lists, never arrow-chains; each code block directly under the instruction it implements; add to an existing file (fragment + a unique anchor), never re-paste it whole; every step ends on a green build — never "this error is expected, the next step fixes it" — and every step that changes the tree ends with a ready-made **suggested commit message** (code, settings, assets and config alike).
5. **Anticipate failure** — name the likely error and its usual cause.
6. **Prove the gate** — a Done-when must exercise the exact property it claims, and stay observable in the environment you told the reader to watch (no debug session or dev mode masking the signal).
7. **Declare the starting state** — never silently assume an install, a running service, a login, or a prior artifact.

---

## Best practices

**Do**

- Answer the audience interview honestly and specifically — it drives everything.
- Approve the plan before drafting. Fixing a ladder is cheap; re-drafting ten milestones is not.
- Verify each milestone's *Done-when* gate before moving to the next.
- Let the guide's `status.md` be the single source of truth for what's actually done.

**Don't**

- Skip Phase 0 to "save time" — a vague audience model produces a generic guide.
- Skip the plan-approval gate. The whole guide is drafted off the ladder in one pass — approve it wrong and that's ten milestones to redo.
- Trust a guide's "done" language over reality. Reconcile first (prompt 04).
- Over-explain what the reader already knows — that's as harmful as under-explaining.

---

## Tips for creating a guide

Best practices above are the short version. These are the ones that decide whether the guide comes out well —
how to hand the idea over, and how to cut the work once the ladder exists. Each tip names the skill that acts
on it, where one does.

### Getting the brief right

- **Describe the thing you're building, not the document you want.** One line naming the build and who it's
  for — *"a 2D platformer in Godot for a web dev"* — is a better input than *"write me a ten-chapter tutorial
  with an intro chapter on scene trees"*. The first lets [plan-guide](skills/plan-guide/prompt.md) cut the
  ladder from the build's real dependencies; the second pre-commits you to a structure you haven't tested and
  fights the design it's about to do. Say what "done" looks like as something you can *observe* — a running
  app, a passing suite, a deployed URL. **Skill:** [/plan-guide](skills/plan-guide/prompt.md).
- **Attach the context instead of describing it.** The brief isn't only the prompt line: a repo path, a spec,
  an OpenAPI file, sample code, a screenshot, a legacy doc. Provided sources are read as authoritative and
  pre-fill the interview, so a lockfile pins your real versions and a codebase supplies your real conventions
  — you confirm instead of dictating. Only one thing no attachment can supply: **context describes the build,
  never the reader.** **Skill:** [/plan-guide](skills/plan-guide/prompt.md) — or
  [/modernize-guide](skills/modernize-guide/prompt.md) when the context *is* an existing doc.
- **Rate yourself per topic, never overall.** This is the highest-leverage answer in the whole pipeline. "I'm
  intermediate" produces a guide that over-explains what you already know and skims what you don't. Split it:
  expert in the language, new to the ORM, beginner at Docker. Each rating sets the explanation depth for that
  topic independently. If the reader isn't you, answer as *them* — an honest model of a beginner beats a
  flattering model of yourself. **Skill:** [/plan-guide](skills/plan-guide/prompt.md).
- **Choose a version for every tool, explicitly** — a specific one you name, or "latest" so the online check
  resolves it. Don't supply version numbers from memory, yours or the model's; that's what the stack
  verification pass is for. **Skill:** [/plan-guide](skills/plan-guide/prompt.md) — later,
  [/update-stack](skills/update-stack/prompt.md) re-verifies those pins.
- **Name the non-goals.** Scope boundaries keep a guide tight more reliably than goals do — "no auth, no
  deployment, no multiplayer" prevents more sprawl than any amount of describing what you do want. They shape
  the *ladder*, not the prose: the guide itself never lists what it isn't doing, because a reader learns
  nothing from an absence. **Skill:** [/plan-guide](skills/plan-guide/prompt.md).
- **Answer the advise-back gate properly.** Before planning, you get suggested capabilities and the long-run
  risks of your choices. Accept or reject each one deliberately: what you accept shapes the ladder, and what
  you knowingly reject is recorded in the decision log, so the *why* survives to whoever reads the guide later.
  **Skill:** [/plan-guide](skills/plan-guide/prompt.md).
- **Decide build vs borrow yourself — row by row.** Parts of any build are already solved by a library, and a
  guide left to its own devices will happily generate 90 lines of colour conversion instead of naming the
  colour library that has existed for a decade. The plan puts every such capability to you in a table:
  the verified off-the-shelf option, what borrowing costs, what building teaches, a recommendation — and your
  call. Set the default posture once (borrow-first / balanced / build-first), then override per row; flipping
  one before approval re-cuts a milestone, which is cheap, while flipping it after you've built is an
  amendment. Both directions land in the guide: build steps carry a callout naming the library they replace
  (rule 3.7), borrow steps say in one clause what the library does for you.
  **Skill:** [/plan-guide](skills/plan-guide/prompt.md) — later,
  [/amend-guide](skills/amend-guide/prompt.md) to swap one mid-build.

### Dividing the work

- **Cut by capability, not by layer.** The one decomposition mistake that ruins a guide is horizontal slicing:
  all the models, then all the repositories, then all the handlers — nothing runnable until the end and no
  gate to check along the way. Every milestone should be a **vertical slice** that runs and can be observed,
  spanning whatever layers it needs. Full treatment in
  [reference/milestone-design.md](reference/milestone-design.md). **Skill:**
  [/plan-guide](skills/plan-guide/prompt.md).
- **Spend your attention on the ladder table, not the prose.** Plan approval is the gate that matters, because
  the entire guide is drafted off the ladder in one pass. Read the table against four mechanical checks: the
  first rung is the thinnest *runnable* thing (proves the toolchain, no real logic); each rung depends only on
  rungs below it; each Done-when is something you can watch happen, not a claim like "the persistence layer is
  complete"; and no rung uses a symbol a later rung introduces. Fixing the table costs minutes — re-drafting
  off a wrong table costs the whole guide. **Skill:** [/plan-guide](skills/plan-guide/prompt.md) — this is its
  approval gate.
- **Know which unit you're dividing by.** A **step** is one indivisible action, ending on a green build and on
  one commit (the guide writes the message). A **sitting** is a run of steps ending at a natural stopping
  point — that's where you tell the reader they can close the laptop for the day. A **milestone** is a capability with a gate. Group steps into sittings; don't lengthen a
  step to fill one. **Skill:** [/plan-guide](skills/plan-guide/prompt.md) sets the granularity,
  [/draft-milestone](skills/draft-milestone/prompt.md) cuts the actual steps.
- **Build the capability in the milestone that consumes it.** If a milestone adds a public function nothing in
  that milestone calls, either it belongs later or it's a declared deferral — mark it `[Mn]` naming the
  milestone that uses it. Unmarked, uncalled members leave dead code the reader can't verify. **Skill:**
  [/plan-guide](skills/plan-guide/prompt.md); [/audit-guide](skills/audit-guide/prompt.md) flags the ones that
  slipped through.
- **Scaffold before drafting, and re-draft narrowly after.** [scaffold-guide](skills/scaffold-guide/prompt.md)
  stamps the skeleton and foundation docs so drafting fills a real tree.
  [draft-milestone](skills/draft-milestone/prompt.md) then writes every milestone in one pass — but when
  something comes out wrong, re-run it on *that one milestone*, or
  [clarify-step](skills/clarify-step/prompt.md) on that one step. Re-drafting everything to fix one step
  throws away work that was already good. **Skill:** the chain above — `/scaffold-guide` → `/draft-milestone`
  → `/clarify-step` for the narrow fixes.
- **Scale the apparatus to the guide.** One document, one sitting? Say "lite mode" — the foundation docs and
  verification design are skipped, the ladder collapses to the fewest rungs that each still prove something
  runnable, and the two things that always matter survive: the audience model and the pedagogy contract.
  **Skill:** [/plan-guide](skills/plan-guide/prompt.md) — say "lite mode" in the brief.
- **Audit the guide as soon as it's drafted — once.** The drafting pass is the cheapest place to catch a
  defect, and the reader's first hour is the most expensive: a dead `glossary.md#term` link, a step with no
  *Done when*, a milestone marked `✅` nothing records passing. Run the audit on the fresh draft, fix what it
  ranks as a blocker, and stop there — it's read-only by design, so it hands you a list, not a rewrite loop.
  **Skill:** [/audit-guide](skills/audit-guide/prompt.md), then
  [/clarify-step](skills/clarify-step/prompt.md) on the steps it flags.
- **Reconcile with reality right before you execute.** Whatever time passes between drafting the guide and
  building against it, the world may have moved in it — APIs, file layouts, console UI. This is the one check
  worth running *again* later, because it costs a minute and it fails loudly. **Skill:**
  [/review-before-follow](skills/review-before-follow/prompt.md).
- **The goal is the thing you're building, not a perfect guide.** The guide is scaffolding for a project you
  actually want to exist; past the first audit, extra polishing passes buy less than the first hour of
  building does. A defect you meet while following the guide is cheaper to find than one you hunted for in the
  abstract — and it comes with the exact context needed to fix it properly. So ship the draft, start step 01,
  and let the maintenance skills repair the guide from real friction as you hit it. **Skill:** none — that's
  the point; when something does break, [/report-issue](skills/report-issue/prompt.md).

---

## Tips for following a guide

Everything above is for *making* a guide. These are for the person **following** one — read them before
you start building against it. Each tip names the skill that acts on it, where one does.

- **Install the exact versions in `foundation/stack.md`.** The whole guide was written and verified against
  that snapshot — every command, flag and API name in it. Reaching for `latest` instead puts you on a
  different stack than the one the steps describe, and the mismatch rarely announces itself as a version
  error: it shows up as a flag that no longer exists or a default that quietly changed. **Skill:** none to
  install them — but [/update-stack](skills/update-stack/prompt.md) if you'd rather move the guide to the
  current releases than pin yourself to its snapshot.
- **Read the milestone's `00_overview.md` before its steps.** It tells you what this milestone builds and the
  one gate that proves it. Knowing the destination makes steps that look arbitrary in isolation obvious —
  and tells you what "done" means before you spend an hour on it. **Skill:** none — just read it.
- **Read a step all the way through before you type anything.** Code sits interleaved under the instruction
  that introduces it, so instruction 3 can change where instruction 1's fragment belongs. One read-through
  first, then act. **Skill:** [/clarify-step](skills/clarify-step/prompt.md) if the step still reads
  ambiguously after that read-through.
- **Don't just copy-paste.** Every step tells you *where* the code goes and *why* it's there — that context is
  the point. Type it, or at minimum read the explanation before you paste the block. A guide you paste your
  way through teaches you nothing, and you won't be able to debug it when it breaks. **Skill:** none.
- **Commit at the end of every step.** Every step is cut so it ends with the project building, which makes
  each step boundary a safe restore point — one you get for free and most readers never use. Name the commit
  after the milestone and step you just finished, so the log reads as your path through the guide and
  `git diff` against the previous commit shows exactly what that step changed:
  `M2 step 03 — add the books route`. **Skill:** none — this one is yours.
- **Mark a step done the moment you finish it, not at the end of a sitting.** Ticking it in
  `foundation/progress.md` takes one line — `/mark-progress M2/03` — and that ledger is the only record of
  where you actually are: it's what lets `/amend-guide` change the guide later *around* the work you've
  already built instead of over it, and an unticked guide is one those skills must treat as entirely unbuilt.
  Mark the milestone too when its gate passes, and the marks stay honest: nothing goes `✅` on a gate you
  didn't watch pass. **Skill:** [/mark-progress](skills/mark-progress/prompt.md).
- **Don't skip the `NN_verify.md` checkpoint at the end of a milestone.** It holds the milestone's real gate,
  checked by hand — and the only complete, paste-able copy of every file the milestone touched. If you
  suspect you've drifted, that's the file you diff against. Skipping it means finding out two milestones
  later, where the failure no longer points at what caused it. **Skill:**
  [/mark-progress](skills/mark-progress/prompt.md) — it's what records that the gate passed.
- **Follow the whole guide before adding your own changes.** Resist the urge to refactor, rename, or expand as
  you go. Later steps build on the exact state the earlier ones left behind — file names, function signatures,
  folder layout — so an early "improvement" can make the next steps hard or impossible to follow. Reach the
  last milestone's *Done-when* gate first, then make the project yours. **Skill:**
  [/amend-guide](skills/amend-guide/prompt.md) when the change isn't a whim but a real change of plan — it
  folds it into what's ahead of you and leaves what you've built alone.
- **Keep `foundation/glossary.md` open.** When a term you don't know shows up, look it up instead of
  pattern-matching the code around it. The guide defines its vocabulary on purpose — the definitions are what
  let you read the *next* step without guessing. **Skill:** [/clarify-step](skills/clarify-step/prompt.md)
  when a step uses a term the glossary never defined.
- **When something breaks, read the step's failure note first.** Every step names the error you're most likely
  to hit and its usual cause. The answer is often already on the page, before you open a search engine.
  **Skill:** [/report-issue](skills/report-issue/prompt.md) if the note didn't cover it — the fix then lands
  everywhere that defect appears, not just where you hit it.
- **Don't hand a milestone to the AI.** Asking a model to "just do this part for me" produces exactly the code
  you can't reason about — the problem the guide exists to avoid. Ask it to *explain* a step you're stuck on,
  not to complete it. **Skill:** none — deliberately.
- **Assume the guide can be wrong or out of date.** It was written against a snapshot of the world. Steps that
  touch **external platforms** — cloud consoles, dashboards, OAuth screens, app stores, third-party APIs — age
  fastest: buttons get renamed, settings move, free tiers change, endpoints get deprecated. If what you see
  doesn't match what the step describes, trust the platform and adapt, don't force the guide's exact wording.
  Running `/review-before-follow` before you start catches much of this up front. **Skill:**
  [/review-before-follow](skills/review-before-follow/prompt.md), and
  [/update-stack](skills/update-stack/prompt.md) when the pins themselves have moved.
- **Report the friction you hit.** The exact place you got stuck is the most valuable data the guide can get.
  **Skill:** [/report-issue](skills/report-issue/prompt.md) if you want the guide fixed,
  [/log-feedback](skills/log-feedback/prompt.md) if you just want it recorded.

---

## FAQ

**Is this only for Claude Code?**
No. Each skill's `prompt.md` is a paste-into-any-chat prompt that works in any Claude conversation (or the API); the `SKILL.md` wrappers are just the Claude Code convenience layer over those same prompts.

**Does it write the whole guide automatically?**
Yes — once you approve the plan, `draft-milestone` drafts every milestone in one pass, so you have the finished guide before you build. The human gate is **plan approval** (get the ladder right before ten milestones are written off it); you then build against the guide, verifying each milestone's *Done-when* gate as you go.

**How is this different from "write me a tutorial" prompts?**
Those generate content. GuideForge generates a *verified, milestone-gated, audience-modeled plan* and then teaching step-files — with an explicit, rule-by-rule writing contract. See [Why this exists](#why-this-exists).

**Can I use it for non-code guides?**
It's tuned for software, but the method (audience model → ladder → gated steps) transfers to anything procedural. Your mileage varies.

**How do I keep a generated guide from going stale?**
Use prompt 04 (review-before-follow): before executing a guide against real code/tools, reconcile it — reality wins, and you log the drift in `status.md`.

**What if what I want built changes when I'm halfway through?**
Run `/amend-guide`. It reads `foundation/progress.md` to find where you actually stopped, shows you an impact report, and only writes once you approve it: everything ahead of you gets rewritten freely, everything you've already executed stays exactly as you followed it, and anything the change invalidates gets a *Before you continue — corrections* section in the next step you'll open. So keep the ledger ticked — it's the whole basis of that guarantee.

**Where did this come from?**
Distilled from a real doc-driven, solo-dev build system. See [Credits](#credits--inspiration).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Plan feels generic | Audience interview answered vaguely | Re-run Phase 0; rate each topic concretely on the per-topic matrix (Expert → New). |
| Milestones can't be run on their own | Ladder was cut into horizontal layers | Re-cut into vertical slices — see [milestone-design.md](reference/milestone-design.md). |
| Steps are too long / do many things | Atomicity rule ignored | Run [clarify-step](skills/clarify-step/prompt.md); split by "one indivisible action." |
| Reader keeps hitting undefined terms | Rule 1.1 not applied | Run clarify-step; add a per-step glossary. |
| Guide worked once, breaks now | Drifted from reality | Run [review-before-follow](skills/review-before-follow/prompt.md). |

---

## Built something with GuideForge?

**No attribution is required.** The [MIT licence](LICENSE) doesn't ask for it, and a guide you generated is
yours — ship it, sell it, put your own name on it.

If you *want* to credit it, one line in your guide's README is plenty:

```markdown
Built with [GuideForge](https://github.com/tomthebearded/guide-forge) `v<x.y.z>`.
```

Naming the **version** is the part worth keeping. The layout and conventions move between releases, so it
tells a reader which shape of the method they're looking at — and tells you, later, whether re-running the
maintenance skills would change anything. If you scaffolded the guide, `foundation/status.md` already records
it as `Generated with GuideForge v<x.y.z>`.

**Want it listed here?** Publish the guide as its own repository, then open a PR adding it to
[examples/real-examples.md](examples/real-examples.md) — a heading, the link, the version you generated it
with, and two lines. Guides live in their own repos and get linked, never vendored into this one: GuideForge
ships the method, and the output is yours. Details in [CONTRIBUTING.md](CONTRIBUTING.md).

Real output is the most convincing thing this repo can point at, especially for a domain nobody has covered
yet.

---

## Credits & inspiration

- **Method** distilled from a real doc-driven, milestone-laddered solo-dev build kit (the "learn-as-you-go, milestone-laddered" workflow, an atomic step-file contract, and a trigger-gated clarity protocol).
- **Repo shape** inspired by the excellent [luongnv89/claude-howto](https://github.com/luongnv89/claude-howto).
- Built to be **meta-prompting** in the classic sense — one reusable prompt that solves a whole category of tasks.

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE) © 2026 GuideForge.
