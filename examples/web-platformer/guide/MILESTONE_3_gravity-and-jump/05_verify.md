# Milestone 3 · Step 05 of 5 — Verify
> Nav: [← Jump](04_jump.md) · [Overview](00_overview.md) · [M4: Platforms & collision →](../MILESTONE_4_platforms-and-collision/00_overview.md)

## Done-when gate (the milestone acceptance test)
- [ ] **Falls and rests.** Open `index.html` → the player falls and stops **exactly on top of the floor** — no sinking, no jitter, no bounce.
- [ ] **Jumps once.** Space/↑ launches it up ~107 px; it arcs and falls back down under gravity.
- [ ] **No double-jump.** Pressing jump again while airborne does nothing until it lands.
- [ ] **No auto-jump.** Holding Space does not repeatedly jump on landing.
- [ ] **Steering works.** Left/right (←/→ or A/D) move it, on the ground and in the air.

## Files after this milestone
```
shape-jumper/
  index.html
  style.css
  js/
    config.js
    state.js
    input.js
    physics.js
    render.js
    main.js
```

### `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shape Jumper</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <canvas id="game"></canvas>

  <script src="js/config.js"></script>
  <script src="js/state.js"></script>
  <script src="js/input.js"></script>
  <script src="js/physics.js"></script>
  <script src="js/render.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

### `js/config.js`
```js
// js/config.js — tuning constants (no runtime state here).
const Game = {};

Game.config = {
  width: 800,
  height: 450,

  colors: {
    sky: '#10131a',
    player: '#4cc2ff',
    platform: '#3a4256',
  },

  maxDt: 1 / 30,

  player: { w: 28, h: 36 },
  moveSpeed: 240,

  gravity: 1800,
  jumpSpeed: 620,
  floorY: 420,
};
```

### `js/state.js`
```js
// js/state.js — everything that MUTATES during play.
Game.state = {
  player: {
    x: 40,
    y: 200,
    w: Game.config.player.w,
    h: Game.config.player.h,
    vx: 0,
    vy: 0,
    grounded: false
  },

  gravitySign: 1,
};
```

### `js/input.js`
```js
// js/input.js — movement (held) + a one-shot jump.
Game.input = {
  left: false,
  right: false,
  jumpQueued: false,
};

function setKey(code, isDown) {
  switch (code) {
    case 'ArrowLeft':
    case 'KeyA':
      Game.input.left = isDown;
      break;
    case 'ArrowRight':
    case 'KeyD':
      Game.input.right = isDown;
      break;
  }
}

window.addEventListener('keydown', function (e) {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && !e.repeat) {
    Game.input.jumpQueued = true;
  }
  if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  setKey(e.code, true);
});

window.addEventListener('keyup', function (e) {
  setKey(e.code, false);
});
```

### `js/physics.js`
```js
// js/physics.js — motion + gravity + floor + jump. Sign-aware throughout.
Game.updatePlayer = function (dt) {
  const cfg = Game.config;
  const s = Game.state;
  const p = s.player;
  const input = Game.input;

  if (input.jumpQueued && p.grounded) {
    p.vy = -cfg.jumpSpeed * s.gravitySign;
    p.grounded = false;
  }
  input.jumpQueued = false;

  let dir = 0;
  if (input.left)  dir -= 1;
  if (input.right) dir += 1;
  p.vx = dir * cfg.moveSpeed;
  p.x += p.vx * dt;

  p.vy += cfg.gravity * s.gravitySign * dt;
  p.y += p.vy * dt;

  p.grounded = false;
  if (p.y + p.h >= cfg.floorY) {
    p.y = cfg.floorY - p.h;
    p.vy = 0;
    p.grounded = true;
  }
};
```

### `js/render.js`
```js
// js/render.js — draw the scene each frame. Reads state; never mutates it.
Game.draw = function () {
  const ctx = Game.ctx;
  const cfg = Game.config;
  const p = Game.state.player;

  ctx.fillStyle = cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  ctx.fillStyle = cfg.colors.platform;
  ctx.fillRect(0, cfg.floorY, cfg.width, cfg.height - cfg.floorY);

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

### `js/main.js`
```js
// js/main.js — the loop delegates all player motion to physics.js.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = Game.config.width;
canvas.height = Game.config.height;

Game.ctx = ctx;

Game.update = function (dt) {
  Game.updatePlayer(dt);
};

let lastTime = null;
function frame(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (dt > Game.config.maxDt) dt = Game.config.maxDt;

  Game.update(dt);
  Game.draw();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

## Troubleshooting recap
- **Sinks then jitters** → test `p.y + p.h >= floorY` and snap `p.y = floorY - p.h`.
- **Falls through floor** → floor check must run *after* integrating `y`.
- **Can't jump / rocket-jumps** → gate the impulse on `p.grounded`; ignore `e.repeat`; consume `jumpQueued`.
- **Space scrolls page** → add `e.preventDefault()` for game keys.

## Next
Mark M3 ✅ in [foundation/status.md](../foundation/status.md), then go to
**[M4 — Platforms & AABB collision](../MILESTONE_4_platforms-and-collision/00_overview.md)** ⭐ — the
reality-check gate, where the floor becomes real platforms and you actually play the thing.

---
> Nav: [← Jump](04_jump.md) · [Overview](00_overview.md) · [M4: Platforms & collision →](../MILESTONE_4_platforms-and-collision/00_overview.md)
