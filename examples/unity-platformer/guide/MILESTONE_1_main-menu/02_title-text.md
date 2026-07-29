# Milestone 1 · Step 02 of 08 — Add the title text (Canvas + TextMeshPro)
> Nav: [← MainMenu scene](01_mainmenu-scene.md) · [Overview](00_overview.md) · [Buttons →](03_buttons.md)

## Glossary for this step
- **[Canvas](../foundation/glossary.md#canvas)** — the root of all uGUI: every UI element must be a child of a Canvas, which decides how the UI is
  drawn on screen.
- **[EventSystem](../foundation/glossary.md#eventsystem)** — the object that routes clicks/keys to UI so buttons can fire; Unity adds it automatically
  with your first UI element.
- **[uGUI](../foundation/glossary.md#ugui)** — Unity's classic GameObject-based UI (Canvas + Button + Text).
- **Rect Transform** — the UI version of a Transform that every Canvas element has. Instead of a plain position
  it uses **anchors** (which edge/corner of the parent it sticks to) plus **Pos X/Y** offsets from that anchor.
  It's why UI elements are placed with "anchor + Pos", not raw world coordinates.

## Why / design
A UI title is a **Text** element living under a **Canvas**. Adding the first UI element makes Unity create the
Canvas and the EventSystem for you. We use **TextMeshPro** (TMP) text — Unity's crisp text system and the
default for UI text in 6.5.

> **New concept — the first TMP element triggers a one-time import.** The first time you add any TextMeshPro
> object, a dialog offers **"Import TMP Essentials"**. **Click Import.** Without it, TMP text won't render.
> This happens once per project. See [stack.md version notes](../foundation/stack.md#version-notes).

## Do this
1. In the **Hierarchy**, right-click empty space → **UI → Text - TextMeshPro**. *(Why: this adds the Text and,
   automatically, a **Canvas** parent and an **EventSystem** — check the Hierarchy: you now have `Canvas` →
   `Text (TMP)` and a separate `EventSystem`.)*
2. If the **TMP Importer** dialog appears, click **Import TMP Essentials**, then close the dialog. *(Mandatory —
   see the callout above.)*
3. In the Hierarchy, select the new **Text (TMP)**. In the **Inspector**, find the **Text Input** box (under the
   *TextMeshPro - Text (UI)* component) and replace the placeholder with **`SHAPE JUMPER`**. *(The exact text is
   **cosmetic** — call it whatever you like.)*
4. Still in the Inspector, set **Font Size** to about **48** and, under **Alignment**, click the **center**
   horizontal and **middle** vertical buttons so the title is centered in its box. *(Cosmetic.)*
5. Position the title near the top: with **Text (TMP)** selected, in the Inspector's **Rect Transform** set
   **Pos Y** to about **150**. *(Cosmetic — just get it above where the buttons will go.)*
6. Click the **Game** tab to see the title rendered. *(If you only see the Scene view, UI is easiest to judge in
   Game view.)*

## Done when (this step)
- [ ] The **Hierarchy** shows `Canvas → Text (TMP)` plus a separate `EventSystem`.
- [ ] The **Game** view shows the title **SHAPE JUMPER** near the top-center — the exact observable that the
      Canvas + TMP text render.

## If it breaks
- **Text is invisible / shows boxes or nothing** → you skipped **Import TMP Essentials**. Re-add a TMP element
  or use **Window → TextMeshPro → Import TMP Essential Resources**.
- **The title is huge or tiny relative to the screen** → that's the Canvas **Scale** vs the Game view; ignore
  exact size for now, or set the Canvas Scaler later. It won't affect the gate. *(The **Canvas Scaler** is the
  Component that decides how UI scales across screen sizes — leave it at its default for now.)*
- **No `UI` entry in the right-click menu** → right-click inside the **Hierarchy** (not the Scene view); the UI
  submenu lives there.

---
> Nav: [← MainMenu scene](01_mainmenu-scene.md) · [Overview](00_overview.md) · [Buttons →](03_buttons.md)
