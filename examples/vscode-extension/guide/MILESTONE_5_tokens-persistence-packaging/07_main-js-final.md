# M5 · Step 07 of 10 — The final webview (language box, Save/Export/Import, My sets)
> Nav: [← Final provider](06_provider-final.md) · [Overview](00_overview.md) · [Export / import →](08_export-import.md)

## Why / design
The provider (step 06) now understands `save`, `applySet`, `delete`, `export`, `import`, a `languageId` on `apply`,
and it posts `savedSets`. This step gives those handlers a UI. We edit `media/webview/main.js` — the plain webview
script (no framework, no `vscode` API beyond `acquireVsCodeApi`) — to add four things to M4's version:

1. **`savedSets` in `state`** + a `savedSets` message handler that stores the list and calls `renderSaved()`.
2. **A per-language `<input>`** — a text box for a `languageId` (e.g. `typescript`). Its value rides along on the
   next `apply` message as `languageId`. Blank = all languages.
3. **Save / Export / Import buttons + a name input** — Save reads the name box and posts `{ type: 'save', name }`;
   Export/Import post their bare message types (the provider drives the VS Code dialogs).
4. **A "My sets" list** (`renderSaved`) — one row per saved set: click the name to apply it, click ✕ to delete it.

> This is webview JS (audience: **Intermediate**) — DOM building with the existing `el()`/`section()` helpers and
> `vscode.postMessage`, both established in M4. Nothing new API-wise; it's UI wiring to the handlers from step 06.

`styles.css` already carries `.badge`, `.text`, and `.muted` (written in M4) — **it is unchanged, do not re-touch
it.** The `enforced-on-select` behavior (selecting a combo/style/variant immediately applies) carries over exactly
as in M4: `render()` stays **pure draw** and each click handler applies **once** (with the initial apply fired
once from `init`) — one apply per pick, one history snapshot per pick. The only change here is that `apply()` now
also sends `state.languageId`, so if the box has `typescript`, selecting a style scopes to TS.

## Do this
This step edits **one file**: `media/webview/main.js` — M4's webview script. `el()`, `section()`, and
`renderPreview()` are unchanged from M4, so the **complete paste-able file is in [the M5 checkpoint](10_verify.md)**
under `### media/webview/main.js` — select-all and paste that. The fragments below walk only the regions that
changed from M4.

> **Before you start:** M4's `media/webview/main.js` must exist, and the final provider (step 06) must be posting
> `savedSets` and understanding `save`/`applySet`/`delete`/`export`/`import` — this UI drives those handlers.

1. **Add `savedSets` and `languageId` to `state`.** Replace the `state` declaration with:
   ```js
   const state = { combos: [], profiles: [], savedSets: [], comboId: null, profileId: null, variant: null, languageId: '' };
   ```
2. **Add the `savedSets` branch** to the `message` listener (it stores the list and re-renders "My sets"), and
   store `savedSets` on `init`. Replace the listener with:
   ```js
   window.addEventListener('message', (event) => {
     const msg = event.data;
     if (msg.type === 'init') {
       state.combos = msg.combos;
       state.profiles = msg.profiles;
       state.savedSets = msg.savedSets || [];
       if (!state.comboId && state.combos[0]) state.comboId = state.combos[0].id;
       if (!state.profileId && state.profiles[0]) state.profileId = state.profiles[0].id;
       render();
       apply(); // apply the initial selection once, right after the first draw
     } else if (msg.type === 'applied') {
       renderPreview(msg.palette, msg.contrast);
     } else if (msg.type === 'savedSets') {
       state.savedSets = msg.savedSets || [];
       renderSaved();
     }
   });
   ```
3. **Add `languageId` to the `apply()` payload** (blank = all languages). Replace `apply()` with:
   ```js
   function apply() {
     if (!state.comboId || !state.profileId) return;
     vscode.postMessage({
       type: 'apply', comboId: state.comboId, profileId: state.profileId,
       variant: state.variant || undefined, languageId: state.languageId || undefined,
     });
   }
   ```
