# Milestone 4 · Step 05 of 07 — `input` and `change` events
> Nav: [← Reflect the value out](04_reflect-the-value-out.md) · [Overview](00_overview.md) · [Preset swatches →](06_preset-swatches.md)

## Before you start

Step 04 done: dragging rewrites the `value` attribute.

## Glossary for this step

- [CustomEvent](../foundation/glossary.md#customevent) — defined under *Do this*, action 1.

## Why / design

Reflecting the attribute lets a host page *ask*. Events let it *be told* — and a page that has to poll an
attribute to notice a colour change is a page nobody wants to write.

The two-event split is not an invention: it is what every native input does. `input` fires continuously while
the value is being changed; `change` fires once, when the interaction ends. A live preview listens to `input`;
a save button listens to `change`. Matching that convention is most of what makes a custom element feel like
part of the platform rather than like a widget.

Both events carry **hex**, whatever the readout happens to be showing. That is the decision M5 depends on:
the format switch there changes what you *see*, never what the component *emits*. One wire format means a
host page that stores `event.detail.value` can hand it straight back as `el.value` and get the same colour.

## Do this

1. **Turn the reflector into a publisher.** In `src/color-picker-element.tsx`, replace the whole `#reflect`
   method with `#publish`.

   > **New concept — `CustomEvent`.** A DOM event you construct and dispatch yourself, carrying whatever you
   > like on its `detail` field. `bubbles: true` lets it travel up the host page's DOM so a listener on an
   > ancestor hears it; `composed: true` lets it cross the shadow boundary, which it must, because it is
   > dispatched on the host element from inside a component the page cannot see.
   > ([MDN `CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent))

   ```tsx
   // src/color-picker-element.tsx — replacing the whole #reflect() method
   #publish(eventName: 'input' | 'change', hexText: string) {
     // setAttribute calls attributeChangedCallback synchronously, so the flag is
     // guaranteed to still be true when the callback checks it.
     this.#isReflecting = true;
     this.setAttribute('value', hexText);
     this.#isReflecting = false;

     this.dispatchEvent(
       new CustomEvent(eventName, {
         detail: { value: hexText },
         bubbles: true,
         composed: true,
       }),
     );
   }
   ```

2. **Point the two callbacks at it.** Replace both lines inside `#render`.

   ```tsx
   // src/color-picker-element.tsx — replacing the two callback props inside #render()
   onValueInput={(hexText) => this.#publish('input', hexText)}
   onValueCommit={(hexText) => this.#publish('change', hexText)}
   ```

   The event names `input` and `change` and the payload shape `{ value: hexText }` are **load-bearing**: they
   are the public contract, and the demo page's listeners in action 3 spell all three.

3. **Listen on the demo page.** In `demo/index.html`, add a log element after the `<color-picker>` tag and a
   script that fills it.

   ```html
   <!-- color-picker-demo/demo/index.html — added directly below the <color-picker> line -->
   <pre id="event-log"></pre>
   ```

   ```html
   <!-- color-picker-demo/demo/index.html — added directly above the closing </body> tag -->
   <script type="module">
     const picker = document.querySelector('color-picker');
     const log = document.querySelector('#event-log');

     function record(event) {
       // Newest line on top, capped so the page cannot grow without limit.
       const line = `${event.type.padEnd(6)} ${JSON.stringify(event.detail)}`;
       log.textContent = [line, ...log.textContent.split('\n')].slice(0, 12).join('\n');
     }

     picker.addEventListener('input', record);
     picker.addEventListener('change', record);
   </script>
   ```

   This second `<script>` goes **after** the one that loads the bundle, so the element is registered by the
   time it runs. It is also the first line of JavaScript on the demo page — and it is worth noticing how
   little of it there is, and that none of it mentions React.

4. **Give the log some styling.** In `demo/index.html`, add this rule inside the existing `<style>` block.

   ```css
   /* color-picker-demo/demo/index.html — added inside the existing <style> block */
   #event-log {
     margin-top: 16px;
     padding: 8px 12px;
     min-height: 6em;
     background: #ffffff;
     border: 1px solid #d4d4d8;
     border-radius: 6px;
     font-size: 13px;
   }
   ```

5. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- Press inside the square, drag, and release. While you drag, lines reading `input  {"value":"#..."}` stream
  into the log. On release, exactly **one** line reading `change {"value":"#..."}` appears on top, and its
  hex is identical to the last `input` line's.
- The same is true of the hue rail.
- A single click inside the square without moving produces one `input` line and one `change` line.
- Setting `picker.value = '#00ff00'` from the Console moves the picker and adds **no** lines to the log. A
  programmatic write is not user input, and emitting an event for it is how you give a host page an infinite
  loop.
- `npm run build` exits without printing an error.

Note on that "exactly one `change`": it is exactly one because the element bundle contains no `StrictMode`.
React's development-only wrapper double-invokes effects, and a version of this component wrapped in it would
put two `change` lines in the log for one release — correct code reading as broken. See
[`../foundation/conventions.md`](../foundation/conventions.md).

## If it breaks

- **No lines appear at all.** The listener script ran before the element existed — check it sits below the
  `<script src=...>` that loads the bundle, and that both are `type="module"`.
- **`input` lines appear but `change` never does.** `onPointerUp={commitColor}` from step 04 is missing from
  one or both tracks.
- **Two `change` lines per release.** Something wrapped the component in `StrictMode`, or `onPointerUp` is on
  both the track and a child that also receives the event.
- **The events never reach the page's listener.** `composed: true` is missing, so the event stops at the
  shadow boundary.
- **`event.detail` prints `null` in the log.** The `detail` key is misspelled or nested — it goes directly in
  the options object passed to `new CustomEvent`.

---
> Nav: [← Reflect the value out](04_reflect-the-value-out.md) · [Overview](00_overview.md) · [Preset swatches →](06_preset-swatches.md)
