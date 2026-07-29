# Shape Jumper (Unity edition) — build a 2D platformer from simple shapes, with a Main Menu

> The front door to this guide. Skim this, then follow the milestones. **Progress lives in
> [foundation/status.md](foundation/status.md), not here** — this page describes intent; `status.md` states reality.

> _Generated with **GuideForge v1.2.0**._

## Objective
You'll build a small but complete 2D platformer **in the Unity Editor**, made entirely of Unity's primitive
**Square and Circle sprites** — no imported art. It opens on a **Main Menu** (Play + Quit); pressing **Play**
loads the game, where a square player runs and jumps across shape platforms, collects circle coins for score,
survives **random gravity flips** (the twist — the engine's gravity vector inverts, telegraphed a beat ahead,
then flips back), and reaches a goal to win. Jump/coin/win each beep; the win panel shows your completion time
and a **best time that survives quitting Play** (via `PlayerPrefs`). Press **R** to restart or **Menu** to
return to the title.

> **This is the engine-powered twin of [`web-platformer/`](../../web-platformer/guide/README.md).** *Same game,
> opposite philosophy.* There you *wrote* the game loop, gravity, and collision by hand — each was its own
> milestone of JavaScript. Here **Unity's engine provides all three for free**: you add a `Rigidbody2D` and a
> `Collider2D` and the object falls and lands with **zero code you wrote**. That inversion is the whole point,
> and every milestone draws the contrast. The consequence: **you write no *gameplay* C# until M3** — M1 adds only a tiny menu-button script, and M0/M2 are pure Editor
> and engine.

## Stack (summary)
**Unity 6.5** (`6000.5.x`, the newest tech-stream release) · 2D · shapes only · **legacy Input Manager** (zero
setup) · **uGUI** (Canvas/Button) for the menu + HUD · nothing to install but the Editor. Full verified table,
version notes, and check date: **[foundation/stack.md](foundation/stack.md)**.

> ⚠️ **6.5 is not an LTS release.** It's a tech-stream build with a shorter support window and more churn than
> **6.3 LTS** (supported to Dec 2027). If you're following this a while after it was written, run the
> **review-before-follow** gate first — menu paths and defaults can drift. See
> [decision-log D1](foundation/decision-log.md#d1--pin-unity-65-tech-stream-not-63-lts).

## Key decisions
- **The engine runs the loop, gravity, and collision — so you write no *gameplay* C# until M3.** M0–M2 are
  Editor and components only (M1's lone script just wires the menu buttons); a `Rigidbody2D` + `Collider2D`
  makes the player fall and land with no script. → [decision-log D2](foundation/decision-log.md#d2--the-engine-does-the-work-code-is-deferred-to-m3)
- **Menu-first, two scenes.** `MainMenu` (build index 0) and `Game` (build index 1); `SceneManager.LoadScene`
  moves between them. You meet Scenes before you meet gameplay. → [decision-log D3](foundation/decision-log.md#d3--menu-first-two-scenes)
- **Four small scripts, tag-based pickups.** `MenuController`, `PlayerController`, `GameManager`, `Sfx`; coins
  and the goal are detected by **tag** in the player's trigger handler — no per-object scripts. → [decision-log D4](foundation/decision-log.md#d4--four-small-scripts-tag-based-pickups)
- **The twist = flip the engine's global gravity vector.** `Physics2D.gravity` inverts on a random schedule;
  jump and "grounded" read the **sign** of gravity, so the flip is a small change — the direct Unity analogue
  of the sibling's signed-gravity integrator. → [decision-log D5](foundation/decision-log.md#d5--twist--flip-physics2dgravity-sign-aware-jump)

## Updates
- 2026-07-21 — Retrofitted to the GuideForge v1.2.0 pedagogy contract: provenance stamp, glossary hygiene (concept headings + deep-links, functions→inline comments), code interleaved under its instruction (M6), existing-file edit shown as a fragment (M6). M6 flagged for re-verify.
- 2026-07-13 — fixed: the "no C# until M3" framing (M1 does write a small `MenuController.cs`) → now "no **gameplay** C# until M3" everywhere; and 3 dead D8 anchor links (`#d8--playerprefs-for-the-best-time`). M0/M2/M7 flagged for re-verify.
- 2026-07-11 — Audit pass (PASS-WITH-WARNINGS, 0 blockers): fixed the Unity-6 **Build Profiles** menu path, a jump-height physics error (`jumpSpeed` 12→7), a broken decision-log anchor, the script-create submenu path, and several pedagogy nits. Link check clean (374 links). Still awaiting Editor verification by a person.
- 2026-07-11 — Whole guide drafted (M0–M7, 56 files). Author-cross-checked vs Unity 6.5 docs but **not run in the Editor** — awaiting verification by a person (see [status](foundation/status.md)).
- 2026-07-11 — Guide created (plan approved → scaffolded). Unity 6.5, full web-platformer parity + Main Menu.

## Following this guide
1. Read **[foundation/status.md](foundation/status.md)** first — the single source of truth for what's done and
   verified. **Important:** Unity is a GUI + engine and **could not be run headlessly by the author**, so every
   milestone is marked **📝 drafted (author-unverified)** — *your first follow-through in the Editor is the real
   verification pass.*
2. Start at **[Milestone 0](MILESTONE_0_setup-and-editor/00_overview.md)**; do the milestones in order (each
   builds on the last).
3. **Type the code — don't paste it.** The complete scripts are included so you always have an authoritative
   copy to diff against, *not* so you can paste blindly. You'll learn far more by typing each file, reading it
   as you go, and predicting a step's expected Editor result *before* you press Play.
4. If you're following this a while after it was written, run the **review-before-follow** gate first —
   re-check the stack's version notes (6.5 is non-LTS) and reconcile any drift before executing (reality wins).
