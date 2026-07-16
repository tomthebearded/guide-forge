# PLAN — Shape Jumper (Unity edition): a 2D platformer from simple shapes, with a Main Menu

> **Stage-1 deliverable** (GuideForge `/plan-guide`). This is the plan the guide will be drafted from — the
> whole guide, in one drafting pass, after approval. It is **not** the guide. Nothing here is scaffolded yet
> except this file.
>
> **Status: awaiting approval.** On approval → `/scaffold-guide` stamps the skeleton, then `/draft-milestone`
> drafts the whole guide (M0→M7 in one pass).
>
> **Sibling guide:** this is the deliberate **engine-powered twin** of `examples/web-platformer/` (the
> zero-build vanilla-JS "Shape Jumper"). *Same game, opposite philosophy* — see §1.

---

## 1. Brief & audience model

### What we're building
A single-screen **2D platformer that runs in the Unity Editor**, built entirely from **Unity's primitive
shapes** (Square and Circle sprites — no art assets, no imported textures). The reader starts at a **Main
Menu** with a **Play** and a **Quit** button, presses Play, and drops into a level of rectangle platforms,
circle coins, and a goal. Every graphic is a plain shape; the whole aesthetic is "boxes and circles," exactly
like the JS sibling.

**The defining framing — same game, opposite philosophy.** In `web-platformer/` the reader *writes* the game
loop, gravity, and collision by hand — each is its own milestone of JavaScript. Here **Unity's engine provides
all three for free**: you add a `Rigidbody2D` and a `Collider2D` component and the object *falls and lands with
zero code you wrote*. That inversion is the whole point of the guide, and **every milestone and every verify
step draws the JS-vs-Unity contrast explicitly.** The consequence: **the reader writes no *gameplay* C# until
M3** — M1 adds only a tiny menu-button script, and M0/M2 are pure Editor and engine. The two guides are
valuable *as a pair*.

**The twist (parity with the sibling):** gravity **randomly flips** during play. At a random, telegraphed
interval, `Physics2D.gravity` inverts — the player falls to the *ceiling*, jumps away from it, platforms become
things you stand on from below — then flips back. In JS this was a sign-flip on a hand-written gravity value;
in Unity it is *literally flipping the engine's global gravity vector* — the sharpest possible illustration of
the contrast. A toggle disables it for calm debugging.

**Observable end state:** launch Unity → open the project → press Play → the **Main Menu** appears (title +
Play + Quit) → click **Play** → the **Game** scene loads → a square player rests on shape platforms → **←/→**
(or A/D) run, **Space** jumps → the player obeys gravity, lands on platforms, can't pass through them →
touching a circle coin removes it, bumps an on-screen score, and beeps → at random moments a telegraph flashes
and **gravity flips**, inverting up/down until it flips back → reaching the goal shows a **WIN** panel with this
run's **time** and the **best time** (saved across sessions via `PlayerPrefs`) → press **R** to restart or a
**Menu** button to return to the Main Menu. Developed on Windows in the Unity Editor.

### Audience model (per-topic expertise → explanation-depth policy)

Reader profile chosen in the interview: **"Codes, new to Unity"** — comfortable with programming in *some*
language, but **new to Unity, the Editor, game dev, and C#-as-used-in-Unity**. So C# *syntax* gets a light
touch (they can read a `for` loop), while everything Unity-shaped is taught from zero.

