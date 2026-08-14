# M1 · Step 01 of 06 — Create the workspace
> Nav: — · [Overview](00_overview.md) · [Write the component →](02_the-component.md)

## Glossary for this step

> New here: **[standalone component](../foundation/glossary.md#standalone-component)** (defined under *Do this* 2)
> and **[zoneless change detection](../foundation/glossary.md#zoneless-change-detection)** (defined under
> *Why / design*).

## Why / design

You need two things before you can write any component: an Angular workspace, and the one package that turns a
component into an HTML tag. This step creates both and nothing else.

The project folder holds **two siblings** that never mix:

```
angular-color-picker/
├── color-picker/     ← the Angular workspace you create here
└── demo/             ← the plain HTML host page (step 05)
```

The demo is deliberately outside the workspace and is never processed by the CLI. The moment Angular builds it,
it stops proving the one thing it exists to prove — that a page which knows nothing about Angular can use your
tag.

> **New concept — zoneless change detection.** Angular has to know when your state changed so it can re-render.
> For a decade it found out by patching every browser API (timers, events, `fetch`) through a library called
> `zone.js` and re-checking everything afterwards. Since v21 the default is **zoneless**: you tell Angular
> directly, with signals, and `zone.js` is not in the build at all.
> ([Zoneless guide](https://angular.dev/guide/zoneless))
>
> That is a bundling fact as much as a rendering one, and it is why this guide can promise a single `<script>`:
> with no `zone.js` there is no polyfill file to load beside your code. You will not write a line to enable it —
> a new v22 workspace is already zoneless, and adding `provideZonelessChangeDetection()` (which older tutorials
> show) is only for apps upgrading from v20.

## Before you start

Node 24 LTS installed and on your `PATH`. Check it before anything else:

```bash
node --version
```

Angular 22 accepts `^22.22.3 || ^24.15.0 || ^26.0.0` — see
[version compatibility](https://angular.dev/reference/versions). If yours is older, install Node 24 first; the
CLI will refuse to run otherwise.

## Do this

1. Create the project folder and move into it. This folder is the root of everything you build in this guide,
   and every path in every later step is relative to it.

   ```bash
   mkdir angular-color-picker
   cd angular-color-picker
   ```

   Both commands run unchanged in PowerShell and in bash. The name `angular-color-picker` is **cosmetic** —
   rename it freely.

2. Create the Angular workspace. Run this **inside `angular-color-picker/`**:

   ```bash
   npx --yes @angular/cli@22 new color-picker --style=css --ssr=false --skip-tests
   ```

   The name `color-picker` is **load-bearing**: it becomes the workspace folder, the project name inside
   `angular.json`, and the default output folder `dist/color-picker`. Every later step spells it exactly this
   way. The three flags are what keep the workspace to the parts this guide uses — plain CSS, no server-side
   rendering, no test scaffolding (this guide's gates are the demo page, not a test runner — see D5 in
   [../foundation/decision-log.md](../foundation/decision-log.md)).

   If the CLI asks whether to share anonymous usage data, answer `n`. It may not ask at all if you have run the
   CLI on this machine before.

   > **New concept — standalone component.** In Angular, a *component* is a class with a template. Older
   > Angular required every component to be listed in an `NgModule` — a registry file whose only job was to say
   > which components could see which. Since v19 components are **standalone** by default: a component declares
   > its own dependencies and there is no module to register it in. Nothing in this guide writes an `NgModule`,
   > and if you find one in a tutorial you are reading pre-v19 material.
   > ([Components guide](https://angular.dev/guide/components))

3. Move into the workspace and add the custom-element package.

   ```bash
   cd color-picker
   npm install @angular/elements@22
   ```

   `@angular/elements` is versioned in lockstep with Angular itself, so `@22` here matches the `22.x` the CLI
   just installed. It is not part of the default workspace; step 03 is where you use it.

4. Build once, to confirm the toolchain works before you have written anything of your own.

   ```bash
   npm run build
   ```

## Done when (this step)

- [ ] `node --version` prints a version Angular 22 accepts — `v24.x` if you followed the prerequisite.
- [ ] `npm run build` exits **0**. Read the exit code rather than the summary line: the CLI renders its build
      table one way in a terminal and another way when the output is piped to a file, so the numbers are the
      part that is stable.
      - bash: `echo $?` → `0`
      - PowerShell: `$LASTEXITCODE` → `0`
- [ ] `ls dist` lists **`color-picker`**. (`ls` works in both shells — it is an alias for `Get-ChildItem` in
      PowerShell.) Step 04 moves this output to where the demo page will look for it.
- [ ] `ls node_modules/@angular/elements` lists files — the package installed.

## If it breaks

- **`The Angular CLI requires a minimum Node.js version of …`** → your `node --version` is below the range
  above. Install Node 24 LTS and re-run; nothing from the failed run needs cleaning up.
- **`npm ERR! code EEXIST` / "Directory is not empty"** on `ng new` → you already ran it once. Delete the
  `color-picker` folder and re-run, or continue with the one you have.
- **`npm install @angular/elements@22` reports `ERESOLVE`** → you are running it in the wrong folder. It must
  run inside `angular-color-picker/color-picker/`, where the workspace's `package.json` is.

---
> Nav: — · [Overview](00_overview.md) · [Write the component →](02_the-component.md)
