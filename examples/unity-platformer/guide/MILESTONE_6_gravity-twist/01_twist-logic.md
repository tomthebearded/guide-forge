# Milestone 6 · Step 01 of 04 — Add the twist logic to `GameManager`
> Nav: — · [Overview](00_overview.md) · [Telegraph panel →](02_telegraph-ui.md)

## Glossary for this step
- **Telegraph** — a short visual warning shown before something happens (here ~1 s before a flip) so it feels
  fair. See [glossary: Telegraph](../foundation/glossary.md).
- **`[Header("…")]`** — a Unity attribute placed above a field; it draws a bold section label over the following
  `[SerializeField]` fields in the Inspector. Purely organizational (groups "HUD" vs "Twist" here) — no runtime effect. See [Unity docs: HeaderAttribute](https://docs.unity3d.com/6000.5/Documentation/ScriptReference/HeaderAttribute.html).

## Why / design
All the twist logic lives in `GameManager`. It runs a simple **schedule**: wait a random time → show the
telegraph for a second → **flip gravity** → schedule the next one. Flipping is one line —
`Physics2D.gravity = -Physics2D.gravity` — and because the engine applies that gravity to every `Rigidbody2D`,
the player immediately starts falling the other way.

> **Recurring mental model — flip the sign, let the engine re-fall everything.** You don't move the player or
> rewrite jumping. You invert the global gravity vector; the physics engine does the rest, and the M3 grounded/
> jump code (which reads `Mathf.Sign(Physics2D.gravity.y)`) automatically checks the ceiling and jumps downward.
> Docs: https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Physics2D-gravity.html
>
> **New concept — `Random.Range(min, max)`.** Unity's `UnityEngine.Random.Range` with floats returns a random
> number in `[min, max)`. We use it to pick the delay until the next flip so timing feels unpredictable. Docs:
> https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Random.Range.html
>
> **Heads-up — the background tint needs the camera's Clear Flags = Solid Color.** `ApplyBackground` sets
> `mainCamera.backgroundColor`, but that colour only shows when the Main Camera's **Clear Flags** is **Solid
> Color** (the 2D template's default, so you're fine unless you changed it). You wire the camera in step 03; if
> the background never changes there, that setting is the first thing to check.

## Do this
This step **replaces** `GameManager.cs` with the expanded version below (it's still small, so the whole file is
shown). The new parts: the **Twist** fields, twist **state**, an `Update` that drives the schedule, and the
`UpdateTwist` / `ScheduleNextFlip` / `FlipGravity` / `ApplyBackground` methods. **Save** after replacing.

## Code
`Assets/Scripts/GameManager.cs` — complete file (score + win from M5, **plus** the twist):
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
    [SerializeField] private float minFlipInterval = 6f;      // shortest wait before a flip (seconds)
    [SerializeField] private float maxFlipInterval = 12f;     // longest wait
    [SerializeField] private float telegraphDuration = 1f;    // warning time before the flip
    [SerializeField] private GameObject telegraphPanel;       // the warning overlay (wired in step 03)
    [SerializeField] private Camera mainCamera;               // for the background tint (wired in step 03)
    [SerializeField] private Color normalBackground = new Color(0.10f, 0.12f, 0.18f);
    [SerializeField] private Color flippedBackground = new Color(0.20f, 0.10f, 0.14f);

    private int coins;
    private bool playing = true;

    // twist state
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
        Physics2D.gravity = GravityDown;   // always begin with gravity pointing down

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
            // Warning is showing; when it ends, flip and schedule the next one.
            if (Time.time >= telegraphEndsAt)
            {
                telegraphing = false;
                telegraphPanel.SetActive(false);
                FlipGravity();
                ScheduleNextFlip();
            }
            return;
        }

        // Not warning yet; when the scheduled time arrives, start the telegraph.
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
        Physics2D.gravity = -Physics2D.gravity;   // invert the engine's global gravity
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

## Done when (this step)
- [ ] `GameManager.cs` matches the code above and **compiles with no errors**. *(It will `NullReference` at
      runtime on `telegraphPanel` until step 03 wires it — that's expected; the exact observable now is a clean
      compile.)*

## If it breaks
- **Error on `Random.Range`** → it's `UnityEngine.Random` (you have `using UnityEngine;`). If you also had
  `using System;` a `Random` ambiguity can appear — qualify as `UnityEngine.Random.Range(...)`.
- **`Header`/`SerializeField` errors** → both are in `UnityEngine`; keep the `using UnityEngine;` line.

---
> Nav: — · [Overview](00_overview.md) · [Telegraph panel →](02_telegraph-ui.md)
