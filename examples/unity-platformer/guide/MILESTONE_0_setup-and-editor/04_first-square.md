# Milestone 0 · Step 04 of 05 — Drag in a Square sprite (prove the pipeline)
> Nav: [← Editor tour](03_editor-tour.md) · [Overview](00_overview.md) · [Verify →](05_verify.md)

## Glossary for this step
- **Sprite** — a 2D image. Here always a plain **Square** or **Circle** primitive Unity generates for you — no
  imported art. See [glossary: Sprite](../foundation/glossary.md).

## Why / design
Before trusting the tools, prove the simplest end-to-end path: create a shape, see it in the Scene, see it in
the Game view. This is the "hello world" of Unity 2D — and it confirms your 2D project and camera are set up
right. Everything visible in this game will be one of these primitive shapes (that's the whole aesthetic — see
[conventions](../foundation/conventions.md)).

## Do this
1. In the **Hierarchy** panel, **right-click** an empty area → **2D Object → Sprites → Square**. *(Why this
   path: `2D Object → Sprites` is Unity's built-in primitive shapes; Square is a solid filled rectangle. No
   image file needed.)*
2. A GameObject named **Square** appears in the Hierarchy and a white square appears in the **Scene** view.
3. With **Square** selected, look at the **Inspector**: it has a **Transform** (Position/Rotation/Scale) and a
   **Sprite Renderer** (which draws the shape). *(This is the component model from step 03 in action — a
   GameObject + a Sprite Renderer component = something you can see.)*
4. In the Inspector, set the Transform **Position** to **X 0, Y 0, Z 0** so it sits at the world origin, in
   front of the camera. *(Type the values into the three Position fields.)*
5. Click the **Game** tab. The white square appears there too — meaning the **camera can see it**. *(If it's
   off-center in Game view, that's fine; position doesn't matter for this test.)*

## Done when (this step)
- [ ] A GameObject named **Square** exists in the Hierarchy.
- [ ] The white square is visible in **both** the **Scene** view and the **Game** view — the exact observable
      that the sprite pipeline and camera work end to end.

## If it breaks
- **No `2D Object` in the right-click menu** → you likely created a 3D project. The menu would show `3D Object`
  instead. Recreate the project with the **2D** template (M0/02).
- **Square shows in Scene but not in Game view** → the camera isn't pointing at it. Confirm the square's
  Position **Z = 0** and that **Main Camera**'s Position Z is negative (the 2D template defaults it to `-10`, so
  it looks toward +Z where your sprite sits).
