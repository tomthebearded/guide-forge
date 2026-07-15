# Milestone 3 · Step 03 of 5 — Catch it: the floor + `grounded`
> Nav: [← Physics: gravity](02_physics-gravity.md) · [Overview](00_overview.md) · [Jump →](04_jump.md)

> **This step touches 2 files, edited together:** `js/physics.js` (edit) and `js/render.js` (edit).

## Glossary for this step
- **grounded** — set `true` when the player is resting on a surface; jumping is only allowed when grounded. See [glossary](../foundation/glossary.md).
- **clamp (to the floor)** — if the player's bottom crosses the floor line, snap it back to sit exactly on the floor and stop its fall. See [glossary](../foundation/glossary.md).

## Why / design
Right now the player falls forever. We add a **floor**: after moving, if the player's bottom edge has crossed
`floorY`, snap it back to rest on the floor, zero its vertical velocity, and mark it **grounded**. We also draw
the floor so you can see it.

> **New concept — grounded means "resting on the gravity-facing side".** With normal gravity (`gravitySign`
> `+1`), the floor is *below*, and the player rests when its **bottom** hits `floorY`. We phrase it as
> "resting on the side gravity pulls toward" so that in M4 the same idea works upside-down (resting on a
> *ceiling* when gravity points up). For now there's just a floor; the general version lands in M4. See
> decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics).

## Do this
1. **Open `js/physics.js`.** **Replace its contents** with the Code block below.
   - **WHAT's new:** after integrating `y`, we set `p.grounded = false`, then check the floor: if
     `p.y + p.h >= floorY` the player's bottom has reached/passed the floor, so we snap `p.y = floorY - p.h`,
     set `p.vy = 0`, and `p.grounded = true`.
   - **WHY `floorY - p.h`:** `p.y` is the player's **top**; to sit its **bottom** (`p.y + p.h`) exactly on the
     floor, the top must be `floorY - p.h`.
2. **Open `js/render.js`.** **Replace its contents** with the Code block below — it now draws the floor (a
   platform-colored rectangle from `floorY` to the bottom) *before* the player.
3. **Save and open `index.html`.** The player falls and **stops on the floor**, sitting exactly on top of it.

## Code
```js
// js/physics.js — motion + gravity + a floor. Sign-aware velocities.
Game.updatePlayer = function (dt) {
  const cfg = Game.config;
  const s = Game.state;
  const p = s.player;
  const input = Game.input;

  // Horizontal.
  let dir = 0;
  if (input.left)  dir -= 1;
  if (input.right) dir += 1;
  p.vx = dir * cfg.moveSpeed;
  p.x += p.vx * dt;

  // Vertical: gravity then integrate.
  p.vy += cfg.gravity * s.gravitySign * dt;
  p.y += p.vy * dt;

  // Floor: rest the player's bottom on floorY and mark it grounded.
  // (Only a floor for now — Milestone 4 replaces this with real platforms + a ceiling.)
  p.grounded = false;
  if (p.y + p.h >= cfg.floorY) {
    p.y = cfg.floorY - p.h;
    p.vy = 0;
    p.grounded = true;
  }
};
```

```js
// js/render.js — draw the scene each frame. Reads state; never mutates it.
Game.draw = function () {
  const ctx = Game.ctx;
  const cfg = Game.config;
  const p = Game.state.player;

  // Background.
  ctx.fillStyle = cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  // Floor.
  ctx.fillStyle = cfg.colors.platform;
  ctx.fillRect(0, cfg.floorY, cfg.width, cfg.height - cfg.floorY);

  // Player.
  ctx.fillStyle = cfg.colors.player;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();
  } else {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
};
```

## Done when (this step)
- [ ] The player falls and **comes to rest exactly on top of the floor** — its bottom edge touches the floor line, no sinking, no bouncing, no jitter.
- [ ] A floor-colored band is visible across the bottom of the canvas (from y=420 down).
- [ ] Left/right move the player along the floor.

## If it breaks
- **Player sinks a little into the floor, then pops up (jitter)** — you tested `p.y >= floorY` instead of
  `p.y + p.h >= floorY`, or forgot to snap `p.y = floorY - p.h`. The snap must set the *top* so the *bottom* sits on the floor.
- **Player falls straight through the floor** — the floor check is missing or runs before the `y` integration.
  It must come *after* `p.y += p.vy * dt`.
- **Player floats above the floor** — `floorY` in `render.js` and `physics.js` differ, or `p.h` is wrong. They
  both read `Game.config.floorY`; the same value must be used in both.
