# Milestone 4 · Step 03 of 4 — Reality-check: actually play it
> Nav: [← Collision](02_collision.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Why / design
This is the **reality-check gate** from the plan. You now have a running platformer: move, jump, land, get
blocked. Before adding coins, sound, and the twist, **stop and play it** — the cheapest moment to notice
something feels wrong is *now*, before more is built on top. This step has no new code; it's a deliberate
pause to use what you made.

## Do this
1. **Open `index.html` and play for a full minute.** Try, specifically:
   - Run left and right along the floor; confirm you stop at both screen edges.
   - Jump straight up; confirm you rise ~107 px and fall back.
   - Hop from the floor up onto ledge 1, then ledge 2, then ledge 3. Confirm each landing is clean.
   - Jump *into* the underside of a ledge; confirm you bonk and drop.
   - Walk *into* the side of a ledge from the air; confirm you're blocked.
2. **Stress the `dt` clamp:** while the player is mid-jump, switch to another browser tab for ~5 seconds, then
   switch back. The player should **not** have teleported through the floor or a ledge — the `maxDt` clamp
   caps the catch-up frame.
3. **Tune if it feels off (all optional, all cosmetic-ish):**
   - Jump too floaty or too stiff? Adjust `jumpSpeed` and `gravity` in `config.js` together.
   - Run too fast/slow? Adjust `moveSpeed`.
   - Ledges out of reach? Lower them in `level.js`, or raise `jumpSpeed`. Keep each ledge within one jump.
4. **Make the call.** If it plays like a platformer you'd want to finish, continue. If a jump can't reach a
   ledge or a platform feels wrong, fix it here — later milestones assume this base is solid.

## Done when (this step)
- [ ] You can complete a full "floor → ledge 1 → ledge 2 → ledge 3" climb by jumping, with clean landings.
- [ ] Sides and undersides block you; screen edges stop you.
- [ ] Tab-out/tab-in mid-jump does **not** tunnel the player through anything.
- [ ] You've decided the feel is good (and retuned `config.js`/`level.js` if not).

## If it breaks
- **A ledge is unreachable** — the vertical gap exceeds your jump height (~`jumpSpeed² / (2 · gravity)` ≈
  107 px at the defaults). Lower the ledge in `level.js` or raise `jumpSpeed`.
- **The climb feels awkward/too hard** — nudge horizontal spacing of the ledges in `level.js`; this is a
  design tuning pass, exactly what the reality-check is for.
- **Anything tunnels on tab-switch** — the `maxDt` clamp in `main.js` is missing or too large; it should be
  `1/30`.
