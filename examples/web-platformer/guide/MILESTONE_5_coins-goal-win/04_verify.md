# Milestone 5 · Step 04 of 4 — Verify
> Nav: [← Goal & win](03_goal-and-win.md) · [Overview](00_overview.md) · [M6: The random twist →](../MILESTONE_6_gravity-twist/00_overview.md)

## Done-when gate (the milestone acceptance test)
- [ ] **Entities render.** Three yellow coins and a green goal flag appear; the player starts bottom-left.
- [ ] **Coins collect.** Touching a coin removes it and increments the top-left **Score** by 1; all three → Score 3.
- [ ] **HUD is live.** The score text updates the instant a coin is collected.
- [ ] **Goal wins.** Touching the goal shows a dimmed **YOU WIN!** overlay with the final score and freezes the player.
- [ ] **Reload replays.** Reloading resets coins, score, and mode.

## Files after this milestone
`index.html` and `style.css` are unchanged since M4. The JS files in full:

### `js/config.js`
```js
// js/config.js — tuning constants.
const Game = {};

Game.config = {
  width: 800,
  height: 450,

  colors: {
    sky: '#10131a',
    player: '#4cc2ff',
    platform: '#3a4256',
    coin: '#ffd54a',
    goal: '#7bffa1',
    text: '#ffffff',
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
// js/state.js — everything that MUTATES during play. resetGame() seeds it.
Game.state = {
  mode: 'playing',
  score: 0,

  player: {
    x: 40,
    y: 380,
    w: Game.config.player.w,
    h: Game.config.player.h,
    vx: 0,
    vy: 0,
    grounded: false
  },

  gravitySign: 1,

  coins: [],
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
// js/physics.js — motion + gravity + AABB collision + coins + goal. Sign-aware.

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

Game.collectCoins = function () {
  const s = Game.state;
  const p = s.player;

  for (let i = s.coins.length - 1; i >= 0; i--) {
    if (Game.overlaps(p, s.coins[i])) {
      s.coins.splice(i, 1);
      s.score += 1;
    }
  }
};

Game.checkGoal = function () {
  const s = Game.state;
  if (Game.overlaps(s.player, Game.level.goal)) {
    s.mode = 'won';
  }
};
```

### `js/level.js`
```js
// js/level.js — the level as DATA + resetGame().
Game.level = {
  platforms: [
    { x: 0,   y: 420, w: 800, h: 30 },
    { x: 0,   y: 0,   w: 800, h: 16 },
    { x: 140, y: 330, w: 150, h: 18 },
    { x: 360, y: 250, w: 150, h: 18 },
    { x: 560, y: 170, w: 150, h: 18 },
  ],

  coins: [
    { x: 200, y: 296, w: 20, h: 20 },
    { x: 420, y: 216, w: 20, h: 20 },
    { x: 620, y: 136, w: 20, h: 20 },
  ],

  goal: { x: 740, y: 360, w: 24, h: 60 },
  playerStart: { x: 40, y: 380 },
};

Game.resetGame = function () {
  const s = Game.state;
  const start = Game.level.playerStart;

  s.mode = 'playing';
  s.score = 0;
  s.gravitySign = 1;

  s.player.x = start.x;
  s.player.y = start.y;
  s.player.vx = 0;
  s.player.vy = 0;
  s.player.grounded = false;

  s.coins = Game.level.coins.map(function (c) {
    return { x: c.x, y: c.y, w: c.w, h: c.h };
  });
};
```

### `js/render.js`
```js
// js/render.js — draw the scene each frame. Reads state; never mutates it.
Game.draw = function () {
  const ctx = Game.ctx;
  const cfg = Game.config;
  const s = Game.state;
  const p = s.player;

  ctx.fillStyle = cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  ctx.fillStyle = cfg.colors.platform;
  for (const plat of Game.level.platforms) {
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
  }

  const g = Game.level.goal;
  ctx.fillStyle = cfg.colors.goal;
  ctx.fillRect(g.x, g.y, g.w, g.h);

  ctx.fillStyle = cfg.colors.coin;
  for (const c of s.coins) {
    ctx.beginPath();
    ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = cfg.colors.player;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();
  } else {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }

  // HUD.
  ctx.fillStyle = cfg.colors.text;
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + s.score, 12, 24);

  // Win overlay.
  if (s.mode === 'won') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, cfg.width, cfg.height);

    ctx.fillStyle = cfg.colors.text;
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('YOU WIN!', cfg.width / 2, cfg.height / 2);

    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Score: ' + s.score, cfg.width / 2, cfg.height / 2 + 34);

    ctx.textAlign = 'left';
  }
};
```

### `js/main.js`
```js
// js/main.js — the loop: seed a run, then update/draw each frame.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = Game.config.width;
canvas.height = Game.config.height;

Game.ctx = ctx;

Game.update = function (dt) {
  const s = Game.state;
  if (s.mode !== 'playing') return;

  Game.updatePlayer(dt);
  Game.collectCoins();
  Game.checkGoal();
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

Game.resetGame();
requestAnimationFrame(frame);
```

## Troubleshooting recap
- **Score skips / double-counts** → loop coins backwards when splicing.
- **Coins never collect / goal does nothing** → `collectCoins`/`checkGoal` not called in `Game.update`.
- **Player moves after winning** → missing `if (s.mode !== 'playing') return;`.
- **HUD centered/invisible** → reset `ctx.textAlign = 'left'` after the overlay; draw HUD after the background.

## Next
Mark M5 ✅ in [foundation/status.md](../foundation/status.md), then go to
**[M6 — The random twist: gravity flips](../MILESTONE_6_gravity-twist/00_overview.md)** — the signature
mechanic, and the payoff for all that sign-aware physics.

---
> Nav: [← Goal & win](03_goal-and-win.md) · [Overview](00_overview.md) · [M6: The random twist →](../MILESTONE_6_gravity-twist/00_overview.md)
