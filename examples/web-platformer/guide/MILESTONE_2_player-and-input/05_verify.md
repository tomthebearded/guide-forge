# Milestone 2 · Step 05 of 5 — Verify
> Nav: [← Wire it up](04_wire-up.md) · [Overview](00_overview.md) · [M3: Gravity & jumping →](../MILESTONE_3_gravity-and-jump/00_overview.md)

## Done-when gate (the milestone acceptance test)
- [ ] **Player renders.** Open `index.html` → a rounded blue rectangle (~28×36) sits on the dark canvas.
- [ ] **Moves on hold.** Hold **←**/**A** → moves left; hold **→**/**D** → moves right, steady (~240 px/s).
- [ ] **Stops on release.** Let go → it stops instantly (velocity → 0).
- [ ] **Both keys cancel.** Hold ← and → together → it stands still. No Console error.
- [ ] **Layout-independent (sanity).** In the Console, holding ← shows `Game.input` as `{ left: true, right: false }`.

## Files after this milestone
```
shape-jumper/
  index.html
  style.css
  js/
    config.js
    state.js
    input.js
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

  <!-- Load order = dependency order. NOT type="module". -->
  <script src="js/config.js"></script>
  <script src="js/state.js"></script>
  <script src="js/input.js"></script>
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
  },

  maxDt: 1 / 30, // delta-time clamp (seconds)

  player: { w: 28, h: 36 }, // player size in pixels (cosmetic)
  moveSpeed: 240,           // horizontal run speed, pixels per second
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
  },
};
```

### `js/input.js`
```js
// js/input.js — keyboard: record which movement keys are currently held.
Game.input = {
  left: false,
  right: false,
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
  setKey(e.code, true);
});

window.addEventListener('keyup', function (e) {
  setKey(e.code, false);
});
```

### `js/render.js`
```js
// js/render.js — draw the whole scene each frame. Reads state; never mutates it.
Game.draw = function () {
  const ctx = Game.ctx;
  const cfg = Game.config;
  const p = Game.state.player;

  ctx.fillStyle = cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

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
// js/main.js — the LAST script. Owns the loop: dt -> update -> draw.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = Game.config.width;
canvas.height = Game.config.height;

Game.ctx = ctx;

Game.update = function (dt) {
  const p = Game.state.player;
  const input = Game.input;

  let dir = 0;
  if (input.left)  dir -= 1;
  if (input.right) dir += 1;

  p.vx = dir * Game.config.moveSpeed;
  p.x += p.vx * dt;
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
- **Key does nothing** → wrong code string or used `event.key`; codes are `"ArrowLeft"`, `"KeyA"`, etc.
- **`undefined` errors** → script tags out of order (`config, state, input, render, main`).
- **Smear** → background not repainted first in `Game.draw()`.
- **Won't move** → missing `* dt` or not reading `Game.input`.

## Next
Mark M2 ✅ in [foundation/status.md](../foundation/status.md), then go to
**[M3 — Gravity & jumping](../MILESTONE_3_gravity-and-jump/00_overview.md)**: make the player fall, land on a
floor, and jump — written *gravity-sign-aware* so the M6 twist is nearly free.
