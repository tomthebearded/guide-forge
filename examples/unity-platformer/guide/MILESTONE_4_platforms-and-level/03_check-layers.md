# Milestone 4 · Step 03 of 05 — Confirm every platform is on the Ground layer
> Nav: [← Build the level](02_build-level.md) · [Overview](00_overview.md) · [⭐ Reality-check →](04_reality-check.md)

## Why / design
The player's jump only works when the feet-check finds something on the **Ground** layer (M3/04). Duplicating
`Platform_Floor` *should* have copied the Ground layer to every platform — but a quick audit now prevents the
maddening "I can jump off some platforms but not others" bug later.

## Do this
1. In the **Hierarchy**, click **`Platform_Floor`**. In the **Inspector**, top-right, confirm **Layer** reads
   **Ground**.
2. Repeat for **`Platform_A`**, **`Platform_B`**, and **`Platform_C`** — each **Layer** must read **Ground**.
3. If any reads **Default** (or anything else), fix it: with that object selected, click the **Layer** dropdown →
   **Ground**.
4. Also confirm each still has a **Box Collider 2D** component (it should, from duplication) and that **none**
   has a `Rigidbody2D` (platforms are static). *(If a platform has a `Rigidbody2D`, remove it — it would fall.)*

## Done when (this step)
- [ ] All four objects — `Platform_Floor`, `Platform_A/B/C` — show **Layer: Ground** and have a `BoxCollider2D`
      and **no** `Rigidbody2D` — the exact observable that every platform is solid and jump-detectable.

## If it breaks
- **Jump works on some platforms but not others** → the failing one isn't on the **Ground** layer. Set it.
- **A platform falls when the game runs** → it has a `Rigidbody2D`; remove it (gear icon → Remove Component).
- **Player passes through a platform** → that platform lost its `BoxCollider2D`; **Add Component → Box Collider
  2D**.
