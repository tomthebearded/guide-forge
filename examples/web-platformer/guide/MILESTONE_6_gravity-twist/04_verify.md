# Milestone 6 · Step 04 of 4 — Verify
> Nav: [← Telegraph](03_telegraph.md) · [Overview](00_overview.md) · [M7: Sound, timer & best time →](../MILESTONE_7_sound-timer-persistence/00_overview.md)

## Done-when gate (the milestone acceptance test)
- [ ] **Telegraph → flip.** After a few seconds, a ~1 s pulsing warning shows, then gravity flips (background turns reddish, player falls up).
- [ ] **Upside-down platforming.** While flipped, the player jumps down off the ceiling and lands on platform undersides.
- [ ] **Flips back, randomly.** It returns to normal later; the intervals vary run to run (not a fixed beat).
- [ ] **Toggle works.** `twistEnabled: false` + reload → no flips, no telegraph; plays exactly like M5.
- [ ] Coins, goal, HUD, and the win overlay all still work during and after flips.

## Files after this milestone
`index.html`, `style.css`, and `js/input.js` are unchanged since M5. The changed JS files in full:

### `js/config.js`
```js
// js/config.js — tuning constants (+ the twist knobs).
const Game = {};

Game.config = {
  width: 800,
  height: 450,

  colors: {
    sky: '#10131a',
    skyFlipped: '#241016',
    player: '#4cc2ff',
    platform: '#3a4256',
    coin: '#ffd54a',
    goal: '#7bffa1',
    text: '#ffffff',
    telegraph: '#ff5470',
  },

  maxDt: 1 / 30,

  player: { w: 28, h: 36 },
  moveSpeed: 240,

  gravity: 1800,
  jumpSpeed: 620,

  twistEnabled: true,
  flipMinDelay: 4.0,
  flipMaxDelay: 8.0,
  telegraphTime: 1.0,
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

  clock: 0,
  nextFlipAt: 0,
};
```

### `js/level.js`
```js
// js/level.js — the level as DATA + resetGame() + scheduleNextFlip().
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
  s.clock = 0;

  s.player.x = start.x;
  s.player.y = start.y;
  s.player.vx = 0;
  s.player.vy = 0;
  s.player.grounded = false;

  s.coins = Game.level.coins.map(function (c) {
    return { x: c.x, y: c.y, w: c.w, h: c.h };
  });

  Game.scheduleNextFlip();
};

Game.scheduleNextFlip = function () {
  const cfg = Game.config;
  const s = Game.state;
  const span = cfg.flipMaxDelay - cfg.flipMinDelay;
  s.nextFlipAt = s.clock + cfg.flipMinDelay + Math.random() * span;
};
```

### `js/physics.js`
```js
// js/physics.js — motion + gravity + collision + coins + goal + the twist. Sign-aware.

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

Game.updateTwist = function () {
  const cfg = Game.config;
  const s = Game.state;
  if (!cfg.twistEnabled) return;

  if (s.clock >= s.nextFlipAt) {
    s.gravitySign *= -1;
    Game.scheduleNextFlip();
  }
};

Game.flipIncoming = function () {
  const cfg = Game.config;
  const s = Game.state;
  if (!cfg.twistEnabled) return false;
  return (s.nextFlipAt - s.clock) <= cfg.telegraphTime;
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

  // Background: reddish tint while gravity is inverted.
  ctx.fillStyle = (s.gravitySign < 0) ? cfg.colors.skyFlipped : cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  // Platforms.
  ctx.fillStyle = cfg.colors.platform;
  for (const plat of Game.level.platforms) {
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
  }

  // Goal.
  const g = Game.level.goal;
  ctx.fillStyle = cfg.colors.goal;
  ctx.fillRect(g.x, g.y, g.w, g.h);

  // Coins.
  ctx.fillStyle = cfg.colors.coin;
  for (const c of s.coins) {
    ctx.beginPath();
    ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player.
  ctx.fillStyle = cfg.colors.player;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();
  } else {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }

  // Telegraph: pulsing warning ~1s before a gravity flip.
  if (Game.flipIncoming()) {
    const pulse = 0.35 + 0.45 * Math.abs(Math.sin(s.clock * 12));
    ctx.globalAlpha = pulse;
    ctx.fillStyle = cfg.colors.telegraph;
    ctx.fillRect(0, 0, cfg.width, 10);
    ctx.fillRect(0, cfg.height - 10, cfg.width, 10);
    ctx.globalAlpha = 1;

    ctx.fillStyle = cfg.colors.telegraph;
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('GRAVITY FLIP INCOMING', cfg.width / 2, 40);
    ctx.textAlign = 'left';
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

  s.clock += dt;
  Game.updateTwist();

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
- **Falls off the top when flipped** → the ceiling platform is missing from `level.js`.
- **Flips every frame** → `scheduleNextFlip()` not called after the flip.
- **Everything transparent** → reset `ctx.globalAlpha = 1` after the telegraph.
- **Jump wrong after flip** → jump must be `-cfg.jumpSpeed * s.gravitySign` (sign-aware, from M3).

## Next
Mark M6 ✅ in [foundation/status.md](../foundation/status.md), then go to
**[M7 — Sound, timer, best time & restart](../MILESTONE_7_sound-timer-persistence/00_overview.md)** — the final
polish that makes it a replayable game.
