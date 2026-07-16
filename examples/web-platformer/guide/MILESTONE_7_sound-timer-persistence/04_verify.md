# Milestone 7 · Step 04 of 4 — Verify (and the whole game)
> Nav: [← Title & restart](03_title-and-restart.md) · [Overview](00_overview.md) · [Guide README →](../README.md)

## Done-when gate (the milestone acceptance test)
- [ ] **Sound.** Jump, coin, and win each play a distinct beep (after the first keypress starts audio).
- [ ] **Timer.** A live **Time** ticks in the HUD; the win overlay shows this run's Time.
- [ ] **Best time persists.** The win overlay shows **Best**; beat it, reload the page, and the improved best is still there (title + win screens show it).
- [ ] **Title screen.** The game opens on **SHAPE JUMPER**; a move key starts it.
- [ ] **Restart.** **R** starts a fresh run from anywhere, with a newly randomized gravity-flip schedule.

## Whole-game gate (run once, end to end)
Run these in order, in one sitting, confirming each observable before moving on:
1. [ ] **Start from the title.** The page opens on the **SHAPE JUMPER** overlay; press a move key (←/→ or A/D) and the overlay disappears into live play.
2. [ ] **Run and jump across the ledges, collecting all 3 coins.** Each coin vanishes on touch, plays a beep, and the HUD **Score** climbs `1 → 2 → 3`.
3. [ ] **Survive at least one telegraphed gravity flip.** The **GRAVITY FLIP INCOMING** warning flashes for ~1 s, then gravity inverts (background turns reddish, the player falls to the ceiling) and later flips back.
4. [ ] **Reach the green goal.** Touching the goal flag freezes play.
5. [ ] **See the win overlay.** A dimmed **YOU WIN!** appears showing **Time**, **Best**, and **Score**, plus "Press R to play again".
6. [ ] **Press R to play again.** The run restarts immediately with a freshly randomized flip schedule (the first flip's timing differs from the previous run).

## Files after this milestone — the COMPLETE game
```
shape-jumper/
  index.html
  style.css
  js/
    config.js  state.js  input.js  audio.js  storage.js
    physics.js  level.js  render.js  main.js
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
  <script src="js/audio.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/physics.js"></script>
  <script src="js/level.js"></script>
  <script src="js/render.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

### `style.css`
```css
/* style.css — all cosmetic; retune freely. */
html, body {
  margin: 0;
  height: 100%;
  background: #05070c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
}
#game {
  background: #10131a;
  border: 1px solid #2a2f3a;
}
```

### `js/config.js`
```js
// js/config.js — tuning constants (the whole game's knobs live here).
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

  storageKey: 'shapeJumper.bestTimeMs',
};
```

### `js/state.js`
```js
// js/state.js — everything that MUTATES during play. resetGame() seeds it.
Game.state = {
  mode: 'title',      // 'title' | 'playing' | 'won'
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

  bestTimeMs: null,
  lastTimeMs: 0,
};
```

### `js/input.js`
```js
// js/input.js — keyboard: movement (held), one-shot jump, audio start, title-start, R restart.
let audioStarted = false;

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
  // Start audio on the first keypress (browsers block it before a gesture).
  if (!audioStarted) {
    Game.startAudio();
    audioStarted = true;
  }

  const s = Game.state;

  // R restarts from anywhere (fresh run + new random flip schedule).
  if (e.code === 'KeyR') {
    Game.resetGame();
    e.preventDefault();
    return;
  }

  // From the title screen, any move/jump key starts the game.
  if (s.mode === 'title' &&
      ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'ArrowUp'].includes(e.code)) {
    Game.resetGame();
  }

  // Jump: fire once per real press (ignore OS auto-repeat).
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

### `js/audio.js`
```js
// js/audio.js — tiny synth: start on a gesture, then play short beeps.
Game.audioCtx = null;

Game.startAudio = function () {
  if (Game.audioCtx) {
    Game.audioCtx.resume();
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  Game.audioCtx = new Ctx();
};

Game.beep = function (freq, ms, delay) {
  const ac = Game.audioCtx;
  if (!ac) return;
  delay = delay || 0;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ac.destination);

  const start = ac.currentTime + delay;
  const end = start + ms / 1000;
  gain.gain.setValueAtTime(0.06, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.start(start);
  osc.stop(end);
};
```

