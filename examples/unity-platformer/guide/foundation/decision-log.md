# Decision log — Shape Jumper (Unity edition)

> Why the guide is the way it is. Each entry: the decision, the reasoning, and what it rules out.
> Seeded from the approved plan's acknowledged risks and accepted feature additions.

## D1 — Pin Unity 6.5 (tech stream), not 6.3 LTS
- **Date:** 2026-07-11
- **Source:** the audience interview (reader chose "6.5, the newest" over the LTS option).
- **Decision:** pin **Unity 6.5** (`6000.5.x`), the newest tech-stream release, rather than the current LTS
  (6.3, `6000.3.19f1`, supported to Dec 2027).
- **Why:** the reader explicitly wanted the literal latest version.
- **Rules out / trade-off:** 6.5 is **non-LTS** — a shorter support window and more churn than 6.3 LTS. Menu
  paths, package versions, and defaults can drift under a reader who installs a later 6.x, and 6.5 may be
  superseded sooner. Accepted: newest-now over maximum stability.
- **Revisit if:** guide longevity starts to matter more than being on the newest build — re-pin to the current
  LTS with `/update-stack` and reconcile the changed steps.

## D2 — The engine does the work; code is deferred to M3
- **Date:** 2026-07-11
- **Source:** the sibling-guide framing (`web-platformer/`) + Phase 2 design.
- **Decision:** No **gameplay** C# is written until M3. M0 and M2 use **only the Editor and built-in
  components**, and M1's only script is a tiny menu-button wiring file (`MenuController`) — not gameplay code.
  A `Rigidbody2D` + `Collider2D` makes the player fall and land with no script; the first *gameplay* script
  (`PlayerController`) appears at M3.
- **Why:** the whole value of this guide is the contrast with the JS sibling, where the loop, gravity, and
  collision were each hand-written milestones. Showing that Unity provides all three "for free" is the lesson —
  and it's only legible if the reader experiences building a falling, landing player with zero code first.
- **Rules out / trade-off:** a reader impatient to write *gameplay* code waits until M3 (M1's menu script is
  the one small exception). Accepted: the deferral *is* the teaching.
- **Revisit if:** never expected to — the deferred-code arc is the guide's identity.

## D3 — Menu-first, two scenes
- **Date:** 2026-07-11
- **Source:** the audience interview (a Main Menu was a hard requirement) + design.
- **Decision:** build the **`MainMenu`** scene (build index 0) *before* any gameplay, with Play + Quit buttons;
  `Game` is a second scene (index 1). `SceneManager.LoadScene` moves between them by name.
- **Why:** the reader asked for a menu, and a menu is the gentlest possible first encounter with Scenes, the
  Canvas/Button UI, and one tiny script — before the physics arrives. It also closes the Menu→Game→Menu arc.
- **Rules out / trade-off:** a hair more setup (two scenes, Build Settings) before the player moves. Trivial.
- **Revisit if:** adding more screens (settings, level select) — the two-scene pattern extends naturally.

## D4 — Four small scripts, tag-based pickups
- **Date:** 2026-07-11
- **Source:** Phase 2 design (carried from the prior Unity example's "minimal scripts" rule, relaxed for scope).
- **Decision:** exactly four scripts — `MenuController`, `PlayerController`, `GameManager`, `Sfx`. Coins and the
  goal have **no scripts of their own**; they're detected by **tag** (`CompareTag("Coin")` / `"Goal"`) in
  `PlayerController.OnTriggerEnter2D`.
- **Why:** fewest moving parts for someone new to Unity. One place handles all pickups; new collectibles are a
  tag + a branch, not a new class. (The menu, the twist, and audio each justify one focused script beyond the
  player/manager pair.)
- **Rules out / trade-off:** doesn't scale to many distinct interactive object types (each would want its own
  behavior). Accepted for a shapes-only mini-game.
- **Revisit if:** the game grows many kinds of interactive objects — then per-object components earn their keep.

## D5 — Twist = flip `Physics2D.gravity`; sign-aware jump
- **Date:** 2026-07-11
- **Source:** the sibling's twist (parity) + design.
- **Decision:** the gravity flip **inverts the engine's global `Physics2D.gravity` vector** on a random,
  telegraphed schedule. Jump pushes **opposite the sign of `Physics2D.gravity.y`**, and "grounded" checks the
  gravity-facing side — so no code hard-codes "down."
