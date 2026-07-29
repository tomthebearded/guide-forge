# Milestone 1 · Step 05 of 08 — Add both scenes to Build Settings
> Nav: [← Game scene](04_game-scene.md) · [Overview](00_overview.md) · [MenuController script →](06_menucontroller-script.md)

## Glossary for this step
- **[Scene List (Build Profiles)](../foundation/glossary.md#build-settings--build-profiles)** — the list of scenes that ship with the game and their order; a scene must be
  here to be loaded by name at runtime, and **index 0** is the scene that opens first. In Unity 6 this list lives
  in the **Build Profiles** window (it was called "Build Settings" before Unity 6).

## Why / design
`SceneManager.LoadScene("Game")` (the code you'll write next) can only load a scene that's in the build's
**Scene List**. Order matters: the scene at **index 0** is what a built game launches into — so `MainMenu` must
be **index 0**.

## Do this
1. Open **File → Build Profiles** (Unity 6's replacement for the old "Build Settings"; shortcut
   **Ctrl+Shift+B**). In that window find the **Scene List** section — the ordered list of scenes in the build.
   *(If your build predates Unity 6 and shows **File → Build Settings** with a "Scenes In Build" list, it's the
   same thing.)*
2. Make sure the **`MainMenu`** scene is open (title bar), then click **Add Open Scenes**. `Scenes/MainMenu`
   appears in the Scene List with index **0**.
3. Open the **`Game`** scene (Project window → double-click `Assets/Scenes/Game`), return to **Build Profiles**,
   and click **Add Open Scenes** again. `Scenes/Game` appears with index **1**.
4. Confirm the order: **`MainMenu` = 0**, **`Game` = 1**. If they're reversed, **drag** `MainMenu` above `Game`
   in the list. *(**Load-bearing:** MainMenu must be index 0 — see [conventions](../foundation/conventions.md#naming).)*
5. Close the Build Profiles window. Reopen **`MainMenu`** (double-click it in Project) to keep working.

## Done when (this step)
- [ ] The **Build Profiles → Scene List** lists exactly two entries: **`Scenes/MainMenu` (0)** and
      **`Scenes/Game` (1)** — the exact observable, indices included.

## If it breaks
- **A scene shows a greyed-out / unchecked box** → click its checkbox so it's enabled; a disabled scene won't
  load.
- **No "Build Settings" in the File menu** → in Unity 6 it's **File → Build Profiles** (Ctrl+Shift+B); the
  scene list is the **Scene List** section inside it.
- **Only one scene listed** → you clicked **Add Open Scenes** with the same scene open twice. Open the missing
  scene first, then Add Open Scenes.
- **Indices are swapped** → drag `MainMenu` to the top; the number on the right updates to 0.

---
> Nav: [← Game scene](04_game-scene.md) · [Overview](00_overview.md) · [MenuController script →](06_menucontroller-script.md)
