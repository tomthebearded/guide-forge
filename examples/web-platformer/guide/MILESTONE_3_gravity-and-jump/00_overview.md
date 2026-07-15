# Milestone 3 — Gravity & jumping (sign-aware)
> Section: Core mechanics · milestone 3 of 7 · prev: [Player & keyboard control](../MILESTONE_2_player-and-input/00_overview.md) · next: [Platforms & AABB collision](../MILESTONE_4_platforms-and-collision/00_overview.md)

## Goal
Give the player **vertical velocity**, pull it down with **gravity**, catch it on a **floor**, and let it
**jump**. Crucially, we write gravity as a **signed value** through one integrator and compute "grounded"
against the gravity-facing side — the direction-agnostic design (decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics))
that makes the M6 gravity-flip twist almost free. By the end: the player falls, rests on the floor, and jumps
once per landing.

## Scope discipline
This milestone deliberately does **not**: add platforms or box-vs-box collision (that's
[M4](../MILESTONE_4_platforms-and-collision/00_overview.md)) — there is only a single **floor line**, and the
player can still walk off the left/right edges. No coins, goal, sound, or the actual gravity flip (though the
code is *written to allow* it). The floor here is a simple clamp; M4 replaces it with real platform collision
(including a ceiling, which the twist needs).

## Prerequisite
[M2](../MILESTONE_2_player-and-input/00_overview.md) green: the player moves left/right under keyboard control.

## Steps at a glance
**Sitting 1 — fall (01–03)**
1. [Add gravity constants and vertical state](01_config-and-state.md)
2. [Create `physics.js`: velocity + gravity (the player falls)](02_physics-gravity.md)
3. [Catch it: the floor + `grounded`](03_floor-and-grounded.md)

**Sitting 2 — jump (04–05)**
4. [Jump: queue the key and apply an impulse](04_jump.md)
5. [Verify Milestone 3](05_verify.md)

## Design / decisions folded in
- **Gravity is a signed number through one integrator; "grounded" = resting on the gravity-facing side** —
  decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics), [conventions](../foundation/conventions.md#language--framework-specifics).
- New glossary terms: velocity (`vy`), acceleration, gravity, jump impulse, grounded — all in the [glossary](../foundation/glossary.md).

## Done-when gate
- [ ] Open `index.html` → the player **falls** and comes to rest exactly on the floor line (no sinking, no jitter).
- [ ] Press **Space** (or **↑**) → it launches upward and falls back down under gravity.
- [ ] Pressing jump again **while airborne does nothing** — you can only jump when grounded (no double-jump).
- [ ] Left/right still work, including while airborne.

## Handoff
### Recap
Added a physics module: vertical velocity, gravity (sign-aware), a floor with `grounded`, and a jump impulse.
### Done so far (cumulative)
- Everything from M2 (loop, player, input, render).
- `Game.state.player` now has `vy` and `grounded`; `Game.state.gravitySign` (+1 = down).
- `Game.updatePlayer(dt)` in `physics.js` — horizontal + gravity + floor + jump, all in one integrator.
- `input.js` now queues a one-shot jump (`Game.input.jumpQueued`) via Space/↑, ignoring key-repeat.
- `render.js` draws the floor.
### Artifacts now in the project
```
shape-jumper/
  index.html   (loads config, state, input, physics, render, main)
  style.css
  js/
    config.js  (+ gravity, jumpSpeed, floorY, colors.platform)
    state.js   (+ vy, grounded, gravitySign)
    input.js   (+ jumpQueued)
    physics.js (NEW — updatePlayer)
    render.js  (+ floor)
    main.js    (update() now calls Game.updatePlayer)
```
### Decisions / open issues
- Grounding here only knows about a single floor; M4 makes it fully general (any platform, top or bottom).
- The player can leave the screen sideways — M4's platforms will box it in.
### Next milestone
[M4 — Platforms & AABB collision](../MILESTONE_4_platforms-and-collision/00_overview.md) ⭐ **reality-check**:
solid platforms you land on and bump into. Done-when: lands on every platform, can't pass through any side —
then you actually play it.
