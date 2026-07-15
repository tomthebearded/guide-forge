# Milestone 7 · Step 04 of 07 — Add the run timer to the HUD
> Nav: [← Wire sounds](03_wire-sounds.md) · [Overview](00_overview.md) · [Best time →](05_best-time.md)

## Why / design
A completion time needs a running clock. `GameManager` accumulates **`elapsed`** seconds each frame while
`playing`, formats it as `mm:ss.cc`, and shows it in a HUD label. We add a `timerText` field, a `TimerText` UI
element, and a `FormatTime` helper (also used by the best time next step).

> **New concept — `Time.deltaTime`.** The seconds since the last frame. Summing it (`elapsed += Time.deltaTime`)
> gives real elapsed time, frame-rate independent. Because the timer only runs while `playing`, and the win sets
> `playing = false`, the clock **stops on win** — the frozen value is the completion time. Docs:
> https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Time-deltaTime.html

## Do this
**Edit `GameManager.cs`** (fragments — full file in [07_verify](07_verify.md)):
1. **ADD** a timer field to the **HUD** header block, under `scoreText`:
   ```csharp
   [SerializeField] private TMP_Text timerText;
   ```
2. **ADD** an elapsed-time field next to `private int coins;`:
   ```csharp
   private float elapsed;
   ```
3. In **`Start`**, **ADD** `elapsed = 0f;` right after `coins = 0;`, and **ADD** `UpdateTimerText();` right after
   the existing `UpdateScoreText();` — so `Start` reads `… coins = 0; elapsed = 0f; UpdateScoreText();
   UpdateTimerText(); …` (matching the full file in [07_verify](07_verify.md)):
   ```csharp
   elapsed = 0f;          // after: coins = 0;
   UpdateTimerText();     // after: UpdateScoreText();
   ```
4. **REPLACE** the body of `Update`'s `if (playing)` block so it also advances the timer:
   ```csharp
   if (playing)
   {
       elapsed += Time.deltaTime;
       UpdateTimerText();
       UpdateTwist();
   }
   ```
5. **ADD** two helper methods (e.g. after `UpdateScoreText`):
   ```csharp
   private void UpdateTimerText()
   {
       timerText.text = FormatTime(Mathf.RoundToInt(elapsed * 1000f));
   }

   private string FormatTime(int ms)
   {
       if (ms == int.MaxValue) return "--:--";
       int totalSeconds = ms / 1000;
       int minutes = totalSeconds / 60;
       int seconds = totalSeconds % 60;
       int hundredths = (ms % 1000) / 10;
       return string.Format("{0:00}:{1:00}.{2:00}", minutes, seconds, hundredths);
   }
   ```

**Add the UI + wire it:**
6. In the **Hierarchy**, right-click the HUD **`Canvas`** → **UI → Text - TextMeshPro**. Rename it
   **`TimerText`**. Anchor it **top-right** (anchor preset) and set **Pos X -120, Pos Y -40**, Text
   **`00:00.00`**, Font Size ~28. *(Cosmetic placement.)*
7. Save, select **`GameManager`**, and drag **`TimerText`** into its **Timer Text** field.
8. Press **Play**: the timer counts up; reaching the goal **freezes** it at the completion time.

## Done when (this step)
- [ ] The HUD shows a **timer counting up** during play, and it **stops** at the completion time when you win —
      the exact observable that `elapsed` drives `TimerText` and halts on win.

## If it breaks
- **`NullReference` on `timerText`** → the **Timer Text** field is unwired; drag `TimerText` in.
- **Timer keeps running after win** → the increment must be inside the `if (playing)` block (step 4); the win
  sets `playing = false`.
- **Timer shows a weird format** → confirm you copied `FormatTime` exactly; it expects milliseconds.
