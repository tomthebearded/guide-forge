# Milestone 3 · Step 02 of 06 — Write `PlayerController.cs` (horizontal movement)
> Nav: [← Ground layer](01_ground-layer.md) · [Overview](00_overview.md) · [Attach & test →](03_attach-and-test-move.md)

## Glossary for this step
- **[`MonoBehaviour`](../foundation/glossary.md#monobehaviour)** — the base class every Unity script inherits from (you met it on the menu script in
  [M1/06](../MILESTONE_1_main-menu/06_menucontroller-script.md)); the `: MonoBehaviour` in the class line is what
  lets this script be **attached to the Player GameObject** and receive the lifecycle callbacks below.
- **[`Awake` / `Update` / `FixedUpdate`](../foundation/glossary.md#monobehaviour-lifecycle-methods)** — lifecycle methods Unity calls for you: `Awake` once at load, `Update`
  every rendered frame (read input here), `FixedUpdate` every physics tick (apply velocity here).
- **[`[SerializeField]`](../foundation/glossary.md#serializefield)** — an attribute that exposes a *private* field in the Inspector so you can tune it
  without making it public.

## Why / design
This first version only moves the player left/right. It reads the **`"Horizontal"`** axis and sets the
`Rigidbody2D`'s **`linearVelocity`** X, leaving Y (gravity) alone.

> **New concept — read input in `Update`, move in `FixedUpdate`.** `Update` runs once per rendered frame;
> `FixedUpdate` runs on the fixed physics clock. Physics (setting velocity on a `Rigidbody2D`) belongs in
> `FixedUpdate` so it's in step with the engine; input is read in `Update` so nothing is missed between physics
> ticks. Docs: https://docs.unity3d.com/6000.5/Documentation/Manual/execution-order.html
>
> **New concept — `Input.GetAxisRaw("Horizontal")`.** The **legacy Input Manager** predefines a `"Horizontal"`
> axis mapped to **A/D and ←/→**. `GetAxisRaw` returns exactly **-1, 0, or +1** (no smoothing) — perfect for
> crisp platformer movement. No setup needed; the axis exists by default. Docs:
> https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Input.GetAxisRaw.html
>
> **New concept — `linearVelocity`.** The `Rigidbody2D`'s velocity vector (units/second). We set X from input
> and keep the engine's current Y so gravity still pulls it down. **Use `linearVelocity`, not the obsolete
> `velocity`** (renamed in Unity 6 — see [stack.md](../foundation/stack.md#version-notes)).

## Do this
1. In the **Project** window, right-click **`Assets/Scripts`** → **Create → Scripting → MonoBehaviour Script**
   (in Unity 6.5; older builds list **C# Script** directly under Create). Name it exactly **`PlayerController`**.
   *(**Load-bearing:** filename must equal the class name.)*
2. Double-click it to open your editor. Replace the whole file with the code below and **save**.
3. Back in Unity, wait for the compile spinner and confirm the **Console** has **no errors**. *(We attach it in
   the next step.)*

## Code
`Assets/Scripts/PlayerController.cs` — the complete file (movement only for now; jump is added in step 04):
```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
public class PlayerController : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 7f;   // units per second; tune in the Inspector

    private Rigidbody2D body;
    private float horizontalInput;

    private void Awake()
    {
        body = GetComponent<Rigidbody2D>();   // grab the Rigidbody2D on this same GameObject
    }

    private void Update()
    {
        // Read input every rendered frame so a tap is never missed.
        horizontalInput = Input.GetAxisRaw("Horizontal");   // -1 (left), 0, or +1 (right)
    }

    private void FixedUpdate()
    {
        // Apply motion on the physics tick: set X from input, keep the engine's Y (gravity).
        body.linearVelocity = new Vector2(horizontalInput * moveSpeed, body.linearVelocity.y);
    }
}
```
*(The `[RequireComponent(typeof(Rigidbody2D))]` line tells Unity this script needs a `Rigidbody2D` — a safety
net so the Player always has one.)*

## Done when (this step)
- [ ] `Assets/Scripts/PlayerController.cs` exists with the code above and **compiles with no Console errors** —
      the exact observable that the script is valid.

## If it breaks
- **"does not match the file name"** → class and file must both be `PlayerController`.
- **Red squiggle on `linearVelocity`** → you're on an older Unity; the guide targets 6.5 where `linearVelocity`
  is correct. If you truly must use an older editor, it'd be `velocity` — but re-pin to 6.5 (see stack.md).
- **`Vector2` not found** → keep `using UnityEngine;` at the top (it's in the code above).

---
> Nav: [← Ground layer](01_ground-layer.md) · [Overview](00_overview.md) · [Attach & test →](03_attach-and-test-move.md)
