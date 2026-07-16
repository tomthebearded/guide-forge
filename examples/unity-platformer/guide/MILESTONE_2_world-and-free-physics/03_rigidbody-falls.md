# Milestone 2 · Step 03 of 05 — Add a Rigidbody2D — the player falls
> Nav: [← Ground](02_ground.md) · [Overview](00_overview.md) · [Colliders land →](04_colliders-land.md)

## Glossary for this step
- **`Rigidbody2D`** — the component that hands a GameObject to the 2D physics engine so it falls under gravity,
  carries velocity, and collides. See [glossary: Rigidbody2D](../foundation/glossary.md).
- **`Physics2D.gravity`** — the engine's single global gravity vector, default `(0, -9.81)` (9.81 units/s²
  downward). See [glossary](../foundation/glossary.md).

## Why / design
Adding a **`Rigidbody2D`** to the Player is the entire "make it fall" step. The physics engine then applies
**`Physics2D.gravity`** to it every tick. This is the contrast in one action — the sibling spent a whole
milestone writing a gravity integrator; here you click **Add Component**.

> **New concept — `Rigidbody2D` = "the engine owns this object's motion now."** Once a GameObject has a
> `Rigidbody2D` with **Body Type = Dynamic**, you no longer set its position directly; the physics engine moves
> it using velocity, gravity, and collisions. In M3 you'll steer it by setting its **velocity**, not its
> position. Docs: https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Rigidbody2D.html

## Do this
1. In the **Hierarchy** select **`Player`**.
2. In the **Inspector** click **Add Component**, type **`Rigidbody 2D`**, and select **Rigidbody 2D**. *(Make
   sure it's the **2D** one — there's a 3D `Rigidbody` too. Everything in this game is 2D.)*
3. Confirm the new component's **Body Type** is **Dynamic** (the default). *(Dynamic = fully simulated: gravity,
   velocity, collisions. Leave **Mass, Linear Drag, Gravity Scale** at their defaults — Gravity Scale 1 means
   normal gravity.)*
4. Press **Play**. The **Player** square **falls** straight down… and keeps going, straight **through** the
   Ground and off-screen. *(That's expected — nothing is solid yet. Colliders come next.)*
5. Press **Play** again to stop. *(Stopping resets the player to its starting Y 2 — another reason we don't edit
   during Play.)*

## Done when (this step)
- [ ] With a `Rigidbody2D` on the Player, pressing **Play** makes the square **fall downward** — the exact
      observable that engine gravity is now acting on it. (It falls *through* the ground for now.)

## If it breaks
- **Nothing falls** → the Player has no `Rigidbody2D`, or its **Body Type** is **Static/Kinematic**. Set Body
  Type to **Dynamic**.
- **It falls sideways or too slow/fast** → check **Gravity Scale = 1** and that you didn't rotate the object.
- **You added a 3D `Rigidbody`** → remove it (gear icon → Remove Component) and add **Rigidbody 2D**.

---
> Nav: [← Ground](02_ground.md) · [Overview](00_overview.md) · [Colliders land →](04_colliders-land.md)
