# Conventions — Shape Jumper (Unity edition)

> The rules every step in this guide follows. If a step seems to contradict one of these, the convention
> wins — fix the step.

## Naming
- **Load-bearing names** (must match *exactly* — the game breaks otherwise; flagged at first use in each step):
  - the scene names **`MainMenu`** and **`Game`** (referenced by string in `SceneManager.LoadScene`);
  - the tags **`Coin`** and **`Goal`** (matched by `CompareTag` in the player's trigger handler);
  - the input names **`"Horizontal"`** and **`"Jump"`** (legacy Input Manager axes);
  - the ground **`LayerMask`** name used by the grounded check;
  - every **`[SerializeField]`** field that is wired to another object in the Inspector.
- **Cosmetic** (free to change without breaking anything): all colors, every shape size, the game title text,
  exact platform positions, and every tuning number (speeds, jump force, twist interval).
- **C# style:** `PascalCase` for scripts/classes/methods, `camelCase` for private fields; one script per file,
  named after its class (`PlayerController.cs` holds `class PlayerController`).

## Structure / architecture
- **The Editor is the tool; code is the exception.** Prefer configuring behavior by adding/adjusting
  **Components in the Inspector** over writing scripts. A milestone that can be done with components uses
  components — this is *why* the reader writes no *gameplay* code until M3 (M1's small menu-button script
  aside), and it's the spine of the JS-vs-Unity contrast.
- **Two scenes, menu at build index 0.** `MainMenu.unity` (index 0) and `Game.unity` (index 1), both added to
  the build's **Scene List** via **File → Build Profiles** (called "Build Settings" pre-Unity 6).
  `SceneManager.LoadScene("Game")` / `("MainMenu")` move between them by exact name.
- **Four small scripts, tag-driven pickups:**
  - `MenuController` — the menu buttons (Play → load `Game`, Quit → `Application.Quit`).
  - `PlayerController` — move, jump, **and all pickup handling** (`OnTriggerEnter2D` by tag).
  - `GameManager` — score, win (`Time.timeScale`), timer, best time (`PlayerPrefs`), and the twist.
  - `Sfx` — synthesized beeps (`AudioClip.Create` + `AudioSource`).
  - **No per-object Coin/Goal scripts** — coins and the goal are detected in `PlayerController.OnTriggerEnter2D`
    by **tag** (`CompareTag("Coin")` / `CompareTag("Goal")`).
- **`[SerializeField] private` for tunables.** Speeds, jump force, twist interval, colors, and cross-object
  references are `[SerializeField] private` fields set in the **Inspector** — never public fields, never magic
  numbers buried in methods. "What I tune" lives in the Inspector; "what runs" lives in code.

## Data vs code
- **Everything collides as a box or a circle.** Player + platforms use `BoxCollider2D`; coins use a
  `CircleCollider2D` marked **Is Trigger**; the goal uses a trigger `BoxCollider2D`. The player is the *only*
  `Rigidbody2D` (Body Type = **Dynamic**); platforms are static (no `Rigidbody2D` at all).
- **The level is scene data.** Platforms and coins are GameObjects arranged in the `Game` scene; adding a
  platform = duplicating a GameObject and moving it, never new code. Coins are instances of one **prefab**.

## Language / framework specifics
- **Physics in `FixedUpdate`, input in `Update`.** Read `Input.GetButtonDown("Jump")` in `Update` (so a press
  is never missed between physics ticks); apply `linearVelocity` in `FixedUpdate` (the physics step).
- **Gravity is the engine's global vector; the twist flips its sign.** All "which way is down" logic reads the
  **sign of `Physics2D.gravity.y`**; the jump impulse pushes **opposite** that sign; "grounded" means "a
  surface on the gravity-facing side." **No script hard-codes 'down'** — this is what makes the M6 twist a
  small change (the direct analogue of the sibling's signed-gravity integrator).
- Use **`Rigidbody2D.linearVelocity`**, never the obsolete `velocity`. Reset **`Time.timeScale = 1f` in
  `Start()`** (the win sets it to `0`). Persist the best time with **`PlayerPrefs`** (integer key/value;
  call `PlayerPrefs.Save()`).

## Code presentation
- **New scripts are shown in full; edits use fragment-plus-verify.** A step that **creates a new script** shows
  its complete contents. A step that **edits a script created earlier** may show only a **precisely-placed
  fragment** — the added or replaced lines, with explicit placement ("ADD this method after `Move`", "REPLACE
  `Start` with this") — instead of re-printing the whole file, *provided* the milestone's `NN_verify.md`
  renders the complete current contents of every script that milestone touched.
- **The verify checkpoint holds the full files.** Each milestone's `NN_verify.md` renders the complete current
  contents of every script it touched, so the reader always has an authoritative copy to diff against.

## Testing / verification
- Every Done-when gate is an **observable Editor result** (a square resting on a platform at a Y you can read in
  the Inspector, the score Text incrementing, the WIN panel appearing and play freezing, the telegraph flash
  then the player falling *up*, an audible beep, a best-time number that survives quitting Play). No gate is
  "it works" — each names the exact thing the reader sees.
- **The JS-vs-Unity contrast is a verification artifact.** Each milestone's verify step states, in one line,
  what the sibling had to *code* that Unity did for free here (or vice-versa). Required, not optional.
