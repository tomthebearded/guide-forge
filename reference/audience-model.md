# Reference — The audience model (the most important input)

> A guide is only as good as its model of the reader. This is the *model the reader first* pillar, and the single input that most
> determines whether the finished guide teaches or bores. Everything in the pedagogy contract is applied
> *relative to* this model.
>
> **Every example below is illustrative.** The topics, levels and reader profiles below are there to show
> the *shape* of a good answer. None of them is a recommended profile; the right model always comes from your
> own build and your own reader.
>
> The model has **two dials**: a **per-topic expertise matrix** (how deeply to explain *each* topic) and a
> **granularity** setting (how finely to cut steps and how much to narrate). They're independent and they
> compose.

---

## Dial 1 — The per-topic expertise matrix

A reader is rarely "a beginner" or "an expert" across the board. They might be an expert in the language,
comfortable with HTTP, and brand new to the ORM. A single overall level would over-explain their strengths
*and* under-explain their gaps. So instead of two flat lists, model expertise **per topic**.

**Build the matrix:** list the distinct topics/arguments the build touches (derive them from the idea and the
[Verified stack](../templates/stack.md)), and rate the reader on each.

| Topic / argument | Reader level | ⇒ Explanation depth |
|------------------|-------------|---------------------|
| The language | Expert | Name concepts only — no definitions, no doc links, no deep dives. |
| HTTP / REST | Intermediate | A one-line reminder + a doc link. Skip fundamentals. |
| The ORM | Beginner | Define on first use + doc link + a brief *why*. |
| Auth / sessions | New | Define + doc link + a short concept deep-dive callout + extra failure-mode notes. |

**The four levels and their depth policy:**

- **Expert** → you can *assume* it. Naming the concept is enough. Explaining it wastes their attention and
  makes them skim — which means they'll skim the part that mattered too.
- **Intermediate** → they've seen it but may be rusty. A one-sentence reminder and a link to go deeper.
- **Beginner** → they know *of* it. Define it the first time it appears, link the docs, say why it's here.
- **New** → never touched it. Define it, link the docs, add a short deep-dive callout, and pre-empt the
  failure modes a first-timer hits.

> **Why graded, not binary:** over-explaining an Expert topic is a *real defect*, exactly as harmful as
> under-explaining a New one. The matrix lets the same guide be terse where the reader is strong and patient
> where they're weak — which is what a good human mentor does.

## Dial 2 — Granularity (step size + narration density)

Granularity is orthogonal to expertise. It controls how *finely the work is chopped* and *how much prose*
surrounds each action — not which concepts get defined.

- **Terse / reference** → larger steps; several sub-actions bundled; minimal prose; obvious sub-steps omitted.
  For readers who want a fast path and can fill gaps themselves.
- **Standard** → the default atomic step size — one indivisible action per step.
- **Highly granular / tutorial** → the smallest steps; every sub-action spelled out; nothing assumed about
  navigation or sequencing. For a careful first walk-through.

## How the two dials compose

They multiply, they don't merge:

| | Expert on the topics | New to the topics |
|---|---|---|
| **Terse** | Few big steps, almost no explanation. A cheat-sheet. | Few big steps, but each heavily explained. Risky — big jumps + new material. |
| **Highly granular** | Many tiny steps, almost no explanation. A precise checklist. | Many tiny steps, each fully explained. A true beginner tutorial. |

So "highly granular" does **not** imply "lots of concept explanation" — an expert doing something delicate
may want tiny steps with no theory. Keep the dials separate.

## A worked example

*Illustrative — one possible reader, not a recommended profile.*

> **Reader:** fluent in C#, new to Unity and new to game dev. Wants a careful walk-through.
>
> **Matrix:** C# = *Expert* · Unity editor = *New* · game-loop/physics concepts = *New* · general software
> architecture = *Expert*. **Granularity:** *Highly granular*.
>
> **Consequence:** the guide never explains a `for` loop or an interface (C# is Expert), but *always* defines
> "collider" and "serialized field" with a doc link and a deep-dive (Unity/game-dev are New) — and cuts every
> editor operation into its own tiny numbered step (granularity is high). One reader, opposite treatment per
> topic. That's the whole point.

The same machinery in a different domain, to show the matrix is not about engines:

> **Reader:** ten years of backend Python, first time near a data warehouse. Wants to move fast.
>
> **Matrix:** Python = *Expert* · SQL = *Intermediate* · warehouse/columnar storage concepts = *New* ·
> orchestration tooling = *Beginner*. **Granularity:** *Terse*.
>
> **Consequence:** decorators, context managers and packaging pass without a word (Python is Expert); a window
> function gets a one-line reminder and a doc link (SQL is Intermediate); "partition pruning" and "clustering
> key" are defined, linked and given a deep-dive (warehouse concepts are New); and the whole thing is cut into
> a handful of large steps, because this reader does not want twenty small ones.

## Built-ins count too (don't gloss `const` but skip `Math.round`)

The expertise level for a topic applies to **everything** on that topic — including the standard-library and
built-in API surface, not just the "big" concepts. If the reader is **New** or **Beginner** on a language or
engine, its **built-in methods and objects** are first-use terms exactly like any other: `Math.round()`,
`Math.PI`, `Number.toFixed()`, `ctx.fillRect()`, `Array.map()` for a JS-new reader; `Transform`, `Clear
Flags`, `IL2CPP` for a Unity-new reader. Explain them at first use at the topic's declared depth — but a
**function** (`toFixed()`, `ctx.fillRect()`, `Array.map()`) gets an **inline code comment** on its line, not a
glossary entry (the glossary holds words/concepts only, per rule 1.1); non-function terms (`Math.PI`, `Transform`,
`Clear Flags`, `IL2CPP`) still go in the glossary as usual.

The tell-tale defect is an **inconsistent bar**: a guide that carefully defines `const` but then uses
`toFixed()` or `Math.PI` bare, or names `Transform`/`IL2CPP` without a word. If the bar is high enough to
explain `const`, it's high enough to explain the built-in method on the next line — treat built-ins as rule 1.1
terms, not as "obvious." (Observed: a guide glossed `const` but not `toFixed`/`Math.round`/`Math.PI`;
another left `Transform`/`IL2CPP`/`Clear Flags` unglossed.)

## The rule of thumb

> **Match explanation depth to the reader's level on *that specific topic*; match step size to the
> granularity dial. Never let one global setting flatten either.**

## Keeping it honest

- Put the matrix + granularity at the top of the guide's foundation docs so every drafting pass consults them.
- The matrix can shift between sections — a later chapter may promote a topic from New to Beginner once the
  guide has taught it. When it shifts, say so.
- If a reader gets stuck on a topic you rated Expert/Beginner, the rating was wrong — lower it and run a
  [clarify pass](../skills/clarify-step/prompt.md).