### `js/storage.js`
```js
// js/storage.js — persist the best time. Strings-only + can throw, so guard both.
Game.loadBest = function () {
  try {
    const raw = localStorage.getItem(Game.config.storageKey);
    if (raw === null) return null;
    const val = JSON.parse(raw);
    return (typeof val === 'number' && isFinite(val)) ? val : null;
  } catch (e) {
    return null;
  }
};

Game.saveBest = function (ms) {
  try {
    localStorage.setItem(Game.config.storageKey, JSON.stringify(ms));
  } catch (e) {
    // Storage disabled/full — best time just won't persist.
  }
};
```

### `js/physics.js`
```js
// js/physics.js — motion, gravity, AABB collision, coins, goal, the twist. Sign-aware.

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
    Game.beep(520, 80);
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
      Game.beep(880, 60);
    }
  }
};

Game.checkGoal = function () {
  const s = Game.state;
  if (s.mode !== 'playing') return;

  if (Game.overlaps(s.player, Game.level.goal)) {
    s.mode = 'won';
    s.lastTimeMs = Math.round(s.clock * 1000);

    if (s.bestTimeMs === null || s.lastTimeMs < s.bestTimeMs) {
      s.bestTimeMs = s.lastTimeMs;
      Game.saveBest(s.bestTimeMs);
    }

    Game.beep(660, 120);
    Game.beep(990, 160, 0.12);
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

### `js/render.js`
```js
// js/render.js — draw the scene each frame. Reads state; never mutates it.
Game.formatTime = function (ms) {
  return (ms / 1000).toFixed(2) + 's';
};

Game.draw = function () {
  const ctx = Game.ctx;
  const cfg = Game.config;
  const s = Game.state;
  const p = s.player;

  // Background: reddish while gravity is inverted.
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

  // Telegraph before a flip.
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
  ctx.fillText('Time: ' + Game.formatTime(s.clock * 1000), 12, 44);

  // Win overlay.
  if (s.mode === 'won') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, cfg.width, cfg.height);

    ctx.fillStyle = cfg.colors.text;
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('YOU WIN!', cfg.width / 2, cfg.height / 2 - 24);

    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Time: ' + Game.formatTime(s.lastTimeMs), cfg.width / 2, cfg.height / 2 + 6);
    ctx.fillText('Best: ' + Game.formatTime(s.bestTimeMs), cfg.width / 2, cfg.height / 2 + 30);
    ctx.fillText('Score: ' + s.score, cfg.width / 2, cfg.height / 2 + 54);
    ctx.fillText('Press R to play again', cfg.width / 2, cfg.height / 2 + 84);

    ctx.textAlign = 'left';
  }

  // Title overlay.
  if (s.mode === 'title') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, cfg.width, cfg.height);

    ctx.fillStyle = cfg.colors.text;
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('SHAPE JUMPER', cfg.width / 2, cfg.height / 2 - 30);

    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Arrows / WASD to move  ·  Space or Up to jump', cfg.width / 2, cfg.height / 2 + 4);
    ctx.fillText('Reach the green goal. Watch out for gravity flips!', cfg.width / 2, cfg.height / 2 + 28);
    if (s.bestTimeMs !== null) {
      ctx.fillText('Best: ' + Game.formatTime(s.bestTimeMs), cfg.width / 2, cfg.height / 2 + 56);
    }
    ctx.fillText('Press any move key to start', cfg.width / 2, cfg.height / 2 + 88);

    ctx.textAlign = 'left';
  }
};
```

### `js/main.js`
```js
// js/main.js — the loop: load best, seed a run, open on the title, then update/draw each frame.
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

Game.state.bestTimeMs = Game.loadBest();
Game.resetGame();
Game.state.mode = 'title';
requestAnimationFrame(frame);
```

## Troubleshooting recap
- **No sound** → audio not started on a gesture; check the `startAudio` guard in `keydown`.
- **Best never persists** → must `JSON.stringify` on save and `JSON.parse` on load (strings-only).
- **Title never shows** → `main.js` must set `Game.state.mode = 'title'` after `resetGame()`.
- **R does nothing** → the R branch must be near the top of `keydown`, before other returns.
- **Same flip rhythm every run** → `resetGame()` must call `scheduleNextFlip()`.

## You're done 🎉
Shape Jumper is complete — a full browser platformer of nothing but rectangles and circles, with a random
gravity twist, built with zero tooling. Mark **M7 ✅** and the guide complete in
[foundation/status.md](../foundation/status.md). Ideas for going further (all deliberately out of scope here):
more levels via additional `level.js` data, a scrolling camera, enemies, or on-screen touch controls.

---
> Nav: [← Title & restart](03_title-and-restart.md) · [Overview](00_overview.md) · [Guide README →](../README.md)
