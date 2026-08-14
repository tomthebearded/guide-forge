# Milestone 4 · Step 02 of 07 — The `value` attribute
> Nav: [← Read a colour in](01_read-a-color-in.md) · [Overview](00_overview.md) · [The `value` property →](03_the-value-property.md)

## Before you start

Step 01 done: `<color-picker value="#3366ff">` renders that colour on load.

## Glossary for this step

- [observedAttributes](../foundation/glossary.md#observedattributes) — defined under *Do this*, action 1.

## Why / design

Reading an attribute once, at mount, is not a contract — it is a default. A host page will change the
attribute later: a theme switcher, a form reset, a value loaded from an API. For the element to notice, it has
to *subscribe*.

The browser does the subscribing, but only to attributes you name in advance.

There is a second problem hiding behind the first, and it is worth meeting now rather than in step 04. From
step 04 onwards this element will also write the `value` attribute **itself**, every time the colour changes.
When that happens the browser calls the same callback — so the element needs to be able to tell "the host set
this" from "I set this". The mechanism this step puts in place is a **version counter**: it counts genuine
outside writes, and React re-syncs whenever the count moves.

Why a counter rather than comparing strings: a host page can legitimately set `value` back to a string the
component has already seen. Compare strings and that write looks like a no-op and is silently dropped; count
writes and it never is.

## Do this

1. **Declare the observed attribute.** In `src/color-picker-element.tsx`, add this as the first line inside
   the class body, above the private fields.

   > **New concept — `observedAttributes`.** A static array naming the attributes the browser should watch.
   > Change one of these on the tag and the browser calls `attributeChangedCallback(name, oldValue,
   > newValue)`; change any other attribute and nothing happens. It is read **once**, when the class is
   > registered — adding a name to it at runtime has no effect.
   > ([MDN: using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements))

   ```tsx
   // src/color-picker-element.tsx — the first line inside the class body
   static observedAttributes = ['value'];
   ```

2. **Add the version counter** beside the other private fields.

   ```tsx
   // src/color-picker-element.tsx — added below `#reactRoot: Root | null = null;`
   // Counts writes to `value` that came from outside this element.
   #hostValueVersion = 0;
   ```

3. **Extract the render into its own method.** Add it below `disconnectedCallback`, then point
   `connectedCallback` at it. Both edits go in this step: `connectedCallback` currently holds the only copy of
   the render call, and leaving it there would mean two places that have to agree.

   ```tsx
   // src/color-picker-element.tsx — added as a new method below disconnectedCallback()
   #render() {
     this.#reactRoot?.render(
       <ColorPicker
         hostValue={this.getAttribute('value') ?? undefined}
         hostValueVersion={this.#hostValueVersion}
       />,
     );
   }
   ```

   ```tsx
   // src/color-picker-element.tsx — replacing the `this.#reactRoot.render(<ColorPicker ... />);` line inside connectedCallback
   this.#render();
   ```

4. **Add the callback.** Below `disconnectedCallback` and above `#render`.

   ```tsx
   // src/color-picker-element.tsx — added as a new method
   attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null) {
     // Every observed attribute currently comes from outside, so every call is a host write.
     // Step 04 adds the one case that isn't.
     this.#hostValueVersion += 1;
     this.#render();
   }
   ```

   The leading underscores mark the three parameters as deliberately unused: the signature is fixed by the
   platform, and `#render` reads the attribute back itself rather than trusting `newValue`. The
   `_name`/`_oldValue`/`_newValue` spelling is what keeps the linter quiet without switching the check off.

   Note the ordering the browser guarantees: for `<color-picker value="#3366ff">` written in the HTML, the
   constructor runs, then `attributeChangedCallback` fires for the attribute already present, then
   `connectedCallback`. The callback therefore runs while `#reactRoot` is still `null` — which is why `#render`
   uses `?.` and simply does nothing that first time. `connectedCallback` renders a moment later, with the
   counter already at 1.

5. **Accept the version in the component.** In `src/ColorPicker.tsx`, add the prop and put it in the effect's
   dependency list.

   ```tsx
   // src/ColorPicker.tsx — replacing the ColorPickerProps interface
   export interface ColorPickerProps {
     /** The colour the host page asked for, as hex. Undefined means "you choose". */
     hostValue?: string;
     /** Increments on every write from outside, so a repeated value still re-syncs. */
     hostValueVersion?: number;
   }
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the `export function ColorPicker({ hostValue }: ColorPickerProps) {` line
   export function ColorPicker({ hostValue, hostValueVersion }: ColorPickerProps) {
   ```

   ```tsx
   // src/ColorPicker.tsx — replacing the dependency array on the existing useEffect
   }, [hostValue, hostValueVersion]);
   ```

6. **Build and reload.**

   ```bash
   npm run build
   ```

## Done when (this step)

- With the demo page open, select `<color-picker>` in DevTools' **Elements** panel, double-click the `value`
  attribute and change it to `#ff0000`. The swatch turns red, the readout reads exactly `#ff0000`, and both
  handles move — without a reload.
- Set it to `#00ff00`, then drag the picker somewhere else, then set it back to `#00ff00`. The picker returns
  to green. This is the case the version counter exists for: the string did not change from the last one the
  component was given, and it re-synced anyway.
- Set it to `nonsense`: nothing changes and the Console shows no error.
- `npm run build` exits without printing an error.

## If it breaks

- **Editing the attribute does nothing.** `observedAttributes` is missing, misspelled, or not `static`. It is
  read once at registration, so a typo there fails silently rather than throwing.
- **Setting a value the picker has already seen does nothing.** `hostValueVersion` is not in the effect's
  dependency array.
- **`Uncaught TypeError: Cannot read properties of null (reading 'render')`.** `#render` is missing the `?.`
  after `#reactRoot`. The callback genuinely does run before the root exists.
- **The linter complains about unused parameters.** They need the leading underscore — `_name`, `_oldValue`,
  `_newValue`.

---
> Nav: [← Read a colour in](01_read-a-color-in.md) · [Overview](00_overview.md) · [The `value` property →](03_the-value-property.md)
