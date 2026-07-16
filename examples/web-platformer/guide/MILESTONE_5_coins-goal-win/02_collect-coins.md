# Milestone 5 · Step 02 of 4 — Collect coins: box overlap → score, and the HUD
> Nav: [← Entities data](01_entities-data.md) · [Overview](00_overview.md) · [Goal & win →](03_goal-and-win.md)

> **This step touches 3 files, edited together:** `js/physics.js` (add `collectCoins`), `js/main.js` (call it), `js/render.js` (HUD).

## Glossary for this step
- **`fillText(text, x, y)`** — draws text on the canvas at `(x, y)` using the current `font` and `fillStyle`. See [MDN: fillText](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText).
- **removing while iterating** — deleting items from an array as you loop it is a classic bug; looping **backwards** avoids skipping elements. See below.

## Why / design
A coin is collected when the player's box overlaps the coin's box — the exact same `Game.overlaps` test we
already wrote. On overlap we remove the coin from the live array and bump the score. Then we draw the score as
a HUD.

> **New concept — loop backwards when removing.** `splice(i, 1)` deletes item `i` and shifts everything after
> it down by one. If you loop *forwards*, you'd skip the item that slid into the deleted slot. Looping
> **backwards** (`for (let i = coins.length - 1; i >= 0; i--)`) means the shift only affects indices you've
> already passed, so nothing is skipped. This pattern recurs any time you filter a list in place.

## Do this
1. **Open `js/physics.js`** and **add** the `Game.collectCoins` function (shown in the Code block — add it
   after `Game.updatePlayer`; the rest of `physics.js` is unchanged).
   - It loops the live `Game.state.coins` **backwards**; for each coin the player overlaps, it `splice`s the
     coin out and does `s.score += 1`.
2. **Open `js/main.js`** and in `Game.update`, **call `Game.collectCoins()`** right after
   `Game.updatePlayer(dt)`. The Code block shows the updated `Game.update`.
3. **Open `js/render.js`** and **add the HUD** — after drawing the player, set a font and draw
   `'Score: ' + s.score` in the top-left. The Code block shows the additions (append before the closing `};`).
4. **Save and open `index.html`.** Climb to a coin — it vanishes and the Score in the top-left goes up by 1.

## Code
```js
// js/physics.js — ADD this function (after Game.updatePlayer). Rest of file unchanged.
Game.collectCoins = function () {
  const s = Game.state;
  const p = s.player;

  // Loop BACKWARDS so splicing out a coin doesn't skip the next one.
  for (let i = s.coins.length - 1; i >= 0; i--) {
    if (Game.overlaps(p, s.coins[i])) {
      s.coins.splice(i, 1); // remove the collected coin
      s.score += 1;
    }
  }
};
```

```js
// js/main.js — updated Game.update (rest of the file unchanged).
Game.update = function (dt) {
  Game.updatePlayer(dt);
  Game.collectCoins();
};
```

```js
// js/render.js — ADD the HUD at the END of Game.draw, just before the closing };
  // HUD: score, top-left.
  ctx.fillStyle = cfg.colors.text;
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + s.score, 12, 24);
```

## Done when (this step)
- [ ] Touching a coin makes it **disappear** and the top-left **Score** increases by exactly 1.
- [ ] Collecting all three coins leaves Score at 3 and no coins on screen.
- [ ] Walking near (but not into) a coin does not collect it. No Console errors.

## If it breaks
- **Score jumps by 2+ or a coin is skipped** — you're looping forwards while splicing. Use the backwards loop.
- **Coins never collect** — `collectCoins` isn't called in `Game.update`, or `Game.overlaps` isn't defined
  (it's from M4). Confirm both.
- **HUD text doesn't show** — you set `fillStyle` to the sky color, or drew the text *before* the background
  (which then paints over it). The HUD must be drawn last, after the background.
- **`s is not defined` in the HUD code** — `Game.draw` defines `const s = Game.state;` near the top (from step
  01). Make sure that line is present.

---
> Nav: [← Entities data](01_entities-data.md) · [Overview](00_overview.md) · [Goal & win →](03_goal-and-win.md)
