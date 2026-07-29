# Milestone 7 · Step 05 of 07 — Persist the best time with `PlayerPrefs`
> Nav: [← Timer HUD](04_timer-hud.md) · [Overview](00_overview.md) · [Restart & Menu →](06_restart-and-menu.md)

## Glossary for this step
- **[`PlayerPrefs`](../foundation/glossary.md#playerprefs)** — Unity's simple key/value store that persists small values across Play sessions and app
  runs.

## Why / design
On win, compare this run's time to the stored **best**; if it's faster, save it. `PlayerPrefs` stores an integer
under a string **key** — we save milliseconds. It's the direct analogue of the sibling's `localStorage` best
time. We also fill the win panel's **Time** and **Best** labels.

> **New concept — `PlayerPrefs.GetInt(key, default)` / `SetInt` / `Save`.** `GetInt` returns the stored value or
> your `default` if the key was never set (we use `int.MaxValue` = "no best yet, so any run beats it"). `SetInt`
> writes; `Save` flushes it to disk so it survives quitting. **Caveat:** `PlayerPrefs` is plain, unencrypted
> per-user storage — fine for a best time, **not** a real save system ([decision D8](../foundation/decision-log.md#d8--playerprefs-for-the-best-time)).
> Docs: https://docs.unity3d.com/6000.5/Documentation/ScriptReference/PlayerPrefs.html

## Do this
**Edit `GameManager.cs`** (fragments — full file in [07_verify](07_verify.md)):
1. **ADD** win-panel text fields to the **HUD** header block, under `winPanel`:
   ```csharp
   [SerializeField] private TMP_Text winTimeText;
   [SerializeField] private TMP_Text bestTimeText;
   ```
2. **ADD** the storage key constant next to `GravityDown`:
   ```csharp
   private const string BestTimeKey = "shapeJumper.bestTimeMs";
   ```
   *(**Load-bearing:** the exact key string is how the value is found across runs — see [conventions](../foundation/conventions.md#naming).)*
3. **REPLACE** the whole **`Win`** method with this version (adds best-time save + panel text; keeps the freeze
   and win beep):
   ```csharp
   public void Win()
   {
       if (!playing) return;
       playing = false;
       Time.timeScale = 0f;
       telegraphing = false;
       telegraphPanel.SetActive(false);   // clear any warning flash before the win screen
       if (sfx != null) sfx.PlayWin();

       int runMs = Mathf.RoundToInt(elapsed * 1000f);
       int bestMs = PlayerPrefs.GetInt(BestTimeKey, int.MaxValue);
       if (runMs < bestMs)
       {
           bestMs = runMs;
           PlayerPrefs.SetInt(BestTimeKey, bestMs);
           PlayerPrefs.Save();
       }

       winTimeText.text = "Time: " + FormatTime(runMs);
       bestTimeText.text = "Best: " + FormatTime(bestMs);
       winPanel.SetActive(true);
   }
   ```

**Add the UI + wire it:**
4. In the **Hierarchy**, add two labels under **`WinPanel`**: right-click `WinPanel` → **UI → Text -
   TextMeshPro** twice. Rename them **`WinTimeText`** and **`BestTimeText`**, center them below the "YOU WIN"
   text, Font Size ~28, default Text `Time: --` / `Best: --`. *(Cosmetic layout.)*
5. Save, select **`GameManager`**, and drag **`WinTimeText`** into **Win Time Text** and **`BestTimeText`** into
   **Best Time Text**.
6. Test: press **Play**, win, and read the panel. Note the time. **Stop**, press **Play**, win **faster** — the
   **Best** should reflect your fastest run and persist even after stopping.

## Done when (this step)
- [ ] The WIN panel shows **`Time: mm:ss.cc`** and **`Best: mm:ss.cc`**, and the **Best** value **survives**
      stopping and restarting Play — the exact observable that `PlayerPrefs` persisted it.

## If it breaks
- **`NullReference` on `winTimeText`/`bestTimeText`** → those fields are unwired; drag the two labels in.
- **Best time never updates** → you may already have a faster stored best; to reset it during testing, call
  `PlayerPrefs.DeleteKey("shapeJumper.bestTimeMs")` once (or **Edit → Clear All PlayerPrefs** if available), or
  just beat it.
- **Best resets every run** → you forgot `PlayerPrefs.Save()` (it's in the code above), or you're reading a
  different key string than you wrote.

---
> Nav: [← Timer HUD](04_timer-hud.md) · [Overview](00_overview.md) · [Restart & Menu →](06_restart-and-menu.md)
