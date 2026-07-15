# Milestone 5 · Step 06 of 08 — Build the HUD and the win panel
> Nav: [← GameManager script](05_gamemanager-script.md) · [Overview](00_overview.md) · [Wire GameManager →](07_wire-gamemanager.md)

## Why / design
The score and the win message are **uGUI** elements — the same Canvas/Text pieces you used for the menu, now in
the `Game` scene. We add a **HUD Canvas** with a score label (top-left) and a **Win panel** (a centered box with
"YOU WIN") that starts **hidden** and is shown by `GameManager.Win()`.

## Do this
**Add the HUD score text:**
1. In the **Hierarchy** (Game scene) right-click → **UI → Text - TextMeshPro**. This creates a **Canvas** (+
   EventSystem) in the Game scene and a Text under it. Rename the Text **`ScoreText`**.
2. Select **`ScoreText`**. In the **Rect Transform**, click the **anchor preset** box and pick **top-left**
   (hold nothing; just click the top-left preset), then set **Pos X 120, Pos Y -40** so it sits near the
   top-left corner. Set its **Text Input** to **`Coins: 0`** and Font Size ~28. *(Cosmetic placement/size.)*

**Add the win panel:**
3. Right-click the **Canvas** → **UI → Panel**. Rename it **`WinPanel`**. *(A Panel is a full-screen semi-
   transparent image; fine as a backdrop.)*
4. Right-click **`WinPanel`** → **UI → Text - TextMeshPro**. Set its **Text Input** to **`YOU WIN`**, Font Size
   ~64, and center it (Alignment center/middle, and center anchor). *(Cosmetic.)*
5. Select **`WinPanel`** and **uncheck the checkbox next to its name** at the top-left of the Inspector — this
   **disables** the panel so it's hidden at start. *(`GameManager.Start()` also hides it, but disabling it now
   keeps the editor tidy. The win code re-enables it with `SetActive(true)`.)*

## Done when (this step)
- [ ] The Game view shows **`Coins: 0`** in the top-left, and the `WinPanel` (with **YOU WIN**) exists in the
      Hierarchy but is **disabled/hidden** — the exact observable that the HUD is placed and the win panel is
      ready but off.

## If it breaks
- **Text shows boxes / nothing** → TMP Essentials not imported; **Window → TextMeshPro → Import TMP Essential
  Resources**.
- **ScoreText is centered, not top-left** → set the **anchor preset** to top-left *and* adjust Pos X/Y; anchor
  and position work together.
- **WinPanel covers the whole screen even when "hidden"** → make sure you **unchecked** the GameObject's active
  checkbox (top-left of its Inspector), not just lowered its opacity.
