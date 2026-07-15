# Milestone 4 — Platforms & a real level ⭐ reality-check gate
> Section: The game · milestone 4 of 8 (M0–M7) · next: [Coins, goal & win](../MILESTONE_5_coins-goal-win/00_overview.md)

## Goal
Turn the single ground bar into a **real level**: duplicate it into several **platforms**, arrange them into a
jumpable layout, make sure they're all on the **Ground** layer (so the jump works everywhere), and then —
**the reality-check** — actually **play it for a minute** and decide it's fun enough to finish. Still no code;
this is level design with the tools you already have.

## The JS-vs-Unity contrast for this milestone
The sibling defined platforms as **data in an array** and drew/collided them in code. In Unity a platform is
just **another GameObject** — you *duplicate* the ground, move it, and the same `BoxCollider2D` makes it solid.
Level design is done by hand in the Scene view, not by editing a data structure.

## Scope discipline
This milestone deliberately does **not**: add coins, a goal, a score, or a win ([M5](../MILESTONE_5_coins-goal-win/00_overview.md)),
the twist ([M6](../MILESTONE_6_gravity-twist/00_overview.md)), or any sound/timer ([M7](../MILESTONE_7_sound-timer-restart/00_overview.md)).
No new scripts. Just platforms and a playtest.

## Prerequisite
[M3 gate](../MILESTONE_3_move-and-jump/06_verify.md) green — the player runs and jumps.

## Steps at a glance
**Sitting 1 — build the level (01–03)**
1. [Rename the ground and duplicate it into platforms](01_platform-from-ground.md)
2. [Arrange a jumpable level](02_build-level.md)
3. [Confirm every platform is on the Ground layer](03_check-layers.md)

**Sitting 2 — playtest (04–05)**
4. [⭐ Reality-check: play it for a minute](04_reality-check.md)
5. [Verify Milestone 4](05_verify.md)

## Design / decisions folded in
- **Single fixed camera, no scrolling** — [decision D10](../foundation/decision-log.md#d10--single-fixed-camera-no-scrolling); the whole level fits one screen.
- **Platforms are duplicated GameObjects, not data** — [conventions](../foundation/conventions.md#data-vs-code).
- The **reality-check gate** — the first point the thing is a real, playable platformer worth finishing.

## Done-when gate
- [ ] The player can **land on every platform** and can't pass through their tops or sides.
- [ ] The level is **traversable** — you can reach the far/highest platform by running and jumping.
- [ ] **You played it for a minute** and decided it's fun enough to finish.

## Handoff
### Recap
Renamed the ground, duplicated it into a set of platforms, arranged a one-screen level, confirmed the Ground
layer on all of them, and playtested to confirm it's fun.
### Done so far (cumulative)
- (M0–M3) Project, menu, a controllable player that runs and jumps.
- A `Game` scene with a **Ground** floor plus several **Platform** objects, all on the **Ground** layer, laid
  out as a jumpable one-screen level.
### Artifacts now in the project
```
ShapeJumper/
  Assets/
    Scenes/  MainMenu.unity, Game.unity   (Game now has Ground + several Platforms)
    Scripts/ MenuController.cs, PlayerController.cs
```
### Decisions / open issues
- No goal yet — you can roam but not "win." M5 adds coins and a goal.
- Keep the highest platform reachable in one jump from a lower one; if it's not, lower it or raise `Jump Speed`.
### Next milestone
[M5 — Coins, goal & win](../MILESTONE_5_coins-goal-win/00_overview.md): add collectible coins, a goal, an
on-screen score, and a win state.
