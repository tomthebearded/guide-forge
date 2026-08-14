# Prompt examples — `plan-guide` (the generation skill)

Eight worked briefs for [`skills/plan-guide/prompt.md`](../skills/plan-guide/prompt.md), the entry point of
the pipeline. Each shows the invocation, what to attach, the interview answers that actually shaped the plan,
and the one lesson it illustrates.

**They come in two shapes.** The first two are **fully specified** — you already know the answers, so you
write them down in one message. The rest are **one-liners** that let the interview draw the answers out. Both
are first-class; pick by how much you actually know, not by how much effort the prompt looks like.

**The plain-chat form of every example below** is the same: copy
[`skills/plan-guide/prompt.md`](../skills/plan-guide/prompt.md) into a new conversation, replace `{{IDEA}}`
with the text after the slash command, and answer the questions it asks. The slash command is only a wrapper.

**Read these as filled-in answers, not as defaults.** The versions, ratings and boundaries below are one
reader's; yours come from your own build. What every example has in common is *what* it specifies: the thing
being built, who reads it, and what's out of scope — never how many milestones to cut or what each one covers.
See [Tips for creating a guide](../README.md#tips-for-creating-a-guide).

---

## 1 — Fully specified: a mobile app, on a deadline

You know the build, the stack, and your own gaps. Write it all in one message — the interview then collapses
to a confirmation instead of seven round-trips.

```
/plan-guide Build a Flutter app called Trailhead that logs hikes: start/stop a hike, record the
GPS track, save it locally, and list past hikes with distance and duration. Solo project.

END STATE — a debug build on my own Android phone that records a 20-minute walk, survives the
app being backgrounded, and shows the hike in the list with the right distance after a restart.

STACK — Flutter, current stable; Dart; Riverpod for state; drift (SQLite) for storage;
geolocator for GPS; Android first, iOS not at all for now; VS Code as the editor.
Pin whatever versions you verify — I have no preference, but tell me what you picked.

ME, PER TOPIC — Dart: New. Flutter widgets/layout: Beginner. Reactive state management:
Beginner (I've read about it, never shipped it). Backend/REST: Expert. SQL: Expert.
Mobile permissions and app lifecycle: New. Android tooling/emulators: New.

GRANULARITY — standard, but spell out anything touching the Android toolchain.

OUT OF SCOPE — no accounts, no cloud sync, no maps rendering, no background recording with the
screen off, no Play Store release.

CONSTRAINTS — a real device, no emulator, for anything GPS. I have two weekends.

SIZE — folder of many small files.
```

**What still happens anyway.** Front-loading answers doesn't skip the gate: the planner still runs Phase 0,
but every question arrives pre-filled from what you wrote, so you confirm rather than answer. The online stack
check still runs — that's where "current stable" turns into real pinned versions with doc links, and it's why
you should never supply version numbers from memory. And the advise-back step still fires before any planning:
suggested capabilities you didn't ask for, and the long-run risks of your choices — here, almost certainly that
"no background recording" collides with what a hiking app is for.

**What not to front-load.** Facts about the build, yes. The *shape of the document*, no. Nothing above tells
the planner how many milestones to cut or what each chapter covers — that's the ladder's job, and it's the
part you have the least information about before the stack is verified.

---

## 2 — Fully specified: a data pipeline, from a spec you already wrote

```
/plan-guide Build the nightly ingest pipeline described in the attached spec: pull yesterday's
orders from the partner SFTP drop, validate them, load into Postgres, and emit a run report.
Turn it into a guide I can hand to the analyst who'll own it after me.

END STATE — `make nightly` runs end to end against the sample drop in the repo, writes rows to a
local Postgres, and prints a report with counts of accepted/rejected records; `pytest` is green
including a test for a malformed file.

STACK — Python 3, current stable; uv for dependency management; Postgres 16 in Docker for local
runs; pytest; no orchestrator yet (cron calls make).

THE READER, PER TOPIC — Python: Intermediate. SQL: Expert. pandas: Expert. Type hints and
packaging: Beginner. pytest: Beginner. Docker: New. Error handling and retries: New.
Note: rate the reader, not me — I'm not the one following this.

GRANULARITY — highly granular for anything about failure handling; terse for the SQL.

OUT OF SCOPE — no Airflow/Dagster, no incremental loads, no alerting integration, no dbt,
no deployment to the server (that's a separate runbook).

CONSTRAINTS — the partner's file format is fixed and documented in the spec, section 3.
The pipeline must be re-runnable for the same day without duplicating rows.

SIZE — one week of evenings; folder of many small files.
```

**Attach:** the spec, one real (redacted) sample file from the drop, and the existing `Makefile` if there is
one.

**What it shows.** The clearest brief of all — a spec plus an explicit statement of *who reads the guide*.
Note the line doing the heavy lifting: **"rate the reader, not me"**. When you're writing a guide for someone
else, the per-topic ratings are theirs, and it's the one input no attachment can supply. The rest — the format
in section 3, the re-runnability constraint — comes from the spec, and the planner marks which facts came from
a source versus from you.

---

## 3 — Greenfield service, the plain case

```
/plan-guide a REST API for a bookstore in Go
```

**Interview answers that shaped it**

| Question | Answer |
|---|---|
| Per-topic expertise | Go **Intermediate** · HTTP/REST **Expert** · SQL **Beginner** · the migration tool **New** · Docker **Beginner** |
| Granularity | Standard |
| End state | `go test ./...` green and `curl localhost:8080/books/1` returns a stored record after a restart |
| Stack | Go **latest stable** (resolve it online) · `net/http` stdlib, no framework · SQLite via `modernc.org/sqlite` · `go mod` |
| Non-goals | No auth, no pagination, no deployment, no Docker Compose |
| Constraints | Must run offline after `go mod download`; single binary |
| Size | A weekend; folder of many small files |

**What it shows.** The baseline. One line in, seven answers, a ladder out. Note the expertise split doing real
work: HTTP gets named and never explained, while every migration-tool concept gets defined on first use — the
same guide, two depths, decided by the reader model rather than by an overall "intermediate".

---

## 4 — A total beginner, maximum hand-holding

```
/plan-guide a 2D platformer in Godot for someone who has never written code
```

**Interview answers that shaped it**

| Question | Answer |
|---|---|
| Per-topic expertise | Programming **New** · GDScript **New** · the Godot editor **New** · vector math **New** · Git **New** |
| Granularity | Highly granular / tutorial |
| End state | A `.exe`/web build you can hand to a friend: a character that runs, jumps, dies to a hazard, and reaches a goal |
| Stack | Godot **latest stable** · GDScript · Windows first, web export at the end |
| Non-goals | No multiplayer, no save system, no art pipeline (use the engine's placeholder shapes) |
| Constraints | Free tools only; the reader has never installed a dev tool before |
| Size | Multi-week course; folder of many small files |

**What it shows.** *New* across the board is not the same as "explain more" — it changes the guide's shape.
Every concept gets a deep-dive callout and extra failure notes, the first rung is *"the editor opens and a
grey rectangle appears on screen"*, and "declare the starting state" stops being pedantry: nothing is
installed, so the guide installs it.

---

## 5 — Onboarding, against an existing codebase

```
/plan-guide onboarding for new hires on our deploy pipeline
```

**Attach:** the repo path (or the `infra/` directory), the runbook people actually paste from, one real CI
config, and a redacted `.env.example`.

**Interview answers that shaped it**

| Question | Answer |
|---|---|
| Per-topic expertise | The language **Expert** · our house tooling **New** · Kubernetes **Beginner** · the CI system **Intermediate** |
| Granularity | Standard |
| End state | The hire deploys a one-line change to staging on their own and can roll it back |
| Stack | *(read from the repo — confirm what the planner proposes)* |
| Non-goals | No cluster administration, no on-call procedures, no cost tuning |
| Constraints | Must not touch production; VPN required; existing conventions win over anything nicer |
| Size & language | Two afternoons; folder of many small files; prose in **Italian** (the team's working language) |

**What it shows.** Attachments beat description: the manifests supply the real stack, the CI config supplies
the real commands, and you confirm rather than dictate. But note what the repo *cannot* tell it — your hires'
per-topic expertise. Context describes the build, never the reader, so Q1 and Q2 still get asked. The language
answer is the other thing no attachment settles: it lands in `conventions.md` so every later skill keeps
writing Italian — while the file names, section headings, nav labels and commands stay English, as in every
guide.

---

## 6 — A library, expert language, unfamiliar domain

```
/plan-guide a rate-limiter library in Rust
```

**Attach:** the algorithm write-up you're implementing (a paper, an RFC section, or a blog post with the
pseudocode), plus the public API sketch if you have one.

**Interview answers that shaped it**

| Question | Answer |
|---|---|
| Per-topic expertise | Rust **Expert** · async/Tokio **Intermediate** · rate-limiting algorithms **New** · benchmarking **Beginner** |
| Granularity | Terse / reference |
| End state | A published crate: token-bucket + sliding-window, documented, `cargo test` and a criterion benchmark green |
| Stack | Rust **latest stable** · Tokio · `criterion` for benchmarks · `cargo` |
| Non-goals | No distributed/Redis-backed limiting, no HTTP middleware wrapper, no `no_std` |
| Constraints | Public API must stay `Send + Sync`; MSRV pinned to whatever the plan verifies |
| Size | A week; one document per milestone |

**What it shows.** The inverse of example 4, and the case people get wrong most often. *Expert* in the
language plus *New* in the domain means almost no syntax explanation and a lot of algorithm explanation. Rated
"advanced" overall, this guide would have explained ownership and skipped why a sliding window needs two
counters.

---

## 7 — Small idea, lite mode

```
/plan-guide lite mode — add GitHub OAuth login to an existing Next.js app
```

**Attach:** the app's `package.json` and the file where your session handling currently lives.

**Interview answers that shaped it**

| Question | Answer |
|---|---|
| Per-topic expertise | React/Next.js **Expert** · OAuth **Beginner** · the auth library **New** · cookies/sessions **Intermediate** |
| Granularity | Standard |
| End state | Sign in with GitHub, the session survives a refresh, sign out clears it |
| Stack | *(read from `package.json`; versions confirmed online)* |
| Non-goals | No other providers, no roles/permissions, no account linking, no email flows |
| Constraints | Existing app — don't restructure it; the provider's console UI may have moved since any tutorial |
| Size | One document, one sitting |

**What it shows.** Lite mode drops the foundation docs and the verification-design phase and collapses the
ladder to the fewest rungs that each still prove something runnable — while keeping the two things that always
matter, the audience model and the pedagogy contract. Note the constraint about the provider console: steps
that touch external dashboards age fastest, which is what `review-before-follow` exists for.

---

## 8 — Automation, no interview

```
/plan-guide no questions — a CLI that syncs Notion pages to local Markdown
```

**What it shows.** The only mode that skips Phase 0. Use it when nobody is at the keyboard — a scheduled run,
a batch of briefs, a scripted pipeline. In exchange the planner must state **every** assumption loudly at the
top of the plan, especially the guessed audience model, and it defaults each tool to the current stable LTS
rather than the newest major. The online stack check still runs — that one never depends on you.

**Read the assumptions block first.** It is the interview you didn't have, written down. If the guessed
audience model is wrong, that is the cheapest possible moment to fix it: re-run with real answers instead of
approving a ladder built for a reader who doesn't exist.

---

## Next

Approve the plan, then continue with [pipeline-prompts.md](pipeline-prompts.md) — scaffold, draft, and the two
skills that keep a drafted guide honest.
