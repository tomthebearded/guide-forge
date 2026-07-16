# Milestone 6 · Step 03 of 04 — Wire the references and test the flip
> Nav: [← Telegraph panel](02_telegraph-ui.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Why / design
`GameManager` needs to know **which** panel is the telegraph and **which** camera to tint. We drag those into
its new Inspector fields, then playtest the whole twist cycle: wait → warning → flip → play upside-down → flip
back.

## Do this
1. In the **Hierarchy** (Game scene) select the **`GameManager`** object. Its Inspector now shows the **Twist**
   fields (from [step 01](01_twist-logic.md)).
2. Wire **Telegraph Panel**: drag **`TelegraphPanel`** from the Hierarchy into the **Telegraph Panel** field.
3. Wire **Main Camera**: drag **`Main Camera`** from the Hierarchy into the **Main Camera** field. *(This lets
   the tint show the flipped state. If you leave it empty the twist still works — `ApplyBackground` guards for
   null — you just won't get the color cue.)*
4. Leave the defaults: **Twist Enabled = on**, **Min Flip Interval 6**, **Max Flip Interval 12**, **Telegraph
   Duration 1**. *(All tunable; shorten the intervals to **2–4** temporarily if you want to see flips sooner
   while testing, then restore.)*
5. Press **Play** and wait. You should see: the **telegraph** overlay appears → about a second later gravity
   **flips** (the player falls **up** to the ceiling/underside of platforms, the background tints) → after
   another interval it flips **back**. Try jumping while flipped — the player jumps **toward the floor** (away
   from the ceiling it's resting on). Notice you did **not** touch `PlayerController`.
6. Test the toggle: stop Play, **uncheck Twist Enabled**, press Play — gravity stays down the whole time. Re-check
   it when done.

## Done when (this step)
- [ ] With the references wired, Play shows the full cycle — **telegraph → flip up → jump off the ceiling → flip
      back** — and unchecking **Twist Enabled** stops all flipping. That whole sequence is the exact observable.

## If it breaks
- **`NullReferenceException` on `telegraphPanel`** → the **Telegraph Panel** field is unwired; drag
  `TelegraphPanel` in.
- **Player falls up and off the screen (can't land on the ceiling)** → after the flip the player needs a surface
  *above* it. The platforms are solid from both sides (a `BoxCollider2D` blocks from any direction), so it will
  land on the *underside* of a platform. If it only ever had the floor below, add/keep platforms above the
  player so there's a ceiling to land on.
- **No tint change** → the **Main Camera** field is empty, or the two background colors are too similar (pick
  more contrasting `normalBackground`/`flippedBackground` values), or the Main Camera's **Clear Flags** isn't
  **Solid Color** — `backgroundColor` only shows under **Solid Color** (the 2D template's default). Set **Main
  Camera → Camera → Clear Flags = Solid Color** if the background never changes.
- **Flips never happen** → **Twist Enabled** is off, or the intervals are very long; shorten them to test.

---
> Nav: [← Telegraph panel](02_telegraph-ui.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)
