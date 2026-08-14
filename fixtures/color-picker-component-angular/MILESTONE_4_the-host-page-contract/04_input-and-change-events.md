# M4 · Step 04 of 06 — `input` and `change` events
> Nav: [← Reflect the value out](03_reflect-the-value-out.md) · [Overview](00_overview.md) · [Preset swatches →](05_preset-swatches.md)

## Glossary for this step

> New here: **[CustomEvent](../foundation/glossary.md#customevent)** (defined under *Do this* 2).

## Why / design

A page can now read the colour whenever it likes. It still has to *ask*, which means polling, which nobody
does. The missing half of the contract is the component telling the page.

Two events, not one, and the split is the one native inputs use:

- **`input`** fires continuously, on every move of the drag. It is for a live preview — a heading that recolours
  as you drag.
- **`change`** fires once, when the pointer comes up. It is for anything expensive or final: a save, a request,
  an undo entry.

A page that listened only to `change` would feel dead during the drag; a page that saved on every `input` would
write two hundred records per drag. Offering both is what lets the page choose, and it costs one extra handler.

Angular outputs become DOM events on the way out, which is the second half of the bridge from milestone 1.

## Before you start

Step 03 complete: the `value` attribute updates live in the Elements panel as you drag.

## Do this

1. In `src/color-picker.ts`, add `output` to the `@angular/core` import list, and declare the payload shape
   above the `@Component` decorator.

   ```ts
   export interface ColorChangeDetail {
     value: string;
   }
   ```

   An object rather than a bare string, because an event payload is a contract you have to keep: adding a
   field to an object is compatible, replacing a string with an object is not.

2. In the class, declare the two outputs directly below `readonly value = input('');`.

   ```ts
   readonly colorInput = output<ColorChangeDetail>({ alias: 'input' });
   readonly colorChange = output<ColorChangeDetail>({ alias: 'change' });
   ```

   > **New concept — `CustomEvent`.** A DOM event you create yourself, carrying arbitrary data on its `detail`
   > property. It is how a custom element speaks to a page that knows nothing about what is inside it.
   > `@angular/elements` turns every output into one: the **alias** becomes the event name, and whatever you
   > emit becomes `event.detail`.
   > ([MDN: `CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) ·
   > [Custom elements guide](https://angular.dev/guide/elements))

   The field names and the event names differ on purpose. `input` and `change` are the names a page expects, so
   they are what the aliases say; `colorInput` and `colorChange` are what the class calls them, because `input`
   is already taken in this file by Angular's `input()` function.

3. Add the emit helper and the pointer-up handler, below `reflectValueToHost`.

   ```ts
   onPointerUp(): void {
     this.colorChange.emit({ value: this.hexValue() });
   }

   private emitColorInput(): void {
     this.colorInput.emit({ value: this.hexValue() });
   }
   ```

4. Call `emitColorInput` at the end of both setters — the two places where a drag changes the colour.

   ```ts
   private setHueFromPointer(rail: HTMLElement, event: PointerEvent): void {
     const { xRatio } = pointerRatiosWithin(rail, event);
     this.hueDegrees.set(xRatio * 360);
     this.emitColorInput();
   }

   private setSaturationAndValueFromPointer(area: HTMLElement, event: PointerEvent): void {
     const { xRatio, yRatio } = pointerRatiosWithin(area, event);
     this.saturationRatio.set(xRatio);
     this.valueRatio.set(1 - yRatio); // the screen measures down, brightness reads up
     this.emitColorInput();
   }
   ```

   Emitting here rather than in an effect is deliberate: an event should describe *what a person did*, and
   only these two methods know that a person moved a pointer. An effect on `hexValue` would also fire when the
   host page set the value itself, and a page that receives a `change` event for its own write has no way to
   avoid a loop.

5. In `src/color-picker.html`, add a `pointerup` binding to **both** interactive elements. Replace the two
   opening tags:

   ```html
   <div class="sv-area" [style.background-color]="hueOnlyHex()" (pointerdown)="onAreaPointerDown($event)" (pointermove)="onAreaPointerMove($event)" (pointerup)="onPointerUp()">
   ```

   ```html
   <div class="hue-rail" (pointerdown)="onHuePointerDown($event)" (pointermove)="onHuePointerMove($event)" (pointerup)="onPointerUp()">
   ```

   The pointer capture from milestone 2 is what makes one handler enough: the release is delivered to the
   element that captured the pointer even when it happens somewhere else entirely.

6. In `demo/index.html`, add a log the events can write to. Put both blocks **after** the `<color-picker>` line
   and **before** the `<script type="module" …>` line.

   ```html
   <h2>Events</h2>
   <pre id="event-log">(nothing yet)</pre>
   ```

   ```html
   <script>
     const picker = document.querySelector('color-picker');
     const eventLog = document.querySelector('#event-log');

     for (const eventName of ['input', 'change']) {
       picker.addEventListener(eventName, (event) => {
         eventLog.textContent = `${eventName}: ${JSON.stringify(event.detail)}\n${eventLog.textContent}`;
       });
     }
   </script>
   ```

   This is a plain script, not a module, and it runs **before** the bundle has loaded and defined the tag. That
   is fine and it is worth noticing: `addEventListener` works on an element the browser has not upgraded yet,
   and the listeners survive the upgrade. A host page never has to sequence its scripts around yours.

7. Rebuild and hard-reload.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `npm run build` exits **0** (bash: `echo $?` · PowerShell: `$LASTEXITCODE`).
- [ ] Dragging in the square writes a **run of `input:` lines** to the log, newest on top, each shaped
      `input: {"value":"#xxxxxx"}`.
- [ ] Releasing writes exactly **one** `change:` line, and its value matches the last `input:` line above it.
- [ ] A single click in the square (press and release without moving) logs **one `input:` and one `change:`**.
- [ ] Dragging the hue rail logs the same pair of event types.
- [ ] Setting `document.querySelector('color-picker').value = '#00ff00'` from the console moves the picker and
      logs **nothing** — a page's own write is not a reader action.

## If it breaks

- **No lines at all** → the listeners were attached to `null`, because the `<script>` block landed above the
  `<color-picker>` tag. `document.querySelector` runs immediately; the element must already be in the markup
  above it.
- **`change` fires on every move too** → `onPointerUp` is bound to `pointermove`, or `emitColorInput` is
  calling the wrong output.
- **`detail` is `null` in the log** → the emit was called with no argument. It takes the object.
- **The log shows `[object Object]`** → `JSON.stringify` is missing from the listener.
- **Nothing fires on touch, but the mouse works** → the `pointerup` binding landed on only one of the two
  elements.

---
> Nav: [← Reflect the value out](03_reflect-the-value-out.md) · [Overview](00_overview.md) · [Preset swatches →](05_preset-swatches.md)
