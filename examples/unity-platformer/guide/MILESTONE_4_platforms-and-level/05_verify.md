# Milestone 4 · Step 05 of 05 — Verify Milestone 4
> Nav: [← ⭐ Reality-check](04_reality-check.md) · [Overview](00_overview.md) · [M5 — Coins, goal & win →](../MILESTONE_5_coins-goal-win/00_overview.md)

## Milestone Done-when gate
In the **`Game`** scene, press **Play**:
- [ ] **Solid platforms** — the player lands on every platform (`Platform_Floor`, `A`, `B`, `C`) and can't pass
      through their tops or sides.
- [ ] **Traversable** — you can climb from the floor to the top platform by running and jumping.
- [ ] **Fun call made** — you playtested for a minute and decided it's worth finishing.

Press **Play** to stop.

## The JS-vs-Unity contrast (milestone recap)
The sibling's level was **data** — an array of `{x, y, w, h}` boxes iterated and collided in code. Yours is a
handful of **duplicated GameObjects** arranged by eye in the Scene view; each carries the same `BoxCollider2D`
that makes it solid, no per-platform code. Same playable result, built by placing objects instead of writing a
data structure and a collision loop.

## Files after this milestone
No source files changed — `MenuController.cs` and `PlayerController.cs` are exactly as in
[M3](../MILESTONE_3_move-and-jump/06_verify.md). The scene now holds:
```
Game scene (Assets/Scenes/Game.unity)
  Main Camera
  Player          — Rigidbody2D (Dynamic, Freeze Rotation Z), BoxCollider2D, PlayerController (Ground Layer=Ground)
  Platform_Floor  — BoxCollider2D, layer Ground        (static)
  Platform_A      — BoxCollider2D, layer Ground        (static)
  Platform_B      — BoxCollider2D, layer Ground        (static)
  Platform_C      — BoxCollider2D, layer Ground        (static)
```

## Troubleshooting
- **Can't jump off one platform** → it's not on the **Ground** layer (M4/03).
- **A platform falls / drifts** → it has a `Rigidbody2D`; remove it.
- **Player falls through a platform** → that platform lost its `BoxCollider2D`.
- **A platform is unreachable** → vertical gap > one jump; lower it or raise Jump Speed (M4/02).

## Next
[M5 — Coins, goal & win](../MILESTONE_5_coins-goal-win/00_overview.md): add circle coins you collect for score,
a goal that triggers a **win**, and an on-screen HUD — introducing triggers, tags, prefabs, and your second
script, `GameManager`.

---
> Nav: [← ⭐ Reality-check](04_reality-check.md) · [Overview](00_overview.md) · [M5 — Coins, goal & win →](../MILESTONE_5_coins-goal-win/00_overview.md)
