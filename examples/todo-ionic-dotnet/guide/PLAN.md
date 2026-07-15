# PLAN — Todo app: Ionic-Angular frontend + .NET in-memory backend

> GuideForge stage-1 deliverable. This is the **plan the guide was drafted from**, not the guide.
>
> ⚠️ **Historical artifact — the frontend pin below is superseded.** This plan specifies **Angular 22 +
> Vitest + TS 6.0** throughout (§1 end-state/scope/risks, §2 stack, §4 ladder). After the Phase 0.5 web
> check the frontend was re-pinned to **Angular 20.3 + Karma/Jasmine + TS 5.9** — what `ionic start` actually
> scaffolds today. The **built guide follows [decision D5](foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade)**, not this document. For the current pins see
> **[foundation/stack.md](foundation/stack.md)**.

---

## 1. Brief & audience model

**The idea.** A small to-do app: an **Ionic-Angular** frontend talking over HTTP/REST to a **.NET 10 minimal
API** backend whose data lives in an **EF Core in-memory database** (data persists only while the API process
runs). Full CRUD, plus a test suite on both sides.

**Resolved Phase 0 answers** (all from the interview; no source files were provided):

| # | Question | Answer |
|---|----------|--------|
| 1 | Per-topic expertise | **Graded** — see matrix below. Frontend **Intermediate** (knows Angular basics, *new to Ionic*); Backend **Expert**. |
| 2 | Granularity | **Standard** — default atomic step size, moderate prose. |
| 3 | Target end state | A running Ionic app in the browser that **lists, adds, toggles-done, edits, and deletes** todos against the live .NET API; `dotnet test` green (xUnit) **and** `ng test` green (Vitest). |
| 4 | Tech & stack | Ionic 8 + Angular 22 (standalone), .NET 10 minimal API, EF Core InMemory, Vitest + xUnit v3. **Latest stable**, pinned in §2. |
| 5 | Scope | **Core CRUD + tests, both apps.** In-scope: add / list / toggle-done / edit / delete; backend xUnit tests; frontend Vitest tests; dev-time CORS; loading/empty/error UX. |
| 6 | Hard constraints | **One repo, two folders** (`backend/` + `frontend/`). In-memory only (no persistence across restart). |
| 7 | Format & size | Folder of many small step files. Weekend-sized. |

