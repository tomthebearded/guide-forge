# Milestone 5 — Coins, goal, HUD & win state
> Section: The game · milestone 5 of 7 · prev: [Platforms & AABB collision](../MILESTONE_4_platforms-and-collision/00_overview.md) · next: [The random twist: gravity flips](../MILESTONE_6_gravity-twist/00_overview.md)

## Goal
Give the level a point. Add **coins** (circles you collect for score), a **goal** flag you touch to **win**, an
on-canvas **HUD** showing the score, and a **win overlay** that freezes play. We introduce a tiny game-state
machine (`playing` / `won`) and a `resetGame()` that seeds a fresh run — the seed the restart and twist build
on later.

## Scope discipline
This milestone deliberately does **not**: add sound, a timer, or a persisted best time (that's
[M7](../MILESTONE_7_sound-timer-persistence/00_overview.md)); add a **restart** key (also M7 — once you win in
M5, you reload to play again); or flip gravity ([M6](../MILESTONE_6_gravity-twist/00_overview.md)). The win
overlay shows the score, not a time, for now.

## Prerequisite
[M4](../MILESTONE_4_platforms-and-collision/00_overview.md) green: solid platforms, collision, and a playable
climb.

## Steps at a glance
**Sitting 1 — the collectibles & goal exist (01)**
1. [Add coins, goal, player-start data + `resetGame()`, and draw them](01_entities-data.md)

**Sitting 2 — make them do something (02–04)**
2. [Collect coins: box overlap → score, and the HUD](02_collect-coins.md)
3. [Reach the goal: the win state + overlay](03_goal-and-win.md)
4. [Verify Milestone 5](04_verify.md)

## Design / decisions folded in
- **Coins draw as circles but collide as boxes** — [conventions](../foundation/conventions.md#data-vs-code); reuse `Game.overlaps`.
- **A small state machine + `resetGame()`** — decision [D6](../foundation/decision-log.md#d6--hud-restart-and-a-small-state-machine); this seeds each run and is extended by M6 (flip schedule) and M7 (restart/timer/best).
- New glossary terms: collectible, game-state machine.

## Done-when gate
- [ ] Coins (yellow circles) and a green goal flag appear; the player starts at the bottom-left.
- [ ] Touching a coin **removes it** and increments the on-screen **Score** by 1.
- [ ] The HUD shows the live score in the top-left.
- [ ] Touching the goal switches to a **YOU WIN!** overlay and **freezes** the player.

## Handoff
### Recap
Added collectible coins, a goal, a HUD, and a `playing`/`won` state machine with `resetGame()`.
### Done so far (cumulative)
- Everything from M4 (platforms, collision, playable climb).
- `Game.level` now has `coins`, `goal`, and `playerStart`; `Game.resetGame()` seeds a fresh run.
- `Game.state` has `mode` (`'playing'`/`'won'`), `score`, and a live `coins` array.
- `Game.collectCoins()` and `Game.checkGoal()` in `physics.js`; `main.js` calls them and freezes on win.
- `render.js` draws coins, the goal, the HUD score, and the win overlay.
### Artifacts now in the project
```
shape-jumper/
  js/
    config.js  (+ coin/goal/text colors)
    state.js   (+ mode, score, coins)
    level.js   (+ coins, goal, playerStart, resetGame)
    physics.js (+ collectCoins, checkGoal)
    render.js  (+ coins, goal, HUD, win overlay)
    main.js    (calls resetGame at start; update collects + checks goal; freezes on win)
    ... (input unchanged)
```
### Decisions / open issues
- No restart yet — winning requires a reload to replay. M7 adds the **R** key.
- The win overlay shows score only; the timer + best time arrive in M7.
### Next milestone
[M6 — The random twist: gravity flips](../MILESTONE_6_gravity-twist/00_overview.md): gravity randomly inverts,
telegraphed. Done-when: a telegraph, then a flip; platforming works upside-down; it flips back.

---
> Section: The game · milestone 5 of 7 · prev: [Platforms & AABB collision](../MILESTONE_4_platforms-and-collision/00_overview.md) · next: [The random twist: gravity flips](../MILESTONE_6_gravity-twist/00_overview.md)
