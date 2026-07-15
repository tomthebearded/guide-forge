# Milestone 6 — The random twist: gravity flips
> Section: The game · milestone 6 of 7 · prev: [Coins, goal & win](../MILESTONE_5_coins-goal-win/00_overview.md) · next: [Sound, timer & best time](../MILESTONE_7_sound-timer-persistence/00_overview.md)

## Goal
The signature twist. At **random intervals**, gravity **inverts** — the player falls *up* to the ceiling,
jumps *down* off it, and stands on the undersides of platforms — then flips back. Each flip is **telegraphed**
~1 second ahead so it's fair, and a `twistEnabled` flag turns it off. Because M3–M5 wrote all vertical physics
**sign-aware**, the flip itself is essentially one line: `gravitySign *= -1`.

## Scope discipline
This milestone deliberately does **not**: add sound, a timer, best-time persistence, or a restart key (all
[M7](../MILESTONE_7_sound-timer-persistence/00_overview.md)). It doesn't add new *physics* — it only flips the
sign the existing physics already respects. No new collision code.

## Prerequisite
[M5](../MILESTONE_5_coins-goal-win/00_overview.md) green: coins, goal, HUD, and the win state work.

## Steps at a glance
**Sitting 1 — schedule & flip (01–02)**
1. [Add the twist config, the clock, and `scheduleNextFlip()`](01_config-and-schedule.md)
2. [The flip: `updateTwist()` + the inverted-gravity look](02_flip.md)

**Sitting 2 — make it fair (03–04)**
3. [The telegraph: warn before every flip](03_telegraph.md)
4. [Verify Milestone 6](04_verify.md)

## Design / decisions folded in
- **Gravity flip = one sign change**, thanks to sign-aware physics — decisions [D3](../foundation/decision-log.md#d3--gravity-sign-aware-physics) and [D4](../foundation/decision-log.md#d4--the-gravity-flip-is-telegraphed-and-toggleable).
- **Telegraphed + toggleable** — decision [D4](../foundation/decision-log.md#d4--the-gravity-flip-is-telegraphed-and-toggleable). New glossary term: telegraph. `Math.random` drives the schedule.

## Done-when gate
- [ ] After a few seconds of play, a ~1 s **telegraph** (pulsing warning) appears, then **gravity flips**: the player falls toward the ceiling.
- [ ] While flipped, the player can still **jump** (away from the ceiling) and lands on platform undersides — platforming works upside-down.
- [ ] Gravity flips **back** later; flips keep recurring at **randomized** times (not a fixed rhythm).
- [ ] Setting `Game.config.twistEnabled = false` and reloading disables all flips — the game plays exactly like M5.

## Handoff
### Recap
Added a random, telegraphed gravity-flip mechanic driven by a play clock — a one-line sign change plus warning + visuals.
### Done so far (cumulative)
- Everything from M5 (coins, goal, HUD, win).
- `Game.state` has `clock` (seconds of play) and `nextFlipAt`; `Game.config` has the twist knobs.
- `Game.scheduleNextFlip()` (random next-flip time), `Game.updateTwist()` (flip when due), `Game.flipIncoming()` (telegraph).
- `render.js` tints the sky when inverted and pulses a telegraph before a flip.
### Artifacts now in the project
```
shape-jumper/
  js/
    config.js  (+ twistEnabled, flip delays, telegraphTime, skyFlipped/telegraph colors)
    state.js   (+ clock, nextFlipAt)
    level.js   (resetGame: clock=0 + scheduleNextFlip; new scheduleNextFlip)
    physics.js (+ updateTwist, flipIncoming)
    render.js  (inverted tint + telegraph)
    main.js    (advance clock; call updateTwist)
    ... (input unchanged)
```
### Decisions / open issues
- The player has no fail state if a flip strands them — by design; they wait for the next flip. The telegraph keeps it fair.
### Next milestone
[M7 — Sound, timer, best time & restart](../MILESTONE_7_sound-timer-persistence/00_overview.md): beeps, a
completion timer, a persisted best time, and the **R** restart that reseeds the flip schedule.
