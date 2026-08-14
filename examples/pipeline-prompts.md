# Prompt examples — the gated pipeline

Invocations for the three stages after planning, plus the reconciler you run before executing a guide. The
gate between planning and drafting is human on purpose: everything below assumes the plan is **approved**.

Plain-chat form for all of them: paste the skill's `prompt.md` into a conversation, then the argument shown
here as ordinary text, then whatever files the example says to attach.

---

## `scaffold-guide` — stamp the skeleton

```
/scaffold-guide
```

**Attach:** `PLAN.md`.

Stamps the canonical folder layout and the six foundation docs — `stack.md`, `status.md`, `progress.md`,
`glossary.md`, `conventions.md`, `decision-log.md` — pre-filled from the plan, plus a placeholder overview per
milestone.
Run it before drafting so the drafter fills a real tree instead of inventing paths. In a plain chat it prints
the tree and the documents for you to save; that transcription is the whole job.

---

## `draft-milestone` — write the guide

```
/draft-milestone
```

No argument means **the whole guide**: every milestone in the ladder, in one pass, with each milestone's
cumulative handoff (the last section of its `NN_verify.md`) feeding the next. This is the default and the one you want — the cross-milestone checks
(forward references, the front-door reconciliation against `README.md` and `decision-log.md`) only have
something to run against once every milestone exists.

Name a milestone only to **re-draft** one:

```
/draft-milestone M2
```

Use it after `audit-guide` flags a milestone, or after a reader gets stuck in one. Re-drafting the whole guide
to fix one milestone throws away work that was already correct.

**Working milestone-by-milestone in a plain chat:** name each milestone in turn, and open every conversation
with the re-feed packet, because nothing carries state for you.

```
Draft milestone M3.

[paste: PLAN.md]
[paste: foundation/conventions.md]
[paste: M2's handoff — the last section of its NN_verify.md]
```

---

## `clarify-step` — one step reads badly

```
/clarify-step 03_first-route.md
```

**Attach:** the step file.

The pedagogy pass over a single step: undefined terms, missing WHERE/WHY, arrow-chains, vague values. It does
**not** change what the step does — if the step is wrong rather than unclear, you want `report-issue` or a
milestone re-draft instead.

Point it at the confusion when you know what it is:

```
/clarify-step 07_persist.md — "the connection string" is never defined and step 2 says "adjust as needed"
```

---

## `review-before-follow` — reconcile against reality

```
/review-before-follow M2/03_persist.md
```

**Attach:** the step, plus the real project files or tool output it should be checked against.

Run it *before* you execute a guide that was written a while ago, or against a codebase that has moved since.
Reality wins over the guide, and the drift gets logged. Steps that touch external platforms — cloud consoles,
OAuth screens, app stores, third-party APIs — are the ones that rot fastest, so review those even when the
code steps look fine.

Whole milestone, before a session:

```
/review-before-follow M2/
```

---

## The order, and where the gates are

```
plan-guide  →  [YOU APPROVE THE PLAN]  →  scaffold-guide  →  draft-milestone  →  [YOU BUILD]
                                                                                     │
                                            clarify-step ◄────── a step reads unclearly
                                     review-before-follow ◄───── before executing an older guide
```

The one gate you cannot skip is plan approval: the whole guide is drafted off the ladder in a single pass.
Auxiliary skills — audit, update-stack, modernize, report-issue, log-feedback — are in
[maintenance-prompts.md](maintenance-prompts.md).
