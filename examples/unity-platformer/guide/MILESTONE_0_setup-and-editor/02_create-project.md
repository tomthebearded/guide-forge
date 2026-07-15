# Milestone 0 · Step 02 of 05 — Create the 2D project
> Nav: [← Install Unity](01_install-unity.md) · [Overview](00_overview.md) · [Editor tour →](03_editor-tour.md)

## Glossary for this step
- **Project** — a folder Unity manages that holds your game's assets (scenes, scripts, sprites) plus a lot of
  generated bookkeeping. See [glossary: Project window](../foundation/glossary.md).
- **Template** — a starting configuration for a new project. The **2D** template sets up an orthographic camera
  and 2D-friendly defaults so you don't have to.

## Why / design
A "2D (Built-In Render Pipeline)" project pre-configures the camera as **orthographic** (a flat, no-perspective
view — exactly what a 2D platformer wants) and defaults new sprites and physics to 2D. Starting from the 2D
template saves a dozen manual settings.

## Do this
1. In **Unity Hub**, click **Projects** (left sidebar), then **New project** (top-right).
2. At the top, make sure the **Editor Version** selector shows your **`6000.5.x`** install. *(Why: this is what
   ties the project to Unity 6.5.)*
3. In the template list, select **2D (Built-In Render Pipeline)**. *(Why: the flat orthographic setup a
   platformer needs — see design above. Leave the render pipeline at Built-In; URP/HDRP are overkill here.)*
   *(**URP** = Universal Render Pipeline, **HDRP** = High Definition Render Pipeline — Unity's heavier,
   configurable renderers for richer 3D visuals; a flat 2D platformer doesn't need either.)*
4. On the right, set **Project name** to exactly **`ShapeJumper`** and choose a **Location** you'll remember
   (e.g. `Documents`). *(The name is **cosmetic** — any name works — but the guide refers to `ShapeJumper`.)*
5. Click **Create project**. The Editor opens after a short import (the first open is the slowest — Unity is
   generating the `Library/` cache).

## Done when (this step)
- [ ] The Unity Editor is open showing an empty scene called **SampleScene**.
- [ ] The **title bar** reads something like **"ShapeJumper - SampleScene - Windows, Mac, Linux - Unity
      6000.5.x"** — confirming the project name and the 6.5 version.
- [ ] The **Console** (bottom, we'll find it next) shows **no red errors**.

## If it breaks
- **The Editor opens but everything is 3D / has perspective** → you picked a 3D template. Close the project and
  recreate it with the **2D** template; it's far easier than converting.
- **"Failed to resolve packages" or a long hang** → let it finish once (it's downloading built-in packages). A
  second open is fast. If it errors, reopen from Hub → Projects → `ShapeJumper`.
