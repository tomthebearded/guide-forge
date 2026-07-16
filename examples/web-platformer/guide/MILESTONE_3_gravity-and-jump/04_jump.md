# Milestone 3 · Step 04 of 5 — Jump: queue the key and apply an impulse
> Nav: [← Floor & grounded](03_floor-and-grounded.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

> **This step touches 2 files, edited together:** `js/input.js` (edit) and `js/physics.js` (edit).

## Glossary for this step
- **jump impulse** — a one-time change to `vy` (against gravity) that launches the player off the ground. See [glossary](../foundation/glossary.md).
- **edge-triggered (one-shot)** — the jump should fire *once* per key press, not every frame the key is held. We use a "queued" flag that's consumed once. See [glossary](../foundation/glossary.md).
- **`event.repeat`** — `true` when a `keydown` is an OS auto-repeat (from holding the key). We ignore those so holding Space doesn't machine-gun jumps. See [MDN: KeyboardEvent.repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat).
- **`event.preventDefault()`** — cancels the browser's built-in reaction to an event; here it stops Space/arrows from scrolling the page now that they're game keys. See [MDN: Event.preventDefault](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault).
- **`array.includes(x)`** — returns `true` if the array contains `x`; we use it to ask "is this key code one of the game keys?". See [MDN: Array.includes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).

## Why / design
Jumping is a *moment*, not a *state* — one press = one jump. So the key handler sets a **one-shot flag**
(`jumpQueued`), and the physics step consumes it: if the player is grounded, it applies the impulse and clears
the flag. Launching **against gravity** (`-jumpSpeed * gravitySign`) keeps the jump correct even when the twist
later flips gravity.

> **New concept — launch against gravity with the sign.** A jump should push *away* from the ground. With
> normal gravity (`+1`), the ground is below, so we want to move up: `vy = -jumpSpeed`. Writing it as
> `-jumpSpeed * gravitySign` means that when gravity flips to `-1` (M6), the jump automatically pushes the
> other way — away from the ceiling. Same line, no special case. See decision [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics).

## Do this
1. **Open `js/input.js`.** **Replace its contents** with the Code block below.
   - **WHAT's new:** `Game.input` gains `jumpQueued: false`. In `keydown`, if the code is `Space` or
     `ArrowUp` **and** it's not an auto-repeat (`!e.repeat`), set `jumpQueued = true`. We also call
     `e.preventDefault()` for the game keys so Space/arrows don't scroll the page.
2. **Open `js/physics.js`.** **Replace its contents** with the Code block below.
   - **WHAT's new:** at the **top** of `updatePlayer`, before anything else, if `jumpQueued` **and**
     `p.grounded`, set `p.vy = -cfg.jumpSpeed * s.gravitySign`, clear `grounded`, and then set
     `input.jumpQueued = false` (consume it whether or not it fired, so a jump pressed midair doesn't linger).
   - **WHY at the top:** it uses last frame's `grounded` value, which is exactly "were we on the ground when
     the player pressed jump?".
3. **Save and open `index.html`.** Press **Space** or **↑** to jump; you can only jump when standing on the floor.

## Code
```js
// js/input.js — movement (held) + a one-shot jump.
Game.input = {
  left: false,
  right: false,
  jumpQueued: false, // set once per press; consumed by physics
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
  // Jump: fire once per real press (ignore OS auto-repeat while held).
  if ((e.code === 'Space' || e.code === 'ArrowUp') && !e.repeat) {
    Game.input.jumpQueued = true;
  }
  // Stop game keys from scrolling the page.
  if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  setKey(e.code, true);
});

window.addEventListener('keyup', function (e) {
  setKey(e.code, false);
});
```

```js
// js/physics.js — motion + gravity + floor + jump. Sign-aware throughout.
Game.updatePlayer = function (dt) {
  const cfg = Game.config;
  const s = Game.state;
  const p = s.player;
  const input = Game.input;

  // Jump: only if grounded (uses last frame's grounded). Launch AGAINST gravity.
  if (input.jumpQueued && p.grounded) {
    p.vy = -cfg.jumpSpeed * s.gravitySign;
    p.grounded = false;
  }
  input.jumpQueued = false; // consume the one-shot every frame

  // Horizontal.
  let dir = 0;
  if (input.left)  dir -= 1;
  if (input.right) dir += 1;
  p.vx = dir * cfg.moveSpeed;
  p.x += p.vx * dt;

  // Vertical: gravity then integrate.
  p.vy += cfg.gravity * s.gravitySign * dt;
  p.y += p.vy * dt;

  // Floor: rest on floorY and mark grounded.
  // (Only a floor for now — Milestone 4 replaces this with real platforms + a ceiling.)
  p.grounded = false;
  if (p.y + p.h >= cfg.floorY) {
    p.y = cfg.floorY - p.h;
    p.vy = 0;
    p.grounded = true;
  }
};
```

## Done when (this step)
- [ ] Standing on the floor, pressing **Space**/**↑** launches the player up ~107 px and it falls back to rest.
- [ ] Pressing jump repeatedly while airborne does **nothing** — the second press is ignored until you land.
- [ ] Holding Space does not repeatedly re-jump the instant you land (auto-repeat is ignored).
- [ ] You can still move left/right, including in mid-air.

## If it breaks
- **Can't jump at all** — `grounded` isn't being set on landing (check step 03), or the jump check runs after
  `grounded` is reset to `false`. It must be at the *top* of `updatePlayer`, before the floor code.
- **Infinite/rocket jumping** — you didn't gate on `p.grounded`, or you're setting `jumpQueued` on every
  auto-repeat (missing `!e.repeat`).
- **Holding Space auto-jumps on landing** — same missing `!e.repeat`. Auto-repeat `keydown`s must be ignored.
- **Space scrolls the page** — the `e.preventDefault()` for game keys is missing.

---
> Nav: [← Floor & grounded](03_floor-and-grounded.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)
