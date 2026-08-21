# examples/ — how to invoke the toolkit, and what it has produced

Two different kinds of example live here.

| File | What it is |
|------|-----------|
| [real-examples.md](real-examples.md) | **Output.** Guides the pipeline actually produced, each published as its own repository — linked, not vendored. Split by how far each has been taken: **followed to the end** (someone built it) vs **guide only** (drafted and audited, never built through). |
| [plan-guide-prompts.md](plan-guide-prompts.md) | **Input.** Worked invocations of the generation skill — the brief, the context to attach, and the interview answers that shape the plan. Starts with two fully-specified briefs, for when you already know every answer. |
| [pipeline-prompts.md](pipeline-prompts.md) | **Input.** Invocations for the rest of the gated pipeline: scaffold → draft → clarify → review-before-follow. |
| [maintenance-prompts.md](maintenance-prompts.md) | **Input.** Invocations for the auxiliaries: audit, update-stack, modernize, mark-progress, check-my-work, amend, report-issue, log-feedback. |

**What this folder is not.** It does not vendor generated guides. This repo ships the *method*; a guide written
with it belongs in its own repository, linked from [real-examples.md](real-examples.md). Nothing here is a
template to copy either — every prompt below is one plausible filled-in brief, not a default. Your stack, your
reader, and your non-goals are yours.

**Both invocation forms are shown.** Each example gives the Claude Code slash command and, where it differs,
the plain-chat form (paste the skill's `prompt.md`, then your brief) — the two are the same contract, since a
`SKILL.md` only wraps its `prompt.md`.
