# Milestone 1 · Step 01 of 07 — Create the workspace
> Nav: — · [Overview](00_overview.md) · [The panel component →](02_the-panel-component.md)

## Before you start

Node 24 LTS on your `PATH`. Nothing else is installed yet — `npm create` downloads what it needs.

## Why / design

You need two folders that never touch each other: a Vite workspace that *builds* the component, and a plain
HTML page that *consumes* it. This step makes the outer folder and the workspace inside it, and stops at the
point where the stock template runs. You will not keep any of the template's demo code — but you run it once
first, because a template that runs is a toolchain that works, and finding that out now is cheaper than
finding it out after you have written three files.

## Do this

1. **Make the outer folder and enter it.** Everything in this guide lives under it: the workspace in step 01,
   the demo page in step 06.

   ```bash
   mkdir color-picker-demo
   cd color-picker-demo
   ```

2. **Scaffold the Vite workspace.** Run this from inside `color-picker-demo/`. The `--template react-ts` flag
   is load-bearing — `react` (without `-ts`) gives you a JavaScript project and every code block in this guide
   is TypeScript.

   ```bash
   npm create vite@latest color-picker -- --template react-ts
   ```

   `npm create` may ask to install `create-vite` first — answer yes. The name `color-picker` is
   **load-bearing**: it becomes the folder every later command is run from, and this guide spells it that way
   everywhere.

3. **Install the dependencies.**

   ```bash
   cd color-picker
   npm install
   ```

   This pins the versions in [`../foundation/stack.md`](../foundation/stack.md): React 19.2.x, Vite 8.2.x and
   TypeScript 6.0.x. **Do not run `npm i -D typescript@latest`** at any point in this guide — TypeScript 7.0 is
   out, it is a different compiler written in Go, and this guide is not written against it.

4. **Start the dev server.**

   ```bash
   npm run dev
   ```

   > **New concept — the dev server.** `npm run dev` runs Vite in development: it serves the workspace's own
   > `index.html`, compiles TypeScript and JSX on demand, and pushes changes into the open page without a
   > reload. It is *not* what produces the file the demo page will load — that is `npm run build`, in step 05.
   > This guide reads every milestone gate against the **built** bundle, never against the dev server. See the
   > two-environments table in [`../foundation/conventions.md`](../foundation/conventions.md).
   > ([Vite guide](https://vite.dev/guide/))

5. **Open the URL the terminal printed** — `http://localhost:5173/` unless that port was taken, in which case
   Vite prints the one it used. Leave the server running; steps 02 to 04 are watched here.

## Done when (this step)

- `npm run dev` prints a `Local:` line with a `http://localhost:` URL and stays running.
- Opening that URL shows the template's own demo page — logos, a heading, and a **counter button whose number
  goes up when you click it**. The counter is the part that matters: it is React state re-rendering, which is
  the whole toolchain working end to end. **Do not gate on the wording.** `npm create vite@latest` resolves to
  whatever `create-vite` is newest on the day you run it, and its copy moves between releases — the heading
  read `Vite + React` for years and reads `Get started` on the version this guide was written against.
- In the workspace, `ls src` lists `App.tsx`, `App.css`, `index.css`, `main.tsx` and an `assets` folder. Step
  02 deletes all of them. Recent templates no longer write a `vite-env.d.ts`; if yours has one, leave it —
  nothing in this guide reads it either way.

## If it breaks

- **`npm create vite@latest` fails with an unsupported-engine error.** Your Node is older than Vite's floor of
  20.19 / 22.12. Check with `node --version` and install Node 24 LTS.
- **The command created a folder called `--` or `react-ts`.** The `--` before `--template` is required: it
  tells npm the flags belong to `create-vite`, not to npm. Delete the stray folder and re-run the command
  exactly as written.
- **The page is blank and the terminal shows a port-in-use message.** Another Vite server is already running.
  Read the port Vite actually chose from the `Local:` line rather than assuming 5173.

---
> Nav: — · [Overview](00_overview.md) · [The panel component →](02_the-panel-component.md)
