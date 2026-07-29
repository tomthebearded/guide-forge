# M1 · Step 02 of 10 — Scaffold the extension with `yo code`
> Nav: [← Prerequisites](01_prerequisites.md) · [Overview](00_overview.md) · [First run →](03_first-run.md)

## Glossary for this step
- **Yeoman / `yo code`** — the official project generator for VS Code extensions; it asks a few questions and
  writes a complete starter project so you don't assemble one by hand.

## Why / design
Rather than hand-write a `package.json`, `tsconfig.json`, and debug config, we use the tool the VS Code team
maintains for exactly this. It produces a project that already runs under F5, so step 03 can prove the dev loop
before we change anything.

> 🧠 **New concept — the extension scaffolder.** A VS Code extension is just a Node package with a special
> `package.json` (an *extension manifest*) plus an entry-point module. `yo code` generates all of that, correctly
> wired, in one command. We run it through `npx` so nothing is installed globally. Docs:
> [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension).

## Do this
1. In your terminal, `cd` to the folder where you keep projects (the generator creates a **sub-folder**, so pick a
   parent — e.g. `cd C:\dev`).
2. Run the generator:
   ```powershell
   npx --package yo --package generator-code -- yo code
   ```
   *(Reminder — `npx` downloads and runs a package on the fly. The `--package … -- yo code` form fetches both
   Yeoman and the extension generator for this one run.)* If `npx` asks to install packages, answer **yes**.
3. Answer the prompts **exactly** as below. The generator's wording may vary slightly by version; match by intent
   and use these answers. The identifier answer is **load-bearing** — it becomes the package name.

   | Prompt (by intent) | Answer to type |
   |--------------------|----------------|
   | What type of extension? | **New Extension (TypeScript)** |
   | Extension name / display name | `Live Recolor` |
   | Identifier | `live-recolor` |
   | Description | `Live-recolor the whole editor from a sidebar panel.` *(free — any text)* |
   | Initialize a git repository? | `No` *(free — either works)* |
   | Which bundler to use? | **unbundled** |
   | Which package manager to use? | **npm** |

4. The generator creates a `live-recolor/` folder and installs dependencies. When it finishes, open that folder in
   VS Code:
   ```powershell
   code live-recolor
   ```
   Open it as the **workspace root** (the window's top folder must be `live-recolor`), not as a sub-folder of a
   bigger project — F5 in step 03 depends on this.

## Done when (this step)
- A `live-recolor/` folder exists containing `package.json`, `src/extension.ts`, `tsconfig.json`, and a `.vscode/`
  folder.
- Opening it in VS Code shows those files in the Explorer with no error notifications.
- `package.json`'s `"name"` field reads exactly **`live-recolor`**.

## If it breaks
- **`npx` hangs or errors fetching packages** → check your network/proxy; re-run the command and accept the install
  prompt. Behind a corporate proxy, set `npm config set proxy …` first.
- **The `"name"` came out different** (e.g. `liverecolor`) → the identifier answer wasn't `live-recolor`. Fix it now:
  edit `package.json`'s `"name"` to `live-recolor` before continuing, or re-run the generator. This name is
  load-bearing (the `.vsix` in M5 is named from it).
- **Chose the wrong bundler** → it still works; unbundled just means plain `tsc`. If you picked webpack/esbuild the
  generated scripts differ from this guide's — re-run the generator and choose **unbundled** to stay in step.

---
> Nav: [← Prerequisites](01_prerequisites.md) · [Overview](00_overview.md) · [First run →](03_first-run.md)
