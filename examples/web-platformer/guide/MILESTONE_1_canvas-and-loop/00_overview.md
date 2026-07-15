# Milestone 1 — Canvas & the game loop
> Section: Foundations · milestone 1 of 7 · next: [Player & keyboard control](../MILESTONE_2_player-and-input/00_overview.md)

## Goal
Stand up the whole zero-build page — `index.html`, `style.css`, and the ordered `<script>` tags — then draw a
square on an HTML5 **canvas** and animate it with a **game loop** that moves it at a speed **independent of the
monitor's refresh rate**. By the end, a square glides across the canvas at the same real-world speed on any
screen, and the DevTools console prints the per-frame **delta time**. This milestone builds the single most
important machine in the guide: *clear → update → draw, every frame, scaled by `dt`.*

## Scope discipline
This milestone deliberately does **not**: read the keyboard (that's [M2](../MILESTONE_2_player-and-input/00_overview.md)),
add gravity or jumping ([M3](../MILESTONE_3_gravity-and-jump/00_overview.md)), add platforms or collision
([M4](../MILESTONE_4_platforms-and-collision/00_overview.md)), or introduce a `Game.state`/`render.js`
structure. The animated square here is a **throwaway demo** to prove the loop; M2 replaces it with the real
player. Don't build the player entity yet.

## Prerequisite
A text editor and a modern browser. Nothing to install (see [foundation/stack.md](../foundation/stack.md)).

## Steps at a glance
**Sitting 1 — the page (01–02)**
1. [Create the project folder and the page skeleton](01_page-skeleton.md)
2. [Create `config.js` — the `Game` namespace](02_config-namespace.md)

**Sitting 2 — the loop (03–06)**
3. [Grab the 2D context and draw one static square](03_canvas-context.md)
4. [Animate it: the `requestAnimationFrame` loop](04_animation-loop.md)
5. [Make it frame-rate independent with delta time](05_delta-time.md)
6. [Verify Milestone 1](06_verify.md)

## Design / decisions folded in
- **Zero build, classic scripts, one global `Game`** — see [decision D1](../foundation/decision-log.md#d1--zero-build-classic-scripts-not-es-modules) and [conventions](../foundation/conventions.md#structure--architecture).
- **Delta-time loop with a clamped `dt`** — see [decision D2](../foundation/decision-log.md#d2--delta-time-loop-clamped-dt). New terms land in the [glossary](../foundation/glossary.md): canvas/2D context, frame, game loop, `requestAnimationFrame`, delta time, y-down coordinates.

## Done-when gate
- [ ] Open `index.html` in a browser → a blue square appears on a dark canvas and glides left-to-right, wrapping back to the left edge.
- [ ] The square moves at the **same real-world speed** regardless of the monitor's refresh rate (it's scaled by `dt`, not by frames).
- [ ] The DevTools **Console** prints a `dt` line each frame — a small number like `0.0167` (≈1/60 s) on a 60 Hz screen.

## Handoff
### Recap
Built the zero-build page and a frame-rate-independent game loop; animated a demo square with delta time.
### Done so far (cumulative)
- A working `index.html` that loads `js/config.js` and `js/main.js` as classic scripts.
- The global `Game` object with `Game.config` (canvas size, colors, `maxDt`, demo speed).
- A `requestAnimationFrame` loop that clears and redraws each frame and moves a square by `speed * dt`.
### Artifacts now in the project
```
shape-jumper/
  index.html
  style.css
  js/
    config.js
    main.js
```
### Decisions / open issues
- The moving square is a **demo**, replaced by the real player in M2. No input yet — it moves on its own.
### Next milestone
[M2 — Player & keyboard control](../MILESTONE_2_player-and-input/00_overview.md): turn the demo square into a
player you move left/right with the keyboard. Done-when: held ←/→ (or A/D) moves it; release stops it.
