# Verified stack — Shape Jumper (Unity edition)

> Pinned Editor version, built-in modules, and official docs for this guide, verified online on **2026-07-11**.
> The reader installs **one** thing — the Unity Editor (via Unity Hub). Everything else (2D physics, uGUI, scene
> management, audio, persistence) ships **inside** the Editor, no packages to add. This table pins the Editor
> version and the built-in APIs the milestones lean on. If you're following this later, re-check the version
> notes — **6.5 is a non-LTS tech-stream release** and can drift; reconcile before following (the
> review-before-follow gate).

| Tool / API | Pinned version | Latest stable (as of 2026-07-11) | Official docs | Notes |
|------------|----------------|----------------------------------|---------------|-------|
| **Unity Editor** | **Unity 6.5 — `6000.5.x`** (install the newest `6000.5` patch in the Hub; `6000.5.3f1` was current at the check) | 6.5 = `6000.5.3f1` (Jun 2026, **tech stream, non-LTS**); newest **LTS** = **6.3 `6000.3.19f1`** (Dec 2025 → supported Dec 2027) | https://unity.com/releases/unity-6 · https://docs.unity3d.com/6000.5/Documentation/Manual/ | Reader chose 6.5 over LTS (see [D1](decision-log.md#d1--pin-unity-65-tech-stream-not-63-lts)). Install with the **2D (Built-In Render Pipeline)** template. |
| **Unity Hub** | latest | latest | https://unity.com/unity-hub | The launcher that installs Editor versions and creates projects. |
| **C# (Unity scripting)** | Unity 6.5's bundled Mono runtime | — | https://docs.unity3d.com/6000.5/Documentation/Manual/ScriptingSection.html | No separate install; scripts compile inside the Editor. You write `MonoBehaviour` classes. |
| `Rigidbody2D.linearVelocity` (`Vector2`) | Unity 6.x | current | https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Rigidbody2D-linearVelocity.html | **Load-bearing:** the pre-Unity-6 `Rigidbody2D.velocity` is **obsolete** — use `linearVelocity` (and `linearVelocityX/Y`). Verified 2026-07-11. |
| Legacy **Input Manager** (`Input.GetAxisRaw`, `Input.GetButtonDown`) | built-in | current | https://docs.unity3d.com/6000.5/Documentation/Manual/class-InputManager.html | The `"Horizontal"` axis and `"Jump"` button exist **by default** — no setup. Keep **Active Input Handling** on its default (must include the old manager). See [D6](decision-log.md#d6--legacy-input-manager-not-the-input-system). |
| **`Physics2D.gravity`** (`Vector2`, default `(0, -9.81)`) | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Physics2D-gravity.html | The twist flips this vector's sign. |
| **uGUI** (Canvas, Button, EventSystem, TextMeshPro) | built-in (`com.unity.ugui`) | current | https://docs.unity3d.com/6000.3/Documentation/Manual/com.unity.ugui.html · Canvas: https://docs.unity3d.com/Packages/com.unity.ugui@2.6/manual/class-Canvas.html | The menu + HUD. `GameObject → UI → Button - TextMeshPro`; the first TMP element offers to import **TMP Essentials** — accept it. See [D7](decision-log.md#d7--ugui-not-ui-toolkit). |
| **`SceneManager.LoadScene`** (`using UnityEngine.SceneManagement;`) | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/SceneManagement.SceneManager.LoadScene.html | `LoadScene(string sceneName)` — both scenes must be added to the **Scene List** via **File → Build Profiles** (pre-Unity-6: Build Settings). |
| **`AudioSource` + `AudioClip.Create`** | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/AudioClip.Create.html | Synthesized beeps — no audio files (the engine analogue of the sibling's Web Audio oscillator). |
| **`PlayerPrefs`** (`GetInt`/`SetInt`/`Save`) | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/PlayerPrefs.html | Best-time persistence (the `localStorage` analogue). Integer key/value; not a real save system (see [D8](decision-log.md#d8--playerprefs-for-the-best-time)). |
| **`Time.timeScale`** | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Time-timeScale.html | Win freezes play with `= 0f`; **reset to `1f` in `GameManager.Start()`** so a freeze can't persist across Play sessions. |

## Install (the exact steps, at the pinned version)
```text
1. Download Unity Hub from https://unity.com/unity-hub and install it.
2. In the Hub → Installs → Install Editor → pick the newest Unity 6.5 (6000.5.x) build → include the
   "Windows Build Support" module (default). No other modules needed.
3. In the Hub → Projects → New project → choose the "2D (Built-In Render Pipeline)" template →
   name it "ShapeJumper" → Create.
That is the only install. Everything else is built into the Editor.
```

## Reference pages the milestones lean on (deep-linked)
- Unity Manual (6.5 home) — https://docs.unity3d.com/6000.5/Documentation/Manual/
- Rigidbody2D — https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Rigidbody2D.html
- Colliders 2D & triggers — https://docs.unity3d.com/6000.5/Documentation/Manual/collider-types-introduction.html
- The conventional MonoBehaviour lifecycle (Awake/Start/Update/FixedUpdate) — https://docs.unity3d.com/6000.5/Documentation/Manual/execution-order.html
- uGUI (Canvas, Button, EventSystem) — https://docs.unity3d.com/6000.3/Documentation/Manual/com.unity.ugui.html
- Scenes & Build Settings — https://docs.unity3d.com/6000.5/Documentation/Manual/CreatingScenes.html

## Version notes
- **6.5 is a tech-stream release, NOT LTS.** It gets a shorter support window and more churn than 6.3 LTS
  (supported to Dec 2027). The reader chose it to be on the literal newest; menu paths, package versions, and
  defaults can shift under a later 6.x. Re-run review-before-follow if following much later. —
  https://unity.com/releases/unity-6
- **`Rigidbody2D.velocity` is obsolete.** Unity 6 renamed it to `linearVelocity` (with `linearVelocityX/Y`).
  Old tutorials using `velocity` will warn or error. —
  https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Rigidbody2D-linearVelocity.html
- **Legacy input is a choice, not the default direction.** Unity steers new projects toward the Input System
  package; we use the legacy Input Manager because its `"Horizontal"`/`"Jump"` axes work with zero setup. Keep
  **Edit → Project Settings → Player → Active Input Handling** on a value that includes the old manager. —
  https://docs.unity3d.com/6000.5/Documentation/Manual/class-InputManager.html
- **First TMP element triggers an import.** Adding a `Button - TextMeshPro` (or any TMP text) the first time
  pops "Import TMP Essentials" — accept it, or the text won't render.

## Load-bearing API facts (steps must honor these exact spellings)
- Set player horizontal motion via **`Rigidbody2D.linearVelocity`**, never the obsolete `velocity`.
- Read input via the **legacy** `Input.GetAxisRaw("Horizontal")` / `Input.GetButtonDown("Jump")` — no Input
  System package. Read `GetButtonDown` in `Update`; apply velocity in `FixedUpdate`.
- Both scenes (`MainMenu`, `Game`) must be in **Build Settings**; `MainMenu` at **build index 0**.
- Unity Y is **UP** (positive up) — the *opposite* of the sibling's Canvas Y-down. Default gravity is
  `(0, -9.81)`; the twist flips it to `(0, +9.81)`. Jump impulse is **opposite the gravity sign**.
- **Reset `Time.timeScale = 1f` in `GameManager.Start()`** — the win state sets it to `0`, and it would
  otherwise persist into the next Play session.
- Accept the **TextMeshPro Essentials** import prompt the first time you add a TMP UI element.

## Verification caveat (honesty — read this)
Unity is a GUI application plus a physics/render engine; unlike the JS sibling it **cannot be exercised
headlessly in the authoring environment.** The guide's steps, menu paths, API names, and code were authored and
cross-checked against the official docs above, **but were not run in the Unity Editor by the author.** A human
must open Unity 6.5, follow the guide, and tick each Done-when gate. `status.md` marks every milestone **📝
drafted (author-unverified)**, never ✅, until that happens.
