# Milestone 1 — The Main Menu (no gameplay code)
> Section: Front end · milestone 1 of 8 (M0–M7) · next: [The world & free physics](../MILESTONE_2_world-and-free-physics/00_overview.md)

## Goal
Build the **`MainMenu`** scene — a title plus **Play** and **Quit** buttons — and one tiny script,
`MenuController`, that loads a (still-empty) **`Game`** scene when Play is clicked. Along the way you meet
**Scenes**, the **uGUI** Canvas/Button system, **Build Settings**, and how a UI Button calls a method.

## The JS-vs-Unity contrast for this milestone
The sibling had no separate "menu scene" — it drew a title *state* onto the same canvas and switched a variable.
Unity's idiom is different and arguably cleaner: a menu is its **own scene**, and moving to the game is a
**scene load** (`SceneManager.LoadScene`), not a state flag. You build the whole menu by placing **components**
(Canvas, Buttons, Text) in the Editor — the only code is a five-line script to wire the buttons.

## Scope discipline
This milestone deliberately does **not**: add any gameplay, physics, or a player (that starts in
[M2](../MILESTONE_2_world-and-free-physics/00_overview.md)); the `Game` scene here is an **empty colored
scene** that exists only to prove the Play button loads it. No score, no settings, no pause menu.

## Prerequisite
[M0 gate](../MILESTONE_0_setup-and-editor/05_verify.md) green — Unity 6.5 open on the `ShapeJumper` project.

## Steps at a glance
**Sitting 1 — the menu scene (01–03)**
1. [Create and save the `MainMenu` scene](01_mainmenu-scene.md)
2. [Add the title text (Canvas + TextMeshPro)](02_title-text.md)
3. [Add the Play and Quit buttons](03_buttons.md)

**Sitting 2 — the second scene + wiring (04–08)**
4. [Create the empty `Game` scene](04_game-scene.md)
5. [Add both scenes to Build Settings](05_build-settings.md)
6. [Write `MenuController.cs`](06_menucontroller-script.md)
7. [Attach the script and wire the buttons](07_wire-buttons.md)
8. [Verify Milestone 1](08_verify.md)

## Design / decisions folded in
- **Menu-first, two scenes** — [decision D3](../foundation/decision-log.md#d3--menu-first-two-scenes). Scene
  names `MainMenu` (build index 0) and `Game` (index 1) are **load-bearing** ([conventions](../foundation/conventions.md#naming)).
- **uGUI, not UI Toolkit** — [decision D7](../foundation/decision-log.md#d7--ugui-not-ui-toolkit).
- New [glossary](../foundation/glossary.md) terms: Scene, Canvas, EventSystem, Button, Build Settings,
  `SceneManager.LoadScene`, uGUI.

## Done-when gate
- [ ] Press **Play** (with `MainMenu` open) → a title, a **Play** button, and a **Quit** button appear.
- [ ] Clicking **Play** loads the `Game` scene (a blank colored scene — the Game view changes color).
- [ ] Clicking **Quit** prints `Quit` in the Console.
- [ ] **Build Settings** lists `MainMenu` at index **0** and `Game` at index **1**.

## Handoff
### Recap
Built the menu scene with title + buttons, created an empty Game scene, registered both in Build Settings, and
wrote/wired `MenuController` so Play loads the game and Quit logs.
### Done so far (cumulative)
- (M0) Unity 6.5 + the `ShapeJumper` 2D project.
- A `MainMenu` scene: Canvas with a title and Play/Quit buttons + an EventSystem.
- An empty `Game` scene.
- Both scenes in Build Settings (`MainMenu`=0, `Game`=1).
- `MenuController.cs` — the first script — wired to the buttons.
### Artifacts now in the project
```
ShapeJumper/
  Assets/
    Scenes/
      MainMenu.unity      ← build index 0 — title + Play + Quit
      Game.unity          ← build index 1 — empty colored scene (fills up in M2)
    Scripts/
      MenuController.cs    ← Play → LoadScene("Game"); Quit → Application.Quit()
```
*(You can delete the old `SampleScene.unity` — we replaced it with `MainMenu` and `Game`.)*
### Decisions / open issues
- `Game` is intentionally empty; M2 builds the player and ground into it.
- `Application.Quit()` does nothing inside the Editor (that's expected) — the `Debug.Log("Quit")` is how you
  confirm the button fired.
### Next milestone
[M2 — The world & free physics](../MILESTONE_2_world-and-free-physics/00_overview.md): fill the `Game` scene
with shapes and watch the engine make the player fall and land — with **zero code**.

---
> Section: Front end · milestone 1 of 8 (M0–M7) · next: [The world & free physics](../MILESTONE_2_world-and-free-physics/00_overview.md)
