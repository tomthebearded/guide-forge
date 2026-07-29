# Milestone 5 · Step 05 of 08 — Write `GameManager.cs` (score + win)
> Nav: [← Player triggers](04_player-triggers.md) · [Overview](00_overview.md) · [HUD & win panel →](06_hud-and-winpanel.md)

## Glossary for this step
- **[`Time.timeScale`](../foundation/glossary.md#timetimescale)** — a global multiplier on game time; `0` freezes all physics/animation (our win state),
  `1` is normal. It **persists** across Play sessions, so we reset it in `Start()`.

## Why / design
`GameManager` is the game's brain: it tracks the coin **score**, shows it on the HUD, and handles the **win**
(freeze the game, show the panel). It exposes a static **`Instance`** so the player can reach it easily.

> **Recurring mental model — freeze with `Time.timeScale = 0`, and undo it on load.** Setting `Time.timeScale`
> to 0 stops all physics and `FixedUpdate` motion instantly — a one-line "pause everything" for the win. But
> `timeScale` is a **global that survives leaving Play mode**, so if you don't reset it to `1` in `Start()`, the
> *next* time you press Play the game is frozen from the start. That trap is exactly why `Start()` sets it back
> to 1. Docs: https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Time-timeScale.html
>
> **New concept — `TMP_Text`.** The type of a TextMeshPro UI label. We hold a reference to the score label and
> set its `.text`. Requires `using TMPro;`.

## Do this
1. In **Project → `Assets/Scripts`** right-click → **Create → Scripting → MonoBehaviour Script** (older builds:
   **Create → C# Script**), name it exactly **`GameManager`**.
2. Open it and replace the whole file with the code below. **Save.**
3. Back in Unity, the earlier `GameManager` error from step 04 should now **clear** (once this compiles). Wiring
   the `scoreText` / `winPanel` references happens in step 07 — a `NullReference` at runtime until then is
   expected.

## Code
`Assets/Scripts/GameManager.cs` — the complete file (score + win; timer/twist/sound/best-time come in M6–M7):
```csharp
using UnityEngine;
using TMPro;

public class GameManager : MonoBehaviour
{
    // A single shared reference so PlayerController can call GameManager.Instance.AddCoin()/Win().
    public static GameManager Instance { get; private set; }

    [SerializeField] private TMP_Text scoreText;    // the HUD "Coins: N" label
    [SerializeField] private GameObject winPanel;    // the YOU WIN panel, hidden until we win

    private int coins;
    private bool playing = true;

    private void Awake()
    {
        Instance = this;
    }

    private void Start()
    {
        // Undo any freeze left over from a previous win — timeScale persists across Play sessions.
        Time.timeScale = 1f;

        playing = true;
        coins = 0;
        UpdateScoreText();
        winPanel.SetActive(false);
    }

    public void AddCoin()
    {
        coins++;
        UpdateScoreText();
    }

    public void Win()
    {
        if (!playing) return;   // only win once
        playing = false;
        Time.timeScale = 0f;    // freeze everything
        winPanel.SetActive(true);
    }

    private void UpdateScoreText()
    {
        scoreText.text = "Coins: " + coins;
    }
}
```

## Done when (this step)
- [ ] `Assets/Scripts/GameManager.cs` exists with the code above and **compiles with no errors** — the
      `GameManager` error from step 04 is gone. That cleared Console is the exact observable.

## If it breaks
- **`TMP_Text` not found** → add `using TMPro;` at the top (it's in the code above).
- **Still errors about `GameManager`** → the class/file name must both be `GameManager`.
- **`winPanel`/`scoreText` warnings** → they're just unassigned until step 07; not a compile error.

---
> Nav: [← Player triggers](04_player-triggers.md) · [Overview](00_overview.md) · [HUD & win panel →](06_hud-and-winpanel.md)
