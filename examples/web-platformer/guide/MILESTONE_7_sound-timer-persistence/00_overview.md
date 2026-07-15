# Milestone 7 — Sound, timer, best time & restart
> Section: The game · milestone 7 of 7 · prev: [The random twist: gravity flips](../MILESTONE_6_gravity-twist/00_overview.md)

## Goal
The final polish that turns the toy into a replayable game: synthesized **beeps** for jump / coin / win (Web
Audio, no files); a run **timer**; a **best time persisted in `localStorage`** across reloads; a **title
screen**; and a one-key **restart (R)** that reseeds the random flip schedule. After this, Shape Jumper is
complete.

## Scope discipline
This is the last milestone — it completes the plan's end state and adds nothing beyond it: no extra levels, no
enemies, no mobile controls, no leaderboard (all out of scope per the [plan](../PLAN.md)). Audio is
synthesized only (no asset files); persistence stores a single best-time number only.

## Prerequisite
[M6](../MILESTONE_6_gravity-twist/00_overview.md) green: coins, goal, win, and the telegraphed gravity flip.

## Steps at a glance
**Sitting 1 — sound (01)**
1. [Create `audio.js`: start on a gesture, beep on jump & coin](01_audio.md)

**Sitting 2 — timer, best time, restart (02–04)**
2. [Create `storage.js`: the timer, the win beep, and a persisted best time](02_timer-and-best.md)
3. [Title screen + the `R` restart (the full state machine)](03_title-and-restart.md)
4. [Verify Milestone 7 (and the whole game)](04_verify.md)

## Design / decisions folded in
- **Web Audio starts on a user gesture; degrade silently if blocked** — the Web-Audio autoplay rule (see [stack.md](../foundation/stack.md#version-notes)).
- **`localStorage` is strings-only and can throw — guard it** — [stack.md](../foundation/stack.md).
- **Full `title`/`playing`/`won` state machine + `R` restart** — decision [D6](../foundation/decision-log.md#d6--hud-restart-and-a-small-state-machine). New glossary terms: AudioContext, OscillatorNode, localStorage.

## Done-when gate
- [ ] Jumping, collecting a coin, and winning each play a distinct **beep**.
- [ ] A live **Time** ticks in the HUD; the **YOU WIN!** overlay shows this run's time and the **best** time.
- [ ] The best time **survives a full page reload** (persisted in `localStorage`); beating it updates it.
- [ ] The game opens on a **title screen**; a move key starts it.
- [ ] Pressing **R** restarts with a fresh, newly randomized gravity-flip schedule.

## Handoff
### Recap
Added synthesized sound, a completion timer, a persisted best time, a title screen, and an R restart — completing the game.
### Done so far (cumulative)
- Everything from M6 (the full platformer + the twist).
- `Game.startAudio()` + `Game.beep()` (`audio.js`); `Game.loadBest()` + `Game.saveBest()` (`storage.js`).
- `Game.state` has `bestTimeMs` and `lastTimeMs`; `mode` now includes `'title'`.
- `checkGoal` records the time and persists a new best; `input.js` starts audio, starts from the title, and handles `R`.
- `render.js` shows a Time HUD, a title overlay, and a richer win overlay (time + best + "press R").
### Artifacts now in the project (final)
```
shape-jumper/
  index.html   (loads config, state, input, audio, storage, physics, level, render, main)
  style.css
  js/
    config.js  (+ storageKey)
    state.js   (+ bestTimeMs, lastTimeMs; mode starts 'title')
    input.js   (+ startAudio, title-start, R restart)
    audio.js   (NEW)
    storage.js (NEW)
    physics.js (+ jump/coin/win beeps; checkGoal records time + best)
    level.js   (unchanged since M6)
    render.js  (+ Time HUD, title & richer win overlay)
    main.js    (loads best time; opens on the title screen)
```
### Decisions / open issues
- If `localStorage` is blocked (private mode), the best time simply won't persist — handled gracefully.
- The game is feature-complete per the plan. Natural next projects (out of scope): more levels, a scrolling camera, enemies.
### Next milestone
None — this is the last. Run the whole-game gate in [04_verify.md](04_verify.md), then mark the guide done in
[foundation/status.md](../foundation/status.md).
