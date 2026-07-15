# Milestone 3 · Step 01 of 06 — Create a Ground layer and assign it
> Nav: — · [Overview](00_overview.md) · [PlayerController (move) →](02_playercontroller-move.md)

## Glossary for this step
- **LayerMask** — a filter naming which physics layers a check considers. Our "am I standing on something?"
  check will look only at the **Ground** layer, so coins and the player itself don't count as ground. See
  [glossary: LayerMask](../foundation/glossary.md).

## Why / design
In step 04 the jump uses a small overlap check to ask "is there ground beneath my feet?" To answer *only* about
ground (not coins, not the player), that check filters by a **Ground layer**. We create the layer now and put the
Ground object on it, so the check has something to find.

## Do this
1. In the **Hierarchy** select **`Ground`**.
2. In the **Inspector**, top-right, click the **Layer** dropdown → **Add Layer…**. *(This opens the Tags &
   Layers settings.)*
3. In the **Layers** list, click an empty **User Layer** slot (e.g. **Layer 6**) and type **`Ground`**. Press
   Enter. *(The name **`Ground`** is **load-bearing** — the script's LayerMask field will point at this layer;
   see [conventions](../foundation/conventions.md#naming).)*
4. Select **`Ground`** in the Hierarchy again. Open the **Layer** dropdown once more and choose **Ground**. *(A
   dialog may ask "change children too?" — either answer is fine; the Ground has no children.)*
5. Confirm the Ground's **Layer** now reads **Ground** at the top of its Inspector.

## Done when (this step)
- [ ] A user layer named **`Ground`** exists, and the **`Ground`** GameObject's **Layer** field shows **Ground**
      — the exact observable that the layer exists and is assigned.

## If it breaks
- **Can't type in the Layers list** → you clicked a **Builtin** (greyed) slot. Use a **User Layer** row (index 6
  or higher).
- **Layer dropdown still shows "Default" on the Ground** → you created the layer but didn't re-select it on the
  object; reselect Ground and pick **Ground** from the Layer dropdown.