- **Why:** it's the sharpest possible illustration of the contrast — in JS the twist flipped a hand-written
  signed gravity variable; in Unity it flips the *engine's own* gravity and the physics engine does the rest.
  Writing jump/grounded sign-aware from M3 makes the M6 flip a small change, not a rewrite.
- **Rules out / trade-off:** the M3 physics is marginally more abstract (the sign concept arrives early).
  Accepted: it's the guide's spine and pays off directly in M6.
- **Revisit if:** the twist is ever dropped — the sign could collapse to a constant, but there's no reason to.

## D6 — Legacy Input Manager, not the Input System
- **Date:** 2026-07-11
- **Source:** the Phase 0.5 web check + design.
- **Decision:** use the **legacy Input Manager** (`Input.GetAxisRaw("Horizontal")`,
  `Input.GetButtonDown("Jump")`), not the new Input System package.
- **Why:** the `"Horizontal"` axis and `"Jump"` button exist **by default** with zero project setup, which
  keeps M3 short and beginner-safe. The Input System requires installing a package and authoring an actions
  asset — real overhead for no gain at this scope.
- **Rules out / trade-off:** the legacy manager is the older path Unity is steering away from; no rebindable
  controls, no gamepad abstraction. Accepted: approachability over modernity here.
- **Revisit if:** the reader wants rebinding, multiple devices, or local multiplayer — migrate to the Input
  System (keep **Active Input Handling** including the old manager until then).

## D7 — uGUI, not UI Toolkit
- **Date:** 2026-07-11
- **Source:** the Phase 0.5 web check + design.
- **Decision:** build the menu and HUD with **uGUI** (Canvas + Button + TextMeshPro), not UI Toolkit.
- **Why:** uGUI is GameObject-based and Inspector-driven — the same mental model the reader is already learning
  for gameplay — and it's the most tutorial-documented UI path. UI Toolkit (UXML/USS) is a separate authoring
  model with a steeper curve.
- **Rules out / trade-off:** UI Toolkit is Unity's strategic UI direction; uGUI is mature but not the future.
  Accepted: far friendlier for a beginner menu. Don't mix the two.
- **Revisit if:** building complex, data-bound, or editor UI later — that's UI Toolkit's territory.

## D8 — `PlayerPrefs` for the best time
- **Date:** 2026-07-11
- **Source:** advise-back + the sibling's `localStorage` best-time (parity).
- **Decision:** persist the best completion time with **`PlayerPrefs`** (an integer, milliseconds), the direct
  analogue of the sibling's `localStorage`.
- **Why:** it's the simplest built-in persistence for one small value, needs no files or serialization, and
  survives quitting Play — exactly enough for a best time.
- **Rules out / trade-off:** `PlayerPrefs` is **not a real save system** (plain, unencrypted, per-user registry
  keys); wrong for real game saves. Accepted and stated as such in the step.
- **Revisit if:** saving real game state — move to a JSON/file or a proper save system.

## D9 — Telegraphed, toggleable twist
- **Date:** 2026-07-11
- **Source:** advise-back (accepted feature addition; parity with sibling D4).
- **Decision:** every flip is preceded by a ~1-second visual **telegraph**, and a `[SerializeField] bool
  twistEnabled` can switch the twist off entirely.
- **Why:** an untelegraphed random flip reads as an unfair bug to a beginner; the telegraph makes it a mechanic.
  The toggle lets the reader build and verify M2–M5 calmly, then enable the chaos in M6, and disable it while
  debugging.
- **Rules out / trade-off:** a little extra state (a next-flip time, a telegraph timer). Trivial.
- **Revisit if:** never expected to; the telegraph is core to the twist feeling fair.

## D10 — Single fixed camera, no scrolling
- **Date:** 2026-07-11
- **Source:** the audience interview (scope) + Phase 2 scope discipline.
- **Decision:** the whole level fits one fixed camera view; no Cinemachine, no follow-cam, no scrolling.
- **Why:** a scrolling camera is the biggest source of coordinate-transform complexity in a beginner platformer
  and isn't needed to teach components, physics, the menu, or the twist.
- **Rules out / trade-off:** large/scrolling levels. Accepted: out of scope by design.
- **Revisit if:** the reader wants bigger levels — add a Cinemachine 2D follow camera as a follow-on.
