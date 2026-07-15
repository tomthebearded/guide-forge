# Milestone 5 · Step 01 of 08 — Create the Coin prefab (trigger + `Coin` tag)
> Nav: — · [Overview](00_overview.md) · [Place coins →](02_place-coins.md)

## Glossary for this step
- **Trigger (Is Trigger)** — a collider that detects overlap **without** blocking movement, firing
  `OnTriggerEnter2D` instead of a solid collision. See [glossary](../foundation/glossary.md).
- **Tag** — a short label on a GameObject (`Coin`, `Goal`) you test with `CompareTag`, so one handler can tell
  what it touched. See [glossary: Tag](../foundation/glossary.md).
- **Prefab** — a saved GameObject template; you spawn many identical instances from it. See [glossary: Prefab](../foundation/glossary.md).

## Why / design
A coin is a **Circle** sprite the player walks *through* (not into), so its collider is a **trigger**. We tag it
**`Coin`** so the player's one trigger handler can identify it. And because we want *many* coins, we save it as a
**prefab** — edit the prefab once, every coin updates.

## Do this
1. In the **Hierarchy** (Game scene) right-click → **2D Object → Sprites → Circle**. Rename it **`Coin`** (F2).
2. In the **Inspector → Transform**, set **Scale** to **X 0.5, Y 0.5, Z 1** (a small coin) and give it a bright
   color (Sprite Renderer → Color, e.g. yellow). *(Cosmetic size/color.)*
3. **Add Component → Circle Collider 2D.** Then **check its `Is Trigger`** box. *(Mandatory: a trigger fires
   `OnTriggerEnter2D` and doesn't physically block the player.)*
4. Create the tag: in the Inspector, top-left, click the **Tag** dropdown → **Add Tag…** → **`+`** → type
   **`Coin`** → **Save**. *(**Load-bearing:** the player matches `CompareTag("Coin")` exactly — see [conventions](../foundation/conventions.md#naming).)*
5. Select **`Coin`** in the Hierarchy again and set its **Tag** dropdown to **Coin**.
6. Leave the Coin on the **Default** layer (do **not** put it on Ground) so the player can't "stand" on a coin.
7. Save it as a prefab: in the **Project** window create a **`Prefabs`** folder (right-click `Assets` → Create →
   Folder → `Prefabs`), then **drag the `Coin` object from the Hierarchy into the `Prefabs` folder**. The
   Hierarchy entry turns blue — it's now a **prefab instance**. A `Coin.prefab` asset appears in the folder.

## Done when (this step)
- [ ] `Assets/Prefabs/Coin.prefab` exists, and the `Coin` in the Hierarchy is blue (a prefab instance) with a
      **CircleCollider2D (Is Trigger)** and **Tag = Coin** — the exact observable that the coin template is
      ready to duplicate.

## If it breaks
- **No `Is Trigger` checkbox** → you added a `BoxCollider2D` or a 3D collider; use **Circle Collider 2D** and
  tick **Is Trigger**.
- **Tag dropdown has no `Coin`** → you created the tag but didn't assign it; reselect the Coin and pick **Coin**
  from the Tag dropdown.
- **Dragging to Prefabs did nothing** → drag from the **Hierarchy** into the **Project** window's `Prefabs`
  folder (not Scene view).
