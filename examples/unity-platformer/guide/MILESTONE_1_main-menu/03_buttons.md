# Milestone 1 · Step 03 of 08 — Add the Play and Quit buttons
> Nav: [← Title text](02_title-text.md) · [Overview](00_overview.md) · [Game scene →](04_game-scene.md)

## Glossary for this step
- **[Button](../foundation/glossary.md#ugui)** — a uGUI component that shows a clickable rectangle and exposes an **OnClick** event you point at a
  method.

## Why / design
Two buttons — **Play** and **Quit**. We just place and label them now; the *behavior* (what they call) gets
wired in step 07 after the script exists. Building the visuals first, then wiring, keeps each step atomic.

## Do this
1. In the **Hierarchy**, right-click the **Canvas** → **UI → Button - TextMeshPro**. A `Button` appears under
   the Canvas with a child `Text (TMP)` label. *(Right-clicking the Canvas nests the button inside it.)*
2. Rename the button: slow-double-click it in the Hierarchy (or press **F2**) and type **`PlayButton`**. *(The
   GameObject name is **cosmetic**, but a clear name makes wiring easier.)*
3. Select **PlayButton**, and in the **Inspector → Rect Transform** set **Pos Y** to about **20** so it sits
   just below the title. *(Cosmetic placement.)*
4. Expand **PlayButton** in the Hierarchy, select its child **Text (TMP)**, and set its **Text Input** to
   **`Play`**. *(This is the button's label.)*
5. Repeat for the second button: right-click **Canvas → UI → Button - TextMeshPro**, rename it **`QuitButton`**,
   set its **Pos Y** to about **-60** (below Play), and set its child **Text (TMP)** to **`Quit`**.
6. Click the **Game** tab: you should see the title with **Play** above **Quit**, both centered. *(They don't do
   anything yet — that's step 07.)*

## Done when (this step)
- [ ] The Hierarchy shows `Canvas → Text (TMP)`, `PlayButton`, `QuitButton`.
- [ ] The **Game** view shows a **Play** button and a **Quit** button stacked under the title — the exact
      observable that both buttons exist and are labeled.

## If it breaks
- **Buttons overlap or sit off-screen** → adjust each button's **Rect Transform → Pos Y**; positive is up,
  negative is down from center.
- **The button label didn't change** → you edited the `Button` object's name instead of its **child** `Text
  (TMP)`'s Text Input. Expand the button and select the child.
- **Button appears outside the Canvas in the Hierarchy** → you right-clicked empty space, not the Canvas. Drag
  the button onto `Canvas` in the Hierarchy to nest it.

---
> Nav: [← Title text](02_title-text.md) · [Overview](00_overview.md) · [Game scene →](04_game-scene.md)
