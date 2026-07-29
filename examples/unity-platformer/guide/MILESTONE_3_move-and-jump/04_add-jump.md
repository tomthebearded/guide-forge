# Milestone 3 · Step 04 of 06 — Add the jump (sign-aware grounded check)
> Nav: [← Attach & test](03_attach-and-test-move.md) · [Overview](00_overview.md) · [Freeze rotation →](05_freeze-rotation.md)

## Glossary for this step
- **[Grounded](../foundation/glossary.md#grounded)** — true when the player rests on a surface on the **gravity-facing side**; the only time a jump is
  allowed.

## Why / design
A jump is a one-time upward push — but only when standing on something (no mid-air jumps). We detect "standing on
something" with **`Physics2D.OverlapCircle`**: a small circle at the player's feet that returns true if it
overlaps the **Ground** layer.

> **Recurring mental model — gravity is a signed value; jump is opposite it.** We read
> **`Mathf.Sign(Physics2D.gravity.y)`** (currently `-1`, down) instead of hard-coding "down." The feet-check
> sits on the **gravity-facing** side, and the jump pushes **opposite** the gravity sign. Right now that's just
> "check below, jump up" — but writing it this way means the **M6 twist changes nothing in this file**: flip
> gravity and the same code checks the ceiling and jumps downward. This is [decision D5](../foundation/decision-log.md#d5--twist--flip-physics2dgravity-sign-aware-jump).
>
> **New concept — `Input.GetButtonDown("Jump")`.** The legacy **`"Jump"`** button is mapped to **Space** by
> default; `GetButtonDown` is **true only on the frame the key goes down** (one press = one jump, no
> machine-gunning while held). We read it in `Update` and consume it in `FixedUpdate`. Docs:
> https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Input.GetButtonDown.html
>
> **New concept — `Physics2D.OverlapCircle(point, radius, layerMask)`.** Returns a collider if the circle
> overlaps one on the given layer, else `null`. We use it as a yes/no ground test. Docs:
> https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Physics2D.OverlapCircle.html

## Do this
This step **edits** `PlayerController.cs`. Make these four changes (the complete file is shown in
[06_verify](06_verify.md)):
1. **ADD** four `[SerializeField]` fields under `moveSpeed`:
   ```csharp
   [SerializeField] private float jumpSpeed = 7f;
   [SerializeField] private float groundCheckOffset = 0.55f;   // distance from center to just below the feet
   [SerializeField] private float groundCheckRadius = 0.2f;
   [SerializeField] private LayerMask groundLayer;             // set to "Ground" in the Inspector
   ```
2. **ADD** a `jumpQueued` field next to `horizontalInput`:
   ```csharp
   private bool jumpQueued;
   ```
3. **ADD** the button read to `Update`, after the `horizontalInput` line:
   ```csharp
   if (Input.GetButtonDown("Jump"))
   {
       jumpQueued = true;
   }
   ```
4. **REPLACE** the body of `FixedUpdate` with the movement **plus** the jump, and **ADD** the `IsGrounded`
   method below it:
   ```csharp
   private void FixedUpdate()
   {
       body.linearVelocity = new Vector2(horizontalInput * moveSpeed, body.linearVelocity.y);

       if (jumpQueued && IsGrounded())
       {
           float jumpDirection = -Mathf.Sign(Physics2D.gravity.y);   // opposite gravity: up now, down when flipped
           body.linearVelocity = new Vector2(body.linearVelocity.x, jumpSpeed * jumpDirection);
       }
       jumpQueued = false;   // consume the press whether or not it jumped
   }

   private bool IsGrounded()
   {
       float gravityDir = Mathf.Sign(Physics2D.gravity.y);   // -1 = down, +1 = up (during the twist)
       Vector2 feet = (Vector2)transform.position + Vector2.up * gravityDir * groundCheckOffset;
       return Physics2D.OverlapCircle(feet, groundCheckRadius, groundLayer) != null;
   }
   ```
5. **Save**, return to Unity, and in the **Inspector** for the Player's **Player Controller** component set the
   **Ground Layer** dropdown to **Ground** (only). *(This is the LayerMask field — it must point at the layer
   you made in step 01, or the ground check always fails and you can never jump.)*

## Done when (this step)
- [ ] With **Ground Layer = Ground** set, pressing **Space** in Play mode makes the player **jump up once** and
      fall back; pressing Space again mid-air does **nothing** — the exact observable of a grounded, single jump.

## If it breaks
- **Jump does nothing** → the **Ground Layer** field is empty or wrong. Set it to **Ground**. Also confirm the
  Ground object is on the **Ground** layer (M3/01).
- **Infinite / mid-air jumps** → the feet circle is overlapping the player's own collider or is too big. Reduce
  **Ground Check Radius** (e.g. 0.15) or increase **Ground Check Offset** so the circle sits *below* the player,
  and make sure **Ground Layer** excludes the player's layer.
- **Jump is too weak/strong** → tune **Jump Speed** (7 is a good start — at default gravity the jump peaks at
  about **2.5 units**, which comfortably clears a **2-unit** step; higher = higher jumps).

---
> Nav: [← Attach & test](03_attach-and-test-move.md) · [Overview](00_overview.md) · [Freeze rotation →](05_freeze-rotation.md)
