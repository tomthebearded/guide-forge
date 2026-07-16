# Milestone 7 · Step 07 of 07 — Verify Milestone 7 (and the whole game)
> Nav: [← Restart & Menu](06_restart-and-menu.md) · [Overview](00_overview.md) · [Guide home →](../README.md)

## Milestone Done-when gate
In the **`Game`** scene, press **Play**:
- [ ] **Sound** — jump, coin pickup, and win each produce an audible **beep**.
- [ ] **Timer** — the HUD timer counts up during play and freezes at the completion time on win.
- [ ] **Best time** — the WIN panel shows **Time** and **Best**; the **Best** survives stopping and re-entering
      Play.
- [ ] **Restart** — pressing **R** reloads `Game` (timer resets, fresh flip schedule).
- [ ] **Menu** — the win panel's **Menu** button returns to `MainMenu`.

## Whole-game gate (the finish line)
Start from the **`MainMenu`** scene and press **Play**:
1. The menu shows **SHAPE JUMPER** + **Play** + **Quit**.
2. **Play** → the `Game` scene loads; you run and jump across shape platforms.
3. Collect coins (score + beep); survive the **telegraphed gravity flips** (play upside-down); reach the
   **Goal**.
4. The **YOU WIN** panel shows your **time** and **best time**; the timer froze at your finish.
5. **R** starts a fresh run; the **Menu** button returns to the title.

If all five hold, **the game is complete.** 🎉

## The JS-vs-Unity contrast (whole-guide recap)
Same game, opposite philosophy, proven end to end:
| Piece | `web-platformer/` (you wrote it) | This guide (the engine did it) |
|-------|----------------------------------|-------------------------------|
| Game loop | hand-written `requestAnimationFrame` + `dt` | Unity's `Update`/`FixedUpdate` |
| Gravity | hand-written integrator (M3) | a `Rigidbody2D` component (M2) |
| Collision | hand-written AABB + resolution (M4) | `BoxCollider2D` components (M2) |
| Pickups | AABB overlap checks | `OnTriggerEnter2D` + tags (M5) |
| The twist | flip a `gravitySign` variable | flip `Physics2D.gravity` (M6) |
| Sound | Web Audio oscillator | `AudioClip.Create` sine wave (M7) |
| Persistence | `localStorage` | `PlayerPrefs` (M7) |
The through-line: you deferred code to M3 because the engine covered M0–M2, and you wrote "down" as a **sign**
so the twist stayed cheap. That's the whole design.

