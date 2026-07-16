# Milestone 7 · Step 02 of 4 — `storage.js`: the timer, the win beep, and a persisted best time
> Nav: [← Audio](01_audio.md) · [Overview](00_overview.md) · [Title & restart →](03_title-and-restart.md)

> **This step touches 7 files, edited together:** `js/config.js`, `js/state.js`, `js/storage.js` (new), `js/physics.js` (checkGoal), `js/render.js` (Time HUD + win overlay), `js/main.js` (load best), and `index.html` (the new `storage.js` `<script>` tag).

## Glossary for this step
- **localStorage** — a browser key/value store that keeps **strings** on the user's machine across reloads. See [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
- **`JSON.stringify` / `JSON.parse`** — convert a value to a string to store it, and back again to read it. `localStorage` only holds strings. See [MDN: JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON).
- **`typeof x`** — gives a value's kind as a string (`'number'`, `'string'`, …); we use it to confirm the loaded value really is a number. See [MDN: typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof).
- **`isFinite(n)`** — `true` only for a real, finite number; it rejects `NaN` and `Infinity` (which a corrupt saved value could parse to). See [MDN: isFinite](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isFinite).
- **`Math.round(n)`** — rounds to the nearest whole number; here it turns fractional seconds-times-1000 into whole **milliseconds** for the stored best. See [MDN: round](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round).
- **`ctx.fillStyle` / `ctx.font` / `ctx.textAlign`** — Canvas drawing-state properties: the current fill colour, the text font (CSS `font` shorthand, e.g. `bold 40px system-ui`), and horizontal text alignment (`'left'` / `'center'` / `'right'`). Each stays set until you change it, so we reset `textAlign` back to `'left'` after the centered overlay. See [MDN: CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).

## Why / design
We already track `clock` (seconds of play). On winning, we freeze that into `lastTimeMs`, compare it to the
stored best, and save a new best if it's faster. `localStorage` is the store — but it's strings-only and can
**throw** (private mode), so every read/write is guarded.

> **New concept — the read/guard/write pattern for `localStorage`.** Reading: `getItem` returns `null` if
> unset, and a stored value is a *string*, so we `JSON.parse` it and sanity-check it's a finite number.
> Writing: `setItem` can throw if storage is disabled or full, so we wrap it in `try/catch`. If anything is off,
> we degrade to "no best time" instead of crashing. See [stack.md](../foundation/stack.md).

## Do this
1. **`js/config.js`** — add `storageKey: 'shapeJumper.bestTimeMs'` (the **load-bearing** key name). Full file
   in [04_verify.md](04_verify.md); here just add that one line to `Game.config`.
2. **`js/state.js`** — add `bestTimeMs: null` and `lastTimeMs: 0`. (Add them; keep the rest.)
3. **Create `js/storage.js`** with the Code block — `Game.loadBest()` and `Game.saveBest(ms)`, both guarded.
   Then **open `index.html`** and add its `<script src="js/storage.js"></script>` tag **after `audio.js`, before
   `physics.js`** — giving the final order `config, state, input, audio, storage, physics, level, render, main`.
4. **`js/physics.js`** — replace `checkGoal` with the version in the Code block: on reaching the goal it sets
   `mode = 'won'`, records `lastTimeMs = round(clock * 1000)`, updates+saves the best if faster, and plays a
   two-note **win** beep.
5. **`js/render.js`** — add a **Time** line to the HUD (under Score), and expand the **win overlay** to show
   Time, Best, and Score. Also add a `Game.formatTime` helper at the top. The Code block shows the additions.
6. **`js/main.js`** — before starting the loop, load the stored best: `Game.state.bestTimeMs = Game.loadBest();`
   (place it right before `Game.resetGame();`). Snippet below.
7. **Save and open `index.html`.** Play, watch **Time** tick, win → the overlay shows your time and best; win
   faster and reload — the best time is remembered.

## Code
```js
// js/config.js — ADD this line inside Game.config.
  storageKey: 'shapeJumper.bestTimeMs',
```

```js
// js/state.js — ADD these two lines inside Game.state.
  bestTimeMs: null,   // best (lowest) completion time in ms, or null if none yet
  lastTimeMs: 0,      // this run's completion time in ms
```

```js
// js/storage.js — persist the best time. Strings-only + can throw, so guard both.
Game.loadBest = function () {
  try {
    const raw = localStorage.getItem(Game.config.storageKey);
    if (raw === null) return null;               // nothing saved yet
    const val = JSON.parse(raw);
    return (typeof val === 'number' && isFinite(val)) ? val : null;
  } catch (e) {
    return null;                                 // storage blocked/corrupt → no best
  }
};

Game.saveBest = function (ms) {
  try {
    localStorage.setItem(Game.config.storageKey, JSON.stringify(ms));
  } catch (e) {
    // Storage disabled or full (e.g. private mode) — best time just won't persist.
  }
};
```

```js
// js/physics.js — REPLACE Game.checkGoal with this.
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

    Game.beep(660, 120);         // win jingle: two notes
    Game.beep(990, 160, 0.12);
  }
};
```

```js
// js/render.js — ADD at the TOP of the file (before Game.draw).
Game.formatTime = function (ms) {
  return (ms / 1000).toFixed(2) + 's';
};
```

```js
// js/render.js — ADD a Time line to the HUD (right after the Score line).
  ctx.fillText('Time: ' + Game.formatTime(s.clock * 1000), 12, 44);
```

```js
// js/render.js — REPLACE the win-overlay text block with this richer version.
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
```

```js
// js/main.js — load the stored best just before seeding the run.
Game.state.bestTimeMs = Game.loadBest();
Game.resetGame();
requestAnimationFrame(frame);
```

## Done when (this step)
- [ ] A **Time** value ticks up in the HUD while playing.
- [ ] Winning plays a two-note jingle and the overlay shows Time, Best, and Score.
- [ ] Beating your best and **reloading** shows the improved best on the next win (it persisted).
- [ ] `Press R to play again` appears (the key itself is wired in the next step).

## If it breaks
- **Best time never persists** — you stored a raw number without `JSON.stringify`, or the read path doesn't
  `JSON.parse`. Both are required (localStorage is strings-only).
- **`Game.formatTime is not a function`** — it must be defined at the top of `render.js`, before `Game.draw`
  uses it.
- **Win overlay shows `NaNs`** — `lastTimeMs`/`bestTimeMs` weren't set; confirm the new `checkGoal` runs and
  `state` has both fields.
- **A `SecurityError` in the Console on load** — some browsers throw on `localStorage` under `file://` in
  private mode; the `try/catch` swallows it and the game still runs (just without a saved best).

---
> Nav: [← Audio](01_audio.md) · [Overview](00_overview.md) · [Title & restart →](03_title-and-restart.md)