| Topic | Level | Depth policy applied in the guide |
|-------|-------|-----------------------------------|
| **The Unity Editor** (Hub, creating a project, the Hierarchy / Scene / Game / Inspector / Project windows, Play mode) | **New** | Fullest tier — define every panel on first use, screenshots-in-words ("the Inspector, the right-hand panel"), name every menu path exactly. This is the reader's "IDE" and it's unfamiliar. |
| **The GameObject / Component model** (a GameObject is a bag of Components; you build behavior by *adding* components, not writing classes) | **New — deepest tier** | The load-bearing mental model of the whole guide — taught with the fullest care and repeated at each use. This is *the* idea that makes Unity click. |
| **2D physics components** (`Rigidbody2D`, `BoxCollider2D`, `CircleCollider2D`, triggers, `Physics2D.gravity`, layers) | **New** | Define each on first use + official docs link + a "New concept" callout + failure notes. This is where "the engine does it for you" lives. |
| **Scenes & scene flow** (a scene is a level/screen; Build Settings; `SceneManager.LoadScene`) | **New** | Full definitions + docs link — the Menu→Game flow is built on this from M1. |
| **uGUI runtime UI** (Canvas, Button, Text/TextMeshPro, the EventSystem) | **New** | Teach the Canvas→Button→handler chain from zero for the menu and the HUD. |
| **C# as a scripting language** (the `MonoBehaviour` lifecycle: `Awake`/`Start`/`Update`/`FixedUpdate`; `[SerializeField]`; attaching a script to a GameObject) | **Beginner** | Reader knows programming, so no `for`-loop tutorials — but Unity's *lifecycle* and *editor-serialization* are new and get defined on first use + docs link + a brief why. |
| **C# language syntax itself** (variables, methods, `if`, classes) | **Intermediate** | One-line reminders at most; no fundamentals. The reader can code. |
| **Prefabs** (a saved, reusable GameObject template; instances; the coin prefab) | **New** | Define on first use + docs link; taught where coins are introduced (M5). |
| **Persistence** (`PlayerPrefs` for the best time) | **Beginner** | One-line reminder + docs link + the "not a real save system" caveat; the reader knows key/value stores. |
| **Procedural audio** (`AudioSource`, `AudioClip.Create`, a synthesized beep) | **New** | Provided as a complete helper; internals flagged as an optional deep-dive, with a "drop in a .wav instead" fallback. |

**Granularity: Highly granular / tutorial.** The smallest atomic steps — every Editor click, every menu path,
every Inspector field spelled out. Because most topics are **New**, nearly every step carries real teaching.
This composes with the matrix: C# syntax steps stay terse; Editor and physics steps are exhaustive.

### Scope boundaries (out of scope — deliberately)
- **Imported art, sprites, textures, animation, tilemaps.** *Shapes only* — Square and Circle sprites, solid
  colors. That is the whole aesthetic premise (shared with the sibling).
- **A scrolling camera / large levels.** The level fits one fixed camera view; no Cinemachine, no follow-cam,
  no viewport math. (Biggest scope-saver.)
- **Enemies, AI, hazards, lives/health, damage, death/respawn.** The only antagonist is the gravity twist.
- **The new Input System package.** We use the **legacy Input Manager** (zero setup) — see Hard constraints.
- **UI Toolkit (UXML/USS).** The menu and HUD use **uGUI** (Canvas/Button) — far more tutorial-friendly for a
  beginner. UI Toolkit is noted as the "later" path.
- **Multiple levels, a level editor, or level loading from files.** One hand-built Game scene (with a
  *randomized* twist schedule).
- **Building a standalone player** (Windows `.exe`, WebGL, mobile). The finish line is **Play mode in the
  Editor**. A one-paragraph "how to build for real" pointer is the only nod to it.
- **Physics tuning beyond what the gate needs** — no custom physics materials, joints, or effectors.
- **Version control / `.gitignore` for the Unity project** — mentioned in one conventions note, not taught.

### Hard constraints
- **Unity 6.5** (the newest tech-stream release), reader's explicit choice over 6.3 LTS. Pinned exactly in the
  Verified stack; the **non-LTS risk is logged** (see advise-back + decision log).
- **Shapes only** — every visible thing is a Square or Circle sprite (`GameObject → 2D Object → Sprites →
  Square/Circle`). No asset pipeline.
- **Legacy Input Manager**, not the new Input System — `Input.GetAxisRaw("Horizontal")` /
  `Input.GetButtonDown("Jump")` work with **zero project setup** (the axes exist by default). This is
  load-bearing: it's why M3 is short. *Project Setting to leave alone:* keep **Active Input Handling** at its
  default that includes the old manager.
