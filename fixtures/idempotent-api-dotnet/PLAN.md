# PLAN — An idempotent Minimal API in .NET, proven by `dotnet test`

> The plan this guide is drafted from. Produced by GuideForge `plan-guide`. **Not the guide itself** — the
> ladder below is what the drafting pass expands into step files. Approve it before anything is drafted:
> fixing a rung costs minutes, re-drafting off a wrong rung costs the guide.

---

## 1. Brief & audience model

**The build.** A small HTTP service that accepts *commands* carrying an `Idempotency-Key` header. Sending the
same command twice with the same key returns the same response and produces exactly **one** stored record.
State survives a process restart. Every acceptance gate is an integration test executed by `dotnet test` —
no browser, no second terminal, no manual `curl`.

**Observable end state.** `dotnet test` reports all tests passed, including one that submits a command twice
and asserts a single stored record, and one that reloads the store from disk in a fresh host.

### Assumptions — stated loudly, not asked

This plan was produced without the full Phase 0 interview. Every answer below is an **assumption**; correct
any that is wrong before approving, because the audience model drives every explanation depth in the guide.

| # | Question | Assumed answer |
|---|----------|----------------|
| 1 | Per-topic expertise | See the matrix below — **assumed from a Unity/C# background** |
| 2 | Granularity | **Standard** (default atomic step size) |
| 3 | Target end state | `dotnet test` green, including the twice-submitted and the restart gates |
| 4 | Stack | .NET 10 LTS — see §2 (verified online 2026-08-14) |
| 5 | Out of scope | No database, no EF Core, no auth, no Docker, no deployment, no client app, no distributed store |
| 6 | Hard constraints | Windows + PowerShell is the author's shell; commands must also run on bash. No external service to install |
| 7 | Size & writing language | ~5 milestones, one or two sittings. Prose in **English** |

**Per-topic expertise matrix** — the single most important input, and the one most likely to be wrong here:

| Topic | Assumed level | Explanation depth the guide must use |
|-------|---------------|--------------------------------------|
| C# the language | **Expert** | Name it, no definitions. No explaining `record`, `async`, pattern matching |
| The `dotnet` CLI, solutions & project refs | **Beginner** | Define on first use + doc link + brief why |
| ASP.NET Core hosting & Minimal APIs | **New** | Define + doc link + short deep-dive callout + extra failure notes |
| Integration testing / `WebApplicationFactory` | **New** | Same as above — this is the guide's spine, treat it as taught from zero |
| HTTP semantics (status codes, `Location`, idempotency) | **Beginner** | Define on first use + link + why |
| JSON serialization (`System.Text.Json`) | **Intermediate** | One-line reminder + doc link |
| xUnit | **Beginner** | Define the attributes on first use + link |

> **Over-explaining an Expert topic is a defect, exactly as harmful as under-explaining a New one.** With this
> matrix, a step that explains what a `record` is has failed; a step that uses `WebApplicationFactory<Program>`
> without saying what it constructs has also failed.

### Advise-back — suggestions and risks (Phase 0 gate)

**Capabilities commonly paired with this build, deliberately *not* in the ladder.** Take or leave each; what
you reject is recorded in the decision log so the *why* survives.

- **Key expiry / TTL sweep.** Real idempotency stores forget keys eventually. Adds a time dependency to the
  gates (a test that waits, or an injected clock) — worth it only if you want to teach testable time.
- **Concurrency: two identical requests in flight at once.** The honest hard case, and the one the naive
  implementation gets wrong. Teaches locking and atomic file writes. Recommended as a **later** milestone if
  you want the guide to be more than introductory — currently out of scope.
- **Conflict on key reuse with a *different* payload.** Included, in M5 — it is what separates a real
  idempotency key from a cache.
- **`ProblemDetails` conforming to RFC 9457.** Included in M5; the framework supports it, so it costs one
  step and teaches a real standard.

**Long-run risks of these choices.**

- **File-backed store is a teaching device, not a design.** It will not survive concurrent writers or two
  processes. The guide must say so plainly at the point it is built, or a reader will carry the pattern into
  something real. Mitigation: an explicit note in M4 and a decision-log entry.
- **`WebApplicationFactory` restarts the host in the same process.** It is *not* a true process restart, so a
  static field or a captured singleton could mask a persistence bug and turn the M4 gate into a false
  positive. This is a rule-6.2 hazard and is designed against in §6 — the gate also asserts the bytes on disk.
- **Pinning to LTS costs novelty.** .NET 10 is supported to 2028-11-14; nothing here is bleeding-edge, which
  is the right trade for a teaching guide but means the guide will not showcase .NET 11 features.

---

## 2. Verified stack

Checked online **2026-08-14**. Every version claim below carries a link; anything unverified is marked.

