# Milestone 5 · Step 07 of 08 — Create the GameManager object and wire it
> Nav: [← HUD & win panel](06_hud-and-winpanel.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)

## Why / design
The `GameManager` script needs to live on a GameObject and know **which** Text is the score and **which** object
is the win panel. We create an empty `GameManager` object, attach the script, and drag those two references into
its Inspector fields.

## Do this
1. In the **Hierarchy** (Game scene) right-click empty space → **Create Empty**. Rename it **`GameManager`**.
2. Select it, **Add Component → `Game Manager`** (your script). Two empty fields appear: **Score Text** and
   **Win Panel**.
3. Wire **Score Text**: drag the **`ScoreText`** object from the Hierarchy into the **Score Text** field.
4. Wire **Win Panel**: drag the **`WinPanel`** object from the Hierarchy into the **Win Panel** field.
5. Both fields should now name their objects (not "None"). *(These are the `[SerializeField]` references from
   [M5/05](05_gamemanager-script.md).)*

## Done when (this step)
- [ ] The `GameManager` object's **Game Manager** component shows **Score Text = ScoreText** and **Win Panel =
      WinPanel** — the exact observable that both references are wired (neither says "None").

## If it breaks
- **A field says "None" and won't accept the drag** → the field type must match: drag the **ScoreText** (a TMP
  Text) into Score Text, and the **WinPanel** GameObject into Win Panel. Don't swap them.
- **Runtime `NullReferenceException` on `scoreText`/`winPanel`** → a field is still empty; wire it.
- **`GameManager.Instance` is null when a coin is hit** → the `GameManager` object isn't in the scene or the
  script isn't attached; confirm step 1–2.

---
> Nav: [← HUD & win panel](06_hud-and-winpanel.md) · [Overview](00_overview.md) · [Verify →](08_verify.md)
