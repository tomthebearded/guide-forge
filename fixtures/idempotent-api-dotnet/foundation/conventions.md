# Conventions

> The style and structure rules this guide's code follows. One place, referenced everywhere, so no step
> re-argues them.

## Writing language

**Prose: English. Code: English.** Both settings are recorded here because the later skills read them from
this file in a fresh session, and a missing setting defaults to English. The prose language covers everything
the reader reads — sentences *and* page furniture (section headings, the `New here:` / `New concept —` /
`Build vs borrow —` markers, the nav vocabulary, the checklist labels). The code language covers identifiers,
comments and user-facing strings in the code this guide writes; the commit messages in `## Suggested commit`
follow it too. Untranslated in every GuideForge guide whatever the settings say: file and folder names, the
`foundation/` docs' own section headings and table column keys, commands, paths and doc URLs.

### Heading map

This guide's prose is English, so the map is the identity — every heading is written exactly as the skills
know it. It is written out in full anyway: its presence is what tells a later skill there is nothing to look
up, and every skill reproduces the right-hand column byte for byte rather than translating a heading itself.

| Canonical (what the skills call it) | As written in this guide |
|---------------------------------------------------------------|---------------------------------------------------------------|
| `## Before you continue — corrections`                        | `## Before you continue — corrections`                        |
| `## Glossary for this step`                                   | `## Glossary for this step`                                   |
| `## Why / design`                                             | `## Why / design`                                             |
| `## Do this`                                                  | `## Do this`                                                  |
| `## Code`                                                     | `## Code`                                                     |
| `## Done when (this step)`                                    | `## Done when (this step)`                                    |
| `## Suggested commit`                                         | `## Suggested commit`                                         |
| `## If it breaks`                                             | `## If it breaks`                                             |
| `## Goal`                                                     | `## Goal`                                                     |
| `## Prerequisite`                                             | `## Prerequisite`                                             |
| `## Steps at a glance`                                        | `## Steps at a glance`                                        |
| `## Design / decisions folded in`                             | `## Design / decisions folded in`                             |
| `Sitting <N> — <name>`                                        | `Sitting <N> — <name>`                                        |
| `## Done-when gate (the real test — check every box by hand)` | `## Done-when gate (the real test — check every box by hand)` |
| `## Files after this milestone (the checkpoint)`              | `## Files after this milestone (the checkpoint)`              |
| `### Pre-existing files modified`                             | `### Pre-existing files modified`                             |
| `### Unchanged this milestone`                                | `### Unchanged this milestone`                                |
| `## Troubleshooting`                                          | `## Troubleshooting`                                          |
| `## Handoff`                                                  | `## Handoff`                                                  |
| `## Objective`                                                | `## Objective`                                                |
| `## Stack (summary)`                                          | `## Stack (summary)`                                          |
| `## Key decisions`                                            | `## Key decisions`                                            |
| `## Updates`                                                  | `## Updates`                                                  |
| `## How a step is built`                                      | `## How a step is built`                                      |
| `## Following this guide`                                     | `## Following this guide`                                     |
| `New here:`                                                   | `New here:`                                                   |
| `New concept —`                                               | `New concept —`                                               |
| `Build vs borrow —`                                           | `Build vs borrow —`                                           |
| `**Corrected when:**`                                         | `**Corrected when:**`                                         |
| `**Suggested commit:**`                                       | `**Suggested commit:**`                                       |
| `⚠️ **Superseded <YYYY-MM-DD>**`                              | `⚠️ **Superseded <YYYY-MM-DD>**`                              |
| `Nav:`                                                        | `Nav:`                                                        |
| `Overview`                                                    | `Overview`                                                    |
| `prev:` / `next:` / `start:`                                  | `prev:` / `next:` / `start:`                                  |
| `milestone K of N`                                            | `milestone K of N`                                            |
| `start: — not drafted yet`                                    | `start: — not drafted yet`                                    |

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
