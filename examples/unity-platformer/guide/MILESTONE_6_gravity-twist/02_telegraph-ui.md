# Milestone 6 · Step 02 of 04 — Build the telegraph warning panel
> Nav: [← Twist logic](01_twist-logic.md) · [Overview](00_overview.md) · [Wire & test →](03_wire-and-test.md)

## Why / design
The telegraph is a **translucent warning overlay** shown for the second before gravity flips, so the flip never
feels like a bug. It's a uGUI **Panel** on the HUD Canvas, tinted a warning color, that starts **disabled** —
`GameManager` turns it on for `telegraphDuration`, then off.

## Do this
1. In the **Hierarchy** (Game scene), right-click the HUD **`Canvas`** (the one holding `ScoreText`/`WinPanel`)
   → **UI → Panel**. Rename it **`TelegraphPanel`**.
2. Select **`TelegraphPanel`**. In the **Image** component, click the **Color** swatch and give it a warning
   tint with **low alpha**, e.g. RGBA **(255, 140, 0, 60)** — a faint orange wash. *(Cosmetic color; keep the
   **A**lpha low so you can still see the game through it.)*
3. (Optional, illustrative) Add a label: right-click `TelegraphPanel` → **UI → Text - TextMeshPro**, set its
   Text to **`FLIP INCOMING`**, center it near the top. *(Cosmetic — the panel wash alone is enough of a
   warning.)*
4. Disable it so it's hidden at start: select **`TelegraphPanel`** and **uncheck the active checkbox** at the
   top-left of its Inspector. *(`GameManager.Start()` also hides it; disabling now keeps the editor clean.)*

## Done when (this step)
- [ ] A **`TelegraphPanel`** exists under the HUD Canvas, tinted a translucent warning color, and is currently
      **disabled/hidden** — the exact observable that the warning overlay is built but off.

## If it breaks
- **Panel is fully opaque and hides the game** → lower the Image **Color → Alpha** (the A slider) to ~50–80.
- **Panel isn't under the HUD Canvas** → drag `TelegraphPanel` onto the `Canvas` in the Hierarchy so it's a
  child; UI must live under a Canvas.
