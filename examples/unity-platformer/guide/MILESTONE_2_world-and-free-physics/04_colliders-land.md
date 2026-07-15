# Milestone 2 · Step 04 of 05 — Add colliders — the player lands
> Nav: [← Rigidbody falls](03_rigidbody-falls.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Glossary for this step
- **`BoxCollider2D`** — a component that gives a GameObject a rectangular collision shape so the physics engine
  can detect contact. See [glossary](../foundation/glossary.md).

## Why / design
A `Rigidbody2D` makes something *move*; a **`BoxCollider2D`** makes something *solid*. Two objects only stop each
other when **both** have colliders. So we add a box collider to the **Player** and to the **Ground** — then the
falling player lands. Still no code: collision detection and response are the engine's job.

> **Recurring mental model — everything collides as a box.** Player, ground, and every platform get a
> `BoxCollider2D`. One collision shape for everything keeps the physics simple (and matches
> [conventions](../foundation/conventions.md#data-vs-code)).

## Do this
1. Select **`Player`** in the Hierarchy. **Add Component → Box Collider 2D**. Unity auto-sizes the box to the
   sprite — a green outline appears around the square. *(Leave **Is Trigger** unchecked; a trigger wouldn't
   block movement. Leave the offset/size at their auto values.)*
2. Select **`Ground`** in the Hierarchy. **Add Component → Box Collider 2D**. The green outline matches the wide
   bar. *(The Ground has **no** `Rigidbody2D` — that's deliberate: no Rigidbody2D = a **static** collider the
   engine treats as immovable. Only the Player is Dynamic.)*
3. Press **Play**. The **Player** falls and **stops on top of the Ground**, resting there. *(The engine detected
   the two boxes touching and stopped the player — zero code.)*
4. Press **Play** to stop.

## Done when (this step)
- [ ] Pressing **Play** makes the Player fall and **come to rest on top of the Ground bar** — sitting on it, not
      sinking in or passing through. That resting-on-the-surface image is the exact observable.

## If it breaks
- **Player still falls through** → the **Ground** is missing its `BoxCollider2D` (or the Player is). Both need
  one. Re-check step 1 and 2.
- **Player sinks halfway into the ground then stops** → the collider sizes don't match the sprites; select each
  and confirm the green outline hugs the shape. Click the collider's **Edit Collider** button to re-fit if
  needed.
- **Player passes through at high speed** → not an issue at this scale, but if you enlarged gravity, Unity's
  default collision handles it; leave Gravity Scale at 1.
- **Ground moves when hit** → you accidentally gave the Ground a `Rigidbody2D`. Remove it — the ground must be
  static.