**Per-topic explanation-depth matrix** (the guide's north star — depth is matched per topic, not globally):

| Topic | Level | Depth policy in the guide |
|-------|-------|---------------------------|
| TypeScript | Intermediate | One-line reminder + doc link; skip fundamentals. |
| Angular (standalone, signals, DI, HttpClient) | Intermediate | One-line reminder + doc link; assume components/DI known. Signals get a short note (reader may be pre-v19). |
| **Ionic components / CLI / theming** | **Beginner** | **Define on first use + doc link + brief why.** This is the reader's new territory — `ion-*` components, `ionic serve`, theming variables all get explained. |
| HTTP / REST | Intermediate | One-line reminder + doc link. |
| .NET / C# 14 / minimal APIs | Expert | Name only. No definitions, no doc links except a specific gotcha. |
| EF Core (DbContext, InMemory provider) | Expert | Name only — **but** the InMemory-for-testing caveat is flagged once (specific gotcha, see §6 risk). |
| xUnit v3 | Expert | Name only — **but** the v3-template gotcha is called out (specific gotcha). |
| Vitest / Angular test runner | Intermediate | One-line + doc link. |
| CORS | Expert | Name only — gotcha: `UseCors` ordering + dev origin. |

**Out of scope** (named to stop sprawl): authentication / users, real persistence (SQL Server/Postgres/SQLite
files), deployment / hosting / Docker, mobile native builds (Capacitor / iOS / Android), pagination, and
optimistic concurrency. Every one is a natural "later" — flagged in the handoff of the last milestone.

**Accepted feature suggestions:** filtering (All / Active / Done) and inline edit are folded into the CRUD
milestones (they're cheap and make the app feel real). Loading / empty / error states become the polish
milestone. Everything else stays out of scope.

**Acknowledged long-run risks** (also in the decision log):

1. **EF Core InMemory + a test suite.** Microsoft **explicitly discourages** the InMemory provider for
   testing — it doesn't enforce constraints, transactions, or relational semantics, and can make tests pass
   that would fail against a real DB. Their recommended fake is **SQLite in-memory**. *The reader asked for an
   in-memory DB, so we keep EF InMemory as the app's store* — but the guide's **backend tests will not lean on
   it as a database fake**; they exercise the API through `WebApplicationFactory` (real HTTP pipeline, real
   DbContext), and a decision-log note records the trade-off and the SQLite escape hatch. **Recommendation
   baked into the plan; flag at approval if you'd rather swap the store to SQLite-in-memory.**
2. **Angular 22 is signal-first and standalone-only by default.** A reader whose "Angular basics" predate v19
   will meet `bootstrapApplication`, no `NgModule`, and signals. Mitigated by a short orientation note in M4
   and Intermediate-depth reminders — not a full Angular course.
3. **TypeScript 6.0 line.** Angular 22 requires TS `>=6.0 <6.1`. Readers on TS 5.x tooling must let the
   scaffold pin it; the guide never installs TS by hand.
4. **xUnit v3 template friction.** `dotnet new xunit` still scaffolds **v2**; v3 needs an extra template
   install. Handled explicitly in M3 so it can't bite.

---

## 2. Verified stack (checked 2026-07-10, official sources)

> ⚠️ **Historical — superseded by [decision D5](foundation/decision-log.md#d5--follow-the-ionic-scaffolds-angular-203--karma-not-a-forced-upgrade).** This section (and the ladder/scope above) reflects the *originally approved* plan: **Angular 22 + Vitest + TS 6.0**. After the Phase 0.5 web check, the frontend was re-pinned to **Angular 20.3 + Karma/Jasmine + TS 5.9** (what `ionic start` actually scaffolds today). The **built guide follows D5**, not this table. For the current pins see **[foundation/stack.md](foundation/stack.md)**.

| Tool / library | Pinned version | Latest stable (as of 2026-07-10) | Official docs | Notes |
|----------------|----------------|-----------------------------------|---------------|-------|
| Node.js | 24 (Active LTS) | v24 "Krypton" | https://nodejs.org/en/about/previous-releases | Angular 22 engines: `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0`. Use 24 LTS. |
| Angular | 22.0.x | 22.0.6 (v22.0.0: 2026-06-03) | https://angular.dev/reference/releases | Standalone is the **default**; signal-first. No `NgModule` in new apps. |
| TypeScript | 6.0.x | 6.0.x | https://angular.dev/reference/versions | Angular 22 peer dep `>=6.0 <6.1`. Pinned by the scaffold — don't install by hand. |
| @ionic/angular | 8.8.x | 8.8.13 | https://ionicframework.com/docs/angular/overview | Standalone components via `@ionic/angular/standalone` (since v7.5). Peer `@angular/core >=16`. |
| @ionic/cli | 7.2.x | 7.2.1 | https://ionicframework.com/docs/cli/commands/start | `ionic start app blank --type angular-standalone`. |
| Vitest (via `@angular/build:unit-test`) | Angular-managed | *exact number unverified* | https://angular.dev/guide/testing/migrating-to-vitest | **Default unit-test runner for new Angular projects.** We do **not** pin Vitest ourselves — the scaffold owns it. Migration of existing projects is experimental; a fresh scaffold is not. |
| .NET SDK / runtime | 10.0.x (LTS) | 10.0 (GA 2025-11-11) | https://learn.microsoft.com/dotnet/core/whats-new/dotnet-10/overview | LTS to 2028-11-10. Ships **C# 14**. |
| C# | 14 | 14 | https://learn.microsoft.com/dotnet/csharp/whats-new/csharp-14 | Default lang version on .NET 10. |
| Minimal APIs | ASP.NET Core 10 | — | https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis | Docs (May 2026): "For new projects, we recommend using Minimal APIs." |
| Microsoft.EntityFrameworkCore.InMemory | 10.0.x | 10.0.9 | https://learn.microsoft.com/ef/core/providers/in-memory/ | EF Core 10. Microsoft **discourages for testing** — see decision log. |
| xUnit v3 | 3.2.x | 3.2.2 (2026-01-14) | https://xunit.net/docs/getting-started/v3/getting-started | `dotnet new xunit` = **v2**. For v3: `dotnet new install xunit.v3.templates` → `dotnet new xunit3`. |

> **One version per tool for the whole guide.** Every milestone and code block imports these exact versions.
> The only deliberately unpinned item is Vitest's patch number (Angular's scaffold resolves it) — flagged so
> it doesn't read as an omission.

---

## 3. Foundation docs (the cross-cutting layer — `guide/foundation/`)

- **README** (`guide/README.md`) — thin front door: objective (the observable end state), one-line stack
  summary, the 3 headline decisions (Ionic standalone components · .NET minimal API · EF Core InMemory store),
  an **Updates** log, and a "Following this guide" note (type the code, don't paste — the full files are a
  reference to diff against). Links to `stack.md` / `decision-log.md`; does **not** duplicate them.
- **`foundation/stack.md`** — the §2 table verbatim + check date.
- **`foundation/audience-model.md`** — the per-topic matrix + Standard granularity, as the writing north star.
- **`foundation/conventions.md`** — naming & structure rules: `backend/` (C# PascalCase, minimal API in
  `Program.cs`, feature files), `frontend/` (Angular standalone, `kebab-case` files, `TodoApi` service,
  signals for state), the shared **Todo** shape (`id: number`, `title: string`, `isDone: boolean`), the API
  contract (`/api/todos`, verbs, status codes), and the dev ports (**backend `http://localhost:5080`**,
  **frontend `http://localhost:8100`** — Ionic's default `ionic serve` port).
- **`foundation/glossary.md`** — running plain-language defs, growing as steps introduce terms (standalone
  component, signal, `ion-*` component, DbContext, minimal API, DTO, CORS, WebApplicationFactory, TestBed).
- **`foundation/status.md`** — single source of truth for what is **actually done & verified** (vs. what the
  guide intends). Milestones start `⬜ not started`; only reach ✅ after a human runs the Done-when gate.
- **`foundation/decision-log.md`** — the *why* behind non-obvious choices: EF InMemory vs SQLite-in-memory
  (with the risk-1 trade-off), minimal APIs over controllers, standalone Ionic imports over `IonicModule`,
  Vitest as the scaffold default, xUnit v3 template install, dev-CORS named policy.

---

## 4. Milestone ladder

Ordered strictly by dependency. Backend is built and proven first (Expert reader → fast), then the frontend
consumes it. The **reality-check gate is M6** — the first point the thing is a *usable to-do app*.

| # | Milestone | Proves (end state) | Depends on | Done-when (one line) |
|---|-----------|--------------------|------------|----------------------|
| **M0** | Workspace & tooling | Toolchains present; repo skeleton exists | — | `dotnet --version`→10.x, `node -v`→24.x, `ionic -v`→7.2.x; `backend/` + `frontend/` folders exist. |
| **M1** | Backend read path | API returns seeded todos from EF InMemory | M0 | `GET http://localhost:5080/api/todos` returns the seeded JSON array (200). |
| **M2** | Backend full CRUD + CORS | Every verb works; browser origin allowed | M1 | `POST`/`PUT`/`PATCH done`/`DELETE` each succeed via curl; response carries the CORS header for the frontend origin. |
| **M3** | Backend tests (xUnit v3) | API behavior locked by tests | M2 | `dotnet test` → all green, covering each endpoint via `WebApplicationFactory`. |
| **M4** | Frontend scaffold | Ionic standalone app runs; proxied to API | M0 (uses M2 contract) | `ionic serve` shows the Ionic shell at `:8100`; `/api` proxy forwards to `:5080`. |
| **M5** | Frontend read path | Real todos render in the browser | M2, M4 | Home page lists the live todos fetched from the backend (not mock data). |
| **M6** ⭐ | Frontend CRUD UI *(reality-check gate)* | Full add/toggle/edit/delete/filter from the UI | M5 | Every CRUD action works from the UI and survives a page refresh; **stop and actually use it**. |
| **M7** | Frontend tests (Vitest) | Service + component behavior locked | M6 | `ng test` → all green, covering `TodoApi` and the list component. |
| **M8** | Polish & full-stack ship-check | Loading/empty/error UX; both apps run together | M7 | With both servers up, a cold start shows a loading state → todo list; empty & error states render; final acceptance checklist passes. |

⭐ **M6 reality-check gate:** before building tests/polish, run the app and confirm it's genuinely a working
to-do list worth finishing.

---

## 5. Templates

**Per-step** (`NN_<slug>.md`) — Standard granularity, one indivisible action per step:

```
# <Milestone> · Step NN of <TOTAL> — <single action title>
> Nav: [← prev](PREV.md) · [Milestone overview](00_overview.md) · [next →](NEXT.md)

## Glossary for this step        (only terms THIS step introduces; omit if none)
## Why / design                  (rationale the reader needs; omit if pure mechanics)
## Do this                       (exact numbered actions — WHERE + WHAT + WHY each)
## Code                          (complete file(s), never partial; omit if no code)
## Done when (this step)         (the sub-slice of the milestone gate this step satisfies)
## If it breaks                  (the likely error + first thing to check)
```

> Nav line is **line 2**, directly under the H1, **no blank line** between them.

**Milestone overview** (`00_overview.md`): Goal · Scope discipline · Prerequisite · Steps-at-a-glance
(grouped into sittings) · Design/decisions folded in · Aggregated Done-when gate · **Handoff** (what exists so
far, open issues, pointer to next milestone).

---

## 6. Writing contract

**Pedagogy (every step honors these):**
1. Explain each concept on first use **at its topic's depth** (matrix in §1): Ionic terms defined + linked +
   why; Angular/TS one-line + link; .NET/EF/xUnit named only (gotchas excepted).
2. Every action says **WHERE** (which file / panel / command / URL).
3. Every action says **WHAT** it does and **WHY** — mechanism, not just keystrokes.
4. Exact values, not ranges; exact names, exact commands. Say when a value is genuinely free.
5. Mark **MANDATORY** vs **ILLUSTRATIVE**.
6. State which fields/flags to change and which to **leave at default**.
7. Repeat the load-bearing mental models at point of use (the Todo contract; signals-as-state; DbContext as
   the store; the API as the single source of truth).
8. Flag **load-bearing names** (`/api/todos`, `Todo` fields, the CORS policy name, dev ports) vs cosmetic ones.
9. Sequences are numbered lists, never arrow-chains.
10. Name the common failure + first fix per step.

**Verification (Phase 5):**
- Every Done-when shows **expected output** (exact JSON, status code, console line, on-screen state) — never
  a bare "it works".
- **Consistency check before ship:** every command/code block uses the §2 pinned versions; every load-bearing
  name/path/port is spelled identically everywhere.
- A **troubleshooting sheet** in M8: CORS blocked, proxy misconfigured, port already in use, EF InMemory
  reset-on-restart surprise, xUnit v3 template missing, Node/Angular version mismatch.
- **Reconcile-before-follow:** if followed against a drifted tool/codebase, reality wins — patch the guide and
  log the drift in `status.md`.

---

## 7. Folder / file layout (canonical skeleton)

```
examples/todo-ionic-dotnet/
├─ TOKEN_USAGE.md                 (project-level cost ledger; scaffold seeds it)
└─ guide/
   ├─ PLAN.md                     ← this file
   ├─ README.md                   (front door — scaffold)
   ├─ token-usage.md              (scaffold)
   ├─ feedback-log.md             (scaffold)
   ├─ foundation/
   │  ├─ stack.md  audience-model.md  conventions.md  glossary.md  status.md  decision-log.md
   ├─ MILESTONE_0_workspace/          00_overview.md … NN_verify.md
   ├─ MILESTONE_1_backend-read/       00_overview.md … NN_verify.md
   ├─ MILESTONE_2_backend-crud-cors/  00_overview.md … NN_verify.md
   ├─ MILESTONE_3_backend-tests/      00_overview.md … NN_verify.md
   ├─ MILESTONE_4_frontend-scaffold/  00_overview.md … NN_verify.md
   ├─ MILESTONE_5_frontend-read/      00_overview.md … NN_verify.md
   ├─ MILESTONE_6_frontend-crud/      00_overview.md … NN_verify.md
   ├─ MILESTONE_7_frontend-tests/     00_overview.md … NN_verify.md
   └─ MILESTONE_8_polish-shipcheck/   00_overview.md … NN_verify.md
```

## 8. First move

On approval: run **`/scaffold-guide`** (stamps the skeleton + five foundation docs + placeholder overviews +
`TOKEN_USAGE.md`), then **`/draft-milestone`** with no argument to draft the **whole guide in one pass**
(M0→M8, each milestone atomic: `00_overview.md`, step files, `NN_verify.md`), reconciling `status.md`, the
README Updates log, and `examples/README.md` as it goes, then a dead-link check and an `/audit-guide` pass.
The reader then builds against the finished guide, checking each Done-when gate as they go.
