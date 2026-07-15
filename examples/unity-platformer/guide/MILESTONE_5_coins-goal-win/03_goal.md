# Milestone 5 · Step 03 of 08 — Create the Goal (trigger + `Goal` tag)
> Nav: [← Place coins](02_place-coins.md) · [Overview](00_overview.md) · [Player triggers →](04_player-triggers.md)

## Why / design
The goal is the win condition — reach it and the run ends. Like a coin, the player walks *through* it, so it's a
**trigger**; and it's tagged **`Goal`** so the same player handler can tell it apart from a coin. We make it a
tall, obvious shape at the top of the level.

## Do this
1. In the **Hierarchy** (Game scene) right-click → **2D Object → Sprites → Square**. Rename it **`Goal`** (F2).
2. In the **Inspector → Transform** set **Scale X 1, Y 2, Z 1** (a tall flag-like bar) and **Position** near the
   top platform, e.g. **X 6, Y 4.5** (just above `Platform_C`). Give it a distinct color (e.g. bright green).
   *(Cosmetic size/color/position — just make it reachable and obvious.)*
3. **Add Component → Box Collider 2D**, then **check `Is Trigger`**. *(Mandatory — the player passes through and
   triggers a win, not a solid block.)*
4. Create and assign the tag: **Tag** dropdown → **Add Tag…** → **`+`** → type **`Goal`** → **Save**. Then
   reselect **`Goal`** and set its **Tag** to **Goal**. *(**Load-bearing:** matched by `CompareTag("Goal")`.)*
5. Leave the Goal on the **Default** layer (not Ground). *(A trigger on the Ground layer could confuse the
   grounded check.)*

## Done when (this step)
- [ ] A tall **`Goal`** object with **Tag = Goal** and a **BoxCollider2D (Is Trigger)** sits at the top of the
      level — the exact observable that the win target exists and is a trigger.

## If it breaks
- **Player bumps into the goal like a wall** → its collider isn't **Is Trigger**; check the box.
- **`Goal` tag missing from the dropdown** → you added it in the tag editor but didn't assign it; reselect Goal
  and pick **Goal**.
- **Goal unreachable** → move it within a jump of the top platform.
