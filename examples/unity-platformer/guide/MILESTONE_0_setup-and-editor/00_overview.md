# Milestone 0 — Install Unity & meet the Editor
> Section: Setup · milestone 0 of 8 (M0–M7) · next: [The Main Menu](../MILESTONE_1_main-menu/00_overview.md)

## Goal
Get **Unity 6.5** and a **2D project** installed and open, and learn to name the five core Editor windows
(Hierarchy, Scene, Game, Inspector, Project) plus **Play mode** — so every later "where do I click" instruction
lands. You'll finish by dragging a **Square sprite** into the scene to prove the whole pipeline works. **No code
and no gameplay yet** — this milestone is about the tools.

## The JS-vs-Unity contrast for this milestone
In the sibling [`web-platformer/`](../../../web-platformer/guide/README.md) your "install" was *nothing* — you
opened a text editor and a browser. Unity trades that zero-setup start for an **engine**: you install a large
application, and in return you'll get gravity, collision, and the game loop **for free** in the milestones
ahead. This milestone is the cost side of that trade; M2 is where it starts paying off.

## Scope discipline
This milestone deliberately does **not**: write any C# (the first script arrives with the menu in
[M1](../MILESTONE_1_main-menu/00_overview.md); the first *gameplay* script is
[M3](../MILESTONE_3_move-and-jump/00_overview.md)), build the menu
([M1](../MILESTONE_1_main-menu/00_overview.md)), or add any physics
([M2](../MILESTONE_2_world-and-free-physics/00_overview.md)). The Square you drag in here is just a
**pipeline test** — you'll delete it and build the real player later.

## Prerequisite
A Windows PC with a few GB free. Nothing else installed yet — this milestone installs it.

## Steps at a glance
**Sitting 1 — install (01–02)**
1. [Install Unity Hub and the Unity 6.5 Editor](01_install-unity.md)
2. [Create the 2D project](02_create-project.md)

**Sitting 2 — orient (03–05)**
3. [Tour the five Editor windows and Play mode](03_editor-tour.md)
4. [Drag in a Square sprite (prove the pipeline)](04_first-square.md)
5. [Verify Milestone 0](05_verify.md)

## Design / decisions folded in
- **Unity 6.5, non-LTS** — see [decision D1](../foundation/decision-log.md#d1--pin-unity-65-tech-stream-not-63-lts) and [stack.md](../foundation/stack.md). New terms land in the [glossary](../foundation/glossary.md): GameObject, Component, sprite, and the five windows + Play mode.

## Done-when gate
- [ ] Unity Hub opens the new **2D** project named `ShapeJumper` with no console errors.
- [ ] You can point to the **Hierarchy, Scene, Game, Inspector,** and **Project** windows by name.
- [ ] A **Square** sprite dragged into the scene appears in **both** the Scene and Game views.

## Handoff
### Recap
Installed Unity 6.5, created a 2D project, learned the Editor layout, and proved the sprite pipeline by adding a
Square.
### Done so far (cumulative)
- Unity Hub + Unity 6.5 Editor installed.
- A 2D project named `ShapeJumper` that opens cleanly.
- Confidence naming the five windows and using Play mode.
### Artifacts now in the project
```
ShapeJumper/
  Assets/
    Scenes/
      SampleScene.unity      ← the default scene (we'll replace it in M1/M2)
  (Library/ Packages/ ProjectSettings/  ← Unity-generated)
```
### Decisions / open issues
- The Square is a throwaway pipeline test — it gets deleted in M2 when we build the real player.
### Next milestone
[M1 — The Main Menu](../MILESTONE_1_main-menu/00_overview.md): build a title screen with Play + Quit buttons and
your first (tiny) script. Done-when: pressing Play shows the menu, and **Play** loads a second scene.

---
> Section: Setup · milestone 0 of 8 (M0–M7) · next: [The Main Menu](../MILESTONE_1_main-menu/00_overview.md)
