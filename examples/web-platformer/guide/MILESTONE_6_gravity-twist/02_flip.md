# Milestone 6 · Step 02 of 4 — The flip: `updateTwist()` + the inverted-gravity look
> Nav: [← Config & schedule](01_config-and-schedule.md) · [Overview](00_overview.md) · [Telegraph →](03_telegraph.md)

> **This step touches 3 files, edited together:** `js/physics.js` (add `updateTwist`), `js/main.js` (call it), `js/render.js` (tint).

## Glossary for this step
- **flip** — inverting gravity by negating `gravitySign` (`+1 → -1` or back). Everything vertical already multiplies by it, so this one change reverses falling, jumping, and grounding at once. See decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics).
- **the ternary `cond ? a : b`** — a one-line if/else *expression*: it evaluates to `a` when `cond` is true, otherwise `b`. Here `(s.gravitySign < 0) ? skyFlipped : sky` picks the flipped or the normal sky color. See [MDN: conditional (ternary) operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator).

## Why / design
Here's the payoff. When the clock reaches `nextFlipAt`, we **negate `gravitySign`** and schedule the next flip.
That's it — the physics from M3–M5 already reads `gravitySign` everywhere, so the player immediately falls the
other way, jumps the other way, and grounds on the other surface. We also tint the background so "which way is
down" is obvious.

> **New concept — one line, whole-game effect.** `s.gravitySign *= -1;` is the entire mechanic. This is why we
> paid the small cost of writing sign-aware physics back in M3: the twist needs no new collision code, no
> special cases for jumping, no ceiling handling — the ceiling platform we added in M4 is *already* a valid
> landing surface once gravity points up. See decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics).

## Do this
1. **Open `js/physics.js`** and **add** `Game.updateTwist` (Code block; put it after `checkGoal`). It returns
   early if `twistEnabled` is false; otherwise, when `clock >= nextFlipAt`, it flips the sign and reschedules.
2. **Open `js/main.js`** and in `Game.update`, **call `Game.updateTwist()`** right after `s.clock += dt;`
   (before `updatePlayer`, so the flip applies this frame). The Code block shows the whole `Game.update`.
3. **Open `js/render.js`** and change the **background fill** so it uses `colors.skyFlipped` when
   `s.gravitySign < 0`, else `colors.sky`. The Code block shows just the changed lines at the top of `Game.draw`.
4. **Save and open `index.html`.** Play for 4–8 seconds: gravity flips, the background turns reddish, and the
   player falls up to the ceiling. Jump — you launch *down*. It flips back after another random delay.
5. **Try the toggle:** set `twistEnabled: false` in `config.js`, reload → no flips (plays like M5). Set it back
   to `true`.

## Code
```js
// js/physics.js — ADD this function (after Game.checkGoal). Rest of file unchanged.
Game.updateTwist = function () {
  const cfg = Game.config;
  const s = Game.state;
  if (!cfg.twistEnabled) return;

  if (s.clock >= s.nextFlipAt) {
    s.gravitySign *= -1;     // THE flip — everything vertical follows the sign
    Game.scheduleNextFlip(); // pick the next random flip time
  }
};
```

```js
// js/main.js — updated Game.update (rest of the file unchanged).
Game.update = function (dt) {
  const s = Game.state;
  if (s.mode !== 'playing') return;

  s.clock += dt;
  Game.updateTwist();     // flip gravity if it's due

  Game.updatePlayer(dt);
  Game.collectCoins();
  Game.checkGoal();
};
```

```js
// js/render.js — CHANGE the background fill at the top of Game.draw.
  // Background: reddish tint while gravity is inverted.
  ctx.fillStyle = (s.gravitySign < 0) ? cfg.colors.skyFlipped : cfg.colors.sky;
  ctx.fillRect(0, 0, cfg.width, cfg.height);
```

## Done when (this step)
- [ ] Within ~4–8 seconds of play, gravity flips: the background turns reddish and the player falls **up** toward the ceiling.
- [ ] While inverted, jumping launches the player **down**, and it lands on platform undersides / the ceiling.
- [ ] After another random delay it flips back (background returns to dark blue).
- [ ] `twistEnabled: false` + reload = no flips at all.

## If it breaks
- **Player falls up but can't land / falls off the top** — the ceiling platform (`platforms[1]`) is missing
  from `level.js`. It's the landing surface when gravity is up.
- **Flip never happens** — `updateTwist` isn't called in `Game.update`, or `nextFlipAt` never gets passed
  because `clock` isn't advancing (check step 01).
- **Flips constantly / every frame** — you flip but don't call `scheduleNextFlip()`, so `clock >= nextFlipAt`
  stays true. Both lines are required.
- **Jump feels wrong after a flip** — that would mean the jump isn't sign-aware; confirm
  `p.vy = -cfg.jumpSpeed * s.gravitySign;` (from M3), not a hard-coded `-cfg.jumpSpeed`.

---
> Nav: [← Config & schedule](01_config-and-schedule.md) · [Overview](00_overview.md) · [Telegraph →](03_telegraph.md)
