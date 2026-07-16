# Milestone 2 · Step 02 of 5 — Create `input.js`, track held keys
> Nav: [← Config & state](01_config-and-state.md) · [Overview](00_overview.md) · [Render →](03_render.md)

## Glossary for this step
- **`keydown` / `keyup`** — browser events that fire when a key is pressed and released. We listen for both. See [MDN: keydown](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event).
- **`event.code`** — identifies the **physical key** (e.g. `"ArrowLeft"`, `"KeyA"`), independent of keyboard layout. MDN recommends it for games. See [MDN: KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code).
- **held-key state** — instead of acting on each key event, we record *which keys are currently down* in an object, and the game loop reads it every frame. See [glossary](../foundation/glossary.md).
- **`switch` / `case` / `break`** — a `switch` picks a branch by matching a value against `case` labels; `break` ends a branch so it doesn't fall through into the next. Two `case` labels stacked with no code between them (as with `'ArrowLeft'` / `'KeyA'` below) share one branch — either key runs the same line. See [MDN: switch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch).
- **`addEventListener(type, fn)` / `window`** — `addEventListener` registers `fn` to run every time an event of `type` fires on an object. We attach ours to **`window`**, the global object for the whole page/tab, so keypresses are caught no matter what element is focused. See [MDN: addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).

## Why / design
A platformer needs to know, every frame, *"is left held right now?"* — not *"was left pressed once?"*. So we
don't move the player inside the key event. Instead, `keydown` sets a flag to `true`, `keyup` sets it to
`false`, and the loop reads those flags each frame. This makes smooth, continuous movement trivial and handles
multiple keys at once for free.

> **New concept — use `event.code`, not `event.key`.** `event.code` is the *physical* key position, so the
> A/D and arrow controls work the same on a QWERTY or AZERTY keyboard. `event.key` would give the *character*
> (`"a"`, or `"q"` on AZERTY), which is the wrong thing for movement. We always use `code`. See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) and [stack.md](../foundation/stack.md).

## Do this
1. **Create `js/input.js`** with the Code block below.
2. **WHAT it does:**
   - `Game.input = { left: false, right: false }` — the held-key flags the loop reads.
   - `setKey(code, isDown)` — a small helper that maps a physical key **code** to the right flag. Both the
     arrow key and its WASD twin set the same flag (so either works).
   - Two listeners on `window`: `keydown` calls `setKey(code, true)`, `keyup` calls `setKey(code, false)`.
   - **WHERE:** listeners are on `window` so keys are caught no matter what's focused.
3. **Load-bearing names:** `Game.input`, `Game.input.left`, `Game.input.right`, and the exact code strings
   `"ArrowLeft"`, `"KeyA"`, `"ArrowRight"`, `"KeyD"` (see [stack.md](../foundation/stack.md)). `main.js` reads
   `Game.input.left`/`right` by these names in the next steps.
4. **Nothing visibly changes yet** — the loop doesn't read `Game.input` until step 04. You can, however, open
   the Console after wiring and type `Game.input` to inspect it.

## Code
```js
// js/input.js — keyboard: record which movement keys are currently held.
Game.input = {
  left: false,
  right: false,
};

// Map a PHYSICAL key code to a held-key flag. Arrow keys and WASD share flags.
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
  setKey(e.code, true);
});

window.addEventListener('keyup', function (e) {
  setKey(e.code, false);
});
```

## Done when (this step)
- [ ] `js/input.js` exists and defines `Game.input` plus `keydown`/`keyup` listeners.
- [ ] (After step 04 wires it up) typing `Game.input` in the Console and holding ← shows `{ left: true, right: false }`.

## If it breaks
- **A key does nothing later** — you compared `event.key` instead of `event.code`, or misspelled a code
  string. The codes are case-sensitive: `"KeyA"`, `"ArrowLeft"` (not `"a"`, not `"arrowleft"`).
- **`Game is not defined`** — `input.js` must load *after* `config.js` (which creates `Game`). We set the
  script order in step 04.

---
> Nav: [← Config & state](01_config-and-state.md) · [Overview](00_overview.md) · [Render →](03_render.md)
