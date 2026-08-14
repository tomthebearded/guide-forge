# Conventions

> The style and structure rules this guide's code follows. One place, referenced everywhere, so no step
> re-argues them.

## Writing language

**English.** Only the prose would ever change language; the skeleton never does — file and folder names,
section headings (`## Do this`, `## Done when (this step)`, …), nav-line vocabulary (`Nav`, `Overview`,
`prev:`/`next:`/`start:`), table column keys, code, commands, identifiers, paths and doc URLs stay English in
every GuideForge guide.

## Solution layout

```
src/Api/            ← the service (the "system under test")
tests/Api.Tests/    ← the integration tests, which are also the guide's gates
IdempotentApi.sln
```

Two projects, no more. The tests live in their own project — mixing them into the service would ship test
infrastructure to production and remove the ability to run one set without the other.

## Naming

- **Identifiers say what they hold or do.** `idempotencyKey`, `dataDirectory`, `FindByKey` — never `key2`,
  `dir`, `data`, `Handle`. Units in the name where they prevent a mistake.
- **The framework's idioms win where it has one.** `app`, `builder`, `sp` for an `IServiceProvider`, `ct` for
  a `CancellationToken` — these are what the official docs use, and matching them is the teaching move.
- **One concept, one name.** The idempotency key is `idempotencyKey` in the code, "idempotency key" in the
  prose, and `Idempotency-Key` on the wire. Never "request id" halfway through.

## Code style

- **Records for data, classes for behaviour.** `Command` and the request/response shapes are `record`s; the
  store is a `sealed class`.
- **File-scoped namespaces** (`namespace Api;`) — the .NET template default.
- **Nullable reference types stay enabled.** The template turns them on; a step that would disable them to
  silence a warning is fixing the wrong thing.
- **`ConcurrentDictionary`, not `Dictionary`, for anything a request handler touches.** ASP.NET Core serves
  requests concurrently; a plain `Dictionary` mutated from two requests is a real bug, not a theoretical one.

## Test conventions

- **One behaviour per test**, named `MethodOrRoute_Condition_ExpectedResult`.
- **Every test owns its state.** Nothing is shared between tests — each gets its own temporary data directory,
  so a passing test can never be a leftover from the previous one.
- **The gate asserts the observable value, not just the absence of an exception.** `201`, the `Location`
  header, the response body, the record count.
