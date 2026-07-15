# Milestone 6 · Step 03 of 4 — The telegraph: warn before every flip
> Nav: [← The flip](02_flip.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

> **This step touches 2 files, edited together:** `js/physics.js` (add `flipIncoming`) and `js/render.js` (draw the warning).

## Glossary for this step
- **telegraph** — a short visual warning shown *before* something happens, so the player can react. Here: ~1 second before a flip. See [glossary](../foundation/glossary.md).
- **`globalAlpha`** — a Canvas setting (0–1) that makes everything drawn afterward semi-transparent; we use it to pulse the warning. Reset it to 1 when done. See [MDN: globalAlpha](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalAlpha).
- **`Math.sin` / `Math.abs`** — `Math.sin` returns a value that oscillates smoothly between −1 and 1; `Math.abs` strips the sign so it never goes negative. Together they give the pulsing 0→1 flicker value fed to `globalAlpha`. See [MDN: Math.sin](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin) and [Math.abs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/abs).

## Why / design
An unannounced random flip feels like a bug. The fix is a **telegraph**: when the next flip is within
`telegraphTime` seconds, we flash a pulsing warning so the player braces. This is what turns "random and
unfair" into "random but readable" (decision [D4](../foundation/decision-log.md#d4--the-gravity-flip-is-telegraphed-and-toggleable)).

> **New concept — derive the warning from the schedule, don't add another timer.** We already know
> `nextFlipAt`. "Is a flip incoming?" is just `nextFlipAt - clock <= telegraphTime`. No extra state — the
> telegraph is a *view* of the existing schedule. Reusing one source of truth (the schedule) for both the flip
> and its warning keeps them perfectly in sync.

## Do this
1. **Open `js/physics.js`** and **add** `Game.flipIncoming` (Code block; after `updateTwist`). It returns
   `false` if the twist is off, else whether the next flip is within `telegraphTime`.
2. **Open `js/render.js`** and **add the telegraph** just **after** the player is drawn and **before** the HUD.
   When `Game.flipIncoming()` is true, draw pulsing warning bars at the top and bottom and a centered
   **"GRAVITY FLIP INCOMING"** label. The pulse uses `Math.sin(s.clock * 12)` for a smooth flicker — the `12`
   is the flash speed (roughly two flashes per second; raise it to flash faster, lower it to flash slower). The
   `0.35` and `0.45` set the brightness range (alpha floors at `0.35` and rises to `0.80`); all three numbers
   are **cosmetic** — retune to taste. The Code block shows the block to insert.
3. **Save and open `index.html`.** About a second before each flip, warning bars pulse and the label shows;
   then gravity flips.

## Code
```js
// js/physics.js — ADD this function (after Game.updateTwist). Rest of file unchanged.
Game.flipIncoming = function () {
  const cfg = Game.config;
  const s = Game.state;
  if (!cfg.twistEnabled) return false;
  return (s.nextFlipAt - s.clock) <= cfg.telegraphTime;
};
```

```js
// js/render.js — INSERT after drawing the player, before the HUD.
  // Telegraph: pulsing warning ~1s before a gravity flip.
  if (Game.flipIncoming()) {
    const pulse = 0.35 + 0.45 * Math.abs(Math.sin(s.clock * 12));
    ctx.globalAlpha = pulse;
    ctx.fillStyle = cfg.colors.telegraph;
    ctx.fillRect(0, 0, cfg.width, 10);
    ctx.fillRect(0, cfg.height - 10, cfg.width, 10);
    ctx.globalAlpha = 1; // reset so nothing else is transparent

    ctx.fillStyle = cfg.colors.telegraph;
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('GRAVITY FLIP INCOMING', cfg.width / 2, 40);
    ctx.textAlign = 'left';
  }
```

## Done when (this step)
- [ ] ~1 second before each flip, warning bars pulse at the top and bottom and a centered label reads "GRAVITY FLIP INCOMING".
- [ ] The warning stops the instant the flip happens, and the flips still occur at randomized times.
- [ ] With `twistEnabled: false`, no telegraph ever shows.

## If it breaks
- **Everything on screen is faintly transparent** — you didn't reset `ctx.globalAlpha = 1;` after the pulse.
  It must be reset before drawing anything else.
- **The telegraph never appears** — `flipIncoming()` isn't called, or `telegraphTime` is 0. Also confirm the
  telegraph block is *inside* `Game.draw`.
- **The telegraph shows the whole time** — `telegraphTime` is larger than your min flip delay, so a flip is
  "always incoming." Keep `telegraphTime` well under `flipMinDelay`.
- **The label is centered but the HUD is too** — reset `ctx.textAlign = 'left'` at the end of the block.
