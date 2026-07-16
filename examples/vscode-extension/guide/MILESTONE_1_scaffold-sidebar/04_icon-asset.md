# M1 · Step 04 of 10 — Add the Activity-Bar icon asset
> Nav: [← First run](03_first-run.md) · [Overview](00_overview.md) · [Contribute view →](05_contribute-view.md)

## Why / design
The next step declares an Activity-Bar container, and a container needs an icon. VS Code renders Activity-Bar icons
in a single theme color, so the icon must be a **monochrome SVG** that paints itself with `currentColor` — then it
automatically matches the user's theme (light or dark) instead of being a fixed color.

## Do this
1. In the `live-recolor` window's Explorer, create a new folder at the project root named **`media`** (right-click
   the root → **New Folder** → `media`).
2. Inside `media`, create a file named **`icon.svg`** (right-click `media` → **New File** → `icon.svg`).
   - The path **`media/icon.svg`** is **load-bearing** — step 05 references it by this exact path. The *artwork*
     inside is cosmetic; any 24×24 monochrome SVG works.
3. Paste the SVG below (a painter's palette). Note `fill="currentColor"` — that's what makes it theme-aware; do not
   replace it with a hard-coded color.

## Code
`media/icon.svg`
```svg
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-.95-.5-1.3-.3-.35-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.5A4.5 4.5 0 0 0 22 11 10 10 0 0 0 12 2Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3.5 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>
</svg>
```

## Done when (this step)
- The file **`media/icon.svg`** exists at the project root and contains the SVG above.
- Opening it in VS Code's editor shows a small palette shape (VS Code previews SVGs).

## If it breaks
- **The preview is blank** → the SVG text is malformed (a missing `>` or quote from a bad paste). Re-paste the whole
  block exactly.
- **You put it somewhere else** (e.g. `src/media/icon.svg`) → move it to `media/icon.svg` at the project root; the
  path in step 05 is relative to the project root.

---
> Nav: [← First run](03_first-run.md) · [Overview](00_overview.md) · [Contribute view →](05_contribute-view.md)
