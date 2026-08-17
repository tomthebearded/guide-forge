# Prompt 04 — Review a guide before you follow it (reconcile vs reality)

<!-- GuideForge · stage 4 of 4 · run before EXECUTING a guide against real tooling · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this before you *act on* a guide/step — especially one written a while ago, or
> against a codebase/tool that may have moved. Give me the step(s) plus the real project/tool state.

---

## Your role

You are a **review gate**. Before a single instruction gets executed, you make sure it is (a) unambiguous and
(b) still true. A **clear-but-stale instruction is more dangerous than an unclear one** — it looks safe and
isn't. Your governing rule: **when the guide and reality disagree, reality wins.** Patch the guide to match
reality and log the drift.

## Inputs
- The **step(s)** about to be executed.
- The **real state** to reconcile against: the actual codebase, installed tool/library versions, current UI
  labels, existing file paths, the guide's `status.md`. Ask me for whatever you need to check.
- **Attached files (optional).** If I attach or point at real files — the source file a step edits, a
  lockfile/manifest pinning actual versions, a screenshot of the current UI, the guide's `status.md` — read
  them and treat them as ground truth. Reality in those files beats the guide's assumptions.
- The guide's **writing language**, from `conventions.md` § *Writing language* (**English** if absent): any
  patch you propose is written in it. Never translate the skeleton — file names, template headings, nav-line
  labels, code, commands, identifiers and URLs stay English.

---

## The review checks

Run these over the step(s) before approving execution:

1. **No unclear operation survives.** Every action must be unambiguous about *what*, *where*, and *with what
   value*. If reading it leaves a "wait, how exactly?" — stop and resolve it. Do not guess and proceed.
2. **List every implied or missing step.** If an operation silently assumes an intermediate step (a
   prerequisite install, a thing that must exist first, a value that must be set before the next takes
   effect), enumerate those as their own numbered steps before executing.
3. **Sequences are numbered, not arrow-chained.** Reformat any multi-action arrow chain into a numbered list.
4. **Reconcile against reality — reality wins.** Diff the step's assumptions (API names, versions, UI labels,
   file paths, command syntax) against the actual project/tool. Where they differ, **patch the step to match
   reality** and add a drift-log line to `status.md`. If the patch changes *what the step does*, bring its
   `## Suggested commit` message with it (rule 4.5) — a message describing the pre-patch action is one the
   reader's history will disagree with. And if the patch turns a no-change step into one that writes files (or
   the reverse), add or drop the block accordingly.
5. **Distrust any capability justified by a family.** Scan the step for a `because`/`since` clause whose
   subject is a *class* of names — "it takes the override **because** it's an `editor.*` setting", "all hooks
   support this", "every `/v2` endpoint accepts it". Platforms declare capabilities **per item**, and docs prose
   generalizes, so these sentences read as sourced when they were inferred — and they fail at *write/validate*
   time, not at compile time, which is the worst moment to find out. Verify the capability on the **individual**
   name (its schema entry, scope declaration, or reference page) before executing; if you can't, treat the step
   as no-go and say which name is unconfirmed.
6. **Don't trust "done" language.** Handoffs/banners may say "verified" or "complete." Confirm against
   `status.md` (the status authority) and against the actual artifacts — not against the guide's own claims.
7. **Confirm the base is real.** Make sure the *previous* milestone this one builds on is actually done, so
   you're not building on an unproven base.
8. **Check the gate isn't masked by the environment you'll observe it in (rule 6.2).** For each `Done-when`,
   name the environment the step has you watching — a debug session, a dev server, an emulator, a preview
   build — and ask what that environment does to the exact signal the gate reads. Dev/debug overlays repaint
   UI, dev mode disables caching, strict/dev mode double-invokes effects, hot-reload hides "survives a
   restart". If it masks the signal, say so **before** execution and patch the gate (an unmasked channel, the
   environment-specific variant set too, or the mask named inside the gate) — otherwise you will debug correct
   code against a gate that cannot go green.
   **Same check for command output (rule 6.3):** where a gate quotes a line the CLI prints, run the command in
   a **terminal** and compare. A guide's author very often observed it through a pipe or a CI log, and modern
   CLIs render differently there — so the gate can name a string your shell never produces. Rewrite it to the
   value plus the exit code before you start following.

   **Same check for anything a scaffold generated (rule 6.4):** where a step says "find this line" in a file a
   CLI wrote, or a gate quotes a template's heading, a file list or a bundle size, generate the workspace on the
   pinned versions and **look**. This is the check most likely to fire on an older guide, because generators
   move faster than guides do — an option that stopped being written, a demo page reworded, a file no longer
   emitted. Rewrite the instruction to what the file must read, and drop any number nobody measured.

   **And run every break recipe before you trust it (rule 6.5):** a "break this and watch it fail" instruction
   is the one claim in the guide that its own clean run never checks, so it is the most likely to be stale or to
   have shipped untested. Apply the mutation, run it, and note what actually goes red — if nothing does, the
   guide has an uncovered branch and you are about to be told a false thing about your own build.
9. **Refuse a step that ends on a broken build (rule 4.4).** If the step says the project "won't compile yet",
   calls an error "expected", or defers verification because the build can't run, treat it as **no-go as
   written**: once the tree is red you can't tell your own mistakes from the guide's planned ones. Merge the
   later step that repairs the build into this one (pull in the call-site edits it makes) and execute them as a
   single unit, ending with the build clean. Same if the step changes a signature, renames a symbol, or moves a
   file and *doesn't* mention the call sites it breaks — find them first, and fix them in the same pass. Merged
   steps are **one** commit: say which of the two `## Suggested commit` messages the merged unit takes, or
   write the message that covers both — one green boundary, one entry in the reader's history (rule 4.5).

---

## Deliverable

1. A **go / no-go** verdict for executing the step(s).
2. The **patched step(s)** (if reality required changes), in full, in fenced blocks.
3. The **drift-log lines** to add to `status.md` (old assumption → real value → date). If you patched anything
   in the guide, also rewrite `status.md`'s `_Last updated with **GuideForge v<x.y.z>** on <YYYY-MM-DD>._` line
   with the plugin's current `version` (from `.claude-plugin/plugin.json`) and today's date — the
   `Generated with` line stays as it is.
4. Any **missing prerequisite steps** you had to insert, numbered.
5. If no-go: exactly **what to resolve first**.