- **A Main Menu is required** (reader's explicit ask) — it's M1, built before the gameplay, and it's how the
  reader first meets Scenes.
- **Desktop, Windows** for development; keyboard controls only.
- **As few scripts as possible** (see conventions): `MenuController`, `PlayerController`, `GameManager`,
  `Sfx` — four small scripts, no per-collectible scripts.

### Accepted feature additions (folded in — from the advise-back)
- **A telegraph before every gravity flip** (a ~1 s visual warning) — without it a random flip reads as a bug.
  Folded into **M6** as a required part of the twist (parity with the sibling).
- **A `twistEnabled` toggle** (a `[SerializeField] bool` on the GameManager) — lets the reader build and verify
  M2–M5 calmly, then switch the chaos on in M6. Folded into **M6**.
- **An on-screen HUD** (uGUI Text: score + timer) — the cheapest way to make coins and the timer *observable*,
  which every Done-when gate needs. Folded into **M5/M7**.
- **A one-key restart (`R`) and a "Menu" button on the win panel** — makes the loop replayable and closes the
  Menu→Game→Menu arc. Folded into **M7**.

### Long-run risks acknowledged (logged so the *why* survives → `decision-log.md`)
1. **Unity 6.5 is NOT an LTS release.** *(The headline risk.)* 6.5 is a tech-stream build (≈Jun 2026) with a
   shorter support window and more churn than **6.3 LTS** (supported to Dec 2027). Menu paths, package
   versions, and default settings can shift under a reader who installs a later 6.x. **Mitigation:** pin the
   exact patch in `stack.md`, state the LTS alternative plainly, and lean on `/review-before-follow` +
   `/update-stack` before following. The cheaper-stability alternative was 6.3 LTS; the reader accepted 6.5.
2. **Legacy Input Manager is the older path.** Unity steers new projects toward the Input System package. The
   legacy manager still ships and is zero-setup (which is *why* we use it), but it's "legacy." **Mitigation:**
   note the upgrade path once; treat it as a deliberate approachability trade-off.
3. **uGUI is mature but not Unity's strategic UI direction** (UI Toolkit is). For a beginner menu, uGUI is far
   more tutorial-friendly. **Mitigation:** note UI Toolkit as the "later" path in the decision log; don't mix
   the two.
4. **`PlayerPrefs` is not a real save system.** It's perfect for one best-time integer (the `localStorage`
   analogue) but not for real game saves. **Mitigation:** teach it as such and say so explicitly.
5. **Procedural audio (`AudioClip.Create`) is a step above beginner.** **Mitigation:** ship it as a complete
   `Sfx` helper, mark the buffer-filling internals "optional deep-dive," and offer a "drop in a short .wav"
   fallback so a stuck reader still gets sound.
6. **"Shapes-only, Editor-only" caps how far this scales.** No art, no build pipeline, one scene of gameplay.
   That's an accepted teaching trade-off (approachability now over a shippable game later), logged so a reader
   who outgrows it knows the next steps (import sprites, add Cinemachine, build a player).

---

## 2. Verified stack  *(Phase 0.5 — checked 2026-07-11)*

The reader installs **one** thing: the Unity Editor (via Unity Hub). Everything else — 2D physics, the UI
system, scene management, audio — ships **inside** the Editor, no packages to add. So the table pins the Editor
version and the **built-in modules/APIs** the milestones lean on.

