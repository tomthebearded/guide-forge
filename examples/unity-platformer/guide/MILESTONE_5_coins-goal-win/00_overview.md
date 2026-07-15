# Milestone 5 — Coins, goal & win
> Section: The game · milestone 5 of 8 (M0–M7) · next: [The gravity twist](../MILESTONE_6_gravity-twist/00_overview.md)

## Goal
Make it a game you can **win**. Add **circle coins** you collect for score (a reusable **prefab** with a
**trigger** collider and a **`Coin`** tag), a **goal** that ends the run (a trigger with a **`Goal`** tag),
your second script **`GameManager`** (score + win + freeze), and an on-screen **HUD**. The player detects both
pickups by **tag** in one trigger handler — no per-object scripts.

## The JS-vs-Unity contrast for this milestone
The sibling checked coin/goal overlap with the same AABB math it wrote for platforms, and drew the HUD with
`fillText`. Here, **triggers** fire `OnTriggerEnter2D` for you (no overlap math), **tags** tell you what you
touched, and the HUD is **uGUI Text** placed in the Editor. You react to engine events instead of polling boxes.

## Scope discipline
This milestone deliberately does **not**: add the gravity twist ([M6](../MILESTONE_6_gravity-twist/00_overview.md))
or sound/timer/best-time/restart ([M7](../MILESTONE_7_sound-timer-restart/00_overview.md)). The win panel here
is a simple "YOU WIN" — the completion time, best time, and buttons come in M7. `GameManager` starts small and
grows in M6 and M7.

## Prerequisite
[M4 gate](../MILESTONE_4_platforms-and-level/05_verify.md) green — a playable level you enjoyed.

## Steps at a glance
**Sitting 1 — collectibles (01–03)**
1. [Create the Coin prefab (trigger + `Coin` tag)](01_coin-prefab.md)
2. [Place coins in the level](02_place-coins.md)
3. [Create the Goal (trigger + `Goal` tag)](03_goal.md)

**Sitting 2 — logic + HUD (04–08)**
4. [Handle pickups in `PlayerController` (by tag)](04_player-triggers.md)
5. [Write `GameManager.cs` (score + win)](05_gamemanager-script.md)
6. [Build the HUD and the win panel](06_hud-and-winpanel.md)
7. [Create the GameManager object and wire it](07_wire-gamemanager.md)
8. [Verify Milestone 5](08_verify.md)

## Design / decisions folded in
- **Four small scripts, tag-based pickups** — [decision D4](../foundation/decision-log.md#d4--four-small-scripts-tag-based-pickups); coins/goal handled in `PlayerController.OnTriggerEnter2D`.
- **Win freezes play with `Time.timeScale = 0`, reset to 1 in `Start()`** — [conventions](../foundation/conventions.md#language--framework-specifics).
- New [glossary](../foundation/glossary.md) terms: Trigger (Is Trigger), Tag, Prefab, `Time.timeScale`.

## Done-when gate
- [ ] Touching a **coin** removes it and increments an on-screen **score**.
- [ ] Touching the **goal** shows a **YOU WIN** panel and **freezes** all motion.
- [ ] Coins use `Is Trigger` colliders + the `Coin` tag; the goal uses the `Goal` tag.

## Handoff
### Recap
Built a Coin prefab and scattered instances, added a goal, handled both by tag in the player, wrote
`GameManager` for score + win, and built a HUD + win panel.
### Done so far (cumulative)
- (M0–M4) Project, menu, controllable player, a playable level.
- A **Coin** prefab (Circle, trigger `CircleCollider2D`, tag `Coin`) with several instances in the level.
- A **Goal** object (trigger, tag `Goal`).
- `PlayerController` now has `OnTriggerEnter2D` handling coins and the goal by tag.
- **`GameManager.cs`** — score + win (freeze via `Time.timeScale`), a `GameManager` object wired to a **HUD**
  (score text) and a hidden **Win panel**.
### Artifacts now in the project
```
ShapeJumper/
  Assets/
    Scenes/  MainMenu.unity, Game.unity
    Scripts/ MenuController.cs, PlayerController.cs, GameManager.cs
    Prefabs/ Coin.prefab
```
### Decisions / open issues
- The win panel is minimal; M7 adds the timer, best time, and buttons.
- `GameManager` is a simple `Instance` singleton the player calls — fine for one manager.
### Next milestone
[M6 — The gravity twist](../MILESTONE_6_gravity-twist/00_overview.md): make `Physics2D.gravity` randomly flip,
telegraphed — and watch the sign-aware player code from M3 handle upside-down play with no changes.
