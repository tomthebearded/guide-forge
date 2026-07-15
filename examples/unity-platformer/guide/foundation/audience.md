# Audience model — Shape Jumper (Unity edition)

> The guide's north star: **match explanation depth to the reader's level on *that specific topic*.**
> Over-explaining an Expert topic is as harmful as under-explaining a New one. Every step is written against
> this matrix + the granularity setting below.

Reader profile (from the interview): **"Codes, new to Unity"** — comfortable programming in *some* language,
but new to Unity, the Editor, game dev, and C#-as-used-in-Unity. So C# *syntax* gets a light touch (they can
read a loop), while everything Unity-shaped is taught from zero.

## Per-topic expertise → explanation-depth policy

| Topic | Level | Depth policy applied in the guide |
|-------|-------|-----------------------------------|
| **The Unity Editor** (Hub, creating a project, the Hierarchy / Scene / Game / Inspector / Project windows, Play mode) | **New** | Fullest tier — define every panel on first use, name every menu path exactly, describe where each panel sits. This is the reader's unfamiliar "IDE". |
| **The GameObject / Component model** (a GameObject is a bag of Components; behavior is *added*, not written) | **New — deepest tier** | The load-bearing mental model of the whole guide — taught with the fullest care and repeated at each use. |
| **2D physics components** (`Rigidbody2D`, `BoxCollider2D`, `CircleCollider2D`, triggers, `Physics2D.gravity`, layers) | **New** | Define each on first use + docs link + a "New concept" callout + failure notes. This is where "the engine does it for you" lives. |
| **Scenes & scene flow** (a scene is a level/screen; Build Settings; `SceneManager.LoadScene`) | **New** | Full definitions + docs link — the Menu→Game flow is built on this from M1. |
| **uGUI runtime UI** (Canvas, Button, Text/TextMeshPro, the EventSystem) | **New** | Teach the Canvas→Button→handler chain from zero for the menu and HUD. |
| **C# as a Unity scripting language** (the `MonoBehaviour` lifecycle: `Awake`/`Start`/`Update`/`FixedUpdate`; `[SerializeField]`; attaching a script to a GameObject) | **Beginner** | Reader knows programming, so no syntax tutorials — but Unity's *lifecycle* and *editor-serialization* are new and get defined on first use + docs link + a brief why. |
| **C# language syntax itself** (variables, methods, `if`, classes) | **Intermediate** | One-line reminders at most; no fundamentals. The reader can code. |
| **Prefabs** (a saved, reusable GameObject template; instances; the coin prefab) | **New** | Define on first use + docs link; taught where coins are introduced (M5). |
| **Persistence** (`PlayerPrefs` for the best time) | **Beginner** | One-line reminder + docs link + the "not a real save system" caveat; the reader knows key/value stores. |
| **Procedural audio** (`AudioSource`, `AudioClip.Create`, a synthesized beep) | **New** | Provided as a complete helper; internals flagged as an optional deep-dive, with a "drop in a .wav instead" fallback. |

## Depth-policy legend
- **Expert** → name it; no definition, no deep dive, no doc link (except a specific gotcha).
- **Intermediate** → one-line reminder + doc link; skip fundamentals.
- **Beginner** → define on first use + doc link + a brief *why*.
- **New** → define + doc link + a short concept deep-dive callout + extra failure-mode notes.

## Granularity
**Highly granular / tutorial.** The smallest atomic steps — every Editor click, every menu path, every
Inspector field spelled out, nothing assumed.

This composes with the matrix: because most topics are **New**, nearly every Editor/physics step carries real
teaching. C# *syntax* steps stay terse (the reader codes); the Editor, components, scenes, and UI steps are
exhaustive.
