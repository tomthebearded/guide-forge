# M6 · Step 05 of 11 — The `log-terminal` overlay
> Nav: [← country-stats](04_country-stats.md) · [Overview](00_overview.md) · [scan-list →](06_scan-list.md)

This step touches **3 files, committed together**: `log-terminal.ts`, `.html`, `.scss`.

## Glossary for this step
> **`afterRenderEffect`** — an Angular API that runs after the DOM has been updated for the current change. Unlike `effect()` (which runs before paint and must not read the DOM), this fires once the new lines are actually in the DOM, so we can scroll to the bottom. See the [Angular docs](https://angular.dev/api/core/afterRenderEffect).
> **`viewChild()`** — the signal-based way to grab a reference to an element or component from this component's template (matched by a template reference variable like `#list`). It returns a *signal* you read as `list()`, so it composes with effects. It's the modern replacement for the decorator `@ViewChild`. See the [Angular docs](https://angular.dev/api/core/viewChild).

## Why / design
M5's `LogStore` accumulates human-readable progress lines during a scan (`Wikidata: placed 34 of 50 artists`,
`MusicBrainz: Foo → US`, …). The `log-terminal` is the overlay that **renders** them live. It does two jobs at
once: it streams the log like a terminal *and*, by covering the globe area with a semi-transparent blocking
scrim, it prevents any action on the controls beneath while a scan runs.

This satisfies the milestone's "reflects scan progress" gate. (The `scan-list` in the next step is a separate,
phase-gated animation that stays dormant — the **log-terminal** is the real live-progress UI.)

The one interesting mechanic is **auto-scroll**: an `afterRenderEffect` reads `entries()` (registering the
dependency) so it re-runs on every new line, and — because it runs *after* the DOM update — sets
`scrollTop = scrollHeight` to keep the newest line visible. This is the correct place to touch the DOM;
a plain `effect()` would run before the new line exists.

## Do this
1. Create `src/app/features/globe/log-terminal/` and the three files below.
2. Import `LogEntry` from `../../../core/logging/log-store` (the M5 type). The component takes the `entries`
   array plus count inputs; it injects **nothing**.
3. The `inline` input toggles between the default **blocking scrim** (covers the host area) and an in-flow
   panel. In M6 we only ever use the default (scrim) mode; `inline` is ported for a later page (the M10 artist
   page) — leave it.
4. The `host: { '[class.inline]': 'inline()' }` binding applies the `.inline` host class — load-bearing for the
   SCSS `:host(.inline)` rule; keep it exactly.
5. The footer (`placed / pending / unplaced / artists`) only renders when `total() > 0`, so an empty pre-scan
   state shows just the spinner + title.

## Code
### `src/app/features/globe/log-terminal/log-terminal.ts`
```ts
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';

import { LogEntry } from '../../../core/logging/log-store';

/**
 * Full-cover, semi-transparent "terminal" shown while the globe dataset is loading. It streams the
 * pipeline's progress lines, keeps a live loading spinner, and — by covering the globe area with a
 * blocking scrim — prevents any action on the controls beneath until the scan finishes.
 */
@Component({
  selector: 'app-log-terminal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './log-terminal.html',
  styleUrl: './log-terminal.scss',
  host: { '[class.inline]': 'inline()' },
})
export class LogTerminal {
  readonly entries = input<readonly LogEntry[]>([]);
  /** Heading above the log stream. */
  readonly title = input('Building your globe…');
  /**
   * `false` (default): a full-cover blocking scrim over the host area. `true`: an in-flow panel with
   * no scrim, for a page that's already showing nothing but a loading state (e.g. the artist page).
   */
  readonly inline = input(false);
  readonly resolvedCount = input(0);
  readonly pendingCount = input(0);
  readonly failedCount = input(0);
  /** Globe artist total; when 0 the placed/pending footer is hidden (e.g. on the artist page). */
  readonly total = input(0);

  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  constructor() {
    // Keep the newest line in view: re-run after each render where the entries changed (reading the
    // signal inside registers the dependency), by which point the new lines are already in the DOM.
    afterRenderEffect(() => {
      this.entries();
      const el = this.list()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
```

