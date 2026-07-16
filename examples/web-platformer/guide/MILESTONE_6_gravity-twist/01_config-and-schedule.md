# Milestone 6 · Step 01 of 4 — Twist config, the clock, and `scheduleNextFlip()`
> Nav: — · [Overview](00_overview.md) · [The flip →](02_flip.md)

> **This step touches 4 files, edited together:** `js/config.js`, `js/state.js`, `js/level.js`, `js/main.js`.

## Glossary for this step
- **clock** — a running count of seconds since the run started (`clock += dt` each frame). It drives both the flip schedule and (in M7) the timer. See [glossary](../foundation/glossary.md).
- **`Math.random()`** — returns a random decimal in `[0, 1)`. Scaled and shifted, it picks a random delay. See [MDN: Math.random](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random).
- **schedule** — we don't flip on a fixed beat; we compute *when* the next flip happens (`nextFlipAt`) as "now + a random delay." See [glossary](../foundation/glossary.md).

## Why / design
Before flipping anything, we need a sense of time and a plan for *when* to flip. We add a `clock` that
accumulates `dt`, and `nextFlipAt`, the clock time the next flip is due. `scheduleNextFlip()` sets
`nextFlipAt = clock + random(min, max)`. This step is plumbing — nothing flips yet (that's step 02).

> **New concept — randomness with a floor and a ceiling.** `Math.random()` gives `[0, 1)`. To get a delay
> between `flipMinDelay` and `flipMaxDelay`, we do `min + Math.random() * (max - min)`. So the next flip is
> never sooner than `min` seconds or later than `max` — random, but bounded, so it's never unfair-fast. See
> decision [D4](../foundation/decision-log.md#d4--the-gravity-flip-is-telegraphed-and-toggleable).

## Do this
1. **`js/config.js`** — add the twist knobs and two colors. Full file below.
   - `twistEnabled` (**load-bearing** flag; `true` on), `flipMinDelay`/`flipMaxDelay` (seconds between flips),
     `telegraphTime` (warning length, used in step 03), `colors.skyFlipped` (inverted background),
     `colors.telegraph` (warning color).
2. **`js/state.js`** — add `clock: 0` and `nextFlipAt: 0`. Full file below.
3. **`js/level.js`** — in `resetGame()`, set `s.clock = 0` and call `Game.scheduleNextFlip()` at the end; then
   **add** the `Game.scheduleNextFlip` function. Full file below.
4. **`js/main.js`** — in `Game.update`, add `s.clock += dt;` as the first line after the freeze guard. (The
   flip call comes in step 02.) Snippet below.
5. **Save and open `index.html`.** Nothing looks different yet. To confirm the plumbing: open the Console and
   type `Game.state.nextFlipAt` — it's a number a few seconds ahead of `Game.state.clock`, which climbs.

## Code
```js
// js/config.js — tuning constants (+ the twist knobs).
const Game = {};

Game.config = {
  width: 800,
  height: 450,

  colors: {
    sky: '#10131a',
    skyFlipped: '#241016',  // background while gravity is inverted
    player: '#4cc2ff',
    platform: '#3a4256',
    coin: '#ffd54a',
    goal: '#7bffa1',
    text: '#ffffff',
    telegraph: '#ff5470',   // flip-warning color
  },

  maxDt: 1 / 30,

  player: { w: 28, h: 36 },
  moveSpeed: 240,

  gravity: 1800,
  jumpSpeed: 620,

  // The twist.
  twistEnabled: true,   // set false to disable gravity flips entirely
  flipMinDelay: 4.0,    // soonest a flip can happen (seconds)
  flipMaxDelay: 8.0,    // latest a flip can happen (seconds)
  telegraphTime: 1.0,   // seconds of warning before a flip
};
```

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

  clock: 0,        // seconds elapsed this run
  nextFlipAt: 0,   // clock time of the next gravity flip
};
```

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

// Pick the next flip time = now + a random delay in [flipMinDelay, flipMaxDelay].
Game.scheduleNextFlip = function () {
  const cfg = Game.config;
  const s = Game.state;
  const span = cfg.flipMaxDelay - cfg.flipMinDelay;
  s.nextFlipAt = s.clock + cfg.flipMinDelay + Math.random() * span;
};
```

```js
// js/main.js — inside Game.update, add the clock line (rest unchanged this step).
Game.update = function (dt) {
  const s = Game.state;
  if (s.mode !== 'playing') return;

  s.clock += dt;            // advance the play clock

  Game.updatePlayer(dt);
  Game.collectCoins();
  Game.checkGoal();
};
```

## Done when (this step)
- [ ] The game plays exactly like M5 (no flips yet).
- [ ] In the Console, `Game.state.clock` increases over time, and `Game.state.nextFlipAt` is a number a few seconds ahead of it.
- [ ] No errors.

## If it breaks
- **`Game.scheduleNextFlip is not a function`** — it must be defined in `level.js` and `resetGame()` calls it
  *after* it's defined (it's called at runtime, so definition order within the file is fine, but the function
  must exist).
- **`clock` stays 0** — the `s.clock += dt;` line isn't in `Game.update`, or `dt` is 0 (see M1 troubleshooting).
- **`nextFlipAt` is 0 or NaN** — `scheduleNextFlip` didn't run (is it called at the end of `resetGame`?) or a
  config value is missing.

---
> Nav: — · [Overview](00_overview.md) · [The flip →](02_flip.md)
