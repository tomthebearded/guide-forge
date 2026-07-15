# Milestone 7 · Step 03 of 07 — Wire beeps to jump, coin, and win
> Nav: [← Audio object](02_audio-object.md) · [Overview](00_overview.md) · [Timer HUD →](04_timer-hud.md)

## Why / design
Now connect the three beeps to game events. `GameManager` gets a reference to `Sfx` and calls it on **coin** and
**win**; it also exposes `PlayJumpSound()` so `PlayerController` can beep on **jump** without holding its own
audio reference. We guard every call with `if (sfx != null)` so a missing reference degrades to silence, not a
crash.

## Do this
**Edit `GameManager.cs`** (fragments — full file in [07_verify](07_verify.md)):
1. **ADD** an audio field. Put it after the Twist block, as its own header:
   ```csharp
   [Header("Audio")]
   [SerializeField] private Sfx sfx;
   ```
2. In **`AddCoin`**, **ADD** the coin beep as the last line:
   ```csharp
   if (sfx != null) sfx.PlayCoin();
   ```
3. In **`Win`**, **ADD** the win beep right after `Time.timeScale = 0f;`:
   ```csharp
   if (sfx != null) sfx.PlayWin();
   ```
4. **ADD** a public method (anywhere in the class, e.g. after `AddCoin`) for the player to call:
   ```csharp
   public void PlayJumpSound()
   {
       if (sfx != null) sfx.PlayJump();
   }
   ```

**Edit `PlayerController.cs`** (fragment — full file in [07_verify](07_verify.md)):
5. In **`FixedUpdate`**, inside the `if (jumpQueued && IsGrounded())` block, **ADD** the jump beep as the last
   line of that block (after setting the jump velocity):
   ```csharp
   GameManager.Instance.PlayJumpSound();
   ```

**Wire the reference in the Editor:**
6. Save both files. In the **Hierarchy** select **`GameManager`**; its Inspector now has an **Sfx** field. Drag
   the **`Audio`** GameObject into it. *(That's the object carrying the `Sfx` component.)*
7. Press **Play**: jumping beeps, collecting a coin beeps (higher), and winning beeps.

## Done when (this step)
- [ ] In Play mode you **hear** a beep on jump, a higher beep on coin pickup, and a beep on winning — the exact
      observable that all three events are wired to `Sfx`.

## If it breaks
- **No sound at all** → the **Sfx** field on `GameManager` is unwired (drag `Audio` in), or the Main Camera lost
  its **Audio Listener** (M7/02), or your system volume/Editor mute is on (the Game view has a **Mute Audio**
  toggle — make sure it's off).
- **Jump is silent but coin/win work** → the `PlayerController` edit (step 5) is missing, or
  `GameManager.Instance` is null (the `GameManager` object must be in the scene).
- **`Sfx` type not found on the field** → `Sfx.cs` didn't compile; fix Console errors first.
