# Reference — Milestone design (cutting a good ladder)

> How to decompose an idea into a **ladder** of milestones that always builds on a proven base. This is
> pillar 2. Get the ladder right and the guide writes itself; get it wrong and no amount of clarity saves it.

---

## What a milestone is

A **milestone** is a **vertical slice** that:

1. **Proves one thing end-to-end** — something you can *run and observe*, spanning whatever layers it needs.
2. **Ends in a Done-when gate** — a short checklist of *observable* conditions.
3. **Depends only on earlier milestones** — never on scaffolding that doesn't exist yet.
4. **Declares its scope discipline** — what it deliberately does *not* do.
5. **Fits in one sitting or a few** — grouped into "sittings" with checkpoints.

## Vertical slice vs horizontal layer (the key distinction)

The most common decomposition mistake is cutting by *layer* instead of by *capability*.

| ❌ Horizontal (can't run alone) | ✅ Vertical (runnable, observable) |
|---|---|
| M1: all the data models | M1: one endpoint returns one hard-coded record over HTTP |
| M2: all the repositories | M2: that endpoint reads the record from a real store |
| M3: all the handlers | M3: a second endpoint creates a record; the first reads it back |

The vertical ladder gives the reader a working thing at *every* rung. The horizontal one gives them nothing
runnable until the very end — and no gate to verify against along the way.

## The Done-when gate

A gate is **observable**, not aspirational. "The persistence layer is complete" is not a gate. These are:

- [ ] `curl localhost:8080/books/1` returns `{"id":1,...}` with status 200.
- [ ] Restarting the server and re-running the curl returns the same record (it persisted).
- [ ] `go test ./...` passes.

If you can't write the gate as things you can see happen, the milestone is cut wrong.

## Dependency ordering — no forward references (hard rule)

A milestone must be **buildable from the milestones below it alone**. This is stricter than "depends only on
earlier milestones" as a vibe — it's a mechanical property you can check:

- **Every symbol a milestone references MUST already be introduced in a milestone `<=` the current one.** A
  symbol is any load-bearing identifier the code names: a class, method, function, field, constant, file,
  route, env-key, CSS class, config key. If milestone M*k* calls `LikedIndex.clear()`, then `clear()` must be
  defined in some milestone M*j* with `j <= k` — never in M*k+1* or later.
- **Each milestone's `build` gate must be satisfiable using ONLY the code of the current and earlier
  milestones.** If the reader stops at the end of M*k* and runs the build, it must compile and pass. A gate
  that only goes green once a *later* milestone lands is a broken gate, no matter how the prose reads.

> **The defect this prevents:** a guide where M9's step calls `LikedIndex.clear()` but `clear()` isn't
> introduced until M10. The reader following in order hits a build that cannot pass — the guide is broken at
> M9 even though every file "looks right" in isolation. (Observed: a guide used a method introduced only in a later milestone.)

**Self-check before closing each milestone:** for every load-bearing identifier a step *uses*, confirm its
**first definition** lives in this milestone or an earlier one. If a step needs a symbol that a later
milestone owns, you have a forward reference — either pull the definition earlier (and re-cut the ladder) or
move the use later. Do not draft the milestone with the dangling reference.

## Scope discipline — the "consume it now" test (no gold-plating)

Scope discipline cuts both ways: don't defer required work, and don't build capability the milestone won't
use. The second half is easy to violate silently — you add a "nice" helper now because a later milestone will
want it. That leaves **dead members** the reader can't exercise or verify, and blurs which milestone owns
what. Make it a mechanical test:

- **Every public member or function a milestone adds must be CALLED within the same milestone** — exercised by
  that milestone's own code and observable through its Done-when gate.
- **The only exception is an explicitly-marked deferral:** if a member genuinely must exist now but is
  consumed later, mark it inline with a `[Mn]` comment naming the milestone that consumes it — e.g.
  `clear() { … } // [M10] used by the reset flow`. The marker turns invisible gold-plating into a declared,
  auditable promise. An unmarked, uncalled member is a defect.

> **The defect this prevents:** M8 building the full marker system that only M11 uses, leaving dead members
> scattered across intervening milestones. (Observed in an earlier worked example.) Build the capability in the
> milestone that consumes it — or mark the deferral.

## Ordering the ladder

1. **Start with the thinnest runnable thing** — the "hello, it's alive" slice (one endpoint, one screen, one
   command). This proves the toolchain before any real logic.
2. **Each rung adds one capability** and depends only on rungs below it.
3. **Defer cross-cutting concerns** (auth, config, error polish) until there's something to apply them to,
   unless one is a hard prerequisite.
4. **Mark the reality-check gate** — the first rung where the thing is genuinely *usable*. Stop there,
   actually use it, confirm it's worth continuing before building more. (In the source system this was a
   literal "playtest gate.")

## Sittings (stopping points inside a milestone)

A milestone with many steps gets grouped into **sittings** — clusters of steps that end at a natural
checkpoint/commit. This tells the reader where they can safely stop for the day. Name them in the overview's
"Steps at a glance":

```
Sitting 1 — Project setup (01–04)
Sitting 2 — First endpoint (05–07)
Sitting 3 — Verify (08)
```

## The handoff (what makes a *series* cohere)

Every milestone ends in a **handoff**: recap what was built, the cumulative "what exists so far", open
issues, and a pointer to the next milestone. Without it, a reader finishing M4 has no map of the whole
journey. The handoff is the connective tissue of the ladder.

## Presenting the ladder

Always present it as a table so dependencies and gates are visible at a glance:

| # | Milestone | Proves (end state) | Depends on | Done-when (one line) |
|---|-----------|--------------------|------------|-----------------------|
| M1 | Hello endpoint | one route answers over HTTP | — | `curl /health` → 200 `ok` |
| M2 | Read a book | endpoint returns a stored record | M1 | `curl /books/1` → the record |
| M3 | Create a book | POST persists; GET reads it back | M2 | POST then GET returns it |

---

## Lite mode

For a **small guide** (single doc, under ~2 hours), the full apparatus is overkill. In lite mode:

- Skip Phase 1 (foundation docs) and Phase 5 (verification design) from the planner.
- Collapse the ladder to **2–3 milestones**.
- Keep the two things that always matter: the **audience model** and the **pedagogy contract**.

Invoke it by telling the planner "lite mode." Everything else in this reference still applies at smaller
scale.
