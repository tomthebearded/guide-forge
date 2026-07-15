# Milestone 7 · Step 06 of 07 — Add restart (R) and the Menu button
> Nav: [← Best time](05_best-time.md) · [Overview](00_overview.md) · [Verify →](07_verify.md)

## Why / design
Close the loop: **R** reloads the `Game` scene for a fresh run (new random flip schedule, timer reset — all from
`Start`), and a **Menu** button on the win panel returns to `MainMenu`. Both use `SceneManager.LoadScene`; the
menu path first resets `Time.timeScale = 1` so the menu isn't frozen by a leftover win freeze.

> **Recurring mental model — a reload *is* a reset.** Reloading the `Game` scene re-runs `GameManager.Start()`,
> which already resets `timeScale`, gravity, score, timer, and the flip schedule. So "restart" is just
> `SceneManager.LoadScene("Game")` — no manual un-doing.

## Do this
**Edit `GameManager.cs`** (fragments — full file in [07_verify](07_verify.md)):
1. **ADD** the scene-management import at the very top, under `using UnityEngine;`:
   ```csharp
   using UnityEngine.SceneManagement;
   ```
2. In **`Update`**, **ADD** an R-to-restart check **outside** the `if (playing)` block (so R works on the win
   screen too), at the end of the method:
   ```csharp
   if (Input.GetKeyDown(KeyCode.R))
   {
       SceneManager.LoadScene("Game");
   }
   ```
3. **ADD** a public method for the Menu button (e.g. after `Win`):
   ```csharp
   // Wired to the win panel's Menu button.
   public void GoToMenu()
   {
       Time.timeScale = 1f;                    // undo the win freeze before leaving
       SceneManager.LoadScene("MainMenu");
   }
   ```

**Add the Menu button + wire it:**
4. In the **Hierarchy**, right-click **`WinPanel`** → **UI → Button - TextMeshPro**. Rename it
   **`MenuButton`**, set its child `Text (TMP)` to **`Menu`**, and place it below the best-time text.
5. Select **`MenuButton`**; in its **Button → On Click ()** click **`+`**, drag the **`GameManager`** object into
   the object field, and choose **GameManager → GoToMenu ()**.
6. Save and test the full loop below.

## Done when (this step)
- [ ] Pressing **R** at any time reloads the `Game` scene (timer resets to `00:00.00`, a fresh run begins), and
      clicking the **Menu** button on the win panel returns to the **MainMenu** scene — the exact observable of a
      closed Menu→game→Menu loop.

## If it breaks
- **R does nothing** → the check is inside `if (playing)` (move it out), or `Game` isn't in Build Settings
  (M1/05).
- **Menu button loads a black screen / errors** → `MainMenu` isn't in Build Settings, or the button's function
  isn't `GameManager.GoToMenu` (re-check the OnClick wiring).
- **Menu opens but is frozen** → `GoToMenu` must set `Time.timeScale = 1f` before loading (it does above).
