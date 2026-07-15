# Milestone 5 · Step 01 of 4 — Add coins, goal, player-start + `resetGame()`, and draw them
> Nav: — · [Overview](00_overview.md) · [Collect coins →](02_collect-coins.md)

> **This step touches 5 files, edited together:** `js/config.js`, `js/state.js`, `js/level.js`, `js/render.js`, plus one line in `js/main.js`.

## Glossary for this step
- **collectible** — an object the player picks up by touching it; here, a coin. See [glossary](../foundation/glossary.md).
- **game-state machine** — the small set of modes the game can be in (`playing`, `won`) with rules for switching. See [glossary](../foundation/glossary.md).
- **`resetGame()`** — a function that sets up a fresh run: player back to start, score 0, mode `playing`, coins refilled. See decision [D6](../foundation/decision-log.md#d6--hud-restart-and-a-small-state-machine).
- **`Math.PI`** — the constant π (≈ 3.14159). Canvas angles are in **radians**, and a full turn is `2 × π`, so `0` to `Math.PI * 2` sweeps a whole circle. See [MDN: Math.PI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI).
- **`arc(cx, cy, r, 0, Math.PI*2)`** — the Canvas call that draws a full circle centered at `(cx, cy)` with radius `r`. See [MDN: arc](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arc).
- **`array.map(fn)`** — builds a **new** array by running `fn` on each element and collecting the results; the original array is left untouched. See [MDN: map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

## Why / design
We add the *data* for coins and the goal, plus a `resetGame()` that seeds a run, and we *draw* everything. No
collection logic yet — that's the next step. Coins are boxes in the data (so one `overlaps` test works) but
**drawn as circles**.

> **New concept — `resetGame()` is the single "new run" button.** Rather than scatter starting values across
> files, one function puts the world into a fresh playing state. We call it once at startup now; M7 calls it
> again on the **R** key. It copies the coin data into a *live* `coins` array in state, so collecting a coin
> (removing it from the live array) never touches the authored level. See decision [D6](../foundation/decision-log.md#d6--hud-restart-and-a-small-state-machine).

## Do this
1. **`js/config.js`** — add three colors (`coin`, `goal`, `text`) to the `colors` object. Full file below.
2. **`js/state.js`** — add `mode: 'playing'`, `score: 0`, and `coins: []` to the state. The player's start
   coords now come from `resetGame`, so leave them as placeholders. Full file below.
3. **`js/level.js`** — add `coins`, `goal`, and `playerStart` to the data, and define `Game.resetGame()`.
   - **Load-bearing:** `Game.resetGame`, `Game.level.coins`, `Game.level.goal`, `Game.level.playerStart`,
     `Game.state.coins`. Coin/goal positions are cosmetic.
4. **`js/render.js`** — draw the goal (rectangle), the coins (circles), and (added next step) the HUD. Full
   file below draws goal + coins now; HUD/overlay come in steps 02–03.
5. **`js/main.js`** — add **one line**, `Game.resetGame();`, just before `requestAnimationFrame(frame);` at the
   bottom, so the run is seeded before the first frame. (Everything else in `main.js` is unchanged this step.)
6. **Save and open `index.html`.** You'll see yellow coins near the ledges and a green goal flag on the right;
   the player starts at the bottom-left. Coins don't disappear yet — that's step 02.

## Code
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

```js
// js/state.js — everything that MUTATES during play. resetGame() seeds it.
Game.state = {
  mode: 'playing',   // 'playing' | 'won'
  score: 0,

  player: {
    x: 40,           // placeholder; resetGame() sets the real start
    y: 380,
    w: Game.config.player.w,
    h: Game.config.player.h,
    vx: 0,
    vy: 0,
    grounded: false
  },

  gravitySign: 1,

  coins: [],         // live coins for this run; filled by resetGame()
};
```

```js
// js/level.js — the level as DATA + resetGame().
Game.level = {
  platforms: [
    { x: 0,   y: 420, w: 800, h: 30 },  // floor
    { x: 0,   y: 0,   w: 800, h: 16 },  // ceiling (used in M6)
    { x: 140, y: 330, w: 150, h: 18 },  // ledge 1
    { x: 360, y: 250, w: 150, h: 18 },  // ledge 2
    { x: 560, y: 170, w: 150, h: 18 },  // ledge 3
  ],

  // Coins collide as boxes; drawn as circles. One above each ledge.
  coins: [
    { x: 200, y: 296, w: 20, h: 20 },
    { x: 420, y: 216, w: 20, h: 20 },
    { x: 620, y: 136, w: 20, h: 20 },
  ],

  goal: { x: 740, y: 360, w: 24, h: 60 }, // flag on the right, on the floor
  playerStart: { x: 40, y: 380 },
};

// Put the world into a fresh "playing" state.
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

  // Copy the coin data into a LIVE array we can remove from as they're collected.
  s.coins = Game.level.coins.map(function (c) {
    return { x: c.x, y: c.y, w: c.w, h: c.h };
  });
};
```

```js
// js/render.js — draw the scene each frame. Reads state; never mutates it.
Game.draw = function () {
  const ctx = Game.ctx;
  const cfg = Game.config;
  const s = Game.state;
  const p = s.player;

  // Background.
  ctx.fillStyle = cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  // Platforms.
  ctx.fillStyle = cfg.colors.platform;
  for (const plat of Game.level.platforms) {
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
  }

  // Goal (a rectangle "flag").
  const g = Game.level.goal;
  ctx.fillStyle = cfg.colors.goal;
  ctx.fillRect(g.x, g.y, g.w, g.h);

  // Coins (drawn as circles).
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
};
```

```js
// js/main.js — the bottom of the file only; add the resetGame() line.
// ... (Game.update and frame() unchanged from M4) ...

Game.resetGame();               // seed a fresh run before the first frame
requestAnimationFrame(frame);
```

## Done when (this step)
- [ ] Three yellow coin-circles appear (one above each ledge) and a green goal flag stands on the right of the floor.
- [ ] The player starts at the bottom-left (x≈40) and falls onto the floor.
- [ ] Coins do **not** disappear when touched yet (that's the next step). No Console errors.

## If it breaks
- **`Game.resetGame is not a function`** — it's defined in `level.js`, which must load before `main.js` calls
  it. Check the script order (unchanged from M4: `… physics, level, render, main`).
- **Coins/goal don't appear** — `render.js` isn't drawing them, or `resetGame()` didn't run so `state.coins` is
  empty. Confirm the `Game.resetGame();` line is in `main.js` before the loop starts.
- **Player starts in the wrong place** — `resetGame` reads `Game.level.playerStart`; check that object exists.
