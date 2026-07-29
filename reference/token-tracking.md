# Reference: token-usage tracking

Cost is tracked **per guide** — every guide carries its own running record of what it cost to build. There is
**one ledger file per guide**: `guide/TOKEN_USAGE.md`, inside the guide folder beside `README.md`. Two
mechanisms write to it, and the hook always wins:

- **Metered** (the hook) → rewrites `guide/TOKEN_USAGE.md` from the session transcript's real `usage` records.
  These are real figures and cost zero Claude tokens. **Authoritative.**
- **Estimate** (the skills, fallback) → appends an estimated row to the same `guide/TOKEN_USAGE.md` when the
  hook isn't active. An estimate row is a **transient stopgap**: the next time the hook runs it rewrites the
  whole file and replaces it. Use it only when the hook can't run.

## Two mechanisms — prefer the hook

1. **The bundled hook (accurate, automatic — primary).** The plugin ships a Stop/SubagentStop hook,
   `hooks/track-tokens.js`, wired via `hooks/hooks.json`. After every finished request the harness runs it; it
   reads the session transcript's real `usage` records, dedupes by `message.id`, prices per model, fetches the
   live USD→EUR rate, and rewrites the **per-guide `guide/TOKEN_USAGE.md`**. These are **real metered
   figures**, it costs **zero Claude tokens**, and it needs no cooperation from the skills. When the hook is
   active, it is the source of truth for cost — nothing below is needed. It is **a meter, not a bill**: it's
   indifferent to how you're billed (Pro/Max subscription, API credits, pay-as-you-go) and simply reports what
   the usage *would* cost at API list rates. On a subscription those dollars are informational, not an actual
   charge.

   **Attribution (how usage reaches the right guide).** A guide is an `examples/<name>/` folder. Each *session*
   is credited to the guide its tool calls reference most (session → dominant `examples/<name>`), and that
   session's whole usage lands in that one guide's ledger, `examples/<name>/guide/TOKEN_USAGE.md`. Sessions
   that touch **no** `examples/<name>/` path — e.g. work on the GuideForge tooling itself (the skills and their
   `prompt.md` contracts, the hook, README) — are **intentionally dropped**: building the plugin is not a guide,
   so it earns no ledger, and there is **no** project-root catch-all in a repo that has an `examples/` folder.
   (A plain single-guide project with no `examples/` dir is the exception: it's treated as one guide and its
   ledger is `<project>/guide/TOKEN_USAGE.md` when a `guide/` folder exists, else the project-root
   `TOKEN_USAGE.md`.)

   **Known limitation of the heuristic.** Attribution is by *reference count*, not intent — so a tooling/meta
   session that merely *mentions* an example path (e.g. editing this hook while it prints
   `examples/foo/guide/TOKEN_USAGE.md`) is credited to that guide, inflating its ledger with work that wasn't
   about building it. The dominant-guide rule can't tell "built the guide" from "referenced it." This is the
   accepted trade-off of session-level attribution; if a ledger looks inflated by a meta-session, trim that row
   by hand.
2. **The per-skill ledger (estimate, fallback).** When the hook isn't active (hooks disabled, or a paste-prompt
   run outside the plugin), the skills fall back to appending an **estimated** row to the same
   `guide/TOKEN_USAGE.md` per the rule below. Estimates only — clearly inferior to the hook, and **overwritten**
   the next time the hook runs; use it as a stopgap, not the default.

## The rule (every skill follows this)

At the **end** of a run, before reporting back:

1. **Find the ledger:** `guide/TOKEN_USAGE.md` (guide root, beside `README.md`).
2. **Append one row** for this run, then **recompute the `TOTAL` line**. (If the hook is active it will replace
   your estimate with metered figures on its next run — that's expected.)
3. Conditionals by skill type:
   - **Writing skills** (`scaffold-guide`, `draft-milestone`, `clarify-step`, `report-issue`, `update-stack`) —
     append. `scaffold-guide` **creates** the ledger from the template below as part of scaffolding.
   - **Read-only guide skills** (`audit-guide`, `review-before-follow`) — the ledger is **metadata, not guide
     content**, so appending your run to it is *not* a "fix" and does not break your no-edit promise. Append it;
     touch nothing else.
   - **Pre-guide skills** (`plan-guide`, `modernize-guide`) — `guide/` doesn't exist yet. Don't create the
     ledger; end your reply with a `Planning cost (est.)` line so `scaffold-guide` seeds the first row from it.
   - **Repo-scoped** (`pre-pr-check`) — only append if the run is scoped to a single guide; otherwise skip and
     say so.

## What each row records

`Date (UTC) · Time (UTC) · Skill · What it did · Input tokens · Output tokens · Cache-read tokens · Est. cost`

Use absolute dates (`2026-07-09`), never "today".

## ⚠️ These are ESTIMATES, not metered counts

Claude **cannot read its own exact token usage mid-run.** Approximate from the size of what you read and wrote:

- ~750 tokens per 1,000 characters of text read or written.
- On long sessions, re-reads of the same context bill as **cache reads** (cheap) and dominate the token count —
  estimate them generously.
- Round to two significant figures; never present these as exact.

The only exact figures come from the session transcript after the fact (that's what the hook reads). If the
user needs real numbers, point them there — or let the hook run — rather than dressing up an estimate.

## Rates (single source of truth: the hook)

**The per-model USD rates live in one place — `MODEL_RATES` in
[`hooks/track-tokens.js`](../hooks/track-tokens.js).** Do not restate the dollar figures here or in `README.md`;
they drift the moment a price changes or a model is added. Read them from the code. As a shape reference only,
each entry is per-1M-tokens `{ input, output, cacheWrite, cacheRead }`; cache write assumes the 5-minute TTL
(1.25× input) and a 1-hour TTL is 2×. If a guide is built with a model the table doesn't list, the hook still
counts it and flags it with `?`; name the model in the ledger header.

## `guide/TOKEN_USAGE.md` template (estimate-fallback shape)

When the hook runs it replaces this with its own metered layout; this shape is what the skills seed/append when
the hook is inactive.

```markdown
# Token Usage & Cost — <guide name>

> Approximate ledger, appended by GuideForge skills as they run. Entries are ESTIMATES —
> Claude cannot meter its own tokens mid-run; the bundled hook replaces this file with real
> metered figures on its next run. Model: Claude Opus 4.8
> (input $5 / output $25 / cache-write $6.25 / cache-read $0.50 per 1M tokens).

| Date (UTC) | Time | Skill | What it did | Input | Output | Cache read | Est. cost |
|---|---|---|---|--:|--:|--:|--:|
| 2026-07-09 | 13:42 | scaffold-guide | skeleton + 5 foundation docs | 60k | 15k | 400k | $0.75 |

**TOTAL: ~475k tokens · ~$0.75**
```
