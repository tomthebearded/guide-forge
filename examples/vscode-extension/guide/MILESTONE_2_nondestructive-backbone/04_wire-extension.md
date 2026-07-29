# M2 · Step 04 of 6 — Instantiate the history at activation
> Nav: [← History](03_history.md) · [Overview](00_overview.md) · [Panel buttons →](05_panel-buttons.md)

## Why / design
The `ThemeHistory` must be created **once** and shared, so every apply/revert/reset pushes and pops the *same* undo
stack. The right place to create it is `activate` — the function VS Code runs when the extension wakes up (from M1).
We create one `history` there and hand it to the panel provider via its constructor, so the provider can call
`history.apply(...)` when a button is clicked.

This is dependency injection in the plainest sense: `activate` owns the single `ThemeHistory` and passes it in,
rather than the provider making its own. *(TS reminder — a constructor parameter is just how the provider receives
the shared instance; step 05 declares it as `private readonly history`.)*

> ⚠️ **Expected transient error.** After this edit the project **will not compile** — `new ThemePanelProvider(history)`
> passes an argument, but the M1 provider's constructor takes none. That red squiggle is normal and **step 05 fixes
> it** by giving the provider a `constructor(history)`. We change `extension.ts` first only because it's the smaller,
> clearer half; don't press F5 until step 05 is done.

## Do this
This step **edits** `src/extension.ts` (the M1 version from [step 07](../MILESTONE_1_scaffold-sidebar/07_register-provider.md)).
Two small changes — leave the registration line and `deactivate` exactly as M1 wrote them (`registerWebviewViewProvider(ThemePanelProvider.viewType, provider)`, still pushed onto `context.subscriptions`).

**Load-bearing:** the provider now receives `history` — `new ThemePanelProvider(history)`. The import path
`./theme/history` and the class name `ThemeHistory` must match step 03.

**1. Add the history import**, immediately after the `import { ThemePanelProvider } from './panel/ThemePanelProvider';` line:
```ts
import { ThemeHistory } from './theme/history';
```

**2. Create the shared history and inject it** — inside `activate`, replace the line `const provider = new ThemePanelProvider();` with these two lines:
```ts
  const history = new ThemeHistory();
  const provider = new ThemePanelProvider(history);
```

3. Save. Expect the compile error described in the callout above until step 05.

*(The complete `src/extension.ts` for M2 is shown whole in [06_verify.md](06_verify.md).)*

## Done when (this step)
- `src/extension.ts` reads exactly as above.
- The **only** compile error in the project is on `new ThemePanelProvider(history)` — "Expected 0 arguments, but got
  1." That single, expected error means you're set up correctly for step 05. Every other file compiles clean.

## If it breaks
- **`Cannot find module './theme/history'`** → the path is wrong or `history.ts` wasn't saved. It's `./theme/history`
  (no `.ts`), matching the file from step 03.
- **More errors than just the constructor one** → check the two `theme/` imports resolve; run the `watch` task and
  read the terminal — anything other than the expected "Expected 0 arguments, but got 1" points back to steps 01–03.
- **You pressed F5 and the panel is broken** → expected while the code doesn't compile. Finish step 05, then F5.

---
> Nav: [← History](03_history.md) · [Overview](00_overview.md) · [Panel buttons →](05_panel-buttons.md)
