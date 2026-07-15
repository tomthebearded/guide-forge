# Conventions — Shape Jumper

> The rules every step in this guide follows. If a step seems to contradict one of these, the convention
> wins — fix the step.

## Naming
- **Load-bearing names** (must match *exactly* — the game breaks otherwise; flagged at first use in each step):
  - the global object **`Game`**;
  - the canvas element **`id="game"`**;
  - the shared `Game.config.*` and `Game.state.*` **key names** (e.g. `gravity`, `moveSpeed`, `jumpSpeed`,
    `gravitySign`, `mode`, `nextFlipAt`);
  - the **`event.code`** strings (`"ArrowLeft"`, `"ArrowRight"`, `"KeyA"`, `"KeyD"`, `"Space"`, `"ArrowUp"`, `"KeyR"`);
  - the **`localStorage` key** (`"shapeJumper.bestTimeMs"`).
- **Cosmetic** (free to rename / retune without breaking anything): all colors, the canvas pixel size, every
  shape dimension, the page `<title>`, the number and placement of platforms/coins.
- `camelCase` for variables and functions; files are lowercase (`config.js`, `main.js`); no loose globals —
  everything hangs off `Game`.

## Structure / architecture
- **Zero build, classic scripts, one global namespace.** `index.html` loads a fixed, ordered list of
  `<script>` tags (**no `type="module"`**). The *first* script (`config.js`) declares `const Game = {}`; every
  later script attaches to it (`Game.state = …`, `Game.update = function(){…}`). This is the entire "module
  system" — and it's the reason the game runs from `file://` with no server.
- **Load order is dependency order** and is load-bearing:
  `config → state → input → audio → storage → physics → level → render → main`.
- **`config` vs `state` split.** `Game.config` = tuning constants that don't change during play (gravity
  magnitude, move speed, jump strength, canvas size, colors, flip-interval range). `Game.state` = everything
  that mutates each frame (player position/velocity, coins remaining, game mode, timer, next-flip time,
  gravity **sign**).
- **One update, one draw, per frame.** `main.js` owns the loop: `update(dt)` mutates `Game.state`; `draw()`
  reads it and paints. No drawing inside update; no state changes inside draw.

## Data vs code
- **Everything is a box for physics.** Player, platforms, coins, and goal each carry `{x, y, w, h}`. Coins
  *draw* as circles but *collide* as boxes — one collision routine, not two.
- **The level is data.** Platforms/coins/goal are entries in arrays in `level.js`. Adding a platform = adding
  one object to an array, never new control flow.

## Language / framework specifics
- **Frame-rate independence via delta time.** Velocities are in **pixels per second**; every position update
  multiplies velocity by `dt` (seconds since the last frame). `dt` is **clamped** to a small maximum so a
  slept/background tab can't produce one giant frame that tunnels the player through a platform.
- **Gravity is a signed number through one integrator.** `Game.state.gravitySign` is `+1` (down) or `-1`
  (up); *all* vertical physics multiplies by it. "Grounded" = "resolved a vertical overlap on the
  gravity-facing side this frame." **No step hard-codes 'down'** — this is what makes the M6 twist a two-line
  change.
- Use **`event.code`** (physical key), not `event.key`. Create/resume the **`AudioContext` on the first
  keydown** (autoplay policy). `localStorage` values are **strings** — `JSON.stringify` out, `JSON.parse` +
  guard in, writes in `try/catch`.

## Code presentation
- **Edit-steps use fragment-plus-verify.** A step that **creates a new file** shows that file's **complete
  contents**. A step that **edits a file created earlier** may show only a **precisely-placed fragment** — the
  added or replaced lines, with explicit placement ("ADD this function after `collectCoins`", "REPLACE
  `checkGoal` with this", "add this `<script>` tag before `render.js`") — instead of re-printing the whole
  file. This keeps New-tier steps short and focused on what actually changed.
- **The verify checkpoint holds the full files.** Each milestone's `NN_verify.md` renders the **complete
  current contents of every file that milestone touched**, so the reader always has an authoritative copy to
  diff against — the fragment in the step shows *what changed*, the verify file shows *the whole thing*.
  (Rationale in decision [D7](decision-log.md#d7--edit-steps-use-fragment-plus-verify-not-full-file-per-edit).)

## Testing / verification
- Every Done-when gate is an **observable on-screen result** (a shape resting at a coordinate, the score text
  incrementing, the WIN overlay, an audible beep, a best-time number that survives a reload) plus, where
  useful, a **DevTools console log** (e.g. the `dt` value). No gate is "it works" — each names the exact thing
  the reader sees.
