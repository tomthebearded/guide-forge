# Milestone 5 · Step 03 of 4 — Reach the goal: the win state + overlay
> Nav: [← Collect coins](02_collect-coins.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

> **This step touches 3 files, edited together:** `js/physics.js` (add `checkGoal`), `js/main.js` (freeze + call it), `js/render.js` (win overlay).

## Glossary for this step
- **win state (`mode: 'won'`)** — a mode where the game freezes and shows a victory overlay instead of updating the player. See [glossary](../foundation/glossary.md).
- **freeze** — while `mode !== 'playing'`, `update()` returns early so nothing moves, but `draw()` still runs so the overlay shows. See [conventions](../foundation/conventions.md#structure--architecture).
- **`rgba(r, g, b, a)`** — a color whose 4th value `a` is opacity, from 0 (fully transparent) to 1 (fully opaque); `rgba(0, 0, 0, 0.6)` is 60%-opaque black, which dims the game behind the overlay instead of hiding it. See [MDN: rgb()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/rgb).

## Why / design
Touching the goal wins the game. `checkGoal()` sets `mode = 'won'` when the player overlaps the goal box.
`main.js` then **freezes** the world (skips updates while not `playing`) so the player stops mid-screen, and
`render.js` paints a dimmed **YOU WIN!** overlay on top.

> **New concept — the state machine gates the update.** One field, `Game.state.mode`, decides what happens each
> frame. When it's `'playing'`, we update the player and check win conditions. When it's `'won'`, `update`
> returns immediately — the player can't move, coins can't be collected — but `draw` keeps running so the
> overlay is visible. This tiny machine is what M7's restart and title screen extend. See decision [D6](../foundation/decision-log.md#d6--hud-restart-and-a-small-state-machine).

## Do this
1. **Open `js/physics.js`** and **add** `Game.checkGoal` (Code block; after `collectCoins`). It sets
   `s.mode = 'won'` when the player overlaps `Game.level.goal`.
2. **Open `js/main.js`** and update `Game.update` to (a) **return early** when `s.mode !== 'playing'`, and
   (b) call `Game.checkGoal()` after collecting coins. The Code block shows the whole `Game.update`.
3. **Open `js/render.js`** and **add the win overlay** at the very end of `Game.draw` (after the HUD): when
   `s.mode === 'won'`, paint a translucent black rectangle over everything, then centered **YOU WIN!** and the
   final score. Reset `textAlign` back to `'left'` afterward so the next frame's HUD isn't centered.
4. **Save and open `index.html`.** Walk right into the goal flag → the screen dims and **YOU WIN!** appears; the
   player freezes. (To play again in M5, reload the page — the **R** restart arrives in M7.)

## Code
```js
// js/physics.js — ADD this function (after Game.collectCoins). Rest of file unchanged.
Game.checkGoal = function () {
  const s = Game.state;
  if (Game.overlaps(s.player, Game.level.goal)) {
    s.mode = 'won';
  }
};
```

```js
// js/main.js — updated Game.update (rest of the file unchanged).
Game.update = function (dt) {
  const s = Game.state;
  if (s.mode !== 'playing') return; // frozen (e.g. after winning)

  Game.updatePlayer(dt);
  Game.collectCoins();
  Game.checkGoal();
};
```

```js
// js/render.js — ADD at the END of Game.draw, after the HUD, before the closing };
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

    ctx.textAlign = 'left'; // reset for the next frame's HUD
  }
```

## Done when (this step)
- [ ] Walking into the green goal flag switches to a dimmed **YOU WIN!** overlay showing the final score.
- [ ] The player **stops moving** once won (keys do nothing) — the world is frozen.
- [ ] Reloading the page starts a fresh run (coins back, score 0, mode playing).

## If it breaks
- **Nothing happens at the goal** — `checkGoal` isn't called, or the goal box is unreachable. Confirm
  `Game.update` calls `Game.checkGoal()` and the goal sits on the floor where the player can touch it.
- **The player keeps moving after winning** — the `if (s.mode !== 'playing') return;` guard is missing from
  `Game.update`.
- **The overlay text is invisible or off-center** — you didn't set `textAlign = 'center'`, or you forgot to
  reset it to `'left'` (which then mis-aligns the HUD next frame).
- **The whole HUD is centered afterwards** — you didn't reset `ctx.textAlign = 'left'` at the end of the overlay block.

---
> Nav: [← Collect coins](02_collect-coins.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)
