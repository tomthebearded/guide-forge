# Milestone 4 · Step 02 of 05 — Arrange a jumpable level
> Nav: [← Platform from ground](01_platform-from-ground.md) · [Overview](00_overview.md) · [Check layers →](03_check-layers.md)

## Why / design
The platforms exist; now make them a **level you can actually climb**. The key constraint: each platform must be
reachable from a lower one in a **single jump**. With the default `Jump Speed = 7` and default gravity, a jump
rises about **2.5 units** at its peak (and, because these jumps are fairly floaty, carries you several units
sideways too) — so keep each **vertical step ≤ ~2 units**.

## Do this
1. Click the **Scene** tab (not Game) so you can drag objects freely. Use the mouse wheel to zoom and the
   **Move** tool (**W**) to drag platforms.
2. Arrange the four pieces into a rising staircase the player can climb from the floor to the top. A workable
   layout (positions), building on step 01:
   - **Platform_Floor** — Position **X 0, Y -3**, Scale **X 16, Y 1** (the full-width floor).
   - **Platform_A** — Position **X -5, Y -1**.
   - **Platform_B** — Position **X 1, Y 1**.
   - **Platform_C** — Position **X 6, Y 3**.
3. Sanity-check the **gaps**: from the floor up to `Platform_A` is 2 units; A→B is 2; B→C is 2. Each is within a
   single jump. *(If you rearrange them, keep each vertical step ≤ ~2 units so a default jump still clears it.)*
4. Press **Play** and try to climb from the floor to `Platform_C`. Adjust any platform you can't reach: select
   it (Play **off**) and lower it or move it closer.

MANDATORY: every platform reachable in one jump from a lower one. ILLUSTRATIVE: the specific staircase shape —
make any layout you like as long as it's climbable.

## Done when (this step)
- [ ] In Play mode you can **jump from the floor up through A, B, to C** and stand on the top platform — the
      exact observable that the level is traversable.

## If it breaks
- **A platform is unreachable** → the vertical gap is too big; lower it to ≤ ~2 units above the one below (the
  jump peaks near 2.5, so 2 leaves margin), or raise the Player's **Jump Speed**.
- **Player clips the side of a platform instead of landing** → approach from above; that's normal platformer
  behavior. If it feels bad, widen the platform (Scale X).
- **You fall off the world** → the floor is your safety net; make sure `Platform_Floor` spans the whole width
  (Scale X ~16).
