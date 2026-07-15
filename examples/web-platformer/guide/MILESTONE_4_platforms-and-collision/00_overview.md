# Milestone 4 — Platforms & AABB collision  ⭐ reality-check gate
> Section: Core mechanics · milestone 4 of 7 · prev: [Gravity & jumping](../MILESTONE_3_gravity-and-jump/00_overview.md) · next: [Coins, goal & win](../MILESTONE_5_coins-goal-win/00_overview.md)

## Goal
Replace the single floor line with a **level of solid rectangles** the player can stand on, land on, and bump
into from any side. We add the level as **data** (`level.js`), a reusable **AABB overlap test**, and
**collision resolution** that pushes the player out along the smaller overlap and sets `grounded` on the
gravity-facing side. This is the **reality-check gate** — the first time it's genuinely a platformer — so the
last step is: *actually play it and decide it's worth finishing.*

## Scope discipline
This milestone deliberately does **not**: add coins, a goal, score, or a win state (that's
[M5](../MILESTONE_5_coins-goal-win/00_overview.md)); add sound ([M7](../MILESTONE_7_sound-timer-persistence/00_overview.md));
or actually flip gravity ([M6](../MILESTONE_6_gravity-twist/00_overview.md)) — though the collision is written
so that flipping *will* work (a ceiling platform is included now for exactly that reason). One hand-authored
level; no level loading or editor.

## Prerequisite
[M3](../MILESTONE_3_gravity-and-jump/00_overview.md) green: the player falls, rests on the floor, and jumps.

## Steps at a glance
**Sitting 1 — platforms (01–02)**
1. [Create `level.js`: the platforms as data, and draw them](01_level-data.md)
2. [Solid collision: the AABB test + resolution (replaces the floor)](02_collision.md)

**Sitting 2 — play it (03–04)**
3. [Reality-check: actually play it](03_reality-check.md)
4. [Verify Milestone 4](04_verify.md)

## Design / decisions folded in
- **Everything is a box; the level is data** — [conventions](../foundation/conventions.md#data-vs-code). New glossary terms: AABB, entity, collision resolution, penetration/overlap.
- **Separate-axis resolution + gravity-facing `grounded`** — the general form of decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics); the included ceiling is what M6 needs.
- **Single fixed canvas, no camera** — decision [D5](../foundation/decision-log.md#d5--single-fixed-size-canvas-no-scrolling-camera); we also clamp the player to the canvas horizontally.

## Done-when gate
- [ ] The player **lands on and rests on** the floor and all three ledges (the ceiling is only landable once gravity flips in M6).
- [ ] The player **cannot pass through** a platform's sides or underside — it's blocked / bonks its head.
- [ ] The player can't walk off the left/right edges of the canvas.
- [ ] After backgrounding the tab and returning, the player **never tunnels through** a platform (the `dt` clamp holds).
- [ ] **Reality-check:** you played it for a minute and it feels like a platformer worth finishing.

## Handoff
### Recap
Turned the floor into a real level of solid platforms with AABB collision resolution and general grounding.
### Done so far (cumulative)
- Everything from M3 (loop, player, input, gravity, jump).
- `Game.level.platforms` — an array of solid boxes (floor, ceiling, three ledges).
- `Game.overlaps(a, b)` — the AABB test, reused for coins/goal later.
- `Game.updatePlayer(dt)` now resolves collisions on X then Y, sets `grounded` on the gravity-facing side, and clamps the player to the canvas.
- `render.js` draws all platforms from the level data.
### Artifacts now in the project
```
shape-jumper/
  index.html   (loads config, state, input, physics, level, render, main)
  js/
    config.js  (floorY removed — the floor is now a platform)
    level.js   (NEW — platforms as data)
    physics.js (AABB collision replaces the floor clamp)
    render.js  (draws platforms from level data)
    ... (state, input, main unchanged)
```
### Decisions / open issues
- The ceiling platform looks pointless now — it's there for M6, when gravity flips and the player lands on it.
- Collision is simple separate-axis AABB; fast-moving corner cases are avoided by the `dt` clamp and platforms thicker than one frame of movement.
### Next milestone
[M5 — Coins, goal, HUD & win](../MILESTONE_5_coins-goal-win/00_overview.md): give the level a point — collect
coins and reach the goal to win. Done-when: coins score up, the goal triggers a WIN state.
