# Milestone 4 · Step 01 of 05 — Rename the ground and duplicate it into platforms
> Nav: — · [Overview](00_overview.md) · [Build the level →](02_build-level.md)

## Why / design
Every platform is the same thing as the ground — a scaled square with a `BoxCollider2D` on the **Ground** layer.
So we make platforms by **duplicating** the ground. Duplicating copies the collider *and* the layer, so each
copy is instantly solid and jump-detectable. No new art, no new setup.

## Do this
1. Keep the wide floor as-is but rename it for clarity: select **`Ground`** in the Hierarchy, press **F2**, and
   name it **`Platform_Floor`**. *(Cosmetic name; it stays on the Ground layer.)*
2. Select **`Platform_Floor`** and press **Ctrl+D** to **Duplicate**. A copy named `Platform_Floor (1)` appears
   on top of the original.
3. Rename the copy **`Platform_A`** (F2). In the **Inspector → Transform** set:
   - **Position**: **X -5, Y -1, Z 0**
   - **Scale**: **X 4, Y 1, Z 1** *(a shorter platform than the floor. Values are **cosmetic** — this is level
     design, tune freely.)*
4. **Ctrl+D** again on `Platform_A`, rename it **`Platform_B`**, set **Position X 1, Y 1, Z 0** and **Scale X 4,
   Y 1, Z 1**.
5. **Ctrl+D** once more, rename **`Platform_C`**, set **Position X 6, Y 3, Z 0** and **Scale X 3, Y 1, Z 1**.
6. Give the platforms a color if you like (Sprite Renderer → Color). *(Cosmetic.)*

MANDATORY: each platform keeps a **`BoxCollider2D`** and stays on the **Ground** layer (duplication preserves
both). ILLUSTRATIVE: the exact count, positions, and sizes — three platforms is an example, not a requirement.

## Done when (this step)
- [ ] The Hierarchy shows **`Platform_Floor`**, **`Platform_A`**, **`Platform_B`**, **`Platform_C`**, and the
      Game view shows a wide floor with three smaller platforms at rising heights — the exact observable that the
      level pieces exist.

## If it breaks
- **Duplicate lands exactly on top and you can't see it** → it's there; just change its Position so it moves
  apart.
- **A platform isn't solid when you test later** → it lost its `BoxCollider2D` or its Ground layer; steps 03 and
  05 catch this.
- **Platforms are off-screen** → keep positions within roughly X ∈ [-8, 8], Y ∈ [-4, 4] for the default camera
  Size 5, or raise the camera Size.

---
> Nav: — · [Overview](00_overview.md) · [Build the level →](02_build-level.md)
