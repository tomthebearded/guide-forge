# Milestone 1 · Step 01 of 08 — Create and save the `MainMenu` scene
> Nav: — · [Overview](00_overview.md) · [Title text →](02_title-text.md)

## Glossary for this step
- **Scene** — one screen or level of the game, saved as a `.unity` file. This game has two: `MainMenu` and
  `Game`. See [glossary: Scene](../foundation/glossary.md).

## Why / design
Each screen of the game is its own scene file. We'll make `MainMenu` first. Creating it as a fresh scene (rather
than reusing `SampleScene`) keeps names clean and matches the load-bearing scene name the code will reference.

## Do this
1. Top menu: **File → New Scene**. In the dialog pick **Basic (Built-in)** (an empty scene with a camera) and
   click **Create**. *(Why: a clean scene with just a Main Camera.)*
2. **File → Save As…**. Navigate into the **`Assets/Scenes`** folder. *(If there's no `Scenes` folder, create
   one: in the **Project** window right-click `Assets` → **Create → Folder** → name it `Scenes`.)*
3. Name the file exactly **`MainMenu`** and click **Save**. *(**Load-bearing:** the code loads this scene by the
   string `"MainMenu"`, so the filename must match exactly — see [conventions](../foundation/conventions.md#naming).)*
4. Confirm the **title bar** now reads **"ShapeJumper - MainMenu - …"** and the **Project** window shows
   `Assets/Scenes/MainMenu.unity`.

## Done when (this step)
- [ ] `Assets/Scenes/MainMenu.unity` exists in the **Project** window.
- [ ] The Editor **title bar** shows the scene name **MainMenu** — the exact observable that this scene is open
      and saved.

## If it breaks
- **Can't find where to save** → the **Save As** dialog opens to your project; drill into `Assets/Scenes`. Files
  saved outside `Assets/` are invisible to Unity.
- **Title bar still says SampleScene** → you didn't save; redo **File → Save As** and name it `MainMenu`.

---
> Nav: — · [Overview](00_overview.md) · [Title text →](02_title-text.md)
