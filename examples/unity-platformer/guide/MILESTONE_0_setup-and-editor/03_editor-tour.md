# Milestone 0 · Step 03 of 05 — Tour the five Editor windows and Play mode
> Nav: [← Create the 2D project](02_create-project.md) · [Overview](00_overview.md) · [First square →](04_first-square.md)

## Glossary for this step
- **[GameObject](../foundation/glossary.md#gameobject)** — the basic thing in a scene: a container with a position that gains behavior only from the
  Components attached to it.
- **[Component](../foundation/glossary.md#component)** — a reusable piece of behavior/data you attach to a GameObject.
- **[Play mode](../foundation/glossary.md#play-mode)** — pressing Play runs the game *inside* the Editor.
- **Transform** — the Component *every* GameObject has: its Position, Rotation, and Scale in the scene. It's the one you'll edit constantly (you set it hands-on in step 04).

## Why / design
Every later step says things like "in the **Hierarchy**, select the Player" or "in the **Inspector**, set Body
Type to Dynamic." If you can name these five panels and Play mode now, those instructions become trivial. This
is your map of the Editor.

> **New concept — the mental model that makes Unity click:** a **GameObject** is just an empty container with a
> position. It *does* nothing by itself. You give it behavior by **adding Components** — a sprite to show, a
> `Rigidbody2D` to make it fall, a script to control it. You will build this whole game by *adding components to
> GameObjects*, far more than by writing code. Hold onto this — it's the spine of the guide.
> Docs: https://docs.unity3d.com/6000.5/Documentation/Manual/GameObjects.html

## Do this
Find each panel in the default layout (if your layout differs, use **Window → Layouts → Default** to reset):
1. **Hierarchy** (left) — the list of every GameObject in the open scene. Right now it holds **Main Camera**.
   *(This is your scene's "table of contents.")*
2. **Scene** view (center) — the editable view where you arrange objects. You'll drag things here.
3. **Game** view (a tab next to Scene) — what the **player** actually sees through the camera. Click the
   **Game** tab to see it; click **Scene** to go back.
4. **Inspector** (right) — shows the selected GameObject's components and their fields. Click **Main Camera** in
   the Hierarchy and watch the Inspector fill with its Transform, Camera, etc.
5. **Project** (bottom) — the files under `Assets/`. It currently shows a **Scenes** folder holding
   **SampleScene**. *(Next to it is the **Console** tab — where errors and `Debug.Log` messages appear. Click
   it once so you know where it is.)*
6. Press the **Play** button (the ▶ triangle at the top-center). The toolbar tints and the **Game** view takes
   over — you're now *running*. Press **Play** again (the same ▶, now highlighted) to **stop**. *(Why it
   matters: changes you make **during** Play are discarded when you stop — a Unity trap we'll design around
   later with `Time.timeScale`.)*

## Done when (this step)
- [ ] You can point to the Hierarchy, Scene, Game, Inspector, and Project/Console panels by name.
- [ ] Selecting **Main Camera** in the Hierarchy fills the **Inspector** with its components.
- [ ] Pressing **Play** switches to the Game view and tints the toolbar; pressing it again stops and restores
      the toolbar — the exact observable that you entered and left Play mode.

## If it breaks
- **Panels are missing or rearranged** → **Window → Layouts → Default** resets to the standard layout the guide
  assumes.
- **No Console tab visible** → **Window → General → Console** (or `Ctrl+Shift+C`) opens it.

---
> Nav: [← Create the 2D project](02_create-project.md) · [Overview](00_overview.md) · [First square →](04_first-square.md)
