# M10 · Step 09 of 18 — Shared `ConfirmDialog` + `Confirm` service
> Nav: [← The LibraryStore orchestrator](08_library-store.md) · [Overview](00_overview.md) · [The alphabet bar →](10_alphabet-bar.md)

> **This step touches 4 files, committed together:** `shared/components/confirm-dialog/confirm-dialog.ts` +
> `.html` + `.scss`, plus `shared/confirm.ts` (the service that opens it). It's one reusable primitive — a modal
> and the promise-returning service that wraps it — so we add it in one commit.

## Glossary for this step
> **`MatDialog`** — Angular Material's imperative dialog service: `dialog.open(Component, { data })` mounts a
> component in a modal and returns a ref whose `afterClosed()` emits the close value. [Docs](https://material.angular.dev/components/dialog/overview).
> **`MAT_DIALOG_DATA`** — the injection token a dialog component reads to receive the `data` passed to `open()`.

## Why / design
The app needs an in-app replacement for the browser's `window.confirm` — themed, non-blocking, and awaitable.
`ConfirmDialog` is the dumb modal (title + message + two buttons); `Confirm` is the root service that opens it
and resolves a boolean:

- **`Confirm.ask(data)`** resolves `true` **only** on an explicit confirm click; a cancel, a backdrop click, or
  Escape resolves `false`. That single rule keeps every caller safe by default (dismiss = "no").
- The confirm button can render **destructive** (warn palette) via `data.destructive` — for delete/wipe actions.

> **Scope note:** the library's own actions use the **Undo toast** (step 08), not a pre-confirm, so nothing in
> M10 calls `Confirm.ask` yet. We introduce it here as the **shared primitive** its real consumer — M11's "Clear
> all data" control in the settings panel — will use. Building the reusable modal now (rather than in M11) keeps
> the shared layer complete; the destructive *data-wipe* flow itself stays deferred to M11 with the rest of
> `DataTransfer`.

> **Recurring model — dumb component, smart service.** The component holds no logic beyond reading `data`; the
> `Confirm` service owns the `MatDialog` wiring and the promise. Callers read like the old `confirm()` without a
> native browser dialog. The selector `app-confirm-dialog` keeps the `app-` prefix (convention); it's cosmetic
> (the dialog is opened by class reference, not by selector).

## Do this
1. Create the three `confirm-dialog` files under `src/app/shared/components/confirm-dialog/`. The
   `ConfirmDialogData` interface is **exported** — `Confirm` and future callers type their `data` against it.
2. Create `src/app/shared/confirm.ts` — the `Confirm` service. Its `ask` opens the dialog with a fixed width and
   `autoFocus: false`, then maps `afterClosed()` to `=== true` so any non-confirm outcome is `false`.
3. The `[mat-dialog-close]="true"` / `[mat-dialog-close]="false"` bindings in the template are **load-bearing** —
   they are the close values `ask` reads; don't drop them.

## Code
### `src/app/shared/components/confirm-dialog/confirm-dialog.ts`
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

/** Content for the reusable confirm modal. Opened via the {@link Confirm} service, not directly. */
export interface ConfirmDialogData {
  title: string;
  message: string;
  /** Confirm button label (default "Confirm"). */
  confirmLabel?: string;
  /** Cancel button label (default "Cancel"). */
  cancelLabel?: string;
  /** Style the confirm button as a destructive action (warn palette) — e.g. a delete/wipe. */
  destructive?: boolean;
}

/**
 * Reusable yes/no confirmation modal — the in-app replacement for `window.confirm`. Closes with
 * `true` on confirm and `false` (or dismiss) otherwise; the {@link Confirm} service wraps that into
 * a promise so callers read like the old `confirm()` without a native browser dialog.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
```

### `src/app/shared/components/confirm-dialog/confirm-dialog.html`
```html
<h2 mat-dialog-title>{{ data.title }}</h2>

<mat-dialog-content>
  <p class="message">{{ data.message }}</p>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button [mat-dialog-close]="false">{{ data.cancelLabel ?? 'Cancel' }}</button>
  <button
    mat-flat-button
    [color]="data.destructive ? 'warn' : 'primary'"
    [mat-dialog-close]="true"
    cdkFocusInitial
  >
    {{ data.confirmLabel ?? 'Confirm' }}
  </button>
</mat-dialog-actions>
```

### `src/app/shared/components/confirm-dialog/confirm-dialog.scss`
```scss
.message {
  margin: 0;
  max-width: 34rem;
  line-height: 1.5;
  white-space: pre-line;
}
```

### `src/app/shared/confirm.ts`
```ts
import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ConfirmDialog, ConfirmDialogData } from './components/confirm-dialog/confirm-dialog';

/**
 * Opens the reusable {@link ConfirmDialog} modal and resolves to the user's choice — the app-wide
 * replacement for `window.confirm`. Resolves `true` only on explicit confirm; a cancel, backdrop
 * click, or Escape resolves `false`.
 */
@Injectable({ providedIn: 'root' })
export class Confirm {
  private readonly dialog = inject(MatDialog);

  async ask(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data,
      width: '440px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the dialog + service compile and
      `Confirm` resolves its `./components/confirm-dialog/confirm-dialog` import.
- [ ] It's a shared primitive with no caller in M10, so there's nothing to click yet; its first UI use is M11's
      "Clear all data" control. Correctness is proven by the clean build.

## If it breaks
- **`No provider for MatDialog`** → `provideAnimationsAsync()` / the Material dialog providers must be in
  `app.config.ts` — Material was set up in M0; a fresh dialog needs no extra provider beyond that.
- **`ask` always resolves `false`** → the template's confirm button must bind `[mat-dialog-close]="true"`; if it
  closes with no value (a bare `mat-dialog-close`), `=== true` is never met.
- **`Cannot find module './components/confirm-dialog/confirm-dialog'`** → `confirm.ts` sits at `shared/`, so the
  path is `./components/confirm-dialog/confirm-dialog` (no leading `../`).
