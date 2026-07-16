# Milestone 3 · Step 06 of 06 — Verify Milestone 3
> Nav: [← Freeze rotation](05_freeze-rotation.md) · [Overview](00_overview.md) · [M4 — Platforms & a real level →](../MILESTONE_4_platforms-and-level/00_overview.md)

## Milestone Done-when gate
In the **`Game`** scene, press **Play**:
- [ ] **Run** — holding **←/→** (or **A/D**) moves the player smoothly; releasing stops it.
- [ ] **Jump** — pressing **Space** launches the player up once and it falls back down.
- [ ] **No double-jump** — pressing Space in mid-air does nothing.
- [ ] **Upright** — landing on edges no longer spins the player.

Press **Play** to stop.

## The JS-vs-Unity contrast (milestone recap)
The sibling hand-wrote velocity, an integrator, edge-triggered jump state, and grounded detection against its
own AABB math — dozens of lines across two milestones. Here you wrote ~30 lines that mostly express *intent*
(read the axis, set a velocity, jump if grounded) and let the engine integrate motion and apply gravity. And by
reading the **sign** of `Physics2D.gravity` instead of hard-coding "down," this script is **already twist-ready**
— M6 won't touch it.

## Files after this milestone
`Assets/Scripts/PlayerController.cs` — complete current contents:
```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
public class PlayerController : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 7f;
    [SerializeField] private float jumpSpeed = 7f;
    [SerializeField] private float groundCheckOffset = 0.55f;   // distance from center to just below the feet
    [SerializeField] private float groundCheckRadius = 0.2f;
    [SerializeField] private LayerMask groundLayer;             // set to "Ground" in the Inspector

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
            float jumpDirection = -Mathf.Sign(Physics2D.gravity.y);   // opposite gravity: up now, down when flipped
            body.linearVelocity = new Vector2(body.linearVelocity.x, jumpSpeed * jumpDirection);
        }
        jumpQueued = false;
    }

    private bool IsGrounded()
    {
        float gravityDir = Mathf.Sign(Physics2D.gravity.y);   // -1 = down, +1 = up (during the twist)
        Vector2 feet = (Vector2)transform.position + Vector2.up * gravityDir * groundCheckOffset;
        return Physics2D.OverlapCircle(feet, groundCheckRadius, groundLayer) != null;
    }
}
```
`MenuController.cs` is unchanged. Player Inspector: **Ground Layer = Ground**, **Freeze Rotation Z = on**.

## Troubleshooting
- **Can't jump** → **Ground Layer** field empty/wrong, or Ground not on the **Ground** layer. Both must point at
  the `Ground` layer.
- **Mid-air jumps** → feet circle too big or overlapping the player; lower **Ground Check Radius** / raise
  **Ground Check Offset**.
- **Movement smoothed** → used `GetAxis` not `GetAxisRaw`.
- **Player tumbles** → **Freeze Rotation Z** not checked (M3/05).

## Next
[M4 — Platforms & a real level](../MILESTONE_4_platforms-and-level/00_overview.md): turn the single ground bar
into a real level of platforms and **play it** — the reality-check gate where you decide it's fun enough to
finish.

---
> Nav: [← Freeze rotation](05_freeze-rotation.md) · [Overview](00_overview.md) · [M4 — Platforms & a real level →](../MILESTONE_4_platforms-and-level/00_overview.md)
