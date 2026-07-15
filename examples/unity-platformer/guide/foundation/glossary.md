# Glossary — Shape Jumper (Unity edition)

> Terms the guide introduces, defined in plain language. Ordered alphabetically. Each step links here on
> first use of a term. Grows as the ladder introduces concepts.

- **Active Input Handling** — the Player setting that decides which input system is live; it must include the
  **legacy Input Manager** for `Input.GetAxisRaw`/`GetButtonDown` to work. *(Introduced in [Milestone 3](../MILESTONE_3_move-and-jump/00_overview.md).)*
- **`AudioClip.Create`** — the API that builds an audio clip from raw sample data at runtime; we use it to
  synthesize beep tones instead of importing sound files. *(Introduced in [Milestone 7](../MILESTONE_7_sound-timer-restart/00_overview.md).)*
- **`AudioSource` / `AudioListener`** — the component that plays a clip (`AudioSource`) and the component (on the
  camera) that hears it (`AudioListener`); you need both for sound. *(Introduced in [Milestone 7](../MILESTONE_7_sound-timer-restart/00_overview.md).)*
- **`Awake` / `Start` / `Update` / `FixedUpdate`** — the `MonoBehaviour` lifecycle methods Unity calls for you:
  `Awake`/`Start` once at load, `Update` every frame (read input here), `FixedUpdate` every physics tick (apply
  velocity here). *(Introduced in [Milestone 3](../MILESTONE_3_move-and-jump/00_overview.md).)*
- **`BoxCollider2D` / `CircleCollider2D`** — components that give a GameObject a rectangular or circular
  collision shape so the physics engine can detect contact. *(Introduced in [Milestone 2](../MILESTONE_2_world-and-free-physics/00_overview.md).)*
- **Build Settings / Build Profiles** — the window listing which scenes ship and in what order; a scene must be
  here to be loaded by name, and index 0 is what loads first. In **Unity 6** it's **File → Build Profiles**
  (Ctrl+Shift+B), with the scenes under its **Scene List** section; it was called **Build Settings** before
  Unity 6. *(Introduced in [Milestone 1](../MILESTONE_1_main-menu/00_overview.md).)*
- **Canvas** — the root UI component; every uGUI element (Button, Text) must be a child of a Canvas, which
  decides how the UI is drawn on screen. *(Introduced in [Milestone 1](../MILESTONE_1_main-menu/00_overview.md).)*
- **Component** — a reusable piece of behavior or data you attach to a GameObject (a `Rigidbody2D`, a
  `BoxCollider2D`, a script); a GameObject *is* its list of components. *(Introduced in [Milestone 0](../MILESTONE_0_setup-and-editor/00_overview.md).)*
- **EventSystem** — the GameObject Unity auto-adds with a Canvas; it routes clicks/keys to UI elements so
  Buttons can fire. *(Introduced in [Milestone 1](../MILESTONE_1_main-menu/00_overview.md).)*
- **GameObject** — the basic thing in a scene: an empty container with a Transform (position/rotation/scale)
  that gains behavior only through the Components attached to it. *(Introduced in [Milestone 0](../MILESTONE_0_setup-and-editor/00_overview.md).)*
- **Grounded** — a flag that's true when the player is resting on a surface on the gravity-facing side, the only
  time a jump is allowed; we test it with a small overlap check against the ground layer. *(Introduced in [Milestone 3](../MILESTONE_3_move-and-jump/00_overview.md).)*
- **Hierarchy** — the left-hand panel listing every GameObject in the open scene, as a parent/child tree.
  *(Introduced in [Milestone 0](../MILESTONE_0_setup-and-editor/00_overview.md).)*
- **Inspector** — the right-hand panel showing the selected GameObject's components and their editable fields;
  where you tune almost everything. *(Introduced in [Milestone 0](../MILESTONE_0_setup-and-editor/00_overview.md).)*
- **LayerMask** — a filter naming which physics layers a check considers; the grounded test uses a "Ground"
  layer mask so it only counts platforms, not coins. *(Introduced in [Milestone 3](../MILESTONE_3_move-and-jump/00_overview.md).)*
