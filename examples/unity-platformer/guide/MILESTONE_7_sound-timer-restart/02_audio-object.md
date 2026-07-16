# Milestone 7 · Step 02 of 07 — Create the Audio object
> Nav: [← Sfx script](01_sfx-script.md) · [Overview](00_overview.md) · [Wire sounds →](03_wire-sounds.md)

## Why / design
`Sfx` needs an **`AudioSource`** to play through, and something needs to **hear** it — an **`AudioListener`**,
which lives on the Main Camera by default. We make a dedicated **`Audio`** GameObject to hold the `AudioSource`
+ `Sfx` so it's easy to find and wire.

## Do this
1. In the **Hierarchy** (Game scene) right-click empty space → **Create Empty**. Rename it **`Audio`**.
2. Select **`Audio`**, **Add Component → `Sfx`** (your script). Because `Sfx` has
   `[RequireComponent(typeof(AudioSource))]`, Unity **also adds an `AudioSource`** automatically. *(Two
   components now: Audio Source + Sfx.)*
3. On the **Audio Source** component, **uncheck `Play On Awake`** (we trigger sounds manually, not on start).
   Leave everything else default. *(If Play On Awake stays on with no clip assigned, nothing bad happens, but
   unchecking it is tidy.)*
4. Confirm the **Main Camera** still has an **Audio Listener** component (the 2D template adds one by default).
   Select **Main Camera** and check its Inspector. *(Without a listener, nothing is audible.)*

## Done when (this step)
- [ ] An **`Audio`** GameObject exists with an **Audio Source** + **Sfx** component, and the **Main Camera** has
      an **Audio Listener** — the exact observable that sound can be produced and heard.

## If it breaks
- **No Audio Source appeared** → the `[RequireComponent]` should add it; if not, **Add Component → Audio
  Source** manually.
- **Main Camera has no Audio Listener** → **Add Component → Audio Listener** on the Main Camera (only one
  listener should exist in the scene).

---
> Nav: [← Sfx script](01_sfx-script.md) · [Overview](00_overview.md) · [Wire sounds →](03_wire-sounds.md)
