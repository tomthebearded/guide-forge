# Milestone 5 · Step 04 of 08 — Handle pickups in `PlayerController` (by tag)
> Nav: [← Goal](03_goal.md) · [Overview](00_overview.md) · [GameManager script →](05_gamemanager-script.md)

## Why / design
When the player's collider enters a trigger, Unity calls **`OnTriggerEnter2D(Collider2D other)`** on the
player. We check `other`'s **tag**: a `Coin` gets destroyed and bumps the score; the `Goal` triggers a win. One
handler, both pickups — no scripts on the coin or goal ([decision D4](../foundation/decision-log.md#d4--four-small-scripts-tag-based-pickups)).

> **New concept — `OnTriggerEnter2D`.** A `MonoBehaviour` callback Unity fires when another collider enters a
> trigger this object is involved in. It needs at least one of the two to have a `Rigidbody2D` — the player has
> one, so it fires. Docs: https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Collider2D.OnTriggerEnter2D.html
>
> **New concept — `CompareTag` and `GameManager.Instance`.** `other.CompareTag("Coin")` is the safe way to test
> a tag. `GameManager.Instance` is a single shared reference to the manager (set up in the next step) so the
> player can call `AddCoin()` / `Win()` without a wired reference.

## Do this
This step **edits** `PlayerController.cs`. **ADD** this method inside the class (e.g. after `IsGrounded`). The
complete file is shown in [08_verify](08_verify.md).
```csharp
private void OnTriggerEnter2D(Collider2D other)
{
    if (other.CompareTag("Coin"))
    {
        Destroy(other.gameObject);        // remove the coin we touched
        GameManager.Instance.AddCoin();   // bump the score
    }
    else if (other.CompareTag("Goal"))
    {
        GameManager.Instance.Win();       // end the run
    }
}
```
Save the file. **The Console will show an error** that `GameManager` doesn't exist yet — that's expected; you
create it in the next step. *(If you'd rather not see a red error in between, do step 05 immediately.)*

## Done when (this step)
- [ ] `PlayerController.cs` contains the `OnTriggerEnter2D` method above. *(A temporary `GameManager` compile
      error is expected until step 05 — the exact observable is that error naming `GameManager`, which the next
      step resolves.)*

## If it breaks
- **Error persists after step 05** → check the tag strings match exactly: `"Coin"` and `"Goal"` (case
  sensitive), and that the objects actually carry those tags (M5/01, M5/03).
- **Coin isn't destroyed on touch** → the coin's collider isn't **Is Trigger**, or the coin's tag is wrong.
- **`Destroy(other.gameObject)` removes the wrong thing** → `other.gameObject` is the coin (the thing the player
  entered); that's correct. Don't destroy `gameObject` (that'd delete the player).
