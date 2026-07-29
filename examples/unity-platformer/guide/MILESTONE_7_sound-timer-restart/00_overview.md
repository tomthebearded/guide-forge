# Milestone 7 — Sound, timer, best time & restart
> Section: Polish · milestone 7 of 8 (M0–M7) · prev: [Gravity twist](../MILESTONE_6_gravity-twist/00_overview.md) · (final milestone)

## Goal
Close the loop. Add a **`Sfx`** helper that **synthesizes** beep tones in memory (no audio files) and wire beeps
to **jump / coin / win**; a completion **timer** on the HUD; a **best time** persisted with **`PlayerPrefs`**
that survives quitting Play; an **R** key to **restart**; and a **Menu** button on the win panel that returns to
the `MainMenu`. After this, the game is complete: Menu → play → win → best time → restart or menu.

## The JS-vs-Unity contrast for this milestone
The sibling synthesized beeps with the **Web Audio** oscillator and saved its best time in **`localStorage`**.
Here you build the same beeps by filling an **`AudioClip`** with a sine wave and playing it through an
**`AudioSource`**, and persist the best time with **`PlayerPrefs`** — the engine's key/value store. Different
APIs, identical ideas: synthesize sound from numbers; persist one small value across runs.

## Scope discipline
This is the **last** milestone. It deliberately does **not**: add levels, a pause menu, settings, or a build
pipeline (all noted as "later" in the [decision log](../foundation/decision-log.md)). It only polishes the
existing single level into a complete loop.

## Prerequisite
[M6 gate](../MILESTONE_6_gravity-twist/04_verify.md) green — the twist works.

## Steps at a glance
**Sitting 1 — sound (01–03)**
1. [Write `Sfx.cs` (synthesized beeps)](01_sfx-script.md)
2. [Create the Audio object](02_audio-object.md)
3. [Wire beeps to jump, coin, and win](03_wire-sounds.md)

**Sitting 2 — timer, persistence, restart (04–07)**
4. [Add the run timer to the HUD](04_timer-hud.md)
5. [Persist the best time with `PlayerPrefs`](05_best-time.md)
6. [Add restart (R) and the Menu button](06_restart-and-menu.md)
7. [Verify Milestone 7 (and the whole game)](07_verify.md)

## Design / decisions folded in
- **`PlayerPrefs` for the best time** — [decision D8](../foundation/decision-log.md#d8--playerprefs-for-the-best-time).
- **Synthesized audio, no files** — parallels the sibling's Web Audio; a complete helper with an optional
  deep-dive.
- **Reset `Time.timeScale = 1` before leaving to the menu** — [conventions](../foundation/conventions.md#language--framework-specifics).
- New [glossary](../foundation/glossary.md) terms: `AudioSource`/`AudioListener`, `PlayerPrefs`.

## Done-when gate
- [ ] **Jump**, **coin pickup**, and **win** each produce an audible **beep**.
- [ ] The HUD shows a running **timer**; the WIN panel shows this run's **time** and the **best time**.
- [ ] The best time **survives** stopping and re-entering Play.
- [ ] **R** restarts the `Game` scene; the **Menu** button returns to `MainMenu`.

## Handoff
### Recap
Added synthesized sound (`Sfx`), a HUD timer, `PlayerPrefs` best-time persistence, an R restart, and a
back-to-menu button — completing the game loop.
### Done so far (cumulative)
- (M0–M6) The full game: menu, player, level, coins/goal/win, the gravity twist.
- **`Sfx.cs`** producing jump/coin/win beeps via `AudioClip.Create`.
- `GameManager` now also runs the timer, saves/loads the best time, restarts on **R**, and returns to the menu.
### Artifacts now in the project (final)
```
ShapeJumper/
  Assets/
    Scenes/  MainMenu.unity, Game.unity
    Scripts/ MenuController.cs, PlayerController.cs, GameManager.cs, Sfx.cs
    Prefabs/ Coin.prefab
```
### Decisions / open issues
- The game is complete for this guide's scope. Natural next steps (out of scope): more levels/scenes, a pause
  menu, camera follow (Cinemachine), a mute toggle, and building a standalone player.
### This is the final milestone
There is no M8. See [07_verify](07_verify.md) for the whole-game gate and where to go next.

---
> Section: Polish · milestone 7 of 8 (M0–M7) · prev: [Gravity twist](../MILESTONE_6_gravity-twist/00_overview.md) · (final milestone)
