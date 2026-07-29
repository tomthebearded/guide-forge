# M1 · Step 03 of 10 — First F5 run: the generated Hello World
> Nav: [← Scaffold](02_scaffold.md) · [Overview](00_overview.md) · [Icon asset →](04_icon-asset.md)

## Glossary for this step
- **[Extension Development Host](../foundation/glossary.md#extension-development-host)** — the second VS Code window <kbd>F5</kbd> launches with your extension loaded; your testing sandbox.

## Why / design
The scaffold already includes one working command. Running it **before** we change anything proves your dev loop
(compile → launch → debug) works, so when something breaks later you know it's *your* change, not your setup.

> 🧠 **New concept — the Extension Development Host (EDH).** Pressing <kbd>F5</kbd> compiles your extension and
> launches a **second VS Code window** with your extension loaded into it. That second window is the EDH — your
> testing sandbox. The *first* window (where your code is open) is the debugger and is where your `console.log`
> output appears. Two windows, two roles — keep them straight; it matters in step 09. Docs:
> [Your First Extension → Debugging](https://code.visualstudio.com/api/get-started/your-first-extension#_debugging-the-extension).

## Do this
**Before you start:** the `live-recolor` window from [step 02](02_scaffold.md) is open as the workspace root (you ran `code live-recolor` at the end of that step).

1. In the `live-recolor` window, press <kbd>F5</kbd>.
   - The first time, VS Code may ask which debug environment to use — choose **VS Code Extension Development** (the
     scaffold already wrote a launch config named **Run Extension**; if a dropdown appears, pick that).
2. Wait for a **new VS Code window** to open. Its title bar reads **[Extension Development Host]**. This is the EDH.
3. In the EDH window, open the Command Palette: **View → Command Palette** (or
   <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>).
4. Type **`Hello World`** and press <kbd>Enter</kbd> on the **"Hello World"** command.
5. Confirm a notification appears in the bottom-right of the EDH reading **`Hello World from live-recolor!`**.
6. Close the EDH window (or press <kbd>Shift</kbd>+<kbd>F5</kbd> in the first window to stop debugging). Leave the
   `live-recolor` window open — you'll work in it for every remaining step.

## Done when (this step)
- <kbd>F5</kbd> opens a window titled **[Extension Development Host]**.
- Running **Hello World** from its Command Palette shows the notification **`Hello World from live-recolor!`**.

## If it breaks
- **F5 does nothing / opens a `launch.json` picker with unrelated options** → the `live-recolor` folder isn't the
  workspace root. Close the folder and reopen it via **File → Open Folder → live-recolor**, then F5 again.
- **A red error appears about `out/extension.js` not found** → the compile step didn't run. Open the terminal in the
  first window and run `npm run compile` once, then F5. (F5 normally runs the watch task automatically.)
- **No "Hello World" command in the palette** → make sure you're typing in the **EDH** window's palette, not the
  first window's.

---
> Nav: [← Scaffold](02_scaffold.md) · [Overview](00_overview.md) · [Icon asset →](04_icon-asset.md)
