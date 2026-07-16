# M1 · Step 06 of 10 — The `Toast` service (shared prerequisite)
> Nav: [← The login page](05_login-page.md) · [Overview](00_overview.md) · [The callback page →](07_callback-page.md)

## Glossary for this step
> **`MatSnackBar`** — Angular Material's transient bottom-of-screen notification service. See
> [Material snack-bar](https://material.angular.dev/components/snack-bar/overview).

## Why / design
Both the **callback page** (next step) and the **auth interceptor** (step 08) need to tell the user something
went wrong — "Your login session expired", "Could not complete sign-in". Rather than each injecting
`MatSnackBar` and re-specifying position/duration, the app funnels every transient message through one thin
`Toast` service (`shared/toast.ts`). It's the app's single notification vocabulary — `error` (6 s, red),
`info` (4 s), and `action` (a message with a button, e.g. "Undo") — and it recurs everywhere from here on.

> **Why this step exists.** The brief's M1 source list names the interceptor and callback page, both of which
> `import { Toast }`. `Toast` is therefore a **hard prerequisite** for M1 to compile — so we build it here,
> before its first consumer. Only `Toast.error(...)` is exercised in M1 (callback + interceptor); the other two
> methods come free with the whole-file port and are first used later: `Toast.info(...)` in **M7** (e.g.
> "Added to playlist.") and `Toast.action(...)` — the Undo toast — in **M10**'s library console.

`MatSnackBar`'s animations rely on `provideAnimationsAsync()`, which M0 already put in `app.config.ts` — no
provider change is needed here.

## Do this
This step creates **one file**: `src/app/shared/toast.ts`.

1. In `src/app/shared/`, create **`toast.ts`** and paste the code below.
2. `@Injectable({ providedIn: 'root' })` — a root singleton (mandatory).
3. Inject `MatSnackBar` with `inject()`. The private `open()` centralizes position (`center` / `bottom`) and a
   `Dismiss` action; `error`/`info` layer duration + a panel class on top.
4. `panelClass: 'toast-error'` is a hook for red styling in the global theme — **cosmetic**; the class name is
   only load-bearing if your theme's stylesheet targets it.

## Code
### `src/app/shared/toast.ts`
```ts
import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { firstValueFrom, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  error(message: string): void {
    this.open(message, { duration: 6000, panelClass: 'toast-error' });
  }

  info(message: string): void {
    this.open(message, { duration: 4000 });
  }

  /**
   * Show a message with an action button (e.g. "Undo"). Resolves `true` if the action was clicked
   * before the toast auto-dismissed, `false` otherwise.
   */
  async action(message: string, actionLabel: string, durationMs = 7000): Promise<boolean> {
    const ref = this.snackBar.open(message, actionLabel, {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: durationMs,
    });
    return firstValueFrom(ref.onAction().pipe(map(() => true)), { defaultValue: false });
  }

  private open(message: string, config: MatSnackBarConfig): void {
    this.snackBar.open(message, 'Dismiss', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      ...config,
    });
  }
}
```

## Done when (this step)
- [ ] `npm run build` compiles with `toast.ts` present → **no TypeScript errors**.

> **Why the gate is build-only:** `Toast` is a service with no UI trigger of its own yet — nothing opens a
> snackbar at this point, so there's nothing to see. It's exercised for real in the **next step (07)**, where
> the callback page shows a toast on a failed sign-in. Build-clean is the only assertion available now.

## If it breaks
- **`No provider for MatSnackBar` at runtime** → `provideAnimationsAsync()` is missing from `app.config.ts`.
  M0 added it; if you removed it, put it back (Material overlay components need it).
- **`firstValueFrom(..., { defaultValue: false })` type error** → your RxJS is older than the pinned `~7.8`;
  the `defaultValue` config overload arrived in RxJS 7. Check `package.json`.

---
> Nav: [← The login page](05_login-page.md) · [Overview](00_overview.md) · [The callback page →](07_callback-page.md)
