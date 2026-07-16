# Milestone 2 — The world & free physics (still no code)
> Section: The engine · milestone 2 of 8 (M0–M7) · next: [Move & jump](../MILESTONE_3_move-and-jump/00_overview.md)

## Goal
Fill the empty `Game` scene with shapes — a **Player** square and a **Ground** square — then add a
**`Rigidbody2D`** and a **`BoxCollider2D`** and watch the player **fall under gravity and land on the ground**.
The point: **you write no C# to make this happen.** Gravity and collision are components you add, not code you
write.

## The JS-vs-Unity contrast for this milestone
This is the milestone that defines the whole guide. In the sibling `web-platformer/`, gravity was an entire
milestone (M3: write an integrator, apply acceleration each frame) and collision was another (M4: AABB overlap
math + resolution). **Here both are two components and zero lines of code.** Feel that difference — it's what
you traded the install cost for in M0.

## Scope discipline
This milestone deliberately does **not**: read input or move the player under control (that's
[M3](../MILESTONE_3_move-and-jump/00_overview.md)), add jumping, add more than one ground platform
([M4](../MILESTONE_4_platforms-and-level/00_overview.md)), or write any script. The player only **falls and
lands** — driven entirely by the engine.

## Prerequisite
[M1 gate](../MILESTONE_1_main-menu/08_verify.md) green — the menu loads the `Game` scene. Work happens in the
**`Game`** scene now.

## Steps at a glance
**Sitting 1 — the shapes (01–02)**
1. [Add the Player square and frame the camera](01_player-and-camera.md)
2. [Add the Ground square](02_ground.md)

**Sitting 2 — free physics (03–05)**
3. [Add a Rigidbody2D — the player falls](03_rigidbody-falls.md)
4. [Add colliders — the player lands](04_colliders-land.md)
5. [Verify Milestone 2](05_verify.md)

## Design / decisions folded in
- **The engine does the work; code is deferred to M3** — [decision D2](../foundation/decision-log.md#d2--the-engine-does-the-work-code-is-deferred-to-m3).
- **Everything collides as a box** — [conventions](../foundation/conventions.md#data-vs-code); the player is the
  only `Rigidbody2D` (Dynamic), the ground is static (no Rigidbody2D).
- New [glossary](../foundation/glossary.md) terms: `Rigidbody2D`, `BoxCollider2D`, `Physics2D.gravity`.

## Done-when gate
- [ ] Press **Play** → the **Player** square **falls** downward under gravity.
- [ ] It **stops on top of** the **Ground** square (not sinking in, not passing through).
- [ ] You wrote **zero C#** to achieve this — only added `Rigidbody2D` + `BoxCollider2D` components.

## Handoff
### Recap
Built the `Game` scene's Player and Ground from squares, framed the camera, and used a `Rigidbody2D` +
`BoxCollider2D`s to get engine-driven falling and landing — no code.
### Done so far (cumulative)
- (M0–M1) Unity project; menu scene that loads `Game`; `MenuController.cs`.
- A `Game` scene containing a **Player** square (Dynamic `Rigidbody2D` + `BoxCollider2D`) and a **Ground**
  square (`BoxCollider2D`, static).
- The player falls and lands via the physics engine alone.
### Artifacts now in the project
```
ShapeJumper/
  Assets/
    Scenes/  MainMenu.unity, Game.unity   (Game now has Player + Ground)
    Scripts/ MenuController.cs
```
### Decisions / open issues
- No control yet — the player falls on its own. M3 adds a script to move and jump it.
- The old throwaway `Square` / `SampleScene` from M0 can be deleted if you haven't already.
### Next milestone
[M3 — Move & jump](../MILESTONE_3_move-and-jump/00_overview.md): write your first *gameplay* script,
`PlayerController`, to run left/right and jump — reading the legacy input axes and driving the `Rigidbody2D`.

---
> Section: The engine · milestone 2 of 8 (M0–M7) · next: [Move & jump](../MILESTONE_3_move-and-jump/00_overview.md)
