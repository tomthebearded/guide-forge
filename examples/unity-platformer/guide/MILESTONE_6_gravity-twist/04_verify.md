# Milestone 6 · Step 04 of 04 — Verify Milestone 6
> Nav: [← Wire & test](03_wire-and-test.md) · [Overview](00_overview.md) · [M7 — Sound, timer & restart →](../MILESTONE_7_sound-timer-restart/00_overview.md)

## Milestone Done-when gate
In the **`Game`** scene, press **Play**:
- [ ] **Telegraph then flip** — a ~1 s warning overlay appears, then gravity **flips** (the player falls upward
      and the background tints).
- [ ] **Upside-down play works** — the player lands on the underside of platforms and **jumps toward the floor**
      off them.
- [ ] **Flips back** — after another interval gravity returns to normal; the cycle repeats with fresh timing.
- [ ] **Toggle** — unchecking **Twist Enabled** on `GameManager` stops all flipping.

Press **Play** to stop.

## The JS-vs-Unity contrast (milestone recap)
Same twist, opposite plumbing. The sibling flipped its **own** `gravitySign` variable and its **own** integrator
re-fell the player. You flipped the **engine's** `Physics2D.gravity` and the engine re-fell everything. In both,
the reason it's a handful of lines and not a rewrite is identical: from the first physics milestone, "down" was
written as a **sign** to read, never a constant to hard-code. `PlayerController` didn't change one character this
milestone — that's the design paying off.

## Files after this milestone
`Assets/Scripts/GameManager.cs` — complete current contents:
```csharp
using UnityEngine;
using TMPro;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("HUD")]
    [SerializeField] private TMP_Text scoreText;
    [SerializeField] private GameObject winPanel;

    [Header("Twist")]
    [SerializeField] private bool twistEnabled = true;
    [SerializeField] private float minFlipInterval = 6f;
    [SerializeField] private float maxFlipInterval = 12f;
    [SerializeField] private float telegraphDuration = 1f;
    [SerializeField] private GameObject telegraphPanel;
    [SerializeField] private Camera mainCamera;
    [SerializeField] private Color normalBackground = new Color(0.10f, 0.12f, 0.18f);
    [SerializeField] private Color flippedBackground = new Color(0.20f, 0.10f, 0.14f);

    private int coins;
    private bool playing = true;

    private float nextFlipTime;
    private bool telegraphing;
    private float telegraphEndsAt;

    private static readonly Vector2 GravityDown = new Vector2(0f, -9.81f);

    private void Awake()
    {
        Instance = this;
    }

    private void Start()
    {
        Time.timeScale = 1f;
        Physics2D.gravity = GravityDown;

        playing = true;
        coins = 0;
        UpdateScoreText();
        winPanel.SetActive(false);
        telegraphPanel.SetActive(false);
        ApplyBackground();
        ScheduleNextFlip();
    }

    private void Update()
    {
        if (playing)
        {
            UpdateTwist();
        }
    }

    public void AddCoin()
    {
        coins++;
        UpdateScoreText();
    }

    public void Win()
    {
        if (!playing) return;
        playing = false;
        Time.timeScale = 0f;
        telegraphing = false;
        telegraphPanel.SetActive(false);   // don't leave a warning flash on the win screen
        winPanel.SetActive(true);
    }

    private void UpdateTwist()
    {
        if (!twistEnabled) return;

        if (telegraphing)
        {
            if (Time.time >= telegraphEndsAt)
            {
                telegraphing = false;
                telegraphPanel.SetActive(false);
                FlipGravity();
                ScheduleNextFlip();
            }
            return;
        }

        if (Time.time >= nextFlipTime)
        {
            telegraphing = true;
            telegraphEndsAt = Time.time + telegraphDuration;
            telegraphPanel.SetActive(true);
        }
    }

    private void ScheduleNextFlip()
    {
        nextFlipTime = Time.time + Random.Range(minFlipInterval, maxFlipInterval);
    }

    private void FlipGravity()
    {
        Physics2D.gravity = -Physics2D.gravity;
        ApplyBackground();
    }

    private void ApplyBackground()
    {
        if (mainCamera == null) return;
        bool flipped = Physics2D.gravity.y > 0f;
        mainCamera.backgroundColor = flipped ? flippedBackground : normalBackground;
    }

    private void UpdateScoreText()
    {
        scoreText.text = "Coins: " + coins;
    }
}
```
`PlayerController.cs` and `MenuController.cs` are **unchanged** from [M5](../MILESTONE_5_coins-goal-win/08_verify.md).
Scene adds a `TelegraphPanel` under the HUD Canvas, wired into `GameManager` along with `Main Camera`.

## Troubleshooting
- **`NullReference` on `telegraphPanel`** → wire the **Telegraph Panel** field (M6/03).
- **Player flies off when flipped** → keep platforms above the player so there's a ceiling to land on (M6/03).
- **Flips too rare/often** → tune **Min/Max Flip Interval**.
- **Grounded/jump broke after a flip** → it shouldn't — `PlayerController` reads the gravity sign. If it did,
  you likely hard-coded a direction somewhere; compare against the M3 verify file.

## Next
[M7 — Sound, timer & restart](../MILESTONE_7_sound-timer-restart/00_overview.md): synthesized beeps for
jump/coin/win, a completion timer, a persisted best time, an **R** restart, and a **Menu** button — the final
polish that closes the loop.
