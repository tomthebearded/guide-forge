# Milestone 4 · Step 04 of 05 — ⭐ Reality-check: play it for a minute
> Nav: [← Check layers](03_check-layers.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Why / design
This is the **reality-check gate** — the same idea as the sibling's M4. You now have a real, playable
platformer: shapes, gravity, collision, running, jumping, a level. Before adding coins, a twist, and sound,
**stop and actually play it.** If the movement feels bad now, more features won't save it — fix the feel first.

## Do this
1. Press **Play** and genuinely play for **at least a minute**. Climb from the floor to the top platform and
   back. Try to fall off, jump the gaps, change direction mid-air.
2. Judge the **feel** against these questions:
   - Does the player move at a fun speed? *(Tune **Move Speed** on the Player if not — 7 is the default.)*
   - Do jumps clear the gaps comfortably? *(Tune **Jump Speed** — 7 default; higher = higher jumps.)*
   - Can you reach every platform? *(If not, revisit the layout in [02](02_build-level.md).)*
3. Make any tuning changes with Play **off**, then re-test. Iterate until it feels good.
4. Decide: **is this fun enough to finish?** If yes, continue to M5. If the core feel is off, fix it here — this
   is the cheapest point to change direction.

MANDATORY: actually play it and make the go/no-go call. Tuning values are ILLUSTRATIVE — adjust to taste.

## Done when (this step)
- [ ] You played for a minute, the movement/jumping **feels good**, and you've decided the game is **worth
      finishing** — the exact observable being your own go decision plus a level you enjoyed traversing.

## If it breaks
- **Jumps feel floaty** → raise the Player's `Rigidbody2D` **Gravity Scale** to ~2 **and** **Jump Speed** to ~10
  **together** (both — more gravity snaps the arc tighter, and the extra jump force keeps you clearing the
  2-unit gaps). Changing only one unbalances it: more gravity alone and you can no longer climb.
- **Movement feels sluggish or twitchy** → adjust **Move Speed** (lower = heavier, higher = zippier).
- **You keep falling off the edges** → widen platforms (Scale X) or bring them closer together.
