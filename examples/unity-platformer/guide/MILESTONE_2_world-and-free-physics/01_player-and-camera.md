# Milestone 2 · Step 01 of 05 — Add the Player square and frame the camera
> Nav: — · [Overview](00_overview.md) · [Ground →](02_ground.md)

## Why / design
We build the player from a plain **Square** sprite (shapes only — [conventions](../foundation/conventions.md)).
Naming it **`Player`** matters later: the script and the camera will refer to it. We also nudge the camera so
there's room above the ground for the player to fall.

## Do this
1. Open the **`Game`** scene if it isn't already (Project → double-click `Assets/Scenes/Game`). Confirm the
   title bar reads "…- Game -…".
2. In the **Hierarchy**, right-click empty space → **2D Object → Sprites → Square**.
3. Rename it exactly **`Player`** (F2). *(Not load-bearing — the code never looks it up by name — but keep it as
   `Player` for consistency with later steps.)*
4. With **Player** selected, in the **Inspector** set **Transform → Position** to **X 0, Y 2, Z 0**. *(Why Y 2:
   start it above where the ground will be, so it has room to fall. Cosmetic exact value.)*
5. Give it a distinct color so it's easy to see: in the **Sprite Renderer** component, click the **Color**
   swatch and pick e.g. a bright blue. Close the color picker. *(Cosmetic.)*
6. (Optional, cosmetic) Select **Main Camera** and set its **Size** (under the Camera component, the
   orthographic **Size**) to about **5** so the scene isn't too zoomed. Leave everything else at default.

## Done when (this step)
- [ ] A GameObject named **`Player`** (a colored square) sits near the top-center of the **Game** view at
      Position Y ≈ 2 — the exact observable that the player exists and is framed with room below it.

## If it breaks
- **Square not visible in Game view** → check **Position Z = 0** and that **Main Camera** Z is negative (default
  `-10`). Off-screen usually means a bad Z or the camera Size too small.
- **No `2D Object` menu** → the project is 3D; you'd need to recreate it 2D (M0/02).

---
> Nav: — · [Overview](00_overview.md) · [Ground →](02_ground.md)
