# Milestone 0 · Step 01 of 3 — Verify Node & .NET, install the Ionic CLI
> Nav: — · [Overview](00_overview.md) · [Folder skeleton →](02_folder-skeleton.md)

## Why / design
Every later step assumes exact tool versions (see [foundation/stack.md](../foundation/stack.md)). A version
mismatch is the single most common reason a multi-tool guide breaks halfway through, so we confirm all three
toolchains *before* writing a line of code. Node and the .NET SDK you install once from their official
installers; the Ionic CLI is an npm global you install here.

## Do this
1. **Check Node.js** — in a terminal, run `node -v`. You need **v24.x** (Active LTS). If it prints `v22`,
   `v20`, or nothing, install Node 24 LTS from the official downloads page
   (https://nodejs.org/en/download) and re-run `node -v`.
   - *WHY v24:* Angular 20.3 accepts Node 20, 22, or 24 (see [foundation/stack.md](../foundation/stack.md));
     we standardize on 24 LTS so the Angular tooling in the frontend runs without an engines warning.
2. **Check the .NET SDK** — run `dotnet --version`. You need **10.0.x**. If it prints a 8.x/9.x number or
   "command not found", install the **.NET 10 SDK** (not just the runtime) from
   https://dotnet.microsoft.com/download/dotnet/10.0 and re-run.
   - *WHY the SDK:* you'll run `dotnet new`, `dotnet build`, and `dotnet test`, which need the SDK, not only
     the runtime.
3. **Install the Ionic CLI** — run `npm install -g @ionic/cli@7`. This installs the command named `ionic`
   globally.
   - **New concept — Ionic CLI:** the command-line tool that scaffolds and serves Ionic apps (like `ng` for
     Angular, but Ionic-aware). Docs: https://ionicframework.com/docs/cli. See [glossary](../foundation/glossary.md).
   - The `@7` pins the major version to the one this guide verified (7.2.x). MANDATORY — a different major
     could change the `ionic start` prompts.
4. **Confirm the Ionic CLI** — run `ionic -v`. It should print **7.2.x**.

Leave every other tool at its default; you do **not** need Angular CLI installed globally (the Ionic starter
brings its own), and you do **not** need Docker, a database server, or any global EF tooling for this guide.

## Done when (this step)
- [ ] `node -v` → `v24.x` (e.g. `v24.15.0`).
- [ ] `dotnet --version` → `10.0.x` (e.g. `10.0.100`).
- [ ] `ionic -v` → `7.2.x` (e.g. `7.2.1`).

## If it breaks
- **`ionic: command not found` right after install** — your shell's `PATH` doesn't include npm's global bin
  yet. Open a new terminal, or run `npm bin -g` to find the folder and add it to `PATH`.
- **`dotnet --version` shows 9.x though you installed 10** — a `global.json` somewhere up the directory tree
  is pinning an older SDK. You're not in the project yet, so run the check from your home directory.

---
> Nav: — · [Overview](00_overview.md) · [Folder skeleton →](02_folder-skeleton.md)
