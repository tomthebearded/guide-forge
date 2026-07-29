# M1 · Step 05 of 10 — Declare the View Container + Webview View
> Nav: [← Icon asset](04_icon-asset.md) · [Overview](00_overview.md) · [Provider →](06_provider.md)

## Glossary for this step
- **Contribution point** — a section of `package.json` where an extension declares what it adds to VS Code (commands, views, menus…).
- **[View Container](../foundation/glossary.md#view-container)** — a group in the Activity Bar that holds one or more Views.
- **[Webview View](../foundation/glossary.md#webview-view)** — a View whose body is an HTML page (a mini web app) rather than a tree.

## Why / design
An extension tells VS Code what UI it adds **declaratively**, in the `package.json` manifest, *before* any code
runs. Here we declare two things: a container (the Activity-Bar icon) and a view inside it (our panel). Code that
fills the panel comes in steps 06–07.

> 🧠 **New concept — contribution points & the manifest.** VS Code reads your `package.json` at startup to learn
> your extension's *static* capabilities — it doesn't run your code to find them. `contributes.viewsContainers`
> adds the Activity-Bar button; `contributes.views` adds a view inside a named container. The two are linked by the
> **container id** (`liveRecolor`): the key under `views` must equal the container's `id`. Docs:
> [Contribution Points](https://code.visualstudio.com/api/references/contribution-points).

> ⚠️ **The #1 "nothing happens" trap.** The view entry **must** include `"type": "webview"`. Omit it and VS Code
> treats the view as an (empty) tree, your provider never attaches, and you get a blank panel with no error. Verified
> against the current docs — see [stack.md](../foundation/stack.md).

## Do this
This step edits **one file**: `package.json` (at the project root).

1. Open `package.json`.
2. **Replace** the generated `"contributes"` block. The scaffold created `contributes.commands` with the sample
   Hello World command — we don't need it, so we swap the whole `"contributes"` object for the one below.
3. **Also delete** the sample command's leftover: nothing else in `package.json` references it, so removing it from
   `contributes` is enough. Leave **`activationEvents`** as the empty array `[]` — VS Code auto-activates the
   extension when the view is first opened (it infers this from the view contribution; you don't list it manually).
4. Leave every **other** field (`name`, `version`, `engines`, `main`, `scripts`, `devDependencies`) exactly as the
   generator wrote it. Confirm only that `engines.vscode` reads `^1.128.0` (it will, if you scaffolded on a current
   VS Code).

**Load-bearing values** in the block below (must match later steps): container id `liveRecolor`, view id
`liveRecolor.panel`, icon path `media/icon.svg`, `"type": "webview"`. **Cosmetic** (rename freely): both `title`
and `name` display strings.

## Code
The `contributes` block to put in `package.json` (replacing the generated one):
```jsonc
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
}
```

*(The complete `package.json` is shown in [10_verify.md](10_verify.md) once all edits are in.)*

## Do this — see the container appear
5. Press <kbd>F5</kbd> (or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F5</kbd> to restart a running EDH).
6. In the EDH's Activity Bar (far-left icon strip), find and click the **palette icon**.

## Done when (this step)
- The **palette icon** appears in the EDH's Activity Bar.
- Clicking it opens a side panel titled **LIVE RECOLOR** that is **empty** (or shows a "There is no data provider
  registered…" style message). **Empty is correct here** — the provider that fills it is the next step.

## If it breaks
- **No icon in the Activity Bar** → either `media/icon.svg` doesn't exist (redo step 04) or the JSON is invalid. VS
  Code shows JSON errors as red squiggles in `package.json`; a common one is a missing comma before `"contributes"`.
- **Panel shows a hard error, not just empty** → check `"type": "webview"` is present and spelled exactly; without
  it VS Code expects a tree data provider.
- **The old "Hello World" command still shows** in the palette → you left it in `contributes.commands`; make sure you
  replaced the whole `contributes` object with the one above.

---
> Nav: [← Icon asset](04_icon-asset.md) · [Overview](00_overview.md) · [Provider →](06_provider.md)
