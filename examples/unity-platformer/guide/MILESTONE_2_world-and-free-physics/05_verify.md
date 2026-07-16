# Milestone 2 · Step 05 of 05 — Verify Milestone 2
> Nav: [← Colliders land](04_colliders-land.md) · [Overview](00_overview.md) · [M3 — Move & jump →](../MILESTONE_3_move-and-jump/00_overview.md)

## Milestone Done-when gate
Open the **`Game`** scene, press **Play**, and check:
- [ ] **The player falls** — the `Player` square accelerates downward under gravity.
- [ ] **The player lands** — it comes to rest **on top of** the `Ground` bar and stays there.
- [ ] **Zero code** — you added only a `Rigidbody2D` (Player) and `BoxCollider2D` (Player + Ground). You wrote no
      C# this whole milestone.

Press **Play** to stop.

## The JS-vs-Unity contrast (milestone recap)
This is the guide's thesis, proven. In `web-platformer/`:
- **Gravity** was M3 — a hand-written integrator adding acceleration to velocity to position every frame.
- **Collision** was M4 — AABB overlap detection plus smallest-axis resolution to keep the player out of solids.

Here, **both** are the result of adding **three components** (`Rigidbody2D` + two `BoxCollider2D`) and pressing
Play. That's the trade Unity offers: an engine and an install cost, in exchange for not writing the loop,
gravity, or collision yourself. From here on you *react* to the engine (M3+) rather than *implement* it.

## Files after this milestone
No new or changed source files — this milestone was pure Editor work. `Assets/Scripts/MenuController.cs` is
unchanged from [M1](../MILESTONE_1_main-menu/08_verify.md). The scene state you built:
```
Game scene (Assets/Scenes/Game.unity)
  Main Camera
  Player   — Sprite Renderer, Rigidbody2D (Dynamic), BoxCollider2D
  Ground   — Sprite Renderer, BoxCollider2D   (no Rigidbody2D → static)
```

## Troubleshooting
- **Falls through the ground** → a missing `BoxCollider2D` on Player or Ground.
- **Ground drifts/falls too** → the Ground wrongly has a `Rigidbody2D`; remove it.
- **Player doesn't move at all** → no `Rigidbody2D` on the Player, or Body Type isn't **Dynamic**.
- **Everything resets when I stop Play** → expected; edits made during Play are discarded. Make changes with Play
  **off**.

## Next
[M3 — Move & jump](../MILESTONE_3_move-and-jump/00_overview.md): time for your **first gameplay script**. You'll
read the keyboard and drive the `Rigidbody2D` to run and jump — writing it **gravity-sign-aware** so the M6
twist stays cheap. *(The **twist** is M6's signature mechanic — mid-run the engine's gravity randomly flips
upside-down for a while, then flips back; you'll build it in [M6](../MILESTONE_6_gravity-twist/00_overview.md).)*

---
> Nav: [← Colliders land](04_colliders-land.md) · [Overview](00_overview.md) · [M3 — Move & jump →](../MILESTONE_3_move-and-jump/00_overview.md)
