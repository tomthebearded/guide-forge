# M5 · Step 09 of 10 — Add `publisher` and package the `.vsix`
> Nav: [← Export / import](08_export-import.md) · [Overview](00_overview.md) · [Verify →](10_verify.md)

## Glossary for this step
- **`.vsix`** — the zip-format package file a VS Code extension ships as; produced by `vsce package` and installable via **Extensions: Install from VSIX…**. *(Introduced here.)*

## Why / design
The finish line is a **`.vsix`** — a single installable file containing your compiled extension. It's produced by
`@vscode/vsce` (the packaging CLI), and `vsce package` needs one manifest field it doesn't have yet: a
**`publisher`**.

> 🧠 **New concept — the `publisher` id.** On the Marketplace an extension is identified as `publisher.name`
> (e.g. `ms-python.python`). Even though we're **not** publishing (that's out of scope), `vsce package` still
> **requires** a `publisher` in `package.json` and **errors out without one**: `ERROR Missing publisher name`.
> For a local package the value is arbitrary — any lowercase id works. We use `"publisher": "example"`. Its
> *presence* is load-bearing (packaging fails without it); the *value* is cosmetic here (it only matters if you
> later publish, which needs a registered publisher). Docs:
> [Publishing Extensions — publisher](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions).

We also add a **`repository`** field. It's not required — its absence produces a *warning*, not an error — but
adding it silences that warning and is good hygiene.

> `@vscode/vsce` is the renamed package (the old bare `vsce` is deprecated); the **command** you type is still
> `vsce`. See [stack.md](../foundation/stack.md). (npm/vsce is **Intermediate** — one-liners below, no deep dive.)

## Do this
This step edits **one file** (`package.json`) then runs two commands.

1. Open `package.json`.
2. **Add** `"publisher": "example"` (any lowercase id) and a `"repository"` object. Below is the complete final
   `package.json` — the only new lines vs. M1 are `publisher` and `repository`; everything else (name, version,
   engines, contributes, scripts, devDependencies) is **exactly as scaffolded/M1**. Do **not** hand-edit the
   dependency versions.
3. Save.
4. Install the packaging CLI (once) and package. From the project root terminal:
   ```powershell
   npm install -g @vscode/vsce   # or, no global install: npx @vscode/vsce package
   vsce package
   ```
5. `vsce package` runs `vscode:prepublish` (→ `npm run compile`) first, then zips the extension. Expected final
   line: **`Packaged: …\live-recolor\live-recolor-0.0.1.vsix`**. The file appears in the project root.

**Load-bearing:** the **presence** of `publisher`; the emitted filename `live-recolor-0.0.1.vsix` is derived from
`name` (`live-recolor`) + `version` (`0.0.1`) — both already fixed since M1. The `publisher` value and the
`repository` URL are cosmetic.

## Code
`package.json` (complete, final — `publisher` + `repository` are the only additions):
```jsonc
{
  "name": "live-recolor",
  "displayName": "Live Recolor",
  "description": "Live-recolor the whole editor from a sidebar panel.",
  "version": "0.0.1",
  "publisher": "example",
  "repository": {
    "type": "git",
    "url": "https://github.com/example/live-recolor"
  },
  "engines": {
    "vscode": "^1.128.0"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "liveRecolor",
          "title": "Live Recolor",
          "icon": "media/icon.svg"
        }
      ]
    },
    "views": {
      "liveRecolor": [
        {
          "id": "liveRecolor.panel",
          "name": "Live Recolor",
          "type": "webview"
        }
      ]
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src",
    "test": "vscode-test"
  },
  "devDependencies": {
    "@types/vscode": "^1.128.0",
    "@types/node": "24.x",
    "@types/mocha": "^10.0.10",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "typescript": "^5.9.0",
    "@vscode/test-cli": "^0.0.11",
    "@vscode/test-electron": "^2.4.0"
  }
}
```

## Done when (this step)
- `vsce package` completes and prints a line ending in **`live-recolor-0.0.1.vsix`**.
- The file **`live-recolor-0.0.1.vsix`** exists in the project root (`Get-ChildItem *.vsix` lists it).
- Optional install check: Command Palette → **Extensions: Install from VSIX…** → pick the file → it installs with
  no error (uninstall afterward if you don't want two copies during F5 dev).

## If it breaks
| Symptom | Usual cause | Fix |
|---------|-------------|-----|
| `ERROR Missing publisher name` | no `publisher` in `package.json` | add `"publisher": "example"` (presence, not value) |
| `WARNING ... repository field missing` | no `repository` | harmless warning; add the `repository` object to silence it |
| `WARNING A 'LICENSE' file was not found` | no LICENSE | warning only; add a `LICENSE` file if you care, not required to package |
| `ERROR @types/vscode ^x < engines.vscode ^y` | `@types/vscode` lower than `engines.vscode` | keep both at `^1.128.0` (they match by design) |
| `vsce: command not found` | CLI not installed | `npm install -g @vscode/vsce`, or use `npx @vscode/vsce package` |
| compile error during packaging | `vscode:prepublish` runs `tsc` and it failed | fix the TypeScript error `vsce` prints, then re-run |
| `.vsix` missing `media/webview/*` at runtime | `.vscodeignore` dropped it | our webview lives under `media/` (not `src/`), so the default ignore keeps it — confirm the files are under `media/webview/` |
