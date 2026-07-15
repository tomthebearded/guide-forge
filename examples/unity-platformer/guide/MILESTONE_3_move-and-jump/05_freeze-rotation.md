# Milestone 3 · Step 05 of 06 — Freeze the player's rotation
> Nav: [← Add jump](04_add-jump.md) · [Overview](00_overview.md) · [Verify →](06_verify.md)

## Why / design
A `Rigidbody2D` can rotate when it hits things at an angle — so the player square can **topple over** when it
lands on an edge or bumps a wall. A platformer character should stay upright. We lock its rotation with a
`Rigidbody2D` **constraint** (one checkbox, no code).

## Do this
1. In the **Hierarchy** select **`Player`**.
2. In the **Inspector**, on the **Rigidbody 2D** component, expand **Constraints**.
3. Check **Freeze Rotation → Z**. *(Z is the only rotation axis in 2D. Leave the **Freeze Position** boxes
   unchecked — the player must still move and fall.)*
4. Press **Play**, run into the ground edge and jump around — the player **slides and jumps but never spins**.
5. Press **Play** to stop.

## Done when (this step)
- [ ] Running into edges and landing no longer makes the player **rotate/tumble** — it stays upright — the exact
      observable that Freeze Rotation Z is on.

## If it breaks
- **Player still spins** → you checked a **Freeze Position** box instead of **Freeze Rotation Z**, or didn't
  check it at all. Only **Freeze Rotation Z** should be on.
- **Player won't move or fall anymore** → you accidentally froze **Position X/Y**. Uncheck those; only Rotation Z
  is frozen.
