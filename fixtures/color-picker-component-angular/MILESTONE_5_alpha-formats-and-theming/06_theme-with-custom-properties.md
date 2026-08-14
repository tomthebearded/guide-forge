# M5 · Step 06 of 07 — Theme with custom properties
> Nav: [← Name the parts](05_name-the-parts.md) · [Overview](00_overview.md) · [Verify →](07_verify.md)

## Why / design

`::part()` gives the host page a scalpel: this node, these properties. A theme is not a scalpel — "make it dark"
touches a background, a text colour and every control that inherits from them, and expressing it as a list of
part rules means the page has to know your internal structure.

CSS custom properties are the other half, and they work here for a reason worth knowing: **custom properties
inherit, and inheritance crosses the shadow boundary.** A `--color-picker-background` set on the host element —
or anywhere above it — is visible to every rule inside the shadow tree. It is the one channel that was open all
along.

So the component names two tokens and reads them with a fallback. The fallback is what keeps the component
standalone: a page that sets nothing gets the design it has had since milestone 1.

Two rules of thumb the pair encodes:

- **Parts for structure, properties for theme.** Shape, spacing and borders through `::part()`; colours through
  tokens.
- **Every token needs a default in the `var()` call.** A missing custom property is not an error, it is an
  *invalid* value, and an element with `background: ` unset renders transparent. The fallback is the difference
  between a themeable component and one that vanishes on a page that never heard of it.

## Before you start

Step 05 complete: seven parts are named and `#themed::part(panel)` squares the second picker's corners.

## Do this

1. In `src/color-picker.css`, replace the `.panel` rule so its two colours come from tokens.

   ```css
   .panel {
     width: 240px;
     padding: 12px;
     border: 1px solid #d0d0d0;
     border-radius: 8px;
     background: var(--color-picker-background, #ffffff);
     color: var(--color-picker-text-color, #1a1a1a);
   }
   ```

   The border colour deliberately stays a literal: it is structure, and a host page that wants it changed has
   `::part(panel)` from step 05. Two tokens is a surface you can keep; a token per declaration is a second API
   to maintain.

2. In the same file, make the format buttons follow the panel rather than fight it. Replace the two colour
   declarations in `.format-button` — `background: #ffffff;` becomes transparent, and an explicit `color`
   joins them:

   ```css
   .format-button {
     flex: 1;
     padding: 4px 0;
     border: 1px solid #d0d0d0;
     border-radius: 4px;
     background: transparent;
     color: inherit;
     font: inherit;
     font-size: 12px;
     cursor: pointer;
   }
   ```

   `background: transparent` lets the panel's own colour show through, and `color: inherit` pulls the text
   colour down from `.panel` — so both follow the theme without either token being named twice. The selected
   button keeps its own hard-coded pair below, which is what makes it stay legible on a dark panel and a light
   one alike.

3. In `demo/index.html`, add the two tokens to the themed picker's rule in the `<style>` block, above the
   `#themed::part(panel)` rule.

   ```css
   #themed {
     --color-picker-background: #111111;
     --color-picker-text-color: #f0f0f0;
   }
   ```

   They are set on the **host element**, in the page's own stylesheet, using a plain id selector — no
   `::part()`, no knowledge of what is inside. The values reach the panel because custom properties inherit
   downward through the shadow root.

4. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] The **second** picker's panel is **near-black (`#111111`) with light text** in its readout and its two
      unselected format buttons; its corners are still square from step 05.
- [ ] The **first** picker is unchanged: white panel, dark text, rounded corners. It sets no tokens and gets
      the fallbacks.
- [ ] Both pickers' squares, rails, handles and swatches look identical — the theme reached the panel and the
      text, and nothing else.
- [ ] In the console, `document.querySelector('color-picker').style.setProperty('--color-picker-background',
      '#ffcc00')` turns the **first** picker's panel amber immediately, with no rebuild.

## If it breaks

- **Both panels go dark** → the tokens were set on `color-picker` or `:root` rather than on `#themed`. A custom
  property set on an ancestor inherits into every picker below it.
- **The themed panel is transparent, showing the page behind it** → the `var()` call has no fallback, or the
  token name in the page and in the component differ by a character. Custom properties are case-sensitive and
  fail silently.
- **The themed picker's readout is unreadable dark-on-dark** → `color: var(--color-picker-text-color, #1a1a1a)`
  is missing from `.panel`; the readout inherits its colour from there.
- **The unselected format buttons stay white blocks** → `background: transparent` did not replace
  `background: #ffffff` in `.format-button`.

---
> Nav: [← Name the parts](05_name-the-parts.md) · [Overview](00_overview.md) · [Verify →](07_verify.md)
