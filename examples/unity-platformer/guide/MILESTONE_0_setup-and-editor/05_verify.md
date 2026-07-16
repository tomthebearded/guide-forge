# Milestone 0 · Step 05 of 05 — Verify Milestone 0
> Nav: [← First square](04_first-square.md) · [Overview](00_overview.md) · [M1 — The Main Menu →](../MILESTONE_1_main-menu/00_overview.md)

## Milestone Done-when gate
Confirm all three, each with its exact observable:
- [ ] **Project opens clean** — Unity Hub → Projects → `ShapeJumper` opens in Unity **6000.5.x** (check the
      title bar) with **no red errors** in the Console.
- [ ] **You can name the windows** — you can point to Hierarchy, Scene, Game, Inspector, and Project/Console.
- [ ] **The sprite pipeline works** — a **Square** GameObject is visible in **both** the Scene and Game views.

## The JS-vs-Unity contrast (milestone recap)
The sibling `web-platformer/` needed **zero install** — a text editor and a browser. You paid a real setup cost
here (a multi-GB Editor, an account, a license) to get an **engine**. Starting in M2, that engine gives you
gravity and collision with *no code* — the payoff the sibling had to write by hand. This milestone was the
price; the next two are the reward.

## Files after this milestone
No source files yet — you wrote no code. The project on disk is:
```
ShapeJumper/
  Assets/
    Scenes/
      SampleScene.unity      ← default scene; holds Main Camera + the throwaway Square
  (Library/ Packages/ ProjectSettings/  ← Unity-generated, not authored)
```
Nothing here is load-bearing yet — the Square is a pipeline test we delete in M2.

## Troubleshooting
- **Editor won't open / license error** → Hub → Preferences → Licenses → add a free **Personal** license.
- **Wrong Unity version in the title bar** → Hub → Projects → click the version dropdown on the `ShapeJumper`
  row and point it at your `6000.5.x` install.
- **3D-looking scene / no `2D Object` menu** → the project was made from a 3D template; recreate it 2D (M0/02).

## Next
[M1 — The Main Menu](../MILESTONE_1_main-menu/00_overview.md): build the title screen (Play + Quit) and write
your first tiny script to load a second scene.

---
> Nav: [← First square](04_first-square.md) · [Overview](00_overview.md) · [M1 — The Main Menu →](../MILESTONE_1_main-menu/00_overview.md)
