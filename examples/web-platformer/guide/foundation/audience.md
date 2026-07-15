# Audience model — Shape Jumper

> The guide's north star: **match explanation depth to the reader's level on *that specific topic*.**
> Over-explaining an Expert topic is as harmful as under-explaining a New one. Every step is written against
> this matrix + the granularity setting below.

## Per-topic expertise → explanation-depth policy

| Topic | Level | Depth policy applied in the guide |
|-------|-------|-----------------------------------|
| JavaScript (the language: variables, functions, objects, arrays, `const`/`let`, arrow functions) | **New** | Define on first use + MDN link + a short "New concept" callout + failure notes. The reader is new to programming — no construct is assumed. |
| The browser as a runtime (`<script>` load order, the DOM, opening a file via `file://`, DevTools console) | **New** | Same fullest tier — teach how the page, the scripts, and the console fit together from zero. |
| HTML5 Canvas 2D drawing (`getContext('2d')`, `fillRect`, `arc`, `roundRect`, clearing each frame, y-down coordinates) | **New** | Full definitions + MDN link + deep-dive callouts. This is the "screen" — taught thoroughly. |
| The game loop & frame-rate independence (`requestAnimationFrame`, delta time, `performance.now`) | **New — deepest tier** | The load-bearing mental model of the whole guide; taught with the fullest care and repeated at each use. |
| Game physics from scratch (velocity, acceleration, gravity, jump impulse, AABB collision + resolution, "grounded") | **New — deepest tier** | Every concept defined and derived; the mental model ("everything is a box") repeated where it recurs. |
| Keyboard input (`keydown`/`keyup`, `KeyboardEvent.code`, an input-state object) | **New** | Define the event model + why we track held state rather than react per-event; MDN link + failure notes. |
| Web Audio API (`AudioContext`, `OscillatorNode`, the autoplay-gesture rule) | **New** | Teach the oscillator→gain→destination chain from zero; flag the "context must start on a user gesture" trap. |
| `localStorage` persistence (`setItem`/`getItem`, strings-only, `JSON` round-trip) | **New** | Teach the read/parse/guard/write pattern from scratch; note the strings-only and quota caveats. |

## Depth-policy legend
- **Expert** → name it; no definition, no deep dive, no doc link (except a specific gotcha).
- **Intermediate** → one-line reminder + doc link; skip fundamentals.
- **Beginner** → define on first use + doc link + a brief *why*.
- **New** → define + doc link + a short concept deep-dive callout + extra failure-mode notes.

## Granularity
**Highly granular / tutorial.** The smallest atomic steps, every sub-action spelled out, nothing assumed.

This composes with the matrix: because *every* topic here is **New**, essentially every step carries real
teaching — this is a from-absolute-zero guide, and its length reflects that. Even `const`, an array, and an
event handler get a first-use gloss. There is no terse topic to bundle past.
