# Milestone 3 — Move & jump (first C#)
> Section: Control · milestone 3 of 8 (M0–M7) · next: [Platforms & a real level](../MILESTONE_4_platforms-and-level/00_overview.md)

## Goal
Write your **first gameplay script**, `PlayerController`, and attach it to the Player. It reads the **legacy
input axes** and drives the `Rigidbody2D`: run left/right by setting **`linearVelocity`**, and **jump** once when
grounded. Crucially, you write jumping and "grounded" **gravity-sign-aware** — reading the *sign* of
`Physics2D.gravity` — so the M6 gravity twist stays a tiny change.

## The JS-vs-Unity contrast for this milestone
The sibling wrote velocity, acceleration, an integrator, and an edge-triggered jump — all by hand, per frame.
Here the engine already integrates motion; your script just **hands it a velocity** each physics tick and lets
gravity (which the engine applies) do the rest. You write *intent* (how fast, jump now), not *mechanism*.

## Scope discipline
This milestone deliberately does **not**: add more platforms ([M4](../MILESTONE_4_platforms-and-level/00_overview.md)),
coins/goal/win ([M5](../MILESTONE_5_coins-goal-win/00_overview.md)), or the actual gravity flip
([M6](../MILESTONE_6_gravity-twist/00_overview.md)). We write the physics *sign-aware* now, but gravity stays
down this whole milestone. One player, one ground.

## Prerequisite
[M2 gate](../MILESTONE_2_world-and-free-physics/05_verify.md) green — the player falls and lands on the ground.

## Steps at a glance
**Sitting 1 — move (01–03)**
1. [Create a Ground layer and assign it](01_ground-layer.md)
2. [Write `PlayerController.cs` (horizontal movement)](02_playercontroller-move.md)
3. [Attach it and test moving](03_attach-and-test-move.md)

**Sitting 2 — jump (04–06)**
4. [Add the jump (sign-aware grounded check)](04_add-jump.md)
5. [Freeze the player's rotation](05_freeze-rotation.md)
6. [Verify Milestone 3](06_verify.md)

## Design / decisions folded in
- **Sign-aware physics so the twist is cheap** — [decision D5](../foundation/decision-log.md#d5--twist--flip-physics2dgravity-sign-aware-jump).
- **Legacy Input Manager, zero setup** — [decision D6](../foundation/decision-log.md#d6--legacy-input-manager-not-the-input-system) · axes `"Horizontal"`/`"Jump"` from [stack.md](../foundation/stack.md).
- **`linearVelocity`, not the obsolete `velocity`** · **input in `Update`, physics in `FixedUpdate`** — [conventions](../foundation/conventions.md#language--framework-specifics).
- New [glossary](../foundation/glossary.md) terms: `MonoBehaviour`, MonoBehaviour lifecycle methods,
  `[SerializeField]`, LayerMask, Grounded, Active Input Handling.

## Done-when gate
- [ ] Press **Play** → **←/→** (or **A/D**) move the player smoothly; releasing stops it.
- [ ] **Space** makes the player jump up once and fall back.
- [ ] No second jump while airborne (jump only when grounded).
- [ ] The player no longer topples over when it lands on an edge (rotation frozen).

## Handoff
### Recap
Added a Ground layer, wrote `PlayerController` (move + sign-aware jump), wired its Inspector fields, and froze
the player's rotation.
### Done so far (cumulative)
- (M0–M2) Project, menu, `Game` scene with a falling/landing Player + Ground.
- A **Ground** physics layer, assigned to the Ground object.
- `PlayerController.cs` on the Player: horizontal move via `linearVelocity`, one grounded jump, both sign-aware.
- The Player's `Rigidbody2D` has **Freeze Rotation Z** on.
### Artifacts now in the project
```
ShapeJumper/
  Assets/
    Scenes/  MainMenu.unity, Game.unity
    Scripts/ MenuController.cs, PlayerController.cs
```
### Decisions / open issues
- Only one ground bar — the level proper is M4.
- Gravity is always down here; the grounded/jump code already reads the gravity **sign**, so M6 won't touch this
  script.
### Next milestone
[M4 — Platforms & a real level](../MILESTONE_4_platforms-and-level/00_overview.md): duplicate the ground into
platforms, build a level, and **play it** — the reality-check gate.

---
> Section: Control · milestone 3 of 8 (M0–M7) · next: [Platforms & a real level](../MILESTONE_4_platforms-and-level/00_overview.md)