## Files after this milestone (final source)
`Assets/Scripts/Sfx.cs`:
```csharp
using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class Sfx : MonoBehaviour
{
    [SerializeField] private float jumpFrequency = 440f;
    [SerializeField] private float coinFrequency = 880f;
    [SerializeField] private float winFrequency  = 660f;

    private AudioSource source;
    private AudioClip jumpClip;
    private AudioClip coinClip;
    private AudioClip winClip;

    private void Awake()
    {
        source = GetComponent<AudioSource>();
        jumpClip = MakeBeep(jumpFrequency, 0.10f);
        coinClip = MakeBeep(coinFrequency, 0.08f);
        winClip  = MakeBeep(winFrequency, 0.35f);
    }

    public void PlayJump() { source.PlayOneShot(jumpClip); }
    public void PlayCoin() { source.PlayOneShot(coinClip); }
    public void PlayWin()  { source.PlayOneShot(winClip); }

    private AudioClip MakeBeep(float frequency, float durationSeconds)
    {
        int sampleRate = 44100;
        int sampleCount = Mathf.RoundToInt(sampleRate * durationSeconds);
        float[] samples = new float[sampleCount];
        for (int i = 0; i < sampleCount; i++)
        {
            float t = (float)i / sampleRate;
            float fade = 1f - (float)i / sampleCount;
            samples[i] = Mathf.Sin(2f * Mathf.PI * frequency * t) * 0.3f * fade;
        }
        AudioClip clip = AudioClip.Create("beep", sampleCount, 1, sampleRate, false);
        clip.SetData(samples, 0);
        return clip;
    }
}
```
`Assets/Scripts/PlayerController.cs` (final — adds the jump beep):
```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
public class PlayerController : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 7f;
    [SerializeField] private float jumpSpeed = 7f;
    [SerializeField] private float groundCheckOffset = 0.55f;
    [SerializeField] private float groundCheckRadius = 0.2f;
    [SerializeField] private LayerMask groundLayer;

    private Rigidbody2D body;
    private float horizontalInput;
    private bool jumpQueued;

    private void Awake()
    {
        body = GetComponent<Rigidbody2D>();
    }

    private void Update()
    {
        horizontalInput = Input.GetAxisRaw("Horizontal");
        if (Input.GetButtonDown("Jump"))
        {
            jumpQueued = true;
        }
    }

    private void FixedUpdate()
    {
        body.linearVelocity = new Vector2(horizontalInput * moveSpeed, body.linearVelocity.y);

        if (jumpQueued && IsGrounded())
        {
            float jumpDirection = -Mathf.Sign(Physics2D.gravity.y);
            body.linearVelocity = new Vector2(body.linearVelocity.x, jumpSpeed * jumpDirection);
            GameManager.Instance.PlayJumpSound();
        }
        jumpQueued = false;
    }

    private bool IsGrounded()
    {
        float gravityDir = Mathf.Sign(Physics2D.gravity.y);
        Vector2 feet = (Vector2)transform.position + Vector2.up * gravityDir * groundCheckOffset;
        return Physics2D.OverlapCircle(feet, groundCheckRadius, groundLayer) != null;
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Coin"))
        {
            Destroy(other.gameObject);
            GameManager.Instance.AddCoin();
        }
        else if (other.CompareTag("Goal"))
        {
            GameManager.Instance.Win();
        }
    }
}
```
`Assets/Scripts/GameManager.cs` (final):
```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using TMPro;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("HUD")]
    [SerializeField] private TMP_Text scoreText;
    [SerializeField] private TMP_Text timerText;
    [SerializeField] private GameObject winPanel;
    [SerializeField] private TMP_Text winTimeText;
    [SerializeField] private TMP_Text bestTimeText;

    [Header("Twist")]
    [SerializeField] private bool twistEnabled = true;
    [SerializeField] private float minFlipInterval = 6f;
    [SerializeField] private float maxFlipInterval = 12f;
    [SerializeField] private float telegraphDuration = 1f;
    [SerializeField] private GameObject telegraphPanel;
    [SerializeField] private Camera mainCamera;
    [SerializeField] private Color normalBackground = new Color(0.10f, 0.12f, 0.18f);
    [SerializeField] private Color flippedBackground = new Color(0.20f, 0.10f, 0.14f);

    [Header("Audio")]
    [SerializeField] private Sfx sfx;

    private int coins;
    private bool playing = true;
    private float elapsed;

    private float nextFlipTime;
    private bool telegraphing;
    private float telegraphEndsAt;

    private const string BestTimeKey = "shapeJumper.bestTimeMs";
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
        elapsed = 0f;
        UpdateScoreText();
        UpdateTimerText();
        winPanel.SetActive(false);
        telegraphPanel.SetActive(false);
        ApplyBackground();
        ScheduleNextFlip();
    }

    private void Update()
    {
        if (playing)
        {
            elapsed += Time.deltaTime;
            UpdateTimerText();
            UpdateTwist();
        }

        if (Input.GetKeyDown(KeyCode.R))
        {
            SceneManager.LoadScene("Game");
        }
    }

    public void AddCoin()
    {
        coins++;
        UpdateScoreText();
        if (sfx != null) sfx.PlayCoin();
    }

    public void PlayJumpSound()
    {
        if (sfx != null) sfx.PlayJump();
    }

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

    // Wired to the win panel's Menu button.
    public void GoToMenu()
    {
        Time.timeScale = 1f;
        SceneManager.LoadScene("MainMenu");
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
}
```
`Assets/Scripts/MenuController.cs` is unchanged from [M1](../MILESTONE_1_main-menu/08_verify.md) — reproduced
here so this page holds the **entire final codebase** in one place:
```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public class MenuController : MonoBehaviour
{
    // Wired to the Play button's OnClick in the Inspector.
    public void PlayGame()
    {
        SceneManager.LoadScene("Game");
    }

    // Wired to the Quit button's OnClick in the Inspector.
    public void QuitGame()
    {
        Debug.Log("Quit");   // visible proof the button fired (Application.Quit is a no-op in the Editor)
        Application.Quit();
    }
}
```

## Troubleshooting
- **No sound** → **Sfx** field unwired on `GameManager`, no **Audio Listener** on the camera, or the Game view's
  **Mute Audio** toggle is on.
- **Timer never freezes / keeps counting** → the increment must be inside `if (playing)`.
- **Best time won't persist** → missing `PlayerPrefs.Save()`, or a mismatched key string.
- **R or Menu loads a black screen** → the target scene isn't in **Build Settings** (M1/05).
- **Menu is frozen after clicking Menu** → `GoToMenu` must reset `Time.timeScale = 1f` first.

## Where to go next (out of scope, but natural)
- **More levels** — add more `Game`-style scenes and load them in sequence.
- **A pause menu** — reuse the win-panel pattern, toggled on **Esc**, with `Time.timeScale`.
- **Camera follow** — add a **Cinemachine** 2D camera for levels bigger than one screen.
- **A mute toggle / volume** — a menu setting backed by `PlayerPrefs`.
- **Build a real player** — **File → Build Profiles → Build** (the Windows profile) to make a standalone `.exe`.

You built a complete, menu-driven, shapes-only 2D platformer in Unity 6.5 — the engine-powered twin of the
`web-platformer/` guide. Nicely done.

---
> Nav: [← Restart & Menu](06_restart-and-menu.md) · [Overview](00_overview.md) · [Guide home →](../README.md)
