# Milestone 6 — The random twist: gravity flips
> Section: The twist · milestone 6 of 8 (M0–M7) · next: [Sound, timer & restart](../MILESTONE_7_sound-timer-restart/00_overview.md)

## Goal
Add the signature mechanic: at a **random, telegraphed** interval, **`Physics2D.gravity` flips** — the player
falls to the *ceiling*, jumps off it, and platforms become things you stand under. A ~1-second **telegraph**
warns first (so it's fair), a background **tint** shows the flipped state, and a **`twistEnabled`** toggle turns
it off. The payoff of M3's sign-aware code: **`PlayerController` needs no changes** — flipping the engine's
gravity is enough.

## The JS-vs-Unity contrast for this milestone
In the sibling, the twist flipped a **hand-written** `gravitySign` variable that its own integrator read. Here
you flip the **engine's own** global gravity vector (`Physics2D.gravity = -Physics2D.gravity`) and the physics
engine re-falls everything for you. Both guides made the twist cheap the same way — by writing "which way is
down" as a **sign** from the start — but Unity's version literally hands the flip to the engine.

## Scope discipline
This milestone deliberately does **not**: add sound, a timer, best-time, or restart
([M7](../MILESTONE_7_sound-timer-restart/00_overview.md)), or touch `PlayerController` (it's already
twist-ready). Only `GameManager` grows, plus one telegraph UI panel.

## Prerequisite
[M5 gate](../MILESTONE_5_coins-goal-win/08_verify.md) green — coins, goal, win all work.

## Steps at a glance
**Sitting 1 — the twist (01–04)**
1. [Add the twist logic to `GameManager`](01_twist-logic.md)
2. [Build the telegraph warning panel](02_telegraph-ui.md)
3. [Wire the references and test the flip](03_wire-and-test.md)
4. [Verify Milestone 6](04_verify.md)

## Design / decisions folded in
- **Twist = flip `Physics2D.gravity`; sign-aware jump** — [decision D5](../foundation/decision-log.md#d5--twist--flip-physics2dgravity-sign-aware-jump).
- **Telegraphed + toggleable** — [decision D9](../foundation/decision-log.md#d9--telegraphed-toggleable-twist).
- New [glossary](../foundation/glossary.md) term: Telegraph.

## Done-when gate
- [ ] At a random interval a ~1 s **telegraph** appears, then gravity **flips**.
- [ ] After a flip the player **falls to the ceiling** and can **jump off it**; platforming works upside-down.
- [ ] Gravity flips **back** later; the cycle repeats with fresh random timing.
- [ ] Setting **`twistEnabled = false`** in the Inspector disables the twist entirely.

## Handoff
### Recap
Extended `GameManager` with a randomized, telegraphed gravity flip that inverts `Physics2D.gravity`, added a
telegraph panel and a background tint, and confirmed the sign-aware player handles upside-down play unchanged.
### Done so far (cumulative)
- (M0–M5) Project, menu, player, level, coins/goal/win/HUD.
- `GameManager` now schedules and performs gravity flips (telegraph + tint + `twistEnabled`).
- A **TelegraphPanel** UI element, wired into `GameManager`.
### Artifacts now in the project
```
ShapeJumper/
  Assets/
    Scenes/  MainMenu.unity, Game.unity
    Scripts/ MenuController.cs, PlayerController.cs, GameManager.cs
    Prefabs/ Coin.prefab
```
### Decisions / open issues
- `PlayerController` untouched this milestone — the sign-aware design from M3 paid off exactly as planned.
- No sound on the flip yet; M7 could add one (optional).
### Next milestone
[M7 — Sound, timer & restart](../MILESTONE_7_sound-timer-restart/00_overview.md): synthesized beeps, a completion
timer, a persisted best time, an **R** restart, and a **Menu** button — closing the loop.

---
> Section: The twist · milestone 6 of 8 (M0–M7) · next: [Sound, timer & restart](../MILESTONE_7_sound-timer-restart/00_overview.md)
