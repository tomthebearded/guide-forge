<!--
TEMPLATE: stack.md — the VERIFIED STACK (foundation doc, produced by prompt 01 Phase 0.5).
The single pinned-version reference every milestone builds against, so code stays consistent end to end.
Every version claim must carry a real official-docs link and a check date — versions move.
Re-verify (and bump the date) whenever you resume the guide after a gap; log changes in status.md.

LANGUAGE — this is a `foundation/` doc: its section headings, table column keys and marks are the schema the
skills look things up by, so they stay ENGLISH in every guide, whatever the prose language. The prose you
write inside them follows the guide's prose language (conventions.md § Writing language).
-->

# Verified stack — <project name>

> Pinned versions and official docs for this guide, verified online on **<YYYY-MM-DD>**.
> Every milestone uses these exact versions. If you're following this later, re-check the "Latest stable"
> column — if it moved, reconcile before following (the review-before-follow gate).

> **Target OS / shell(s):** <e.g. macOS/Linux (bash/zsh) + Windows (PowerShell)>. **Load-bearing:** every
> command in a step or a `Done-when` gate must run on **every** shell listed here — provide a variant per
> shell when they differ (a bash `grep` and its PowerShell `Select-String` equivalent, etc.). If the guide
> targets one shell only, say so here and commands may assume it.

| Tool / library | Pinned version | Latest stable (as of <date>) | Official docs | Notes (renames · deprecations · install) |
|----------------|----------------|------------------------------|---------------|------------------------------------------|
| <language>     | <x.y>          | <x.y>                        | <url>         | <e.g. LTS; EOL date; install command>    |
| <framework>    | <x.y>          | <x.y>                        | <url>         | <e.g. API `foo` renamed to `bar` in x.y> |
| <library>      | <x.y>          | <x.y>                        | <url>         |                                          |

## Install (the exact commands, at the pinned versions)
```bash
# e.g. the reproducible install for this stack
```

## Version notes
<!-- Anything that changed between "what most guides assume" and the current pinned reality:
     renamed APIs, deprecations, new recommended install method, breaking changes. One bullet each,
     each with the official link that documents it. -->
- <note> — <official link>.

> **Unverified?** If the online check could not run when this guide was planned, this table is marked
> UNVERIFIED and MUST be confirmed against the official sources before following any step.
