# Conventions — Live Recolor (VS Code extension)

> The rules every step in this guide follows. If a step seems to contradict one of these, the convention
> wins — fix the step.

## Naming
- **Load-bearing names** (must match *exactly* everywhere — things break otherwise; each is flagged at first use):
  the view-container id, the view id, the three settings IDs (`workbench.colorCustomizations`,
  `editor.tokenColorCustomizations`, `editor.semanticTokenColorCustomizations`), and the
  `StyleProfile` field names. *(This extension contributes **no commands** — M1 deletes the scaffold's
  Hello-World command and every action flows through webview messages, not the command palette.)*
- **Cosmetic names** (free to rename): profile display labels, the extension display name, swatch CSS classes,
  starter-combo display names.
- **Casing:** `camelCase` for identifiers/functions, `PascalCase` for types/interfaces, and `SCREAMING_SNAKE`
  only for module-level constants. (Webview message `type` strings — e.g. `apply`, `revert`, `reset` — are the
  closest thing to an action id here; they're plain `camelCase` strings that must match on both sides.)

## Structure / architecture
- **Two layers, one boundary.**
  - **Pure engine** — `src/engine/` — plain TypeScript, **no `import * as vscode`**. Holds the color math and the
    13 `StyleProfile` definitions. Because it never touches VS Code, it's unit-testable in plain Node.
  - **Thin adapter** — `src/extension.ts`, `src/panel/`, `src/theme/` — everything that touches the VS Code API:
    activation, the webview provider, command wiring, and the settings writes.
- **One write path.** *All* settings writes go through a single module in `src/theme/` (`applyTheme()` /
  `snapshot()` / `revert()` / `reset()`). **No step writes `workbench.colorCustomizations` (or the token settings)
  ad hoc** anywhere else — the single choke point is what keeps "non-destructive" honest and revertible.
- **Mental models repeated at point of use:** (1) *snapshot-before-write → everything is revertible*; (2) *the
  engine is pure; the adapter is the only thing that touches VS Code*; (3) *chrome (`workbench.*`) vs. editor
  (`editor.*`) settings decides what can be language-scoped*.

## Data vs code
- **New style = new data, not new control flow.** Each of the 13 styles is a `StyleProfile` object collected in one
  registry. Generative profiles are seed-driven functions over the base palette; the 4 signature presets are
  fixed palettes. Adding a style means adding one entry to the registry — never a new `if`/`switch` branch.
- **Colors are strings in, strings out.** Hex `#RRGGBB` (or `#RRGGBBAA`) at every boundary; HSL exists **only**
  inside the engine's math, never leaks into stored sets or settings values.

## Language / framework specifics
- Pin the versions in [stack.md](stack.md) for every code block; no version drift between steps.
- Webview scripts: always set `enableScripts: true`; call `acquireVsCodeApi()` exactly once; use a strict CSP with
  a nonce for the inline script (taught in M1).
- Always `await config.update(...)` before assuming the value is written; use `ConfigurationTarget.Global` unless a
  step explicitly needs workspace scope (which throws with no folder open).

## Testing / verification
- Every Done-when is an **observable** condition paired with its **exact expected output** (a rendered panel, a
  status bar turned a specific hex, a console line, a `.vsix` filename, a settings.json diff) — never "it works".
- Engine steps ship a tiny Node-runnable check (e.g. hex↔HSL round-trip, contrast ratio of a known pair) so the
  color math is verified **without** F5. Everything touching `vscode` is verified by hand in the Extension
  Development Host — say which is which when marking a milestone ✅ (see [status.md](status.md)).
