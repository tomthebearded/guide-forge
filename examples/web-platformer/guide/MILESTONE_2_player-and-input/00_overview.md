# Milestone 2 — Player & keyboard control
> Section: Foundations · milestone 2 of 7 · prev: [Canvas & the game loop](../MILESTONE_1_canvas-and-loop/00_overview.md) · next: [Gravity & jumping](../MILESTONE_3_gravity-and-jump/00_overview.md)

## Goal
Turn the throwaway demo square into a real **player** you steer. We introduce the clean structure the rest of
the guide relies on — `Game.state` (what changes), `input.js` (held keys), `render.js` (drawing) — and a
`main.js` loop split into **`update(dt)`** and **`draw()`**. By the end, holding ←/→ (or A/D) moves the player
square; releasing stops it.

## Scope discipline
This milestone deliberately does **not**: add gravity, falling, or jumping (that's
[M3](../MILESTONE_3_gravity-and-jump/00_overview.md)) — the player floats and only moves horizontally. No
platforms/collision ([M4](../MILESTONE_4_platforms-and-collision/00_overview.md)), no coins, no sound. The
player can walk off the edges of the canvas for now; we don't clamp it.

## Prerequisite
[M1](../MILESTONE_1_canvas-and-loop/00_overview.md) green: the delta-time loop runs and logs `dt`.

## Steps at a glance
**Sitting 1 — the player data & input (01–02)**
1. [Update `config.js` and create `state.js` (the player entity)](01_config-and-state.md)
2. [Create `input.js` — track held keys](02_input.md)

**Sitting 2 — draw & wire it together (03–05)**
3. [Create `render.js` — draw the player](03_render.md)
4. [Wire it up: update `index.html` and split `main.js` into update + draw](04_wire-up.md)
5. [Verify Milestone 2](05_verify.md)

## Design / decisions folded in
- **`config` vs `state` split**, and **one update / one draw per frame** — see [conventions](../foundation/conventions.md#structure--architecture).
- **Held-key input via `event.code`** (physical key, layout-independent) — see [conventions](../foundation/conventions.md#language--framework-specifics) and [stack.md](../foundation/stack.md). New glossary terms: velocity (introduced properly in M3, previewed here as `vx`).

## Done-when gate
- [ ] Open `index.html` → a rounded blue player rectangle sits on the canvas.
- [ ] Hold **←** or **A** → it moves left; hold **→** or **D** → it moves right, at a steady ~240 px/s.
- [ ] Release the key → it stops immediately.
- [ ] Holding **both** directions at once → it stands still (they cancel), with no error in the Console.

## Handoff
### Recap
Introduced the `state`/`input`/`render` structure and a `main.js` update/draw loop; the player moves under keyboard control.
### Done so far (cumulative)
- The M1 delta-time loop, now split into `Game.update(dt)` and `Game.draw()`.
- `Game.state.player` — a box `{x, y, w, h, vx}`.
- `Game.input` — `{left, right}` held-key flags from `keydown`/`keyup`, keyed by `event.code`.
- `Game.draw()` renders the sky + the player (rounded rect, with a `fillRect` fallback).
### Artifacts now in the project
```
shape-jumper/
  index.html        (now loads config, state, input, render, main)
  style.css
  js/
    config.js       (player size + moveSpeed; demoSpeed removed)
    state.js        (NEW — the player entity)
    input.js        (NEW — keyboard)
    render.js       (NEW — draw the scene)
    main.js         (rewritten — update/draw split)
```
### Decisions / open issues
- The player floats and can leave the screen — expected. Gravity + a floor arrive next.
### Next milestone
[M3 — Gravity & jumping](../MILESTONE_3_gravity-and-jump/00_overview.md): the player falls under gravity, rests
on a floor, and jumps. Done-when: it falls to the floor, Space jumps once, no double-jump midair.

---
> Section: Foundations · milestone 2 of 7 · prev: [Canvas & the game loop](../MILESTONE_1_canvas-and-loop/00_overview.md) · next: [Gravity & jumping](../MILESTONE_3_gravity-and-jump/00_overview.md)
