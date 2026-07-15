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

1. **Every concept explained on first use.** Any term on a topic the reader isn't **Expert** in is explained
   the first time it appears — an inline one-sentence gloss, or, when it first lands on a command/menu/code
   line, a **"New concept" callout on its own line right above** it
   (`> 📚 New concept — [term](link): definition.`). Never leave a load-bearing term as a bare rule with no
   gloss and no pointer. Add/extend a "Glossary for this step" block and link the main glossary.
2. **Every action says WHERE** — file / menu / panel / command / URL. Never assume the reader can find it.
3. **Every action says WHAT + WHY**, not just the keystrokes.
4. **Exact values, not ranges.** Where a value is genuinely free, say so.
5. **Mandatory vs illustrative** is marked.
6. **Change-this vs leave-at-default** is stated, exhaustively for the thing in hand.
7. **The recurring mental model** is taught at the point it's used.
8. **Load-bearing vs cosmetic names** are flagged before the reader types them.
9. **Sequences are numbered lists**, not arrow-chains. (Arrows only for one menu path inside one action.)
10. **The likely failure + its usual cause** is named.

Structural checks:
- Code is a **complete file**, not a partial snippet.
- The step is still **one indivisible action** — if it's secretly several, say so and propose a split.
- The **Nav line** and **Done-when** are intact.

---

## Deliverable

1. The **revised step file**, in full, in a fenced block.
2. A short **change list**: what you clarified (bullet per rule you applied).
3. The **new glossary terms** you defined this pass.
4. **Anything you could NOT fix without changing behavior** — flagged for me to decide (do not change it).
