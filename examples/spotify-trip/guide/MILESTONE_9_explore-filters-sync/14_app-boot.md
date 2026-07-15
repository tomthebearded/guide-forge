# M9 · Step 14 of 14 — App root: restore + boot-sync on open + the blocking overlay
> Nav: [← Header nav + routes](13_header-routes.md) · [Overview](00_overview.md) · [Verify →](15_verify.md)

> **This step touches 3 files, committed together:** `app.ts` + `app.html` + `app.scss`. The root component
> (last changed in M0) now owns startup: restore the saved globe data and kick the boot sync on open, and show
> a full-screen blocking overlay while it runs.

## Why / design
Startup used to live on the globe page (`store.restore()` in its constructor). But M9 has multiple routes
(`/globe`, `/actions`), and the reconcile must run **whatever page you land on** — so it moves to the app root.

The root injects `BootSync` + `GlobeStore` + `LogStore` and runs one `effect`: the first time a session exists,
`restore()` the saved dataset and — **only if there's data to reconcile** — `bootSync.run()`. A first-ever run
(no data) skips the sync and defers to the Actions "Full re-scan", so a new user isn't hit with an auto-page of
their whole library.

The overlay is the same `LogTerminal` the globe uses, in a `position: fixed` scrim (`.sync-overlay`) shown while
`bootSync.busy()`. Because the terminal's own scrim blocks pointer events and the header nav is disabled + the
route guard blocks navigation, the app is genuinely locked during the reconcile — the three mechanisms agree.

**Recurring model:** the `started` latch + `effect` reading `tokens.hasSession()` fires exactly once when the
session appears (login) or already exists (reload) — the standard "run once when a signal first becomes true"
pattern, without a lifecycle hook.

## Do this
1. Replace `src/app/app.ts` with the version below — inject `BootSync`/`GlobeStore`/`LogStore`, add the
   `phaseLabel` getter (the overlay caption from `PHASE_LABEL`, step 06), and the one-shot restore + boot effect.
2. Replace `src/app/app.html` — add the `@if (bootSync.busy())` overlay wrapping `app-log-terminal`.
3. Replace `src/app/app.scss` — add the fixed `.sync-overlay` positioning context.

## Code
### `src/app/app.ts`
```ts
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TokenStore } from './core/auth/token-store';
import { LogStore } from './core/logging/log-store';
import { BootSync, PHASE_LABEL } from './core/pipeline/boot-sync';
import { GlobeStore } from './features/globe/globe-store';
import { LogTerminal } from './features/globe/log-terminal/log-terminal';
import { Header } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, LogTerminal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly bootSync = inject(BootSync);
  protected readonly globe = inject(GlobeStore);
  protected readonly log = inject(LogStore);

  /** Overlay caption for the current sync phase (empty while idle). */
  protected readonly phaseLabel = (): string => PHASE_LABEL[this.bootSync.phase()];

  constructor() {
    const tokens = inject(TokenStore);
    const globe = this.globe;
    const bootSync = this.bootSync;

    // On app open — or the moment a session appears after login — restore the saved globe data and,
    // only if there's already data to reconcile, run the sequential boot sync (liked → playlists →
    // artists). Each step is staleness-guarded, so a warm reopen within 15 min does no network. A
    // first-ever run (no data) defers to the explicit "Full re-scan" UI rather than auto-paging.
    // Owned here (not on the globe page) so it fires regardless of the landing route.
    let started = false;
    effect(() => {
      if (started || !tokens.hasSession()) {
        return;
      }
      started = true;
      globe.restore();
      if (globe.hasData()) {
        void bootSync.run();
      }
    });
  }
}
```

### `src/app/app.html`
```html
<app-header />
<main class="content">
  <router-outlet />
</main>

@if (bootSync.busy()) {
  <div class="sync-overlay">
    <app-log-terminal
      [title]="phaseLabel()"
      [entries]="log.entries()"
      [total]="globe.total()"
      [resolvedCount]="globe.resolvedCount()"
      [pendingCount]="globe.pendingCount()"
      [failedCount]="globe.failedCount()"
    />
  </div>
}
```

### `src/app/app.scss`
```scss
.content {
  display: block;
  min-height: calc(100dvh - 64px);
}

// Full-screen block while the boot sync reconciles — page switching is locked until it finishes.
// It's just a fixed positioning context: the <app-log-terminal> inside fills it (position:absolute
// inset:0) and supplies its own scrim + centred terminal, so the boot loader *is* the live terminal.
.sync-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors.
- [ ] Serve, log in **with a prior scan present**, reload the app → briefly, a full-screen terminal overlay
      appears captioned e.g. `Checking your Liked Songs…`; the header nav is disabled while it's up; it clears
      once the reconcile finishes.
- [ ] Reload again within 15 min → the overlay flashes only briefly (or not at all) and the log reads
      `Liked Songs unchanged — nothing to fetch.` / domains skipped as fresh — **no** network calls.

## If it breaks
- **Overlay never appears** → `bootSync.run()` only runs when `globe.hasData()`; with no prior scan there's
  nothing to reconcile (by design). Scan once from Actions first.
- **Overlay never clears (app stuck)** → a boot step is waiting on a rate-limit cooldown; `pauseIfLimited`
  (step 06) should have bailed the sequence — check it runs *between* steps and in `wrap()`.
- **`restore()` runs but the globe is empty** → the effect must `restore()` *before* checking `hasData()`; and
  `hasData` reads `total()` which reflects the restored snapshot.
- **Boot runs on every render, re-paging constantly** → the `started` latch was dropped; the effect must set
  `started = true` before doing any work so it fires once.