### `src/app/features/globe/log-terminal/log-terminal.html`
```html
<section class="terminal" role="log" aria-live="polite" aria-label="Loading progress">
  <header class="head">
    <span class="spinner" aria-hidden="true"></span>
    <span class="title">{{ title() }}</span>
  </header>

  <ol #list class="lines">
    @for (entry of entries(); track entry.id) {
      <li class="line" [class]="entry.level">
        <span class="prompt" aria-hidden="true">›</span>
        <span class="text">{{ entry.text }}</span>
      </li>
    }
    <li class="cursor" aria-hidden="true">›&nbsp;<span class="blink">▋</span></li>
  </ol>

  @if (total() > 0) {
    <footer class="summary">
      <span class="stat placed">{{ resolvedCount() }} placed</span>
      <span class="stat pending">{{ pendingCount() }} pending</span>
      @if (failedCount() > 0) {
        <span class="stat failed">{{ failedCount() }} unplaced</span>
      }
      <span class="stat total">{{ total() }} artists</span>
    </footer>
  }
</section>
```

### `src/app/features/globe/log-terminal/log-terminal.scss`
```scss
// Blocking scrim: fills the globe area (globe-page :host is position:relative), dims the controls
// beneath, and captures pointer events so no action can be taken while the scan runs.
:host {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: color-mix(in srgb, var(--space-void) 55%, transparent);
  backdrop-filter: blur(2px);
  pointer-events: auto;
}

// Inline mode: no scrim — an in-flow panel centred in a tall block, for a page already showing
// nothing but a loading state (the artist page's discography load).
:host(.inline) {
  position: static;
  inset: auto;
  min-height: 50vh;
  background: none;
  backdrop-filter: none;
}

.terminal {
  display: flex;
  flex-direction: column;
  width: min(34rem, 100%);
  max-height: min(24rem, 100%);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--space-surface) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--neon-teal) 30%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: var(--glow-shadow);
  overflow: hidden;
}

.head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid color-mix(in srgb, var(--neon-teal) 18%, transparent);
}

.spinner {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--neon-teal) 25%, transparent);
  border-top-color: var(--neon-teal);
  animation: spin 0.7s linear infinite;
}

.title {
  font: var(--mat-sys-body-medium);
  color: var(--mat-sys-on-surface);
}

.lines {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0.6rem 0.9rem;
  overflow-y: auto;
  list-style: none;
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 0.72rem;
  line-height: 1.55;
}

.line {
  display: flex;
  gap: 0.5rem;
  color: var(--neon-teal);

  &.success {
    color: var(--globe-land-mid);
  }
  &.warn {
    color: var(--globe-land-hot);
  }
  &.error {
    color: #ff8a80;
  }
}

.prompt {
  flex: 0 0 auto;
  opacity: 0.55;
}

.text {
  word-break: break-word;
}

.cursor {
  color: var(--neon-teal);
}

.blink {
  animation: blink 1.1s step-end infinite;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  padding: 0.55rem 0.9rem;
  border-top: 1px solid color-mix(in srgb, var(--neon-teal) 18%, transparent);
  font: var(--mat-sys-label-small);
  color: var(--mat-sys-on-surface-variant);
}

.stat.placed {
  color: var(--globe-land-mid);
}

.stat.failed {
  color: var(--globe-land-hot);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
```

## Done when (this step)
- [ ] `npm run build` → compiles clean (no unresolved `LogEntry` / `afterRenderEffect` import).
- [ ] Once wired (step 10), starting a scan shows a centred terminal over a dimmed globe, streaming lines that
      auto-scroll to the newest, with a spinning loader and a `N placed · N pending · N artists` footer.

## If it breaks
- **The terminal doesn't cover the globe (sits in normal flow)** → the host `:host { position: absolute }`
  needs the page's `:host` to be `position: relative` (it is, from M4/M5). Confirm you placed
  `<app-log-terminal>` *inside* `globe-page`, not elsewhere.
- **New lines appear but it doesn't scroll to the bottom** → the `afterRenderEffect` isn't reading `entries()`,
  so it never re-runs; keep the bare `this.entries();` call as the first line inside it.
