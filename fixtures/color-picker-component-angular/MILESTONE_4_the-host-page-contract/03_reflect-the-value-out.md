# M4 · Step 03 of 06 — Reflect the value out
> Nav: [← The `value` attribute](02_the-value-attribute.md) · [Overview](00_overview.md) · [`input` and `change` events →](04_input-and-change-events.md)

## Why / design

Right now the attribute is a one-way instruction: the page writes it, the picker obeys it, and then the picker
moves on without it. Open DevTools while dragging and you can watch `value="#3366ff"` sit there, stale, while
the swatch turns orange.

Native inputs behave the same way, and this component is deliberately not going to. **Reflection** — writing
the current state back to the attribute — is what makes the element inspectable: you can see the colour in the
Elements panel, copy the markup and get the same colour back, and read it with `getAttribute` from a script
that never listened to an event.

Doing it means reaching for the host element itself, which is the first time this component touches the DOM
directly. It also means closing the loop you are about to create:

```
drag → hexValue changes → attribute written → Angular re-reads the attribute → value input changes → …
```

That last arrow lands back in step 02's effect, and without a guard it would run forever. There are two guards
and you have already written one of them.

## Before you start

Step 02 complete: the picker opens on `#3366ff` and `element.value = '#00ff00'` moves it.

## Do this

1. In `src/color-picker.ts`, extend the `@angular/core` import with the two names this step needs.

   ```ts
   import {
     Component,
     ElementRef,
     ViewEncapsulation,
     computed,
     effect,
     inject,
     input,
     signal,
     untracked,
   } from '@angular/core';
   ```

2. In the class, add the host-element field directly above `readonly value = input('');`.

   ```ts
   private readonly hostElement: HTMLElement = inject(ElementRef).nativeElement;
   ```

   `inject(ElementRef)` asks Angular's injector — the one you handed to `createCustomElement` back in milestone
   1 — for a wrapper around this component's own DOM node, and `.nativeElement` unwraps it. For a custom
   element that node is the `<color-picker>` tag itself, which is exactly the thing whose attribute you want to
   write.

3. Add the second effect to the constructor, below the first.

   ```ts
   constructor() {
     effect(() => this.applyIncomingValue(this.value()));
     effect(() => this.reflectValueToHost(this.hexValue()));
   }
   ```

   The two effects read different signals and write in opposite directions. Keeping them apart is what makes
   each one readable; merging them into one block that does both is how this becomes impossible to reason
   about.

4. Add the method below `applyIncomingValue`.

   ```ts
   private reflectValueToHost(hex: string): void {
     if (this.hostElement.getAttribute('value') !== hex) {
       this.hostElement.setAttribute('value', hex);
     }
   }
   ```

   This is the second guard: **do not write what is already there.** Together with the one in
   `applyIncomingValue` the cycle above terminates on its first lap — the attribute write does trigger the
   input, the input effect does re-run, and it returns immediately because the colour it parsed is the colour
   already on screen.

   Compare the two strings rather than the two colours, and note that both sides are produced by `rgbToHex`, so
   both are lower-case. This is where the casing decision in milestone 2 earns its keep: `#3366FF` from a host
   page parses to the same colour and reflects back as `#3366ff`, once, and then stops.

5. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] Open DevTools → **Elements**, find the `<color-picker>` tag, and drag the square. The `value` attribute
      **updates live in the markup**, in step with the readout.
- [ ] In the console, `document.querySelector('color-picker').getAttribute('value')` returns the colour
      currently on screen — the same string the readout shows.
- [ ] The page does **not** freeze and the console shows no `NG0103` / infinite-loop warning. If either guard
      were missing, this is where you would find out.
- [ ] Setting `document.querySelector('color-picker').value = '#00ff00'` still works, and afterwards the
      attribute reads `#00ff00`.

## If it breaks

- **The tab hangs on load or on the first drag** → one of the two guards is missing or inverted. Both are
  early returns: "already showing this colour" in `applyIncomingValue`, "attribute already says this" in
  `reflectValueToHost`.
- **`NG0602: effect() cannot be called from within a reactive context`** → the second `effect` landed inside
  the first one's callback rather than beside it in the constructor.
- **`Cannot read properties of undefined (reading 'setAttribute')`** → `inject(ElementRef)` was called outside
  a field initialiser or the constructor. Angular's injection context is only available there.
- **The attribute never changes** → the effect is reading a signal it does not depend on. It must read
  `this.hexValue()`, which is what changes when you drag.

---
> Nav: [← The `value` attribute](02_the-value-attribute.md) · [Overview](00_overview.md) · [`input` and `change` events →](04_input-and-change-events.md)