4. **Rebuild `render()`** — same combo/style/variant chips and `#preview`, now plus a **Per-language (tokens only)**
   input, a set-name input with **Save/Export/Import** buttons in Actions, and a **My sets** container. It stays
   **pure draw** (each click handler applies once). Replace `render()` with:
   ```js
   function render() {
     app.innerHTML = '';

     // Combos
     const combosBox = el('div', { className: 'row' });
     for (const c of state.combos) {
       const b = el('button', { textContent: c.label, className: c.id === state.comboId ? 'chip active' : 'chip' });
       b.addEventListener('click', () => { state.comboId = c.id; render(); apply(); });
       combosBox.append(b);
     }
     app.append(section('Starter combination', combosBox));

     // Profiles
     const profBox = el('div', { className: 'row' });
     for (const p of state.profiles) {
       const b = el('button', { textContent: p.label, className: p.id === state.profileId ? 'chip active' : 'chip' });
       b.addEventListener('click', () => { state.profileId = p.id; state.variant = null; render(); apply(); });
       profBox.append(b);
     }
     app.append(section('Style', profBox));

     // Variant (only if the selected profile has variants)
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

     // Preview placeholder (filled by renderPreview on 'applied')
     app.append(el('div', { id: 'preview', className: 'section' }));

     // Per-language (tokens only)
     const lang = el('input', { id: 'lang', type: 'text', placeholder: 'languageId e.g. typescript (blank = all)', value: state.languageId, className: 'text' });
     lang.addEventListener('change', () => { state.languageId = lang.value.trim(); });
     app.append(section('Per-language (tokens only)', lang));

     // Actions
     const actions = el('div', { className: 'row' });
     const mk = (label, type) => { const b = el('button', { textContent: label, className: 'btn' }); b.addEventListener('click', () => vscode.postMessage({ type })); return b; };
     actions.append(mk('Revert', 'revert'), mk('Reset', 'reset'));
     const saveBtn = el('button', { textContent: 'Save set…', className: 'btn' });
     saveBtn.addEventListener('click', () => {
       const name = (document.getElementById('setname')).value.trim();
       if (name) vscode.postMessage({ type: 'save', name });
     });
     actions.append(mk('Export', 'export'), mk('Import', 'import'), saveBtn);
     const nameInput = el('input', { id: 'setname', type: 'text', placeholder: 'set name', className: 'text' });
     app.append(section('Actions', el('div', {}, nameInput, actions)));

     // Saved sets
     app.append(el('div', { id: 'saved', className: 'section' }));
     renderSaved();
   }
   ```
5. **Add `renderSaved()`** (new) — one row per saved set: click the name to apply it, click ✕ to delete it. Add it
   directly **below `renderPreview()`**:
   ```js
   function renderSaved() {
     const box = document.getElementById('saved');
     if (!box) return;
     box.innerHTML = '';
     box.append(el('h4', { textContent: 'My sets' }));
     if (!state.savedSets.length) { box.append(el('p', { className: 'muted', textContent: 'No saved sets yet.' })); return; }
     for (const name of state.savedSets) {
       const row = el('div', { className: 'row' });
       const apply = el('button', { textContent: name, className: 'chip' });
       apply.addEventListener('click', () => vscode.postMessage({ type: 'applySet', name }));
       const del = el('button', { textContent: '✕', className: 'chip' });
       del.addEventListener('click', () => vscode.postMessage({ type: 'delete', name }));
       row.append(apply, del);
       box.append(row);
     }
   }
   ```
6. Leave `el()`, `section()`, and `renderPreview()` as M4 wrote them (in the checkpoint), and keep the final
   `vscode.postMessage({ type: 'ready' });` line. Save. (Webview assets aren't compiled — but VS Code caches them,
   so relaunch the EDH to pick up changes.)

**Load-bearing:** the message types posted (`save`, `applySet`, `delete`, `export`, `import`) and the `languageId`
field name must match the provider (step 06); the name input's `id="setname"` is read by the Save handler. Button
labels, placeholder text, and the ✕ glyph are cosmetic.

## Done when (this step)
- `media/webview/main.js` matches the fragments above (the complete file is in
  [the M5 checkpoint](10_verify.md)).
- Relaunch the EDH and open the panel. You now see, below the swatch preview: a **Per-language (tokens only)** text
  box, an **Actions** section with a set-name input + **Revert / Reset / Export / Import / Save set…** buttons, and a
  **My sets** section (showing "No saved sets yet." on a clean install).
- Type a name → **Save set…** → the name appears under **My sets** immediately (proof the `savedSets` round-trip
  works). Full persistence-across-reload + language-scoping checks are in step 10.

## If it breaks
- **Buttons/section don't appear** → stale EDH cache; <kbd>Shift</kbd>+<kbd>F5</kbd> then <kbd>F5</kbd>. Confirm
  the file saved.
- **Clicking Save does nothing** → the name box was empty (Save no-ops on blank), or `id="setname"` was changed so
  the handler can't read it. Both the input `id` and the read must be `setname`.
- **My sets never updates** → the provider isn't posting `savedSets`, or the handler branch is missing; confirm
  the `else if (msg.type === 'savedSets')` branch is present and step 06's handlers post it after save/delete/import.
- **Language box has no effect** → its value only rides the *next* apply; type the id, then click a combo/style (or
  Save then applySet). A blank box applies to all languages by design.

---
> Nav: [← Final provider](06_provider-final.md) · [Overview](00_overview.md) · [Export / import →](08_export-import.md)
