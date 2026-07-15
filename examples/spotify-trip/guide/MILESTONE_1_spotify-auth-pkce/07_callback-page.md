# M1 · Step 07 of 10 — The callback page + the `callback` route
> Nav: [← The Toast service](06_toast-service.md) · [Overview](00_overview.md) · [The auth interceptor →](08_auth-interceptor.md)

> **This step touches 4 files, committed together:** `callback-page.ts`, `callback-page.html`,
> `callback-page.scss` (a new standalone component) and an edit to `app.routes.ts` (register the `callback`
> route). The component and its route are one indivisible feature — Spotify can't redirect back without a route
> to land on.

## Glossary for this step
> **CSRF `state` check** — comparing the `state` Spotify echoes in the callback against the one you stashed at
> `beginLogin`; a mismatch means the callback wasn't started by this app, so you reject it.
> **`ActivatedRoute.snapshot.queryParamMap`** — a one-time read of the current URL's `?query` params (here:
> `code`, `state`, `error`).

## Why / design
This is the far side of the redirect. Spotify sends the browser to
`http://127.0.0.1:4200/callback?code=...&state=...` (or `?error=access_denied` if the user declined). The
callback page runs a short **guard sequence**, then either completes the token exchange and routes to `/globe`,
or toasts a reason and routes back to `/login`. The order matters — each check fails safely:

1. **User denied?** (`?error` present) → toast, back to `/login`.
2. **Missing `code` or `state`?** → toast, back to `/login`.
3. **No stashed PKCE session?** (`consumePkceSession()` returned `null`) → the tab lost its `sessionStorage`
   (e.g. different tab) → toast, back to `/login`.
4. **`state` mismatch?** → possible forged callback → toast, back to `/login`.
5. **All good** → `exchangeCode(code, verifier)`; on success route to `/globe`, on throw toast + `/login`.

`consumePkceSession()` (step 04) both **reads and clears** the `sessionStorage` verifier/state — a one-time
use, so a stale login can't be replayed. The page shows a spinner ("Finishing sign-in…") while the exchange
runs; it's a transient screen, never a destination you stay on.

> **Reminder (classic Angular).** `ngOnInit` kicks off the async work; the handler is `private async
> handleCallback()`. We `void` the promise in `ngOnInit` because lifecycle hooks can't be `async`.

The **`callback` route string is load-bearing** — `path: 'callback'` must produce exactly
`http://127.0.0.1:4200/callback`, matching `environment.spotify.redirectUri` (step 03) and the URI registered
in your Spotify dashboard. Change one and login breaks with a redirect-URI mismatch.

## Do this
1. In `src/app/features/auth/`, create the folder **`callback-page/`** with the three files below.
2. `callback-page.ts`: inject `ActivatedRoute`, `Router`, `SpotifyAuth`, `Toast`; run `handleCallback()` from
   `ngOnInit`. Note the import path for `Toast` is `../../../shared/toast` (three levels up from the component).
3. `callback-page.html`: a Material indeterminate spinner + the "Finishing sign-in…" caption. Cosmetic copy.
4. Open **`src/app/app.routes.ts`** and add the `callback` route **between** `login` and `globe`, lazy-loading
   `CallbackPage`. Leave `globe` as-is for now — its `authGuard` arrives in step 09. Do **not** add the
   `bootSyncGuard` or the library/actions routes (later milestones).

## Code
### `src/app/features/auth/callback-page/callback-page.ts`
```ts
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';

import { SpotifyAuth } from '../../../core/auth/spotify-auth';
import { Toast } from '../../../shared/toast';

@Component({
  selector: 'app-callback-page',
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './callback-page.html',
  styleUrl: './callback-page.scss',
})
export class CallbackPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(SpotifyAuth);
  private readonly toast = inject(Toast);

  ngOnInit(): void {
    void this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const denied = params.get('error');
    const code = params.get('code');
    const state = params.get('state');
    const session = this.auth.consumePkceSession();

    if (denied !== null) {
      return this.fail(`Spotify denied the request: ${denied}.`);
    }
    if (code === null || state === null) {
      return this.fail('The callback is missing its authorization code.');
    }
    if (session === null) {
      return this.fail('Your login session expired. Please try again.');
    }
    if (state !== session.state) {
      return this.fail('Sign-in could not be verified. Please try again.');
    }

    try {
      await this.auth.exchangeCode(code, session.verifier);
      await this.router.navigate(['/globe']);
    } catch {
      await this.fail('Could not complete sign-in with Spotify. Please try again.');
    }
  }

  private async fail(message: string): Promise<void> {
    this.toast.error(message);
    await this.router.navigate(['/login']);
  }
}
```
### `src/app/features/auth/callback-page/callback-page.html`
```html
<section class="page">
  <mat-progress-spinner mode="indeterminate" [diameter]="48" />
  <p class="message">Finishing sign-in…</p>
</section>
```
### `src/app/features/auth/callback-page/callback-page.scss`
```scss
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 70vh;
  padding: 2rem;
  text-align: center;
}

.message {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
}
```
### `src/app/app.routes.ts` (state as of this step — `callback` added; `globe` guard comes in step 09)
```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'globe' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./features/auth/callback-page/callback-page').then((m) => m.CallbackPage),
  },
  {
    path: 'globe',
    loadComponent: () => import('./features/globe/globe-page/globe-page').then((m) => m.GlobePage),
  },
  { path: '**', redirectTo: 'globe' },
];
```

## Done when (this step)
- [ ] **Full login round-trip works:** from `/login`, click **Log in with Spotify**, approve on Spotify → you
  land on `/globe` (M0 placeholder), briefly seeing "Finishing sign-in…".
- [ ] In devtools → Application → Local Storage, key **`evm.spotify.tokens`** now exists with a non-empty
  `accessToken`, a `refreshToken` string, and a numeric `expiresAt`.
- [ ] Decline on Spotify instead (or hit `/callback` with no params) → an **error toast** appears and you're
  bounced to `/login`.

## If it breaks
- **`INVALID_CLIENT: Invalid redirect URI`** (on Spotify's page) → the dashboard redirect URI ≠
  `http://127.0.0.1:4200/callback`, or you're on `localhost`. Fix the dashboard / serve on `127.0.0.1`.
- **Always toasts "Your login session expired"** → `consumePkceSession()` found nothing: you completed login
  in a *different tab* than you started it (sessionStorage is per-tab), or something cleared it. Start and
  finish in the same tab.
- **Toast "Could not complete sign-in"** → the token POST failed; open the Network tab, inspect the
  `api/token` response — `invalid_grant` means verifier/redirect-URI mismatch (see step 04).
