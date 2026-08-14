# M4 · Step 02 of 06 — The `value` attribute
> Nav: [← Read a colour in](01_read-a-color-in.md) · [Overview](00_overview.md) · [Reflect the value out →](03_reflect-the-value-out.md)

## Glossary for this step

> New here: **[attribute vs property](../foundation/glossary.md#attribute-vs-property)** (defined under
> *Why / design*).

## Why / design

> **New concept — attribute vs property.** The `value="#3366ff"` in the HTML is an **attribute**: a string, in
> the markup. `element.value` is a **property**: a live field on the JavaScript object. They are two different
> things that happen to share a name, and nothing in the platform keeps them in step for you.
> ([MDN: attributes vs properties](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes))

`@angular/elements` handles exactly one direction of that: it watches the attributes that correspond to your
component's inputs and copies them onto the properties. An input named `value` is fed by the attribute
`value`; an input aliased `myInputProp` would be fed by `my-input-prop`, because the bridge dash-cases the
name. ([Custom elements guide](https://angular.dev/guide/elements))

What it does **not** do is write anything back. When you drag, the attribute in the page's HTML still
says whatever the page originally wrote. Step 03 fixes that; this step builds the way in.

The way in is an **effect**: a block that re-runs whenever a signal it read has changed. Reading `value()`
inside it is what subscribes it, and the body's job is to turn that string into the three signals the handles
live on.

## Before you start

Step 01 complete: `parseHex` and `rgbToHsv` are exported from `src/color-math.ts`.

## Do this

1. In `src/color-picker.ts`, extend the two import lines at the top of the file.

   ```ts
   import { Component, ViewEncapsulation, computed, effect, input, signal, untracked } from '@angular/core';
   import { hsvToRgb, parseHex, rgbToHex, rgbToHsv } from './color-math';
   ```

2. In the class, add the input directly above `readonly hueDegrees = signal(0);`.

   ```ts
   readonly value = input('');
   ```

   `input()` declares a component input as a **read-only signal**: the page writes it, you only read it. The
   name `value` is load-bearing twice over — it is the attribute a host page writes, and it is the property
   name on the element object.

3. Add a constructor below the computed values and above the pointer handlers.

   ```ts
   constructor() {
     effect(() => this.applyIncomingValue(this.value()));
   }
   ```

   > **New concept — `effect`.** A block Angular re-runs whenever any signal it *read last time* changes. It is
   > the escape hatch out of the reactive world into the imperative one — the place for "and also tell the DOM"
   > or "and also tell the page". Reading `this.value()` here is the subscription; nothing else is needed.
   > ([Signals guide](https://angular.dev/guide/signals))

4. Add the method that does the work, below the constructor.

   ```ts
   private applyIncomingValue(text: string): void {
     const rgb = parseHex(text);
     if (rgb === null) {
       return; // not a hex colour — leave the picker where it is
     }
     if (rgbToHex(rgb) === untracked(this.hexValue)) {
       return; // already showing exactly this colour
     }

     const hsv = rgbToHsv(rgb);
     this.hueDegrees.set(hsv.hueDegrees);
     this.saturationRatio.set(hsv.saturationRatio);
     this.valueRatio.set(hsv.valueRatio);
   }
   ```

   The second guard is the one to understand. `untracked(...)` reads a signal **without subscribing to it**, so
   this effect still re-runs only when `value` changes — not every time you drag. Right now the guard
   only saves a redundant write; in step 03 it becomes the thing that stops two effects chasing each other
   forever.

   Note what an unparseable value does: **nothing**. No throw, no console noise, no reset to black. A host page
   that writes `value="rebeccapurple"` gets a picker that keeps working, which is the behaviour you want from a
   tag on someone else's site.

5. In `demo/index.html`, give the tag a starting colour. Replace the `<color-picker></color-picker>` line:

   ```html
   <color-picker value="#3366ff"></color-picker>
   ```

6. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] The picker **opens on `#3366ff`**: the swatch is that blue, the readout reads `#3366ff`, the hue handle
      sits at **62.5%** across the rail (225° of 360°) and the circle sits a fifth of the way in from the right
      edge, hard against the top.
- [ ] In the console, `document.querySelector('color-picker').value = '#00ff00'` turns the picker green
      immediately.
- [ ] In the console, `document.querySelector('color-picker').value = 'rebeccapurple'` changes **nothing** and
      logs no error.
- [ ] Dragging still works, and still overrides whatever the attribute said.

## If it breaks

- **The picker opens red, ignoring the attribute** → either the input is not named `value`, or the effect is
  missing from the constructor. Check the element in DevTools: it should show `value="#3366ff"` in the markup
  either way — the attribute arriving is not the same as the component reading it.
- **`NG0600: Writing to signals is not allowed in a computed`** → `applyIncomingValue` was called from a
  `computed` rather than from the `effect`.
- **The picker resets to `#3366ff` while you drag** → the guard in action 4 is missing, and the effect is
  re-running against a stale attribute.
- **`ReferenceError: untracked is not defined`** → it is missing from the `@angular/core` import list.

---
> Nav: [← Read a colour in](01_read-a-color-in.md) · [Overview](00_overview.md) · [Reflect the value out →](03_reflect-the-value-out.md)
