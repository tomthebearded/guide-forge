# Milestone 1 · Step 07 of 08 — Attach the script and wire the buttons
> Nav: [← MenuController script](06_menucontroller-script.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)

## Why / design
A script does nothing until it's **attached to a GameObject in the scene** (the component model again). We'll
attach `MenuController` to an empty GameObject, then point each button's **OnClick** event at the matching
method. Wiring in the Inspector — not in code — is the Unity way to connect a button to behavior.

## Do this
1. Create a host object: in the **Hierarchy** (with the **MainMenu** scene open) right-click empty space →
   **Create Empty**. Rename it **`MenuController`**. *(Name is cosmetic; it just holds the script.)*
2. Select **`MenuController`** in the Hierarchy. In the **Inspector** click **Add Component**, type
   **`MenuController`**, and pick your script. *(Now the GameObject carries your script as a component.)*
3. Wire **Play**: select **`PlayButton`** in the Hierarchy. In the Inspector, find the **Button** component's
   **On Click ()** box at the bottom and click the little **`+`** to add an event row.
4. Drag the **`MenuController`** GameObject from the Hierarchy into the event row's **object field** (it reads
   "None (Object)"). *(This tells the button *which object* to call.)*
5. In the row's **function dropdown** (now enabled, reads "No Function"), choose **MenuController → PlayGame
   ()**. *(This tells it *which method*. Pick the one under the plain `MenuController` heading, not the ones with
   a value box.)*
6. Wire **Quit**: select **`QuitButton`**, click **`+`** under **On Click ()**, drag the **`MenuController`**
   object into the field, and choose **MenuController → QuitGame ()**.

## Done when (this step)
- [ ] The **MenuController** GameObject has a **MenuController (Script)** component in the Inspector.
- [ ] `PlayButton`'s **On Click ()** lists **MenuController.PlayGame**, and `QuitButton`'s lists
      **MenuController.QuitGame** — the exact observable that both buttons are wired.

## If it breaks
- **The function dropdown has no `PlayGame`/`QuitGame`** → the methods must be `public` (they are in the M1/06
  code) and the script must have compiled (no Console errors). Fix errors, then re-open the dropdown.
- **Dropdown shows `PlayGame` twice, one with a text box** → pick the one with **no** argument box (under the
  bold `MenuController` header). The other is the "dynamic string" variant — not what we want.
- **You dragged the Button into the field instead of MenuController** → the object field must be the
  **MenuController** GameObject (the one holding the script), not the button.
