# M5 · Step 08 of 10 — Export / import round-trip
> Nav: [← Final webview](07_main-js-final.md) · [Overview](00_overview.md) · [Package the .vsix →](09_package.md)

## Why / design
The `export` and `import` handler **code already landed in step 06** (the final provider). This step is a focused
walkthrough of *how that flow works* and a Done-when that exercises the full round-trip. No file changes here — read
the two handlers you already pasted, understand the three VS Code APIs they use, then run the round-trip.

**Export** serializes your saved sets to pretty JSON and opens them in an editor tab (you save that tab wherever you
like). **Import** opens a file picker, reads the chosen file, and merges its sets into `globalState`. The
serialization itself is `exportSets` / `importSets` from `src/storage/sets.ts` (step 05); the provider just supplies
the VS Code plumbing around them.

### The export handler (from step 06)
```ts
case 'export': {
  const doc = await vscode.workspace.openTextDocument({ language: 'json', content: exportSets(this.context) });
  await vscode.window.showTextDocument(doc);
  break;
}
```

> 🧠 **New concept — `workspace.openTextDocument({ content, language })`.** This opens an **in-memory, untitled**
> document from a string — nothing is written to disk yet. Passing `language: 'json'` gives it JSON syntax
> highlighting; `content` is the text (here, `exportSets(context)` — the pretty-printed array). `showTextDocument`
> then reveals it in an editor tab. You save it with <kbd>Ctrl</kbd>+<kbd>S</kbd>, choosing the location —
> we don't pick a path for you. Docs:
> [workspace.openTextDocument](https://code.visualstudio.com/api/references/vscode-api#workspace.openTextDocument).
> **Failure note:** it returns a `Thenable` — `await` it; and the doc is *untitled* until you save, so
> "Export" alone doesn't create a file, it shows you the JSON to save.

### The import handler (from step 06)
```ts
case 'import': {
  const uris = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { JSON: ['json'] } });
  if (!uris?.length) return;
  const bytes = await vscode.workspace.fs.readFile(uris[0]);
  const count = await importSets(this.context, Buffer.from(bytes).toString('utf8'));
  void vscode.window.showInformationMessage(`Live Recolor: imported ${count} set(s).`);
  this.post({ type: 'savedSets', savedSets: listSets(this.context).map((s) => s.name) });
  break;
}
```

> 🧠 **New concept — `window.showOpenDialog(options)`.** Opens the OS file picker and resolves to an array of
> `Uri`s, or `undefined` if you cancel — hence the `if (!uris?.length) return`. `canSelectMany: false`
> restricts to one file; `filters: { JSON: ['json'] }` labels the `.json` filter. Docs:
> [window.showOpenDialog](https://code.visualstudio.com/api/references/vscode-api#window.showOpenDialog).

> 🧠 **New concept — `workspace.fs.readFile(uri)`.** VS Code's own file-system API (works across local/remote/
> virtual workspaces, unlike Node's `fs`). It returns a `Uint8Array` of bytes; we decode to a string with
> `Buffer.from(bytes).toString('utf8')`, then hand it to `importSets`, which `JSON.parse`s and merges by name.
> Docs: [workspace.fs (FileSystem)](https://code.visualstudio.com/api/references/vscode-api#FileSystem).
> **Failure note:** `readFile` gives you **bytes, not text** — decode before parsing, or `JSON.parse` chokes.

`importSets` merges (incoming sets overwrite same-named existing ones; others are kept) and returns the incoming
count for the confirmation toast. The final `post({ type: 'savedSets', … })` refreshes "My sets" in the panel.

## Do this
> **Before you start:** steps 06 and 07 must be done — the provider's `export`/`import` handlers must exist (step
> 06) and the webview must show the **Save set… / Export / Import** buttons and **My sets** list (step 07). Then
> launch the Extension Development Host with <kbd>F5</kbd>.

No code changes. Run the round-trip in the Extension Development Host:

1. Press <kbd>F5</kbd> and open the Live Recolor panel. Create a set: pick a combo + style, type a name (e.g.
   `my-neon`) in the set-name box, click **Save set…**. Confirm it shows under **My sets**.
2. Click **Export**. A new editor tab opens containing a JSON **array** with your set(s) — each object has `name`,
   `comboId`, `profileId`, optional `variant`, and the frozen `chrome`/`tokens`/`semantic` maps.
3. Save that tab to disk (<kbd>Ctrl</kbd>+<kbd>S</kbd>) as e.g. `my-sets.json`.
4. Delete the set from **My sets** (click its ✕) so the list is empty.
5. Click **Import**, pick `my-sets.json` in the dialog. A notification reads **"Live Recolor: imported 1 set(s)."**
   and the set **reappears** under My sets.
6. Click the set's name in My sets → it applies (chrome + tokens recolor). Round-trip complete.

## Done when (this step)
- **Export** opens a JSON document whose top level is an array of `SavedSet` objects (not an object, not empty if
  you saved one).
- Saving it, deleting the set, then **Import**ing the saved file **restores the identical set** — same name, same
  colors — and the info toast reports the count imported.
- Re-importing the same file again is idempotent: My sets doesn't gain duplicates (merge-by-name), and the toast
  still reports the incoming count.

## If it breaks
- **Export tab is empty (`[]`)** → you have no saved sets; save one first (step 07). Export reflects `globalState`.
- **Import dialog opens but nothing happens after picking** → check the file is a JSON **array**; `importSets`
  throws "Expected a JSON array of sets." on a bare object. A hand-edited file with a trailing comma also fails
  `JSON.parse`.
- **"imported N set(s)" but My sets doesn't refresh** → the provider's import handler must `post({ type:
  'savedSets', … })` at the end (it does in step 06's version); confirm you didn't trim that line.
- **`JSON.parse` error / garbled text** → the bytes weren't decoded; `readFile` returns a `Uint8Array`, decode with
  `Buffer.from(bytes).toString('utf8')` before parsing.

---
> Nav: [← Final webview](07_main-js-final.md) · [Overview](00_overview.md) · [Package the .vsix →](09_package.md)
