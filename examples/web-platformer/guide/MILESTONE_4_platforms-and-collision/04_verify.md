# Milestone 4 · Step 04 of 4 — Verify
> Nav: [← Reality-check](03_reality-check.md) · [Overview](00_overview.md) · [M5: Coins, goal & win →](../MILESTONE_5_coins-goal-win/00_overview.md)

## Done-when gate (the milestone acceptance test)
- [ ] **Lands on all platforms.** The player rests cleanly on the floor and all three ledges.
- [ ] **Solid from every side.** Sides block; undersides bonk; the player can't pass through any platform.
- [ ] **Boxed in.** The player can't leave the canvas left or right.
- [ ] **No tunnelling.** Tab out mid-jump for a few seconds, tab back — the player didn't fall through anything.
- [ ] **Reality-check passed.** You played it and the feel is good (retuned if needed).

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
    level.js
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
  <script src="js/level.js"></script>
  <script src="js/render.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

### `js/config.js`
```js
// js/config.js — tuning constants (floorY removed; the floor is now a platform).
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
// js/physics.js — motion + gravity + AABB collision. Sign-aware throughout.

Game.overlaps = function (a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
};

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

  // Horizontal: move, resolve X, clamp to canvas.
  let dir = 0;
  if (input.left)  dir -= 1;
  if (input.right) dir += 1;
  p.vx = dir * cfg.moveSpeed;
  p.x += p.vx * dt;

  for (const plat of Game.level.platforms) {
    if (Game.overlaps(p, plat)) {
      if (p.vx > 0)      p.x = plat.x - p.w;
      else if (p.vx < 0) p.x = plat.x + plat.w;
      p.vx = 0;
    }
  }
  if (p.x < 0) p.x = 0;
  if (p.x + p.w > cfg.width) p.x = cfg.width - p.w;

  // Vertical: gravity, move, resolve Y, set grounded on the gravity-facing side.
  p.vy += cfg.gravity * s.gravitySign * dt;
  p.y += p.vy * dt;

  p.grounded = false;
  for (const plat of Game.level.platforms) {
    if (Game.overlaps(p, plat)) {
      if (p.vy > 0)      p.y = plat.y - p.h;
      else if (p.vy < 0) p.y = plat.y + plat.h;
      if (Math.sign(p.vy) === s.gravitySign) p.grounded = true;
      p.vy = 0;
    }
  }
};
```

### `js/level.js`
```js
// js/level.js — the level as DATA: solid boxes the player collides with.
Game.level = {
  platforms: [
    { x: 0,   y: 420, w: 800, h: 30 },  // floor
    { x: 0,   y: 0,   w: 800, h: 16 },  // ceiling (used once gravity can flip, M6)
    { x: 140, y: 330, w: 150, h: 18 },  // ledge 1
    { x: 360, y: 250, w: 150, h: 18 },  // ledge 2
    { x: 560, y: 170, w: 150, h: 18 },  // ledge 3
  ],
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
  for (const plat of Game.level.platforms) {
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
  }

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
- **Passes through ledges** → old `floorY` clamp still in `physics.js`; use the platform loops.
- **Falls forever** → Y-resolution loop missing or `grounded` never set.
- **`floorY is not defined`** → remove the last reference to the deleted constant.
- **Tunnels on tab-switch** → `maxDt` clamp missing/too large in `main.js`.

## Next
Mark M4 ✅ in [foundation/status.md](../foundation/status.md), then go to
**[M5 — Coins, goal, HUD & win](../MILESTONE_5_coins-goal-win/00_overview.md)**: give the level a purpose.

---
> Nav: [← Reality-check](03_reality-check.md) · [Overview](00_overview.md) · [M5: Coins, goal & win →](../MILESTONE_5_coins-goal-win/00_overview.md)
