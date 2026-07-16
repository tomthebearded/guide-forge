# M1 · Step 01 of 10 — Check your prerequisites
> Nav: — · [Overview](00_overview.md) · [Scaffold →](02_scaffold.md)

## Why / design
Before scaffolding, confirm the two tools this whole guide is pinned to are installed at the right versions. Doing
this now turns a confusing mid-build failure ("`tsc` not found", "engine mismatch") into a 30-second check. The
pinned versions live in [stack.md](../foundation/stack.md) and every milestone assumes them.

## Do this
1. Open a terminal. In VS Code that's the menu **Terminal → New Terminal** (or <kbd>Ctrl</kbd>+<kbd>`</kbd>). On
   Windows this opens PowerShell by default — every command below works there unchanged.
2. Check **Node.js**. Run:
   ```powershell
   node --version
   ```
   You want **`v24.*`** (Node 24 LTS). Node is the runtime the extension's build tools (`tsc`, `npx`) run on.
   *(Reminder — Node ships `npm` and `npx` with it; you don't install those separately.)*
3. Check **npm** is present (it comes with Node):
   ```powershell
   npm --version
   ```
   Any 10.x/11.x is fine — it's whatever shipped with Node 24.
4. Check **VS Code**. Run:
   ```powershell
   code --version
   ```
   The first line should read **`1.128.*`** (or the line you pinned). This must be **≥** the `engines.vscode`
   floor we'll set (`^1.128.0`), or the extension won't load.

## Done when (this step)
- `node --version` → `v24.*`
- `npm --version` → a 10.x or 11.x number
- `code --version` → first line `1.128.*`

All three print a version and none says "not recognized" / "command not found".

## If it breaks
- **`node : The term 'node' is not recognized`** (or `command not found`) → Node isn't installed or isn't on your
  PATH. Install **Node 24 LTS** from https://nodejs.org/en/download and reopen the terminal.
- **`node --version` shows `v20.*` or lower** → that line is EOL (see [stack.md](../foundation/stack.md)). Install
  Node 24; on Windows the simplest switch is [nvm-windows](https://github.com/coreybutler/nvm-windows)
  (`nvm install 24` then `nvm use 24`).
- **`code` is not recognized** → VS Code's CLI isn't on PATH. Open VS Code, run the Command Palette
  (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>) → **Shell Command: Install 'code' command in PATH**, then reopen
  the terminal. (You can also just check the version via **Help → About**.)

---
> Nav: — · [Overview](00_overview.md) · [Scaffold →](02_scaffold.md)
