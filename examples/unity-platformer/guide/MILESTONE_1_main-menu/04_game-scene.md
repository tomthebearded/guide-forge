# Milestone 1 · Step 04 of 08 — Create the empty `Game` scene
> Nav: [← Buttons](03_buttons.md) · [Overview](00_overview.md) · [Build Settings →](05_build-settings.md)

## Why / design
The Play button needs somewhere to go. We create the **`Game`** scene now as an empty, distinctly-colored scene
— empty is enough to *prove* the scene load works. We tint its camera a different color so that when Play loads
it, the change is unmistakable in the Game view.

## Do this
1. Top menu: **File → New Scene**. In the dialog pick **Basic (Built-in)** and click **Create**. *(A fresh scene
   with a Main Camera. Don't worry that this replaces what's on screen — `MainMenu` is saved.)*
2. **File → Save As…**, go into **`Assets/Scenes`**, name it exactly **`Game`**, click **Save**. *(**Load-bearing:**
   the code loads `"Game"` by this exact string — see [conventions](../foundation/conventions.md#naming).)*
3. Make it visibly different from the menu: in the **Hierarchy** select **Main Camera**; in the **Inspector**
   find the **Camera** component's **Background** color swatch and pick an obvious color (e.g. a dark green).
   *(Cosmetic — any color that clearly differs from the menu's background works. This is purely so the scene
   swap is visible; M2 replaces this scene's contents.)*
4. **File → Save** (`Ctrl+S`) to save the `Game` scene.
5. Reopen the menu to keep working on it: in the **Project** window, double-click **`Assets/Scenes/MainMenu`**.
   *(The title bar returns to "…- MainMenu -…".)*

## Done when (this step)
- [ ] `Assets/Scenes/Game.unity` exists in the **Project** window.
- [ ] Opening `Game` shows the camera's new background color in the **Game** view — the exact observable that
      the scene exists and is distinguishable from the menu.
- [ ] You're back on the **MainMenu** scene (title bar confirms).

## If it breaks
- **You lost your menu work** → you didn't save `MainMenu` before **New Scene**. Reopen `MainMenu`; if the
  buttons are gone, redo steps 02–03 (and save as you go with `Ctrl+S`).
- **Two scenes look identical** → set the `Game` camera's **Background** to a clearly different color so the load
  is obvious later.

---
> Nav: [← Buttons](03_buttons.md) · [Overview](00_overview.md) · [Build Settings →](05_build-settings.md)
