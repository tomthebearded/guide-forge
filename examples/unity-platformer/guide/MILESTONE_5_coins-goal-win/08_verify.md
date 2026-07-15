# Milestone 5 · Step 08 of 08 — Verify Milestone 5
> Nav: [← Wire GameManager](07_wire-gamemanager.md) · [Overview](00_overview.md) · [M6 — The gravity twist →](../MILESTONE_6_gravity-twist/00_overview.md)

## Milestone Done-when gate
In the **`Game`** scene, press **Play**:
- [ ] **Coins collect** — running/jumping into a coin makes it **disappear** and the HUD updates **`Coins: 1`**,
      `2`, … one per coin.
- [ ] **Goal wins** — touching the **Goal** shows the **YOU WIN** panel and **everything freezes** (the player
      stops mid-motion, coins stop).
- [ ] **Triggers + tags** — coins/goal are `Is Trigger` colliders with tags `Coin`/`Goal`.

Press **Play** to stop. *(Because `Start()` resets `Time.timeScale = 1`, the next Play starts unfrozen — verify
that too: after a win, stop, press Play again, and confirm the game runs normally.)*

## The JS-vs-Unity contrast (milestone recap)
The sibling detected coin/goal pickups with the *same hand-written AABB overlap* it used for platforms, and drew
the score with `fillText`. Here, **triggers** deliver `OnTriggerEnter2D` for free, **tags** identify what you
touched, and the HUD is **uGUI Text** placed in the Editor. The freeze that the sibling did by switching a
`mode` variable and skipping its update, you did with one line: `Time.timeScale = 0`.

## Files after this milestone
`Assets/Scripts/PlayerController.cs` — complete current contents:
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
`Assets/Scripts/GameManager.cs` — complete current contents:
```csharp
using UnityEngine;
using TMPro;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [SerializeField] private TMP_Text scoreText;
    [SerializeField] private GameObject winPanel;

    private int coins;
    private bool playing = true;

    private void Awake()
    {
        Instance = this;
    }

    private void Start()
    {
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
        if (!playing) return;
        playing = false;
        Time.timeScale = 0f;
        winPanel.SetActive(true);
    }

    private void UpdateScoreText()
    {
        scoreText.text = "Coins: " + coins;
    }
}
```
`MenuController.cs` is unchanged. Scene adds: a HUD `Canvas` (`ScoreText`, `WinPanel`) and a `GameManager`
object. `Assets/Prefabs/Coin.prefab` exists.

## Troubleshooting
- **`NullReferenceException` on coin/goal touch** → `GameManager` object missing from the scene, or its **Score
  Text / Win Panel** fields unwired (M5/07).
- **Coin doesn't disappear** → collider not **Is Trigger**, or tag isn't exactly `Coin`.
- **Win panel never shows** → Goal tag isn't `Goal`, or the **Win Panel** reference is unwired.
- **Second Play starts frozen** → `Start()` must set `Time.timeScale = 1f` (it does in the code above); confirm
  you didn't remove that line.

## Next
[M6 — The gravity twist](../MILESTONE_6_gravity-twist/00_overview.md): the signature mechanic — randomly flip
`Physics2D.gravity`, telegraphed, and watch the sign-aware M3 player code play upside-down with **no changes**.
