# Decision log

> The non-obvious choices and *why* they were made — so you learn the reasoning, not just the result.

### D1 — The store is a file, not a database

**Decision.** Commands are appended to a JSON-lines file and reloaded on startup. No SQLite, no EF Core, no
container.

**Why.** The milestone that matters most (M4) proves *"the state survives a restart"*. Proving that with a
database would mean asking you to install and run one before step 1, which turns a teaching guide into an
environment-setup guide, and buries the lesson under infrastructure. A file gives the identical gate for free.

**What it costs.** This design does not survive two writers, and the append-then-reload approach re-reads
everything at startup. It is a teaching device. Do not carry it into anything real without replacing it — the
`ICommandStore` seam introduced in M4 exists precisely so that swap is a one-class change.

### D2 — `dotnet test` stays on the default runner (VSTest)

**Decision.** No `--test-runner` flag, no `global.json` opting into Microsoft.Testing.Platform.

**Why.** .NET 10 introduced the choice and kept VSTest as the default. A teaching guide should run the way a
reader's untouched machine runs; opting into a second platform would add a configuration step that teaches
nothing about idempotency and one more thing that can go wrong before the first test passes.

### D3 — The gates are integration tests, not manual checks

**Decision.** Every milestone's Done-when is `dotnet test`, driving the app in-process through
`WebApplicationFactory`.

**Why.** A gate a person has to perform by hand is a gate that quietly stops being performed. Both of the
earlier guides written with this toolkit end with un-ticked gates for exactly that reason: their acceptance
checks needed a human in front of a browser or a debugger. Here the whole acceptance suite is one command with
an exit code, so the guide's claims stay checkable by anyone, on any OS, forever.

### D4 — Same key + different payload is a `409`, not a silent replay

**Decision.** Reusing an idempotency key with a *different* request body returns `409 Conflict` (M5) rather
than returning the first response.

**Why.** An idempotency key promises "this is the same operation", not "give me whatever you cached under this
string". Silently replaying the first response when the payload changed hides a client bug — usually a key
that is being reused when it should have been regenerated. Failing loudly is what separates an idempotency key
from a cache.

### D5 — Accepted risks (recorded at plan approval)

- **`WebApplicationFactory` re-hosts in the same process**, so it is not a true process restart. A `static`
  field could make a non-persistent store pass M4's gate. Mitigated by the gate asserting the bytes on disk as
  well as the reload, and by per-test temporary directories.
- **Pinning to LTS costs novelty.** .NET 10 is supported to 2028-11-14; nothing here shows off .NET 11.
- **Concurrency is out of scope.** Two identical requests genuinely in flight at the same moment is the hard
  case, and this guide does not solve it. The single-writer file store would need a lock.

### D6 — A gate names the values it reads, never a line of CLI output

**Decision.** Every `Done when` in this guide states the **values** to look for — `Build succeeded`,
`0 failed, N total`, an exit code — and never a summary line to match character by character. Where the guide
does show output verbatim (M1 steps 01 and 03), it shows what a **terminal** prints and names the redirected
variant beside it.

**Why.** The .NET CLI renders the same result two ways: the *terminal logger* when stdout is a terminal, the
older console/VSTest output when it is redirected to a pipe, a file, or a CI log. The two share their numbers
and nothing else — `Build succeeded in 1.5s` versus a `0 Error(s)` block; `total: 1, failed: 0` versus
`Passed!  - Failed:     0, Passed:     1, …`. This guide shipped with 24 gates written against the redirected
form, because the runs that produced them captured the output through a pipe. Two audit passes read those
gates against their own captured output and confirmed them.

**Source.** Field report, 2026-08-14 — drift log rows 2 and 3.

**Revisit if** the guide ever gates on something whose rendering is genuinely stable and whose *shape* is the
lesson — a JSON body, a file's contents. Those are safe to quote whole; a CLI's own progress rendering is not.

### D7 — Build vs borrow: durable storage is hand-rolled, and that is the exception

**Decision.** The idempotency logic is written by hand because **nothing exists to borrow** — verified: ASP.NET
Core 10 ships no idempotency store, filter, or attribute (`stack.md`, fact 2). The *storage* underneath it is a
different matter: a JSON-Lines file written by hand (M4), where SQLite via
[`Microsoft.Data.Sqlite`](https://learn.microsoft.com/en-us/dotnet/standard/data/sqlite/) (10.0.\*, ships with
the .NET data stack) or [EF Core](https://learn.microsoft.com/en-us/ef/core/) (10.0.\*) is the off-the-shelf
answer.

**Why hand-rolled anyway.** M4's lesson is *"prove the state is on disk"*, and the gate has to be readable
without a schema, a migration, or a service to start. A database would put a package, a connection string and a
migration between the reader and the one fact the milestone exists to demonstrate. The file is a teaching
device, and D1 says what it costs.

**When to swap it in.** The moment you have two writers, need a query that isn't "by id" or "by key", or want
the file not to be replayed whole at startup. The `ICommandStore` seam in M4 step 01 exists so that swap is a
one-class change — that is the entire reason it is introduced a step before the file store, rather than after.
