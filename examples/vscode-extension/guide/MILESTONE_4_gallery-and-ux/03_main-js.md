# M4 · Step 03 of 6 — Create `media/webview/main.js` — the gallery + preview + contrast
> Nav: [← Externalize the CSS](02_styles.md) · [Overview](00_overview.md) · [Rewrite the provider →](04_provider-externalize.md)

## Glossary for this step
- **[Contrast ratio (WCAG)](../foundation/glossary.md#contrast-ratio-wcag)** — how distinguishable two colors are,
  1:1 → 21:1; **AA** text wants ≥ **4.5:1**, **AAA** wants ≥ **7:1**.

## Why / design
This is the panel's brain and the largest step in M4. `main.js` receives the list of combos and styles from the
extension, draws them as clickable **chips**, applies the selection **the instant you click**, and — when the
extension reports back — renders the **swatch strip** and the **contrast badge**. It holds no color knowledge of
its own: the engine computes palettes, the provider ships them over, the script only draws what it's told.

> 🧠 **Reminder — `acquireVsCodeApi()` (New in M1).** Inside a webview script VS Code injects one global,
> `acquireVsCodeApi()`, returning the bridge you call `.postMessage(...)` on. **Call it exactly once** and keep the
> result — calling it twice throws. We call it on the first line and reuse `vscode` everywhere. Docs:
> [Webview → passing messages](https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension).

> 🧠 **New concept — the `ready` → `init` → render → `apply` → `applied` message flow (data-driven rendering).**
> The webview and the extension never share memory; they only exchange messages. M4 uses a fixed round-trip:
> 1. **`ready`** — the last line of `main.js` posts `{ type: 'ready' }` as soon as the script loads, meaning
>    "I'm alive, send me the data."
> 2. **`init`** — the extension replies with `{ type: 'init', combos, profiles }`. The webview does **not**
>    hardcode the 13 styles; it renders whatever `init` carries. (Add a 14th profile in the engine later and this
>    file never changes — that's *data-driven rendering*.)
> 3. **render** — `render()` builds the chip rows from `state.combos` / `state.profiles`.
> 4. **`apply`** — clicking a chip posts `{ type: 'apply', comboId, profileId, variant? }`; the extension
>    generates the theme and writes the chrome live.
> 5. **`applied`** — the extension answers with `{ type: 'applied', palette, contrast }`; `renderPreview()` draws
>    the swatch strip + badge from it.
>
> The message **type strings** (`ready`, `init`, `apply`, `applied`, `revert`, `reset`) are **load-bearing** — both
> sides must spell them identically or a message is silently ignored.

> 🧠 **Enforced-on-select apply — exactly once per pick.** There's no separate "Apply" button. Every chip's
> click handler calls `render()` (to redraw the chips with the new `active` highlight) **and then** `apply()`
> once. `render()` is pure drawing — it does **not** apply — so the selection is applied exactly one time per
> pick. The very first apply happens once in the `init` handler, right after the first `render()`, so the panel
> lands already showing the current selection. Selecting *is* applying; that immediacy is what makes the
> reality-check in step 06 worth doing.
>
> ⚠️ **Why `render()` must not call `apply()`.** If `render()` ended with an `apply()`, a chip click — which
> already calls `render(); apply();` — would fire **two** identical `apply` messages, so the provider would take
> **two** history snapshots per pick. The first **Revert** would then look inert (it pops the duplicate). One
> apply per action = one snapshot per pick; that's the gate in step 06.

The DOM code here is plain, intermediate JavaScript — a tiny `el()` helper that creates an element and assigns
props, and a `section()` helper that wraps a titled block. No framework.

## Do this
This step creates **one file**: `media/webview/main.js`. It's built as a single IIFE; the fragments below assemble
**top-to-bottom inside that closure** in the order given. (The complete file is also shown whole in
[the M4 checkpoint](06_verify.md) under `### media/webview/main.js` if you want to diff.)

> **Before you start:** `media/webview/` must already exist with `styles.css` in it (step 02). This file is its
> sibling.

1. In **`media/webview/`** (from step 02), create the file **`media/webview/main.js`** (load-bearing path — step
   04's `asWebviewUri` points here). Open the IIFE and declare **`state`** — the single source of UI truth: the
   received `combos`/`profiles` and the current `comboId` / `profileId` / `variant` selection.

   At the **top of `media/webview/main.js`** (this opens the closure; it's closed in the last fragment):
   ```js
   (function () {
     const vscode = acquireVsCodeApi();
     const app = document.getElementById('app');
     const state = { combos: [], profiles: [], comboId: null, profileId: null, variant: null };
   ```
2. Add the **`message` listener** — it routes `init` (store data, pick defaults, `render()`, then `apply()`
   **once** so the first selection lands) and `applied` (`renderPreview`).

   In `main.js`, **directly below the `state` declaration**:
   ```js
   window.addEventListener('message', (event) => {
     const msg = event.data;
     if (msg.type === 'init') {
       state.combos = msg.combos;
       state.profiles = msg.profiles;
       if (!state.comboId && state.combos[0]) state.comboId = state.combos[0].id;
       if (!state.profileId && state.profiles[0]) state.profileId = state.profiles[0].id;
       render();
       apply(); // apply the initial selection once, right after the first draw
     } else if (msg.type === 'applied') {
       renderPreview(msg.palette, msg.contrast);
     }
   });
   ```
3. Add **`apply()`** — it posts the current selection and guards against firing before defaults exist.

   In `main.js`, **below the message listener**:
   ```js
   function apply() {
     if (!state.comboId || !state.profileId) return;
     vscode.postMessage({ type: 'apply', comboId: state.comboId, profileId: state.profileId, variant: state.variant || undefined });
   }
   ```
4. Add the two DOM helpers **`el()`** (create an element and assign props) and **`section()`** (wrap a titled
   block).

   In `main.js`, **below `apply()`**:
   ```js
   function el(tag, props, ...kids) {
     const n = document.createElement(tag);
     Object.assign(n, props || {});
     for (const k of kids) n.append(k);
     return n;
   }
   function section(title, body) {
     return el('div', { className: 'section' }, el('h4', { textContent: title }), body);
   }
   ```
5. Add **`render()`** — **pure draw (never calls `apply()`)**: it draws combo chips, style chips, and (only when
   the selected profile has `variants`) a variant row, plus an empty `#preview` box the extension fills, plus
   Revert/Reset. Clicking a **style** chip resets `variant` to `null` so a fresh style starts on its default
   variant.

   In `main.js`, **below the helpers**:
   ```js
   function render() {
     app.innerHTML = '';

     const combosBox = el('div', { className: 'row' });
     for (const c of state.combos) {
       const b = el('button', { textContent: c.label, className: c.id === state.comboId ? 'chip active' : 'chip' });
       b.addEventListener('click', () => { state.comboId = c.id; render(); apply(); });
       combosBox.append(b);
     }
     app.append(section('Starter combination', combosBox));

     const profBox = el('div', { className: 'row' });
     for (const p of state.profiles) {
       const b = el('button', { textContent: p.label, className: p.id === state.profileId ? 'chip active' : 'chip' });
       b.addEventListener('click', () => { state.profileId = p.id; state.variant = null; render(); apply(); });
       profBox.append(b);
     }
     app.append(section('Style', profBox));

     const sel = state.profiles.find((p) => p.id === state.profileId);
     if (sel && sel.variants && sel.variants.length) {
       const vbox = el('div', { className: 'row' });
       for (const v of sel.variants) {
         const active = (state.variant || sel.variants[0]) === v;
         const b = el('button', { textContent: v, className: active ? 'chip active' : 'chip' });
         b.addEventListener('click', () => { state.variant = v; render(); apply(); });
         vbox.append(b);
       }
       app.append(section('Variant', vbox));
     }

     app.append(el('div', { id: 'preview', className: 'section' }));

     const actions = el('div', { className: 'row' });
     const mk = (label, type) => { const b = el('button', { textContent: label, className: 'btn' }); b.addEventListener('click', () => vscode.postMessage({ type })); return b; };
     actions.append(mk('Revert', 'revert'), mk('Reset', 'reset'));
     app.append(section('Actions', actions));
   }
   ```
6. Add **`renderPreview(palette, contrast)`** — it draws the 8 swatches in a fixed role order and the contrast
   badge, choosing `ok`/`warn`/`bad` by the AAA (≥7) / AA (≥4.5) / fail thresholds.

   In `main.js`, **below `render()`**:
   ```js
   function renderPreview(palette, contrast) {
     const box = document.getElementById('preview');
     if (!box) return;
     box.innerHTML = '';
     box.append(el('h4', { textContent: 'Palette' }));
     const strip = el('div', { className: 'swatches' });
     for (const key of ['bg', 'surface', 'surfaceAlt', 'text', 'textMuted', 'accent1', 'accent2', 'border']) {
       const sw = el('div', { className: 'swatch', title: key + ' ' + palette[key] });
       sw.style.background = palette[key];
       strip.append(sw);
     }
     box.append(strip);
     const aa = contrast >= 4.5, aaa = contrast >= 7;
     box.append(el('span', {
       className: 'badge ' + (aaa ? 'ok' : aa ? 'warn' : 'bad'),
       textContent: 'text/bg contrast ' + contrast + ':1 ' + (aaa ? 'AAA' : aa ? 'AA' : 'FAIL'),
     }));
   }
   ```
7. Finally, post **`ready`** and close the IIFE.

   As the **last lines of `main.js`**:
   ```js
   vscode.postMessage({ type: 'ready' });
   })();
   ```
8. This is the **M4 subset**. It deliberately has **no** language input, **no** Save/Export/Import, and **no**
   saved-sets list — those are M5. Don't add them now. Save.

### Reading notes (intermediate JS one-liners)
- **`(function () { … })();`** — an IIFE: it runs immediately and keeps `vscode`, `state`, and the helpers out of
  the global scope (webview scripts share one global namespace, so this avoids collisions).
- **`Object.assign(n, props || {})`** — copies props like `textContent`, `className`, `id`, `type` straight onto
  the DOM node; `className: '…'` sets the class, `textContent: '…'` sets the label.
- **`state.variant || undefined`** in `apply()` — sends `undefined` (not `null`) when no variant is chosen, so the
  engine's `buildPalette` default kicks in.
- **The swatch key order** `['bg','surface','surfaceAlt','text','textMuted','accent1','accent2','border']` is the
  fixed 8-role `Palette` shape from the engine; that's why the strip is always 8 swatches.
- **The badge thresholds** encode WCAG: `contrast >= 7` → `AAA` (green `ok`), `>= 4.5` → `AA` (amber `warn`), else
  `FAIL` (red `bad`). The extension pre-rounds `contrast` to two decimals before sending it.

## Done when (this step)
- The file **`media/webview/main.js`** exists with the content above, alongside `styles.css`.
- Still nothing renders in the panel — the provider isn't serving these files yet (step 04). This file is verified
  end-to-end as part of step 04's Done-when and the milestone gate in step 06.

## If it breaks
- **You started adding a language box / Save button** → stop; that's the M5 delta. The M4 `main.js` ends at
  Revert/Reset. Keeping M4 to its subset is what makes M5's diff teachable.
- **Editor flags `acquireVsCodeApi` as undefined** → that's your editor's type-checker; `acquireVsCodeApi` only
  exists at runtime inside the webview, so a lint warning here is harmless. (It's a plain `.js` file, not compiled.)
- **Worried the chips won't highlight** → the highlight is the `active` class toggled in `render()`; it's styled by
  `.chip.active` in `styles.css` from step 02. If step 02's file is missing, chips render but look unstyled.
- **The first Revert seems to do nothing / you undo twice per pick** → `render()` is calling `apply()`. It must
  not: a chip click already runs `render(); apply();`, so a second apply inside `render()` fires two identical
  `apply` messages and the provider snapshots twice per pick. Keep `render()` pure and apply once in each click
  handler (and once in `init`). This is exactly what step 06's "one snapshot per apply" gate checks.

---
> Nav: [← Externalize the CSS](02_styles.md) · [Overview](00_overview.md) · [Rewrite the provider →](04_provider-externalize.md)
