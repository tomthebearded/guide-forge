# Milestone 4 · Step 03 of 07 — The `value` property
> Nav: [← The `value` attribute](02_the-value-attribute.md) · [Overview](00_overview.md) · [Reflect the value out →](04_reflect-the-value-out.md)

## Before you start

Step 02 done: changing the `value` attribute in DevTools moves the picker.

## Glossary for this step

- [attribute vs property](../foundation/glossary.md#attribute-vs-property) — defined under *Why / design*.

## Why / design

> **New concept — attribute vs property.** An **attribute** is the string written in the HTML —
> `value="#3366ff"` — and it is always a string. A **property** is a live field on the JavaScript object the
> element *is* — `el.value` — and it can be any type. They are two separate things that happen to share a
> name, and nothing in the platform keeps them in step for you.

Every native input has both, and script talks to the property: `input.value = 'x'`, never
`input.setAttribute('value', 'x')`. A component that only accepts the attribute is a component every
JavaScript integration has to be told about specially — and jQuery, React, Vue and Angular all write the
property when they can.

This is the step Angular's element bridge would have written for you. `@angular/elements` generates a property
accessor for every input a component declares. React has no equivalent, so the accessors are yours: two
methods, five lines, and the whole of `el.value` works.

## Do this

1. **Add the accessors** to `src/color-picker-element.tsx`, below `attributeChangedCallback` and above
   `#render`.

   ```tsx
   // src/color-picker-element.tsx — added as new members below attributeChangedCallback()
   get value(): string {
     return this.getAttribute('value') ?? '';
   }

   // Writing the property writes the attribute, which is what triggers the re-render.
   // One direction of the mapping, in one line — nothing in the platform does it for you.
   set value(hexText: string) {
     this.setAttribute('value', hexText);
   }
   ```

   `value` is a **load-bearing** name: it is what a host page will reach for, because it is what every native
   input calls this. The getter returns `''` rather than `null` for an absent attribute, again matching what a
   native input does.

2. **Build and reload.**

   ```bash
   npm run build
   ```

3. **Drive it from the Console.** With the demo page open:

   ```js
   const picker = document.querySelector('color-picker');
   picker.value = '#00ff00';
   ```

## Done when (this step)

- After `picker.value = '#00ff00'`, the swatch turns green, the readout reads exactly `#00ff00`, the rail's
  handle moves to one third along the rail and the square's handle jumps to the top-right corner.
- The Elements panel shows the tag as `<color-picker value="#00ff00">` — writing the property wrote the
  attribute.
- Typing `picker.value` in the Console prints `'#00ff00'`.
- Reading it back before you have set anything — hard-reload first — prints `'#3366ff'`, the value the demo
  page's HTML carries.
- `npm run build` exits without printing an error.

## If it breaks

- **`picker.value = '#00ff00'` changes nothing and `picker.value` prints `undefined` afterwards.** The tag was
  never upgraded, so it is a plain `HTMLElement` and you have just set an ordinary JavaScript property on it.
  Check the Console for a module error and that the Elements panel shows the shadow root.
- **The property sets the attribute but nothing re-renders.** `observedAttributes` from step 02 is missing —
  the setter's whole mechanism is that `setAttribute` triggers the callback.
- **`picker.value` prints `null` for an absent attribute.** The `?? ''` is missing from the getter.

---
> Nav: [← The `value` attribute](02_the-value-attribute.md) · [Overview](00_overview.md) · [Reflect the value out →](04_reflect-the-value-out.md)
