# Milestone 3 · Step 03 of 06 — Attach it and test moving
> Nav: [← PlayerController (move)](02_playercontroller-move.md) · [Overview](00_overview.md) · [Add jump →](04_add-jump.md)

## Why / design
A script only runs when it's a **component on a GameObject**. We attach `PlayerController` to the **Player** and
test movement before adding jump — verifying one behavior at a time.

## Do this
1. In the **Hierarchy** (Game scene) select **`Player`**.
2. In the **Inspector** click **Add Component**, type **`Player Controller`**, and select your script. *(It now
   appears as a component with a **Move Speed** field — that's the `[SerializeField] moveSpeed`, exposed for
   tuning.)*
3. Leave **Move Speed** at **7** for now. *(It's a tunable — **cosmetic** within reason; higher = faster.)*
4. Press **Play**. Hold **→** (or **D**): the player slides right. Hold **←** (or **A**): it slides left. Release:
   it stops (horizontally) and gravity keeps it resting on the ground.
5. Press **Play** to stop.

## Done when (this step)
- [ ] In Play mode, holding **←/→** (or **A/D**) moves the player horizontally along the ground, and releasing
      stops it — the exact observable that input drives `linearVelocity`.

## If it breaks
- **Player doesn't move** → the script isn't attached (no **Player Controller** component in the Inspector), or
  the Console has a compile error. Fix errors first, then Add Component.
- **Player moves but immediately falls through the ground** → you lost the Ground's `BoxCollider2D` (M2/04);
  re-add it.
- **Player rotates/tumbles when moving into the ground edge** → expected for now; we freeze rotation in step 05.
- **Movement feels smoothed/laggy** → make sure you used `GetAxisRaw` (instant -1/0/+1), not `GetAxis`.
