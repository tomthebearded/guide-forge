# Milestone 2 · Step 02 of 05 — Add the Ground square
> Nav: [← Player & camera](01_player-and-camera.md) · [Overview](00_overview.md) · [Rigidbody falls →](03_rigidbody-falls.md)

## Why / design
The player needs something to land on. We make the ground from another **Square**, stretched wide and thin with
its **Scale**, and placed below the player. Scaling a square is how we make platforms of any size without new
art (shapes only).

## Do this
1. In the **Hierarchy** (Game scene), right-click → **2D Object → Sprites → Square**. Rename it exactly
   **`Ground`** (F2). *(Keep this name — M4 duplicates it into platforms.)*
2. With **Ground** selected, in the **Inspector → Transform** set:
   - **Position**: **X 0, Y -3, Z 0** *(below the player, which is at Y 2)*.
   - **Scale**: **X 16, Y 1, Z 1** *(a wide, thin bar. The X/Y scale values are **cosmetic** — resize freely.)*
3. Give it a contrasting color via the **Sprite Renderer → Color** swatch (e.g. a grey or dark green). *(Cosmetic.)*
4. Click the **Game** tab and confirm you see a **wide bar (Ground)** below a **small square (Player)**, with a
   gap between them. *(That gap is the distance the player will fall.)*

## Done when (this step)
- [ ] A wide, thin **`Ground`** bar sits below the **`Player`** square in the Game view, with visible space
      between them — the exact observable that the world is framed for a fall.

## If it breaks
- **Ground is a tiny square, not a bar** → you didn't set **Scale X** high; set Scale to **16, 1, 1**.
- **Player and Ground overlap** → increase the gap: put Player at Y 2 and Ground at Y -3 (or lower the ground
  further).
- **Ground off-screen** → raise the camera **Size** (Main Camera → Camera → Size) so both fit.

---
> Nav: [← Player & camera](01_player-and-camera.md) · [Overview](00_overview.md) · [Rigidbody falls →](03_rigidbody-falls.md)