| Tool / library | Pinned | Latest stable (2026-08-14) | Official docs | Notes |
|---|---|---|---|---|
| .NET SDK | **10.0.302** (present on this machine) | .NET 10 — **LTS**, GA 2025-11-11, EOS **2028-11-14** | [releases & support](https://learn.microsoft.com/en-us/dotnet/core/releases-and-support) | LTS track, 3-year window |
| ASP.NET Core | **10.0** | 10.0 | [what's new in .NET 10](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0) | Minimal APIs |
| `Microsoft.AspNetCore.Mvc.Testing` | **10.0.\*** — patch resolved at `dotnet add package` time | *patch level UNVERIFIED* | [integration tests](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0) | Supplies `WebApplicationFactory<TEntryPoint>` + `TestServer`; copies the SUT's `.deps` and sets the content root |
| xUnit | template default (`dotnet new xunit`) | *UNVERIFIED* | [test Minimal API apps](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/test-min-api?view=aspnetcore-10.0) | The framework the official Minimal-API testing doc uses |
| `dotnet test` runner | **VSTest** (the SDK default) | MTP available, opt-in | [dotnet test](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-test) | .NET 10 adds `--test-runner`; **default remains VSTest**, so the guide stays on the default and says why |
| Idempotency primitive | **none — built by hand** | n/a | — | **Verified: ASP.NET Core 10 ships no idempotency store or filter.** The reader implements it; this is the point of the guide |

**Two facts the drafting pass must not get wrong** (both verified on the exact name, not on the family):

1. On .NET 10 the `Program` class generated from top-level statements is **public**, so
   `WebApplicationFactory<Program>` compiles with nothing added to `Program.cs`. The widely-copied
   `public partial class Program { }` line — which Microsoft's own docs still call required — is **not**
   needed here, and the drafting pass must not add it. *(Corrected 2026-08-14 after the audit built and ran
   the solution: the original plan asserted the opposite, on the strength of the docs alone.)*
2. There is **no** framework idempotency feature to configure. Any draft that reaches for one is inventing it.

---

## 2.5 Build vs borrow

*Added 2026-08-14, after the fact: this plan was produced with GuideForge v1.14.1, before the build-vs-borrow
gate existed. The decisions below were made during drafting and are recorded here so the plan shows the
question was asked.*

Every capability the ladder would otherwise hand-write, and the verified off-the-shelf alternative:

| Capability | Library that already solves it | Decision | Why |
|---|---|---|---|
| **Idempotency** (key → stored response, replay, conflict) | **none exists** — verified 2026-08-14 against the .NET 10 release notes: ASP.NET Core ships no idempotency store, filter or attribute | **Build** — forced | Nothing to borrow. This is the guide's subject; §2 records the verification |
| **Durable storage** (M4) | [`Microsoft.Data.Sqlite`](https://learn.microsoft.com/en-us/dotnet/standard/data/sqlite/) 10.0.\* · [EF Core](https://learn.microsoft.com/en-us/ef/core/) 10.0.\* | **Build** — a JSON-Lines file | M4's lesson is "prove the state is on disk", and its gate must be readable without a schema, a migration or a service to start. Recorded as D1 and D7; the `ICommandStore` seam is what makes the swap a one-class change |
| **Integration testing an ASP.NET Core app in-process** | [`Microsoft.AspNetCore.Mvc.Testing`](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0) 10.0.\* | **Borrow** | Hand-rolling a `TestServer` host, a content-root fix-up and a `.deps.json` copy is a week of work the framework does in one package |
| **Test framework & assertions** | [xUnit](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/test-min-api?view=aspnetcore-10.0) (`dotnet new xunit` default) | **Borrow** | The framework Microsoft's own Minimal-API testing article uses |
| **JSON serialization** | `System.Text.Json` (in-box) | **Borrow** | In the framework already; the guide never touches a serializer by hand |
| **Error response shape** | `AddProblemDetails` / `Results.Problem` (in-box, RFC 9457) | **Borrow** | M5 step 01 uses the framework's generator rather than inventing an error envelope |

**The one rule this table encodes:** the guide hand-writes exactly two things — the idempotency logic, because
nothing exists to borrow, and the store, because borrowing one would bury M4's lesson under setup. Everything
else is the ecosystem's.

---

## 3. Foundation docs

| Doc | What it owns |
|---|---|
| `README.md` | Front door: objective, one-line stack summary, headline decisions, Updates log, "following this guide" note |
| `foundation/stack.md` | The §2 table verbatim — every step builds against these versions |
| `foundation/conventions.md` | Naming, project layout, `Writing language: English`, the "gates are tests" rule |
| `foundation/glossary.md` | `### heading` per term: idempotency key, SUT, integration test, content root, ProblemDetails, top-level statements |
| `foundation/status.md` | The single source of truth for what is actually verified. **No milestone is ✅ until its gate has been run** |
| `foundation/decision-log.md` | D1 file store not a database · D2 VSTest over MTP · D3 conflict → 409 · D4 accepted risks from §1 |
| `feedback-log.md` | Seeded empty by `scaffold-guide` |

---

## 4. Milestone ladder

Every gate is `dotnet test` with an exit code. Every rung depends only on rungs below it.

| # | Milestone | Proves (end state) | Depends on | Done-when (one line) |
|---|-----------|--------------------|------------|----------------------|
| **M1** | Solution skeleton + first passing integration test | The API boots **in-process** and a test can call it | — | `dotnet test` → all pass, incl. `GET /health` → `200` and body `{"status":"ok"}`; `dotnet build` → 0 errors |
| **M2** | Accept a command, read it back | The write/read contract holds over real HTTP | M1 | `POST /commands` → `201` + `Location`; `GET` that `Location` → `200` and the same payload |
| **M3** | **Idempotency** *(reality-check gate)* | The same key twice is one command | M2 | The same key posted **twice** → byte-identical responses **and** the store holds exactly **1** record; a different key → 2 records |
| **M4** | **Durability across a restart** | The state is on disk, not in memory | M3 | A record written through one host is readable through a **freshly constructed** host, **and** appears in the data file on disk |
| **M5** | Errors, validation, conflict | Misuse produces exact, documented responses | M4 | Unknown id → `404`; invalid body → `400` + `ProblemDetails`; same key + different payload → `409`; whole suite green |

**Reality-check gate: end of M3.** That is the first point where the thing is genuinely useful. Stop, read the
implementation, and decide the design holds before making it durable.

**Sittings.** M1–M2 is one sitting (the toolchain and the contract). M3 is its own. M4–M5 is the third.

**Deferrals, written inline and once** — never as a standing "what this milestone does not do" section:
M2's store is in memory, and M2 says so on the line that builds it, pointing at M4.

---

## 5. Templates

The guide uses the canonical GuideForge layout unchanged: `NN_<slug>.md` step files with the nav line at top
and bottom, `00_overview.md` as a one-screen map per milestone, `NN_verify.md` carrying the milestone's single
Done-when gate, the file checkpoint, troubleshooting and the cumulative handoff. Step sections:
`## Glossary for this step` (index only) · `## Why / design` · `## Do this` (code interleaved under each
numbered action) · `## Done when (this step)` · `## If it breaks`.

---

## 6. Writing contract & verification design

The full pedagogy contract applies (P1–P7). Three points need deciding **here**, not at drafting time:

- **Every gate is a test, and every gate shows its expected output.** Not "the test passes" — the exact
  assertion and the exact observed value: `201`, the `Location` header shape, the response body, the record
  count. A reader must be able to diff reality against the page.
- **Rule 6.2 — the M4 gate must not be masked by its own environment.** `WebApplicationFactory` re-hosts the
  app *in the same process*, so a `static` field or a captured singleton would let a non-persistent store pass
  a "survives restart" gate. The gate therefore asserts **two** things: the record is readable through a fresh
  factory **and** the raw data file on disk contains it. Each test also uses its own temp directory, so state
  cannot leak between tests and fake a pass.
- **Rule 4.4 — every step ends on a green build.** .NET has a compiler, so every step's Done-when ends with
  `dotnet build` at 0 errors. When a step changes a signature, the **same** step fixes every call site,
  including the test project. No step may say an error is expected until a later one.
- **Cross-platform commands.** The author's shell is PowerShell; the guide also targets bash. Any command that
  differs gets both variants — paths in particular (`./src/Api` vs `.\src\Api`).

---

## 7. Folder & file layout

```
guide-forge-dotnet-idempotent-api/
├── guide/
│   ├── README.md              ← front door
│   ├── PLAN.md                ← this file
│   ├── feedback-log.md
│   ├── foundation/            ← stack · conventions · glossary · status · decision-log
│   ├── MILESTONE_1_skeleton-and-first-test/
│   ├── MILESTONE_2_accept-and-read-back/
│   ├── MILESTONE_3_idempotency/
│   ├── MILESTONE_4_durability/
│   └── MILESTONE_5_errors-and-conflict/
└── src/                       ← what the reader builds (empty until someone follows the guide)
```

---

## 8. First move

Approve this plan — spend the attention on **§4**, not the prose. Check four things mechanically: M1 is the
thinnest runnable rung (toolchain only, no domain logic); each rung uses only what rungs below it introduced;
each Done-when is something you can *watch happen*; and no rung needs a symbol a later rung defines.

On approval: `scaffold-guide` stamps the skeleton and the six foundation docs, then `draft-milestone` writes
all five milestones in one pass. The guide is then complete and ready to follow — and, until someone follows
it end to end, it belongs in **Guide only** in `examples/real-examples.md`.
