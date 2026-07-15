# Verified stack — Shape Jumper

> Pinned APIs and official docs for this guide, verified online on **2026-07-10**.
> There are **no installed dependencies, no package manager, and no build tooling** — the entire "stack" is
> the browser's built-in web-platform APIs plus the JavaScript language. This table pins the **browser API
> baselines** (the thing that could actually differ across a reader's browser) rather than library versions.
> Every API used is **Baseline "Widely available"** — safe on current Chrome, Edge, Firefox, and Safari with
> no polyfills. If you're following this later, re-check the Baseline notes; if something regressed or the
> autoplay/`file://` rules changed, reconcile before following (the review-before-follow gate).

| Tool / API | "Version" (baseline floor) | Baseline status (as of 2026-07-10) | Official docs | Notes |
|------------|----------------------------|------------------------------------|---------------|-------|
| JavaScript (ES2015+ syntax: `const`/`let`, arrow fns, plain objects) | ES2015+ | Universal | https://developer.mozilla.org/en-US/docs/Web/JavaScript | We stay in plain, widely-taught JS — no bleeding-edge syntax. |
| HTML Canvas 2D (`getContext('2d')`, `fillRect`, `arc`, `fillText`, `clearRect`) | — | Widely available (since 2015) | https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API | The core drawing surface. |
| `CanvasRenderingContext2D.roundRect()` | — | Widely available (reached "widely" 2025-10-11; cross-browser since Apr 2023) | https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect | Rounded-rectangle player. Chrome/Edge 99+, Firefox 112+, Safari 16.4+. Pre-`roundRect` browsers: fall back to `fillRect` (noted in the step). |
| `Window.requestAnimationFrame()` | — | Widely available | https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame | The game-loop driver. **MDN rule we honor:** always compute progress from the callback timestamp, or motion runs faster on high-refresh screens. |
| `performance.now()` (via the rAF timestamp) | — | Widely available | https://developer.mozilla.org/en-US/docs/Web/API/Performance/now | Time source for `dt`; more precise than `Date.now()` and MDN's recommended source for frame deltas. |
| `KeyboardEvent.code` | — | Widely available | https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | **MDN-recommended for games** — physical key position, layout-independent (WASD works on AZERTY). We use `code`, not `key`. |
| Web Audio: `AudioContext` + `OscillatorNode` | — | Widely available (Oscillator since 2015; `new` constructors since 2021) | https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode | Synth beeps — no audio files. **Autoplay rule:** create/resume the context inside a user-gesture handler. |
| `Window.localStorage` (`setItem`/`getItem`) | — | Widely available (since 2015) | https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage | Best-time persistence. **Strings only** — round-trip through `JSON`; wrap writes in `try/catch`. |

## Install (the exact commands, at the pinned versions)
```text
None. There is nothing to install.
Create a folder, add the files, and open index.html in a browser (double-click it, or File → Open).
A text editor (VS Code, Notepad++, anything) and a modern browser are the only tools.
```

## Reference pages the milestones lean on (deep-linked)
- Canvas tutorial (drawing shapes, the drawing loop) — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
- `requestAnimationFrame` + delta-time note — https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- Desktop mouse & keyboard controls (games) — https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard
- Web Audio API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Using the Web Storage API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API

## Version notes
- **`roundRect()` is recent-ish.** It only reached Baseline "Widely available" on 2025-10-11 (cross-browser
  since April 2023). On a browser older than Chrome/Edge 99, Firefox 112, or Safari 16.4 it won't exist —
  the player step gives a `fillRect` fallback. — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect
- **Web Audio needs a user gesture.** Browsers block an `AudioContext` that starts before the user interacts;
  we create/resume it on the first keydown. — https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
- **`localStorage` is strings-only and can throw.** In private mode or with storage disabled, `setItem` can
  throw; an unset key returns `null`. We guard both. — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

## Load-bearing API facts (steps must honor these exact spellings)
- Compute motion from the **rAF timestamp** (`dt` in seconds), never assume a fixed 60 fps.
- Read held keys via **`event.code`**: `"ArrowLeft"`, `"ArrowRight"`, `"KeyA"`, `"KeyD"`, `"Space"`,
  `"ArrowUp"`, `"KeyR"` — not `event.key`.
- **Create/resume the `AudioContext` inside the first keydown handler**, or no sound plays.
- `localStorage` stores **strings only**; a missing key returns **`null`**; a write can **throw** — guard both.
- Canvas Y grows **downward**; positive gravity moves the player **down**. The twist flips the *sign* of gravity.
