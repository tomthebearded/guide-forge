# Milestone 7 · Step 03 of 4 — Title screen + the `R` restart (the full state machine)
> Nav: [← Timer & best time](02_timer-and-best.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

> **This step touches 4 files, edited together:** `js/state.js`, `js/main.js`, `js/input.js`, `js/render.js`.

## Glossary for this step
- **title state** — a third mode (`'title'`) shown before play starts; the world is seeded but frozen behind a title overlay. See [glossary](../foundation/glossary.md).
- **restart** — pressing **R** calls `resetGame()`, which reseeds the run *and* picks a new random flip schedule (from M6). See decision [D6](../foundation/decision-log.md#d6--hud-restart-and-a-small-state-machine).

## Why / design
The game currently starts mid-play and can't be replayed without a reload. We complete the state machine:
`title → playing → won`, with **R** jumping back to a fresh `playing` from anywhere. The freeze guard in
`Game.update` already handles `title` and `won` (both `!== 'playing'`), so we mainly add the *transitions* in
`input.js` and the *title overlay* in `render.js`.

> **New concept — one field drives three screens.** `Game.state.mode` is the whole "screen" system:
> `render.js` draws a title overlay for `'title'`, the game + HUD for `'playing'`, and the win overlay for
> `'won'`; `input.js` decides which key advances which mode. No routing, no framework — just a string and a few
> `if`s. Because `resetGame()` reseeds the flip schedule, every restart's twist timing is different. See
> decision [D6](../foundation/decision-log.md#d6--hud-restart-and-a-small-state-machine).

## Do this
1. **`js/state.js`** — change the initial `mode` from `'playing'` to `'title'`. (One word.)
2. **`js/main.js`** — after seeding the run at startup, force the title screen: add `Game.state.mode = 'title';`
   right after `Game.resetGame();`. (So the world is set up but the player waits on the title.) Snippet below.
3. **`js/input.js`** — in the `keydown` handler, after starting audio, add two transitions (Code block):
   - **R** anywhere → `Game.resetGame();` (fresh playing run) then `return`.
   - From **title**, any move/jump key → `Game.resetGame();` (start playing).
4. **`js/render.js`** — add a **title overlay** (Code block) drawn when `s.mode === 'title'`: the game name,
   the controls, a one-line goal, the best time (if any), and "Press any move key to start". Put it after the
   win-overlay block, at the end of `Game.draw`.
5. **Save and open `index.html`.** It opens on the title; a move key starts play; win, then press **R** to
   replay with a new flip schedule.

## Code
```js
// js/state.js — change the initial mode.
  mode: 'title',   // 'title' | 'playing' | 'won'
```

```js
// js/main.js — open on the title screen (bottom of the file).
Game.state.bestTimeMs = Game.loadBest();
Game.resetGame();
Game.state.mode = 'title';       // <-- start on the title, not mid-play
requestAnimationFrame(frame);
```

```js
// js/input.js — ADD inside keydown, right after the startAudio guard.
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
```

```js
// js/render.js — ADD at the END of Game.draw (after the win overlay).
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
```

## Done when (this step)
- [ ] The game opens on a **SHAPE JUMPER** title screen with controls and (if set) the best time.
- [ ] Pressing a move key starts play; the title overlay disappears.
- [ ] After winning, pressing **R** starts a fresh run (coins back, score 0, timer reset).
- [ ] Each restart's gravity flips happen at **different** times (the schedule is reseeded).

## If it breaks
- **Title never shows** — `main.js` isn't overriding `mode` to `'title'` after `resetGame()`, or `state.js`
  still starts in `'playing'`.
- **R does nothing** — the R branch isn't in `keydown`, or it's placed after `setKey`/`return` paths that skip
  it. Put it near the top of the handler.
- **Can't start from the title** — the start-key list doesn't match your keys, or the title-start block runs
  before `const s = Game.state;`. Ensure `s` is defined first.
- **R restarts but the twist rhythm is identical** — `resetGame()` must call `scheduleNextFlip()` (from M6);
  confirm that line is still there.
- **"I pressed Space/Up to start and the player didn't jump — why did nothing happen?"** — nothing's broken.
  Starting from the title with **Space** or **Up** does set `jumpQueued = true` in that same keypress, but the
  player isn't standing on the ground on the very first frame of the new run, so the queued jump is simply
  ignored (you can only jump when grounded). Press jump again once play begins. This is harmless — no fix
  needed; it's just the one keypress doing double duty (start **and** a jump that can't apply yet).

---
> Nav: [← Timer & best time](02_timer-and-best.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)
