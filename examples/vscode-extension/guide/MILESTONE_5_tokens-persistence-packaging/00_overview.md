# Milestone M5 — Tokens, persistence, packaging
> Core · milestone 5 of 5 · prev: [M4](../MILESTONE_4_gallery-and-ux/00_overview.md) · next: —

## Goal
Take the extension across the finish line. M4 recolored the **chrome** (the editor's surrounding UI); M5 makes it
recolor the **code itself** — syntax tokens (keywords, strings, comments) and semantic tokens (types, functions,
variables) — then adds the features that make it a real tool: **Save** a creation as a named **custom set**,
**export/import** sets as JSON, **scope** a set's token colors to a single language, and finally **package a
`.vsix`** so it installs like any other extension.

**Observable end state:** in the Extension Development Host, pick a combo + style → the code in your open files
recolors live (keywords/strings/comments/types), not just the chrome. Type a name and click **Save set…** → it
appears under **My sets** and is still there after you reload the window. **Export** opens a JSON document you can
save to disk; **Import** reads it back and merges. Type `typescript` into the language box and apply → only `.ts`
token colors change, the chrome stays as it was. Run `vsce package` in the terminal → it emits
`live-recolor-0.0.1.vsix` in the project root.

## Scope discipline (what this milestone deliberately does NOT do)
- **No Marketplace publishing.** Packaging a local `.vsix` is the finish line; `vsce publish` (accounts, tokens,
  the public gallery) is out of scope. → [PLAN.md](../PLAN.md) scope boundaries.
- **No icon or product-icon themes.** We recolor text and chrome only, never the file-type or UI glyphs.
- **No settings-JSON editor UI.** We write settings through our one code path; we don't build a JSON form.
- **No multi-window / settings-sync handling.** `globalState` persistence is per-installation; we don't reason
  about two windows fighting over it.
- **Per-language scoping is tokens-only — on purpose.** `workbench.colorCustomizations` (chrome) is **not**
  language-overridable by VS Code; only `editor.*` (tokens) is. We implement tokens-only scoping and *teach why*
  in step 03. → [decision-log.md D2](../foundation/decision-log.md#d2--per-language-scoping-is-tokens-only).

## Prerequisite
**M4 green.** You have the externalized webview (`media/webview/main.js` + `styles.css`), the full 13-profile
gallery with swatch preview + contrast readout, and chrome recoloring live through the `applyChrome` → history
path. If M4's Done-when gate doesn't pass, fix that first — M5 edits those exact files.

## Load-bearing names (must match exactly, everywhere)
| Name | Value | What breaks if it drifts |
|------|-------|--------------------------|
| Token setting id | `editor.tokenColorCustomizations` | syntax tokens never recolor |
| Semantic setting id | `editor.semanticTokenColorCustomizations` | semantic tokens never recolor |
| globalState key | `liveRecolor.savedSets` | saved sets don't persist / can't be read back |
| Message types | `save`, `applySet`, `delete`, `export`, `import` (+ `languageId` on `apply`) | webview buttons do nothing |
| Language-override 4th arg | `update(key, value, Global, true)` | scoping writes globally instead of per-language |
| `.vsix` filename | `live-recolor-0.0.1.vsix` | (derived from `name`+`version`) the verify gate checks it |
| `publisher` **presence** | any lowercase id (we use `example`) | `vsce package` **errors** without it |

*(Cosmetic — rename freely: the `publisher` value itself, the set-name text, the button labels, the JSON display.)*

## Steps at a glance (grouped into sittings)
**Sitting 1 — Extend the engine to emit tokens (01–02)** — pure, `vscode`-free, unit-testable.
1. [Extend the engine types — `TokenColors`, `SemanticColors`, `ThemeResult`](01_types-extend.md)
2. [Generate token + semantic colors from the palette](02_generate-extend.md)

**Sitting 2 — Write tokens through the one path + per-language (03–04)**
3. [Apply tokens + semantic, and scope tokens per language](03_apply-extend.md)
4. [History captures all three settings](04_history-extend.md)

**Sitting 3 — Persistence + import/export (05–08)**
5. [Save named sets with `globalState`](05_storage.md)
6. [The final provider — wire save / applySet / delete / import / export](06_provider-final.md)
7. [The final webview — language box, Save/Export/Import, My sets](07_main-js-final.md)
8. [Export / import round-trip (walkthrough)](08_export-import.md)

**Sitting 4 — Ship it (09)**
9. [Add `publisher` and package the `.vsix`](09_package.md)

**Verify**
10. [Milestone verification + file checkpoint + you're done](10_verify.md)

## Design / decisions folded in
- **Tokens go through the same one write path.** `applyTheme` in `src/theme/apply.ts` writes chrome + tokens +
  semantic; nothing writes those settings ad hoc. The snapshot backbone (M2) now captures all three, so Revert
  and Reset still undo *everything*. → [conventions.md](../foundation/conventions.md#structure--architecture)
- **Chrome vs. editor settings decides what can be language-scoped.** This is the mental model M5 makes concrete:
  `editor.*` accepts a `"[languageId]"` override; `workbench.*` does not. → [decision-log.md D2](../foundation/decision-log.md#d2--per-language-scoping-is-tokens-only)
- **Semantic tokens can silently do nothing.** They only take effect when a language server supplies semantic
  tokens *and* the active theme opts in. We set `enabled: true` and flag the "it looks broken but isn't" trap
  loudly in steps 03 and 10. → [decision-log.md](../foundation/decision-log.md) (risk 3).
- **Persistence uses `globalState`, not settings.** Saved sets are extension data, not user color settings, so
  they live in the extension's `Memento` — invisible to the user's `settings.json`, surviving reloads.

## Done-when gate (aggregated — the real test)
- [ ] Applying a set recolors **keywords/strings/comments/types** in an open file, live. → steps 02–03, 10
- [ ] Semantic recoloring is wired (`enabled: true`); you understand it may *look* like nothing on files with no
      language server. → steps 03, 10
- [ ] Revert/Reset still undo everything, now including token + semantic settings. → step 04
- [ ] **Save set…** with a name → it appears under **My sets** and **survives a window reload**. → steps 05–07, 10
- [ ] **Export** opens a JSON doc; saving it and **Import**ing it back round-trips (My sets merged/unchanged). → step 08, 10
- [ ] Typing `typescript` in the language box + apply changes **only `.ts`** token colors; chrome unchanged. → steps 03, 07, 10
- [ ] `vsce package` emits **`live-recolor-0.0.1.vsix`** in the project root with no errors. → steps 09, 10

## Handoff
### Recap
You extended the pure engine to emit token + semantic colors, wrote them through the same non-destructive path
(now snapshotting all three settings), added `globalState`-backed named sets with JSON import/export, taught the
tokens-only language-scoping limit, and packaged the whole thing into an installable `.vsix`.

### Done so far (cumulative)
- A runnable VS Code extension `live-recolor` with a sidebar Webview panel and two-way messaging (M1).
- A non-destructive backbone: snapshot-before-write, Revert, Reset (M2).
- A pure color engine: hex↔HSL math, WCAG contrast, 5 combos, 9 generative + 4 signature profiles (M3–M4).
- An externalized gallery UI with swatch preview + contrast readout, full chrome recoloring live (M4).
- **New in M5:** syntax + semantic token recoloring, saved sets via `globalState`, JSON import/export,
  per-language token scoping, and a packaged `live-recolor-0.0.1.vsix`.

### Artifacts now in the project
- Extended: `src/engine/types.ts`, `src/engine/generate.ts`, `src/theme/apply.ts`, `src/theme/history.ts`,
  `src/panel/ThemePanelProvider.ts`, `src/extension.ts`, `media/webview/main.js`, `package.json`.
- New: `src/storage/sets.ts`.
- Emitted: `live-recolor-0.0.1.vsix` (the packaged extension).

### Decisions / open issues
- Language scoping is tokens-only by VS Code's design (D2) — chrome stays global; this is taught, not a bug.
- Semantic recoloring depends on the open file's language server; on a plain file it may appear inert.
- Publishing to the Marketplace is deliberately not covered — the `.vsix` is the finish line.

### You're done
There is no M6. Once the gate in **[step 10](10_verify.md)** passes, the build is complete — head back to the
**[guide front door](../README.md)** for the closing recap.

---
> Core · milestone 5 of 5 · prev: [M4](../MILESTONE_4_gallery-and-ux/00_overview.md) · next: —