| Tool / API | Pinned version | Latest stable (as of 2026-07-11) | Official docs | Notes |
|------------|----------------|----------------------------------|---------------|-------|
| **Unity Editor** | **Unity 6.5 — `6000.5.x`** (install the newest `6000.5` patch in the Hub; `6000.5.3f1` was current at the check) | 6.5 = `6000.5.3f1` (Jun 2026, **tech stream, non-LTS**); newest **LTS** = **6.3 `6000.3.19f1`** (Dec 2025 → supported Dec 2027) | https://unity.com/releases/unity-6 · https://docs.unity3d.com/6000.5/Documentation/Manual/ | Reader chose 6.5 over LTS (§1 risk 1). Install with the **2D** template. |
| **Unity Hub** | latest | latest | https://unity.com/unity-hub | The launcher that installs Editor versions and creates projects. |
| **C# (Unity scripting)** | Unity 6.5's bundled runtime (Mono) | — | https://docs.unity3d.com/6000.5/Documentation/Manual/ScriptingSection.html | No separate install; scripts compile inside the Editor. Reader writes `MonoBehaviour` classes. |
| `Rigidbody2D.linearVelocity` (`Vector2`) | Unity 6.x | current | https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Rigidbody2D-linearVelocity.html | **Load-bearing:** the pre-Unity-6 `Rigidbody2D.velocity` is **obsolete** — use `linearVelocity` (and `linearVelocityX/Y`). Verified 2026-07-11. |
| Legacy **Input Manager** (`Input.GetAxisRaw`, `Input.GetButtonDown`) | built-in | current | https://docs.unity3d.com/6000.5/Documentation/Manual/class-InputManager.html | `"Horizontal"` axis and `"Jump"` button exist **by default** — no setup. Keep **Active Input Handling** on its default (includes the old manager). |
| **`Physics2D.gravity`** (`Vector2`, default `(0, -9.81)`) | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Physics2D-gravity.html | The twist flips this vector's sign. |
| **uGUI** (Canvas, Button, EventSystem, TextMeshPro) | built-in (`com.unity.ugui`) | current | https://docs.unity3d.com/6000.3/Documentation/Manual/com.unity.ugui.html · Canvas: https://docs.unity3d.com/Packages/com.unity.ugui@2.6/manual/class-Canvas.html | The menu + HUD. `GameObject → UI → Button - TextMeshPro` (first use offers to import TMP Essentials — accept it). |
| **`SceneManager.LoadScene`** (`using UnityEngine.SceneManagement;`) | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/SceneManagement.SceneManager.LoadScene.html | `LoadScene(string sceneName)` — both scenes must be added to **Build Settings**. |
| **`AudioSource` + `AudioClip.Create`** | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/AudioClip.Create.html | Synthesized beeps — no audio files (the engine analogue of the sibling's Web Audio oscillator). |
| **`PlayerPrefs`** (`GetInt`/`SetInt`/`Save`) | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/PlayerPrefs.html | Best-time persistence (the `localStorage` analogue). Integer key/value; not a real save system. |
| **`Time.timeScale`** | built-in | current | https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Time-timeScale.html | Win freezes play with `= 0f`; **reset to `1f` in `GameManager.Start()`** so a freeze can't persist across Play sessions. |

**Verified facts steps must honor (load-bearing):**
- Set player horizontal motion via **`Rigidbody2D.linearVelocity`**, never the obsolete `velocity`.
- Read input via the **legacy** `Input.GetAxisRaw("Horizontal")` / `Input.GetButtonDown("Jump")` — no Input
  System package.
- Both scenes (`MainMenu`, `Game`) must be in **Build Settings**; `MainMenu` at **build index 0**.
- Unity Y is **UP** (positive up) — the *opposite* of the sibling's Canvas Y-down. Default gravity is
  `(0, -9.81)`; the twist flips it to `(0, +9.81)`. Jump impulse is **opposite the gravity sign**.
- **Reset `Time.timeScale = 1f` in `Start()`** — the win state sets it to `0`, and it would otherwise persist.
- Accept the **TextMeshPro Essentials** import prompt the first time you add a TMP UI element.

**Verification caveat (honesty — read this):** Unity is a GUI application plus a physics/render engine; unlike
the JS sibling it **cannot be exercised headlessly in this authoring environment.** The guide's steps, menu
paths, API names, and code are authored and cross-checked against the official docs above, **but were not run
in the Unity Editor by the author.** A person must open Unity 6.5, follow the guide, and tick each Done-when
gate. `status.md` will mark milestones **📝 drafted (author-unverified)**, never ✅, until that happens.

---

## 3. Foundation docs (the cross-cutting layer — `/scaffold-guide` stamps these)

- **README** (guide front door) — objective/observable end state, the one-line stack summary ("Unity 6.5, 2D,
  shapes only, legacy input, uGUI"), the **4 headline decisions** (engine-does-the-loop/gravity/collision so
  code is deferred to M3; menu-first two-scene flow; tag-based pickups with four small scripts; twist = flip
  `Physics2D.gravity` with sign-aware jump), an **Updates** log, a **"Following this guide"** note (type the
  code, don't paste; the complete scripts are a reference to diff against), and — prominently — the
  **sibling-guide contrast** with `web-platformer/` and the **author-unverified** caveat. Links to detail docs;
  doesn't duplicate them.
- **`foundation/stack.md`** — the Verified-stack table above + the load-bearing API facts. Every step imports
  its API spellings, menu paths, and version claims from here.
- **`foundation/audience.md`** — the per-topic matrix + Highly-granular setting, as the guide's north star.
- **`foundation/conventions.md`** — the Editor/code/architecture rules (below), referenced everywhere.
- **`foundation/glossary.md`** — running plain-language definitions: Unity Hub, project, scene, GameObject,
  Component, Inspector, Hierarchy, Prefab, sprite, `Rigidbody2D`, `Collider2D`, trigger, tag, layer,
  `MonoBehaviour`, `Awake`/`Start`/`Update`/`FixedUpdate`, `[SerializeField]`, Canvas/Button/EventSystem,
  Build Settings, `Physics2D.gravity`, "grounded", `AudioClip`, `PlayerPrefs`, `Time.timeScale`, telegraph.
  Grows as milestones introduce terms.
- **`foundation/status.md`** — the single source of truth for what is actually built and **verified** vs. what
  the guide intends. Seeds every milestone at **📝 drafted (author-unverified)** given the caveat above.
- **`foundation/decision-log.md`** — non-obvious choices + rationale, seeded with the 6 risks and 4 accepted
  additions above, plus the 4 headline decisions.

### Conventions the guide will follow (`conventions.md`)
- **The Editor is the tool; code is the exception.** Prefer configuring behavior by adding/adjusting
  **Components in the Inspector** over writing scripts. A milestone that can be done with components uses
  components. This is *why* the reader writes no *gameplay* code until M3 (M1's small menu script aside) — and
  it's the spine of the JS contrast.
- **Two scenes, menu at build index 0.** `MainMenu.unity` (index 0) and `Game.unity` (index 1), both in Build
  Settings. `SceneManager.LoadScene("Game")` and `("MainMenu")` move between them by **exact name**.
- **Four small scripts, tag-driven pickups.** `MenuController` (menu buttons), `PlayerController` (move, jump,
  and *all* pickup handling), `GameManager` (score, win, timer, best time, the twist), `Sfx` (beeps). **No
  per-object Coin/Goal scripts** — coins and the goal are detected in
  `PlayerController.OnTriggerEnter2D` by **tag** (`CompareTag("Coin")` / `CompareTag("Goal")`).
- **`[SerializeField] private` for tunables.** Speeds, jump force, twist interval, colors, and cross-object
  references are `[SerializeField] private` fields set in the **Inspector** — never public fields, never
  hard-coded magic numbers buried in methods. "What I tune" lives in the Inspector; "what runs" lives in code.
- **Everything collides as a box or circle.** Player + platforms use `BoxCollider2D`; coins use a
  `CircleCollider2D` marked **Is Trigger**; the goal a trigger `BoxCollider2D`. The player is the only
  `Rigidbody2D` (Dynamic); platforms are static (no Rigidbody2D).
- **Gravity is the engine's global vector; the twist flips its sign.** All "which way is down" logic reads the
  **sign of `Physics2D.gravity.y`**; jump pushes **opposite** that sign; "grounded" means "a surface on the
  gravity-facing side." **No script hard-codes 'down'** — this is what makes the M6 twist a small change (the
  direct analogue of the sibling's signed-gravity integrator).
- **Physics in `FixedUpdate`, input in `Update`.** Read `GetButtonDown` in `Update` (so a press is never
  missed), apply velocity in `FixedUpdate` (the physics tick). Taught at M3.
- **Load-bearing names** (must match exactly — flagged at first use): scene names `MainMenu`/`Game`, the tags
  `Coin`/`Goal`, the input names `"Horizontal"`/`"Jump"`, the ground `LayerMask`, and every
  `[SerializeField]` reference wired in the Inspector. **Cosmetic** (free to change): all colors, shape sizes,
  the game title, exact platform positions, tuning numbers.
- **Naming:** `PascalCase` for scripts/classes/methods (C# convention), `camelCase` for private fields, one
  script per file named after its class.

---

## 4. Milestone ladder

Order is strict-by-dependency; each milestone is a runnable slice with an observable **Done-when** gate. The
**reality-check gate is M4** — the first point it's a real, playable platformer worth finishing. Note the
arc: **M0 and M2 contain no C# at all** (setup + Editor + engine physics), M1 adds only a small menu-button
script, and the first **gameplay** script appears at **M3**.

| # | Milestone | Proves (end state) | Depends on | Done-when (one line) |
|---|-----------|--------------------|------------|----------------------|
| **M0** | Install Unity & meet the Editor | The reader has Unity 6.5, a 2D project, and can name the core Editor windows | — | Unity Hub opens the new **2D** project; a Square sprite dragged into the scene appears in Game view; reader can point to Hierarchy / Scene / Inspector / Project |
| **M1** | The Main Menu *(no gameplay code)* | A menu scene with a title + Play + Quit, wired to load an (empty) Game scene | M0 | Press Play → menu shows → **Play** loads the `Game` scene (a blank colored scene) → **Quit** logs "Quit" in the Editor; both scenes are in Build Settings |
| **M2** | The world & **free** physics *(still no code)* | A player square that **falls and lands on the ground by engine alone** | M1 | Add `Rigidbody2D` + `BoxCollider2D` to a Square and a ground → press Play → it **falls and stops on the ground** with **not one line of C# written** (the contrast moment) |
| **M3** | Move & jump — **first C#** | `PlayerController` reads input and drives the body: run + one jump | M2 | ←/→ (A/D) move the square via `linearVelocity`; **Space** jumps once; no double-jump while airborne; motion is smooth |
| **M4** ⭐ *reality-check gate* | Platforms & a real level | A hand-built level of shape platforms you can traverse | M3 | Player lands on every platform, can't pass through tops/sides; **stop and actually play it for a minute** — is it fun enough to finish? |
| **M5** | Coins, goal, win & HUD | Collect circle coins (score up) and reach the goal to win | M4 | Touching a **Coin**-tagged circle removes it + increments an on-screen score; touching the **Goal** shows a **WIN** panel and freezes play (`Time.timeScale = 0`) |
| **M6** | The random twist — gravity flips | `Physics2D.gravity` randomly inverts (telegraphed); platforming works upside-down | M5 | At a random interval a ~1 s telegraph flashes, then gravity flips: the player falls to the ceiling and can jump off it; it flips back; `twistEnabled = false` disables it |
| **M7** | Sound, timer, best time & restart | Audio feedback + completion timer + persisted best time + restart + back-to-menu | M6 | Jump/coin/win each beep; the WIN panel shows this run's time and the best time; best time **survives quitting Play**; **R** restarts; a **Menu** button returns to `MainMenu` |

### Sittings (natural pause points inside the larger milestones)
- **M0** — (a) install Unity Hub + Unity 6.5; (b) create a 2D project; (c) a guided tour of the five windows +
  Play mode; (d) drag one Square sprite in to prove the pipeline.
- **M1** — (a) make the `MainMenu` scene + a Canvas; (b) add a title + Play + Quit buttons (TMP); (c) make an
  empty `Game` scene, add both to Build Settings; (d) the tiny `MenuController` (Play→LoadScene, Quit→Application.Quit) wired to the buttons.
- **M2** — (a) build the Game scene's player Square + a ground Square (colors, sizes, camera); (b) add a
  Dynamic `Rigidbody2D` + `BoxCollider2D` to the player → it falls; (c) add a `BoxCollider2D` to the ground →
  it lands; (d) the explicit "you wrote zero code" contrast callout.
- **M3** — (a) create `PlayerController`, attach it, `[SerializeField]` the speed/jump/ground fields; (b)
  horizontal move via `GetAxisRaw` → `linearVelocity` in `FixedUpdate`; (c) a ground LayerMask +
  `Physics2D.OverlapCircle` grounded check; (d) the jump impulse (opposite gravity sign) gated on grounded,
  input read in `Update`.
- **M4** — (a) duplicate the ground into several platforms + arrange a level; (b) freeze player rotation, tune
  speeds/jump; (c) **reality-check**: play it, decide it's worth finishing.
- **M5** — (a) a **Coin** prefab (Circle sprite, trigger `CircleCollider2D`, `Coin` tag) + scatter instances;
  (b) `OnTriggerEnter2D` → `CompareTag("Coin")` → destroy + `GameManager.AddScore`; (c) the uGUI HUD (score
  text); (d) a **Goal** (trigger, `Goal` tag) → WIN panel + `Time.timeScale = 0`.
- **M6** — (a) `[SerializeField]` twist interval range + `twistEnabled` + a randomized next-flip time; (b) the
  ~1 s telegraph (flash a panel / tint); (c) flip `Physics2D.gravity` and let jump/grounded read the new sign;
  (d) a visual cue (background tint) so the flipped state is obvious.
- **M7** — (a) the `Sfx` helper (`AudioClip.Create` sine beep + `AudioSource.PlayOneShot`); (b) wire beeps to
  jump/coin/win; (c) the run timer (HUD) + `PlayerPrefs` best-time read/guard/write with `Start()`
  `timeScale` reset; (d) the `R` restart (reload `Game`) + a **Menu** button (load `MainMenu`).

---

## 5. Templates

### Per-step template (Highly-granular tuning)
```
# <Milestone> · Step NN of <TOTAL> — <single action title>
> Nav: [← prev](PREV.md) · [Milestone overview](00_overview.md) · [next →](NEXT.md)   ← MUST be line 2, no blank line under the H1

## Glossary for this step        (only terms THIS step introduces; omit if none)
## Why / design                  (the rationale + the JS-vs-Unity contrast where it applies; omit only if pure mechanics)
## Do this                       (numbered atomic actions — every Editor click / menu path / Inspector field; each says WHERE + WHAT + WHY)
## Code                          (complete script file(s), never partial snippets; omit if no code this step)
## Done when (this step)         (the sub-slice of the milestone gate this step satisfies, with the EXACT observable result in the Editor)
## If it breaks                  (the most likely error + first thing to check)
```

Editor-heavy steps lead with **"Do this"** (numbered clicks through exact menu paths); script steps show a
**complete script file** (never a partial snippet) and name exactly what changed and why. When a step edits an
existing script, it shows that file **in full**.

### Milestone-overview template (`00_overview.md`)
```
# <Milestone N> — <title>
Goal · The JS-vs-Unity contrast for this milestone · Scope discipline (what this milestone deliberately does NOT do) ·
Prerequisite (prior gate green) · Steps-at-a-glance (grouped into the sittings above) · Design/decisions folded in ·
Done-when gate (aggregated, observable in the Editor) · Handoff (what now exists · open issues · pointer to next milestone)
```

---

## 6. Writing contract

### Pedagogical rules (every step must satisfy these)
1. **Explain every concept on first use — at its topic's tier** (matrix in §1): Unity concepts (windows,
   components, scenes, prefabs, `MonoBehaviour` lifecycle) get the **New** tier — inline definition or a "New
   concept" callout on its own line, an official docs link from `stack.md`, and a brief *why*. C# *syntax*
   gets at most a one-line reminder (reader codes). Never a bare Unity term with no gloss and no link.
2. **Every action says WHERE** — the exact window/panel and menu path (e.g. *"in the **Hierarchy** (left
   panel), right-click → **2D Object → Sprites → Square**"*), or the exact Inspector field. Never assume the
   reader can find a thing in the Editor.
3. **Every action says WHAT it does and WHY** — the reader finishes understanding the mechanism (why a
   `Rigidbody2D` makes it fall, why input in `Update` but physics in `FixedUpdate`, why jump is opposite the
   gravity sign), not just having clicked it.
4. **Be exact where the outcome depends on it** — concrete Inspector values (Gravity Scale, collider sizes,
   speeds), exact input names (`"Horizontal"`, `"Jump"`), exact scene names (`MainMenu`, `Game`) and tags
   (`Coin`, `Goal`); say explicitly where a value is free (colors, sizes, positions) vs load-bearing.
5. **Separate MANDATORY from ILLUSTRATIVE** — what the Done-when gate needs vs an embellishment (extra
   platforms, a nicer color, a second coin) marked optional.
6. **State which fields to change and which to LEAVE AT DEFAULT** — exhaustive per Component and per Inspector
   panel (e.g. "set **Body Type = Dynamic**, leave **Mass/Linear Drag** at default"), so the reader never
   wonders "was I supposed to touch something else?"
7. **Teach the recurring mental models at point of use** — (a) *a GameObject is a bag of Components; you build
   behavior by adding components*; (b) *the engine runs the loop, gravity, and collision — you mostly react in
   `Update`/`FixedUpdate`/`OnTriggerEnter2D`*; (c) *"down" is the sign of `Physics2D.gravity.y`; jump is
   opposite it — that's why the twist is cheap*. Repeat each where it recurs.
8. **Flag load-bearing names vs cosmetic** before the reader types/clicks (scene names, tags, input names, the
   ground layer, `[SerializeField]` references are load-bearing; colors/sizes/positions/title are not).
9. **Sequences are numbered lists, never arrow-chains** — arrows only for a single menu path within one action
   (`2D Object → Sprites → Square`); the moment a chain spans two things the reader *does*, split into numbered
   steps.
10. **Name the common failure + its usual cause** — nothing falls (no `Rigidbody2D`, or Body Type not Dynamic);
    falls through the ground (ground has no `Collider2D`, or player collider mis-sized); can't move (script not
    attached, or a field unwired in the Inspector, or used obsolete `velocity`); jump does nothing (grounded
    check wrong layer, or read in `FixedUpdate`); Play loads a black screen (scene not in Build Settings, or
    wrong name string); no coin pickup (collider not **Is Trigger**, or tag misspelled); freeze persists across
    Play (didn't reset `Time.timeScale` in `Start()`); no sound (no `AudioSource`/`AudioListener`, or clip not
    created); best time never saves (forgot `PlayerPrefs.Save`).

### Verification design (Phase 5)
- **Every gate shows expected Editor output** — not "it works" but the exact observable: the square resting on
  the ground at a Y you can read in the Inspector, the score text incrementing, the WIN panel appearing and
  play freezing, the telegraph flash then the player falling *up*, the best-time number persisting after you
  stop and re-enter Play, the audible beep.
- **The JS-vs-Unity contrast is a verification artifact** — each milestone's verify step states, in one line,
  *what the sibling had to code that Unity did for free here* (or vice-versa). This is required, not optional.
- **Consistency check before ship** — every script uses the same scene names, tags, input names, and
  `[SerializeField]` field names; no step reintroduces the obsolete `Rigidbody2D.velocity` or hard-codes a
  gravity direction; the two scenes and their build indices match everywhere.
- **Troubleshooting sheet** — the first-timer traps from rule 10, each with the one-line fix, plus the "accept
  TMP Essentials import" note and the "keep legacy Input in Active Input Handling" note.
- **Reconcile-before-follow** — Unity moves fast and 6.5 is non-LTS: if a menu path, default, or API has
  drifted when the reader follows, **reality wins** — patch the step and log the drift in `status.md`.
  (`/review-before-follow` + `/update-stack` support this.) Given the author-unverified caveat, the *first*
  hands-on follow-through is itself the verification pass.

---

## 7. Folder / file layout (canonical skeleton — filled with real slugs)

```
examples/unity-platformer/
  guide/
    PLAN.md                           ← THIS FILE (the only thing written now)
    README.md                         ← front door (scaffold)
    TOKEN_USAGE.md                    ← the one cost ledger (metered by the hook; scaffold seeds row 1 from the cost line below)
    feedback-log.md                   ← reader-friction log (scaffold)
    foundation/
      stack.md  audience.md  conventions.md  glossary.md  status.md  decision-log.md
    MILESTONE_0_setup-and-editor/          00_overview.md … NN_verify.md
    MILESTONE_1_main-menu/
    MILESTONE_2_world-and-free-physics/
    MILESTONE_3_move-and-jump/
    MILESTONE_4_platforms-and-level/
    MILESTONE_5_coins-goal-win/
    MILESTONE_6_gravity-twist/
    MILESTONE_7_sound-timer-restart/
```

The Unity project the reader builds (created *inside* the steps, not scaffolded now) — Unity generates
`Library/`, `Packages/`, `ProjectSettings/`; the reader authors only `Assets/`:
```
ShapeJumper/                     ← the Unity project (created in M0 via the Hub)
  Assets/
    Scenes/
      MainMenu.unity             ← build index 0 — title + Play + Quit
      Game.unity                 ← build index 1 — the platformer
    Scripts/
      MenuController.cs          ← Play → LoadScene("Game"); Quit → Application.Quit()   (M1)
      PlayerController.cs        ← move + jump (linearVelocity, sign-aware) + OnTriggerEnter2D pickups (M3/M5/M6)
      GameManager.cs             ← score, win (timeScale), timer, best time (PlayerPrefs), the twist (M5/M6/M7)
      Sfx.cs                     ← AudioClip.Create beeps via AudioSource (M7)
    Prefabs/
      Coin.prefab                ← Circle sprite + trigger CircleCollider2D + "Coin" tag (M5)
  (Library/ Packages/ ProjectSettings/  ← Unity-generated, not authored)
```
`MainMenu` is **build index 0** and `Game` is **build index 1** — load-bearing, stated in M1.

---

## 8. First move

`/draft-milestone` drafts the **whole guide in one pass** — every milestone M0→M7 in ladder order,
back-to-back — so the reader has the finished guide before building. Once drafted I reconcile `status.md` (all
milestones **📝 drafted, author-unverified** — see the caveat in §2) + the README Updates log + `examples/README.md`
and run a dead-link check. The reader then installs Unity 6.5, follows the guide, and verifies each Done-when
gate in the Editor — that first hands-on follow-through *is* the verification the author could not run.

**Do not draft yet.** This plan is the deliverable. Next steps in order:
1. You approve (or adjust) this plan.
2. `/scaffold-guide` stamps the README + 6 foundation docs + milestone-overview placeholders.
3. `/draft-milestone` drafts the whole guide (M0→M7).

---

*Planning cost (est.): 2026-07-11 ~10:40 UTC · `plan-guide` · ~55k tokens in / ~9k out ≈ 64k total ·
rough est. (Claude can't meter its own tokens mid-run) — `/scaffold-guide` seeds `TOKEN_USAGE.md` row 1 from
this line.*