- **`MonoBehaviour`** — the base class every Unity script inherits from; inheriting it is what lets a class be
  attached to a GameObject and receive the lifecycle callbacks. *(Introduced in [Milestone 1](../MILESTONE_1_main-menu/00_overview.md); revisited when the first gameplay script appears in [Milestone 3](../MILESTONE_3_move-and-jump/00_overview.md).)*
- **`Physics2D.gravity`** — the engine's single global gravity vector (default `(0, -9.81)`) applied to every
  dynamic `Rigidbody2D`; the twist flips its sign. *(Introduced in [Milestone 2](../MILESTONE_2_world-and-free-physics/00_overview.md).)*
- **`PlayerPrefs`** — Unity's simple key/value store that persists small values (ints/floats/strings) across
  Play sessions and app runs; we use it for the best time. Not a real save system. *(Introduced in [Milestone 7](../MILESTONE_7_sound-timer-restart/00_overview.md).)*
- **Play mode** — pressing the Play button runs the game inside the Editor; changes made during Play are
  discarded when you stop, so a persisted freeze (`Time.timeScale`) must be reset in code. *(Introduced in [Milestone 0](../MILESTONE_0_setup-and-editor/00_overview.md).)*
- **Prefab** — a saved GameObject template stored as an asset; you spawn many identical instances from it (every
  coin is an instance of one Coin prefab). *(Introduced in [Milestone 5](../MILESTONE_5_coins-goal-win/00_overview.md).)*
- **Project window** — the panel showing the files under `Assets/` (scenes, scripts, prefabs); your on-disk
  project contents. *(Introduced in [Milestone 0](../MILESTONE_0_setup-and-editor/00_overview.md).)*
- **`Rigidbody2D`** — the component that hands a GameObject to the 2D physics engine so it falls under gravity,
  carries velocity, and collides; Body Type **Dynamic** = fully simulated. *(Introduced in [Milestone 2](../MILESTONE_2_world-and-free-physics/00_overview.md).)*
- **Scene** — one screen or level of the game saved as a `.unity` file; this guide has two, `MainMenu` and
  `Game`. *(Introduced in [Milestone 1](../MILESTONE_1_main-menu/00_overview.md).)*
- **`SceneManager.LoadScene`** — the call that swaps the running scene by name (or build index); how Play →
  Game and Menu-button → MainMenu work. *(Introduced in [Milestone 1](../MILESTONE_1_main-menu/00_overview.md).)*
- **`[SerializeField]`** — an attribute that exposes a *private* field in the Inspector so you can tune it or
  wire a reference without making the field public. *(Introduced in [Milestone 3](../MILESTONE_3_move-and-jump/00_overview.md).)*
- **Sprite** — a 2D image; here always a plain **Square** or **Circle** primitive (`GameObject → 2D Object →
  Sprites`), never imported art. *(Introduced in [Milestone 0](../MILESTONE_0_setup-and-editor/00_overview.md).)*
- **Tag** — a short label you assign to a GameObject (e.g. `Coin`, `Goal`) and test with `CompareTag`, so one
  trigger handler can tell what it touched. *(Introduced in [Milestone 5](../MILESTONE_5_coins-goal-win/00_overview.md).)*
- **Telegraph** — a short visual warning shown before something happens (here, ~1 second before a gravity flip)
  so the change feels fair, not random-in-a-bad-way. *(Introduced in [Milestone 6](../MILESTONE_6_gravity-twist/00_overview.md).)*
- **`Time.timeScale`** — a global multiplier on game time; `0` freezes all physics/animation (the win state),
  `1` is normal. Must be reset to `1` on load because it persists. *(Introduced in [Milestone 5](../MILESTONE_5_coins-goal-win/00_overview.md).)*
- **Trigger (Is Trigger)** — a collider set to "Is Trigger" that detects overlap **without** blocking movement,
  firing `OnTriggerEnter2D` instead of a physical collision; coins and the goal are triggers. *(Introduced in [Milestone 5](../MILESTONE_5_coins-goal-win/00_overview.md).)*
- **uGUI** — Unity's classic GameObject-based UI system (Canvas + Button + Text), used here for the menu and
  HUD; distinct from the newer UI Toolkit. *(Introduced in [Milestone 1](../MILESTONE_1_main-menu/00_overview.md).)*
