# Milestone 6 · Step 01 of 04 — Add the twist logic to `GameManager`
> Nav: — · [Overview](00_overview.md) · [Telegraph panel →](02_telegraph-ui.md)

## Glossary for this step
- **[Telegraph](../foundation/glossary.md#telegraph)** — a short visual warning shown before something happens (here ~1 s before a flip) so it feels
  fair.
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
**Before you start:** `GameManager.cs` already exists from [M5](../MILESTONE_5_coins-goal-win/08_verify.md)
(score + win). You'll **add** the twist to that existing file — new fields, twist state, an `Update` loop, and
four methods — leaving the M5 score/win code in place. **Don't recreate the file.** Work through the fragments
top-to-bottom; each one names exactly where it goes. The complete post-M6 file is rendered whole in the
[verify checkpoint](04_verify.md) if you want to diff against it. **Save** when you're done (last instruction).

**1. Group the existing HUD fields.** Add a `[Header("HUD")]` attribute on its own line **directly above** the existing `[SerializeField] private TMP_Text scoreText;` field:

```csharp
    [Header("HUD")]
```

**2. Add the Twist fields.** Immediately **below** the existing `[SerializeField] private GameObject winPanel;` line, add the twist configuration block:

```csharp
    [Header("Twist")]
    [SerializeField] private bool twistEnabled = true;
    [SerializeField] private float minFlipInterval = 6f;      // shortest wait before a flip (seconds)
    [SerializeField] private float maxFlipInterval = 12f;     // longest wait
    [SerializeField] private float telegraphDuration = 1f;    // warning time before the flip
    [SerializeField] private GameObject telegraphPanel;       // the warning overlay (wired in step 03)
    [SerializeField] private Camera mainCamera;               // for the background tint (wired in step 03)
    [SerializeField] private Color normalBackground = new Color(0.10f, 0.12f, 0.18f);
    [SerializeField] private Color flippedBackground = new Color(0.20f, 0.10f, 0.14f);
```

**3. Add the twist state.** Below the existing `private bool playing = true;` line, add the runtime state the schedule needs:

```csharp
    // twist state
    private float nextFlipTime;
    private bool telegraphing;
    private float telegraphEndsAt;

    private static readonly Vector2 GravityDown = new Vector2(0f, -9.81f);
```

**4. Initialize the twist in `Start()`.** The existing `Start()` gains a gravity reset and the twist bootstrapping. **Replace the whole `Start()` method** with:

```csharp
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
```

**5. Drive the schedule every frame.** Add an `Update()` method **immediately after `Start()`** (M5 had none):

```csharp
    private void Update()
    {
        if (playing)
        {
            UpdateTwist();
        }
    }
```

**6. Clear the telegraph on win.** So a warning flash can't linger on the win screen, **replace the whole `Win()` method** with:

```csharp
    public void Win()
    {
        if (!playing) return;
        playing = false;
        Time.timeScale = 0f;
        telegraphing = false;
        telegraphPanel.SetActive(false);   // don't leave a warning flash on the win screen
        winPanel.SetActive(true);
    }
```

**7. Add the four twist methods.** Add these **after `Win()`** (above the existing `UpdateScoreText()` method) — they run the schedule, flip gravity, and tint the background:

```csharp
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
```

**8. Save** the file, return to Unity, and wait for the recompile (see Done-when).

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
