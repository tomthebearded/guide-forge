# Prompt 03 — Clarify one step (the pedagogy pass)

<!-- GuideForge · stage 3 of 4 · optional, run on any confusing step · version: see .claude-plugin/plugin.json -->

> **How to use:** paste this, then give me the one step file to clarify (paste its contents or point me at
> it). Use when a finished step reads unclearly, a reader got stuck, or a term went undefined.

---

## Your role

You are running a **clarity pass** over **one existing step** of a learn-as-you-go guide. You improve how
clearly it teaches — you do **not** change what it does.

> **Clarity ≠ rewrite.** Never change scope, decisions, values, or code behavior under the banner of
> "clarity." The only technical change allowed is reconciling against verified reality (that's prompt 04's
> job, and it gets a status-log line). If you spot a genuine bug, **flag it, don't silently fix it.**

## The one input
The step file to clarify: <paste it, or name it>.
Also recall (ask if missing): the **audience model** — the per-topic expertise matrix (topic →
Expert/Intermediate/Beginner/New) and the granularity setting — and the running **glossary**.
You may also **attach the related code file(s)** the step references, so the clarified step matches what
actually exists — but don't change behavior (see the box above).

---

## Apply these rules, in place

Read the whole step first. Then revise it so every one of these holds:

Grouped by principle (rules cited by dotted id; full contract in
[reference/pedagogy-rules.md](../../reference/pedagogy-rules.md)). **P6 "prove the gate" is a drafting /
review-gate concern, not a clarity edit — it's intentionally absent here; clarifying a step never changes what
its Done-when checks:**

**P1 — Explain what's new**
1.1. **Every concept explained on first use.** Any term on a topic the reader isn't **Expert** in is explained
   the first time it appears — an inline one-sentence gloss, or, when it first lands on a command/menu/code
   line, a **"New concept" callout on its own line right above** it
   (`> 📚 New concept — **term**: definition.`). Never leave a load-bearing term as a bare rule with no
   gloss and no pointer. Add/extend a "Glossary for this step" block and link the main glossary **there, once** —
   the block is the one place the glossary is linked, so do **not** append a `see [glossary]` link after every
   term in the body (an external-API *docs* link in a callout is still fine). And the glossary holds
   **words/concepts only** — a **function** (built-in method or one the guide writes) is explained with an
   **inline code comment** on its line, never as a glossary entry.
1.2. **The recurring mental model** is taught at the point it's used.

**P2 — Anchor every action**
2.1. **Every action says WHERE** — file / menu / panel / command / URL. Never assume the reader can find it.
2.2. **Every action says WHAT + WHY**, not just the keystrokes.

**P3 — Leave nothing ambiguous**
3.1. **Exact values, not ranges.** Where a value is genuinely free, say so.
3.2. **Mandatory vs illustrative** is marked.
3.3. **Change-this vs leave-at-default** is stated, exhaustively for the thing in hand.
3.4. **Load-bearing vs cosmetic names** are flagged before the reader types them.
3.5. **Recurring values match.** If a figure in this step (a jump height, timeout, colour hex, port) also
   appears elsewhere in the guide, quote it **identically** — the same number in the code, the prose, and the
   Done-when gate. Don't round it one way here and another way in the gate. (Clarifying a step shouldn't
   introduce a value that drifts from the rest of the guide.)

**P4 — Structure steps & code**
4.1. **Sequences are numbered lists**, not arrow-chains. (Arrows only for one menu path inside one action.)
4.2. **Each code block sits directly under the instruction it implements.** If the step lists its actions and
   then dumps multi-part code in a trailing block, move each block under the action that introduces it and
   label it with WHERE it goes (file + position). Show fragments, not a re-stitched whole file — the
   complete copy lives in the milestone's `NN_verify.md` checkpoint. (A single small block under one
   instruction is fine as-is.)
4.3. **Existing files aren't re-pasted whole; anchors are unambiguous.** If the step reproduces an entire
   pre-existing file to make a small addition, cut it down to the fragment + a placement instruction. Make the
   anchor **unique** — a named function/block or a line that occurs exactly once, not "under `x = true;`" when
   several such lines exist.

**P5 — Anticipate failure**
5.1. **The likely failure + its usual cause** is named.

**P7 — Declare the starting state**
7.1. **Starting state is declared.** If the step's first action assumes something already installed, running,
   logged-in, or created earlier, say so up front — a one-line "Before you start" note or a back-reference to
   the step that established it — rather than letting the reader discover the gap by hitting an error.

Structural checks:
- Multi-part code is **interleaved under its instructions** (rule 4.2), not batched in a trailing block; each
  fragment names where it goes. No redundant consolidated "complete file" copy (that belongs in `NN_verify.md`).
- The step is still **one indivisible action** — if it's secretly several, say so and propose a split.
- The **Nav line** and **Done-when** are intact.

---

## Deliverable

1. The **revised step file**, in full, in a fenced block.
2. A short **change list**: what you clarified (bullet per rule you applied).
3. The **new glossary terms** you defined this pass.
4. **Anything you could NOT fix without changing behavior** — flagged for me to decide (do not change it).
