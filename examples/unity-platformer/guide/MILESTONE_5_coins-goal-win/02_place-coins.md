# Milestone 5 · Step 02 of 08 — Place coins in the level
> Nav: [← Coin prefab](01_coin-prefab.md) · [Overview](00_overview.md) · [Goal →](03_goal.md)

## Why / design
With the prefab made, scatter a handful of coins above the platforms so collecting them means jumping around the
level. Each placed coin is an **instance** of the one prefab — so they all share its trigger + tag automatically.

## Do this
1. Keep the first `Coin` where it is, or reposition it above a platform. Then add more: drag **`Coin.prefab`**
   from the **Project** window's `Prefabs` folder **into the Scene view**, once per coin. *(Each drag creates a
   new instance.)*
2. Position ~4–6 coins so each sits just above a platform the player can reach. Example positions (Transform):
   - Coin 1 — **X -5, Y 0** (above Platform_A)
   - Coin 2 — **X 1, Y 2** (above Platform_B)
   - Coin 3 — **X 6, Y 4** (above Platform_C)
   - Coin 4 — **X -2, Y -2** (above the floor)
   *(Positions are **cosmetic/illustrative** — place them wherever is fun to collect.)*
3. In the **Hierarchy** you'll now see several `Coin` (or `Coin (1)`, `Coin (2)`…) entries, all blue.

MANDATORY: at least one coin, placed so the player can reach it. ILLUSTRATIVE: the exact count and positions.

## Done when (this step)
- [ ] Several blue **Coin** instances sit above reachable platforms in the Game view — the exact observable that
      the level has collectibles. *(They don't do anything yet — the pickup logic is steps 04–05.)*

## If it breaks
- **Coins are grey/not blue** → they're not prefab instances; delete them and drag from `Coin.prefab` in the
  Project window.
- **A coin sits inside a platform** → raise its Y so it's clearly above the surface.
- **Editing one coin didn't change the others** → you edited an instance override, not the prefab. To change all
  coins, double-click `Coin.prefab` to open **Prefab Mode** and edit there.
