# M0 · Step 06 of 15 — Add Angular Material
> Nav: [← Create the folder tree](05_folder-tree.md) · [Overview](00_overview.md) · [Generate the palette →](07_theme-color.md)

## Glossary for this step
> **Angular Material** — Google's official component library implementing **Material 3** (their design system) for Angular. Buttons, toolbars, dialogs, etc., themable from a single palette. Docs: [material.angular.dev](https://material.angular.dev).

## Why / design
Material gives us themed UI components (the placeholder button in step 10, the header, later the whole app) and
— crucially — the **Material 3 theming system** we drive with a custom palette in the next step. `ng add`
installs `@angular/material` + `@angular/cdk` + `@angular/animations`, wires an initial theme, and adds the
Roboto + Material Icons fonts to `index.html`. We'll overwrite the theme it writes with our custom one in step
07, so the theme *choice* here doesn't matter much — but the font links and animation setup do.

## Do this
1. From the project root, run:
   ```bash
   ng add @angular/material
   ```
   Confirm the package version prompt (it resolves to **21.2.x**, version-matched to Angular —
   [stack.md](../foundation/stack.md)).
2. Answer the prompts:
   - **"Choose a theme"** → pick **Custom** (we generate our own palette next; a prebuilt theme would just be
     overwritten).
   - **"Set up global Angular Material typography styles?"** → **Yes** (applies Roboto app-wide).
   - **"Include and enable animations?"** → **Yes / Include** (wires `provideAnimationsAsync()`, which our
     `app.config.ts` uses in step 08).
3. Open `src/index.html` and replace it with the block below. This sets the page **`<title>`** to
   `Spotify Trip` (cosmetic — shows in the browser tab) and ensures the **Roboto** + **Material Icons** font
   links are present (the icon font is needed for `mat-icon` later). If `ng add` already added the font links,
   you're just confirming they match.

## Code
### `src/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Spotify Trip</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap"
      rel="stylesheet"
    />
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

## Done when (this step)
- [ ] `package.json` `dependencies` now includes `@angular/material`, `@angular/cdk`, and `@angular/animations`
      at `21.2.x`.
- [ ] `npm start` → the app still serves; the browser tab reads **Spotify Trip**.
- [ ] `src/index.html` `<head>` contains both the Roboto `css2` link and the `Material+Icons` link.

## If it breaks
- **`ng add @angular/material` resolves a v22 package**: your Angular is 22, not 21 — you scaffolded without the
  pinned CLI. Re-scaffold with `npx @angular/cli@21 new …` (step 02).
- **Icons render as plain text like `home` instead of a glyph**: the `Material+Icons` font link is missing from
  `index.html` — re-add it from the block above.
