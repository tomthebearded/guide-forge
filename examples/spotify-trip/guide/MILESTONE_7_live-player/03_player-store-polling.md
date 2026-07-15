# M7 · Step 03 of 8 — `PlayerStore`: the polling read core
> Nav: [← Playback API](02_playback-api.md) · [Overview](00_overview.md) · [Optimistic controls + device activation →](04_optimistic-controls.md)

## Glossary for this step
> **root-singleton store** — one `@Injectable({ providedIn: 'root' })` service per feature holding its state as
> signals; the convention this app uses everywhere (M3's `LikedIndex`, M5's `GlobeStore`). See
> [conventions](../foundation/conventions.md).
> **poll** — re-read `/me/player` on a timer so changes made *elsewhere* (your phone, a skip on desktop) show
> up in the header without a manual refresh.
> **optimistic patch / update** — apply a UI change *immediately* (before Spotify confirms it), then reconcile
> against the next read — and drop any stale read that would undo it. It's what makes the controls feel
> instant; the full apply → reconcile → revert loop is built in the [next step](04_optimistic-controls.md). See
> [glossary](../foundation/glossary.md#optimistic-update).
> **tri-state favourite** — the ❤ indicator is `true` / `false` / `null`, where `null` means "not known yet"
> (lookup in flight, or hidden because the token can't read the library). Never guess `false`.

## Why / design
`PlayerStore` is the root singleton (created now, extended in steps 04–05) that owns the live playback state.
This step builds its **read half**: signals the UI reads, and a poll loop that keeps them fresh. No buttons
yet — just "the header knows what's playing".

Three ideas land here:

**1. The poll gate is `hasSession()`, not `isAuthenticated()`.** The `effect()` starts polling whenever a
session exists and stops on logout.

> 📚 New concept — why `hasSession()` and not `isAuthenticated()`? `isAuthenticated()` (M1) is a *point-in-time*
> check — it flips to `false` the moment the access token's expiry passes, and it doesn't re-evaluate as time
> passes. But a lapsed access token still has a valid **refresh** token, and the M1 auth interceptor refreshes
> it lazily on the first `401`. If the poll gated on `isAuthenticated()`, reopening the app the next day would
> leave the bar dead until you manually hit a control. `hasSession()` stays `true` as long as *any* token
> exists, so the poll keeps running and the interceptor quietly refreshes underneath. See
> [`TokenStore`](../MILESTONE_1_spotify-auth-pkce/11_verify.md) and [conventions](../foundation/conventions.md).

**2. The poll *skips*, it never *queues*.** `setInterval` fires every 3 s regardless. Inside the tick we
`return` early — rather than issue a request — when the tab is hidden or the rate-limit gate has an open
cooldown ([D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry)). Queuing instead would pile up dozens of requests that all fire
the instant the cooldown lifts, re-tripping it. While paused/idle we also thin the cadence to every 3rd tick
(~9 s), because a static state doesn't need re-reading at 3 s.

**3. The suppress-poll grace window (declared here, used in step 04).** `refresh(fromPoll)` re-checks
`suppressPollUntil` *after* its `await`: a control action issued while a poll was in flight has just set an
optimistic state, and Spotify's read still lags it — applying the stale read would revert the UI. The field
starts at `0` (no suppression) until the controls in step 04 set it.

**The ❤ tri-state indicator** (`checkFavourite`) rides the read path: on a *track change*, look up whether the
new song is Liked, memoised so skipping back to a recent track doesn't re-hit the API. It **self-disables on a
403** (the token can't read the library) so every skip doesn't re-fire a forbidden request. Critically, this
lookup only drives the heart — **it never feeds the globe's dataset** (scope discipline).

> This is the read core only: it references `suppressPollUntil` and the `_playlists` / `myUserId` fields (reset
> on logout) that the control + playlist methods in steps 04–05 will use. That's why they're declared now.

## Do this
1. **Create `src/app/features/player/player-store.ts`** with the code below. The folder
   `src/app/features/player/` is new — create it too (the `player-bar` component joins it in step 06).
2. The class is `PlayerStore` (matches the file name, per [naming](../foundation/conventions.md)); the selector
   / DI token is the class. `@Injectable({ providedIn: 'root' })` makes it a single shared instance.
3. Nothing renders it yet — verification for this step is a clean build. You'll *see* it once the header wires
   it up in step 07.

## Code
### `src/app/features/player/player-store.ts`
```ts
import { HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { RateLimiters } from '../../core/api/rate-limiters';
import { SpotifyApi } from '../../core/api/spotify-api';
import { TokenStore } from '../../core/auth/token-store';
import { toPlaybackState } from '../../core/mappers/spotify.mapper';
import { PlaybackState } from '../../core/models/playback-state';
import { Playlist } from '../../core/models/playlist';

/** How often to poll `/me/player` so external changes (skips, phone control) show up promptly. */
const POLL_INTERVAL_MS = 3_000;
/**
 * While paused/idle the state barely moves, so only actually poll every Nth tick (~9s) instead of
 * every 3s — cutting idle `/me/player` traffic by ~⅔. Controls call `refreshSoon()` (step 04), so a
 * resume the user triggers still reflects immediately; an external resume shows within ~9s.
 */
const IDLE_POLL_EVERY = 3;

/**
 * Root singleton owning the user's live Spotify playback state for the header control. Polls while a
 * session exists (and the tab is visible), exposes readonly signals, and — from step 04 — issues
 * optimistic control actions. Playback control needs a Spotify **Premium** account and an active device.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly api = inject(SpotifyApi);
  private readonly tokenStore = inject(TokenStore);
  private readonly rateLimit = inject(RateLimiters).spotify;

  private readonly _state = signal<PlaybackState | null>(null);
  /** Whether the current track is one of the user's Liked Songs; null while unknown/unchecked. */
  private readonly _isFavourite = signal<boolean | null>(null);

  /** The user's editable playlists, loaded lazily for the "add to" menu (populated in step 05). */
  private readonly _playlists = signal<Playlist[]>([]);
  private readonly _playlistsLoading = signal(false);
  /** Cached current-user id, to filter playlists the user can actually write to (step 05). */
  private myUserId: string | null = null;

  readonly state = this._state.asReadonly();
  readonly isPlaying = computed(() => this._state()?.isPlaying ?? false);
  readonly shuffle = computed(() => this._state()?.shuffle ?? false);
  readonly hasTrack = computed(() => this._state() !== null);
  readonly isFavourite = this._isFavourite.asReadonly();
  readonly playlists = this._playlists.asReadonly();
  readonly playlistsLoading = this._playlistsLoading.asReadonly();

  private pollHandle: ReturnType<typeof setInterval> | null = null;
  /** Counts poll ticks so idle polls can be thinned to every {@link IDLE_POLL_EVERY}th. */
  private pollTick = 0;
  /** Epoch ms until which background-poll results are dropped, so they can't undo an optimistic patch. */
  private suppressPollUntil = 0;
  /** Track whose saved-state was last looked up, so we only re-check on a real track change. */
  private lastFavTrackId: string | null = null;
  /** trackId → saved, so flipping back to a recent track doesn't re-hit the API. */
  private readonly favouriteMemo = new Map<string, boolean>();
  /** Track ids whose saved-state lookup is in flight, so rapid A→B→A skips don't double-fire it. */
  private readonly favouriteInFlight = new Set<string>();
  /**
   * Set once the saved-state endpoint returns 403 (token lacks `user-library-read`). The heart
   * indicator is best-effort, so we stop probing for the session — otherwise every skip re-fires the
   * same forbidden request and spams the console.
   */
  private favouriteCheckForbidden = false;

  constructor() {
    // Poll whenever a session exists — not just while the access token is unexpired. A lapsed access
    // token still has a valid refresh token, and the interceptor refreshes it lazily on the first
    // poll's 401. Gating on `isAuthenticated` would leave the bar dead after the token ages out. Stop
    // and clear on logout (`hasSession` → false).
    effect(() => {
      if (this.tokenStore.hasSession()) {
        this.startPolling();
      } else {
        this.stopPolling();
        this._state.set(null);
        this.resetFavourite();
        this._playlists.set([]);
        this.myUserId = null;
      }
    });
  }

  private async refresh(fromPoll = false): Promise<void> {
    // Mirror the poll gate: a session is enough — the interceptor refreshes a lapsed token on 401.
    if (!this.tokenStore.hasSession()) {
      return;
    }
    try {
      const dto = await this.api.getPlaybackState();
      // Re-check after the await: a control action issued while this poll was in flight just set an
      // optimistic state, and Spotify's read still lags it — applying it now would revert the UI.
      if (fromPoll && Date.now() < this.suppressPollUntil) {
        return;
      }
      const state = toPlaybackState(dto);
      this._state.set(state);
      this.checkFavourite(state?.trackId ?? null);
    } catch {
      // Polling errors are transient and noisy — swallow them; control actions report their own.
    }
  }

  /**
   * On a track change, look up whether the new song is one of the user's Liked Songs. This only drives
   * the heart indicator — it never feeds the globe's scanned dataset, so playing songs (favourite or
   * not) can't pollute the map.
   */
  private checkFavourite(trackId: string | null): void {
    if (trackId === this.lastFavTrackId) {
      return;
    }
    this.lastFavTrackId = trackId;
    if (trackId === null || this.favouriteCheckForbidden) {
      this._isFavourite.set(null);
      return;
    }
    const memoised = this.favouriteMemo.get(trackId);
    if (memoised !== undefined) {
      this._isFavourite.set(memoised);
      return;
    }
    this._isFavourite.set(null); // unknown until the lookup returns
    if (this.favouriteInFlight.has(trackId)) {
      return; // a lookup for this exact track is already running — don't duplicate it
    }
    this.favouriteInFlight.add(trackId);
    this.api
      .areTracksSaved([trackId])
      .then((saved) => {
        const value = saved[0] ?? false;
        this.favouriteMemo.set(trackId, value);
        if (this.lastFavTrackId === trackId) {
          this._isFavourite.set(value); // ignore if the track changed again meanwhile
        }
      })
      .catch((error: unknown) => {
        // Best-effort: a 403 means the token can't read the library at all, so stop probing — every
        // skip would otherwise repeat it.
        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.favouriteCheckForbidden = true;
        }
      })
      .finally(() => this.favouriteInFlight.delete(trackId));
  }

  private resetFavourite(): void {
    this._isFavourite.set(null);
    this.lastFavTrackId = null;
    this.favouriteMemo.clear();
    this.favouriteInFlight.clear();
    this.favouriteCheckForbidden = false;
  }

  private startPolling(): void {
    if (this.pollHandle !== null) {
      return;
    }
    void this.refresh();
    this.pollTick = 0;
    this.pollHandle = setInterval(() => {
      this.pollTick++;
      // Skip (don't queue) while hidden or rate-limited: the interval fires regardless, so deferring
      // these requests would pile up dozens that all fire when the cooldown lifts, re-tripping it.
      if (document.visibilityState !== 'visible' || this.rateLimit.limited) {
        return;
      }
      // Full 3s cadence while actively playing; back off to every IDLE_POLL_EVERY ticks when paused or
      // idle, where the state is static and frequent re-reads buy nothing.
      if (!this.isPlaying() && this.pollTick % IDLE_POLL_EVERY !== 0) {
        return;
      }
      void this.refresh(true);
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors. `PlayerStore` compiles as a
  root-injectable service.
- [ ] `npm run lint` → clean. (`suppressPollUntil` and the playlist fields are declared now but first *read*
  in steps 04–05; unused **private** class members are not flagged by tsc or the lint config, so this compiles
  cleanly in the interim.)
- [ ] With `npm start` running and logged in, open DevTools → Network, filter `api.spotify.com`. Even before
  any UI wires the store, injecting it triggers the poll — but nothing injects it yet, so **no** `/me/player`
  request fires. That's expected; the poll starts once the header uses the store (step 07).

## If it breaks
- **`Cannot find module '../../core/mappers/spotify.mapper'`** → the relative depth is wrong. `player-store.ts`
  sits at `features/player/`, so core is two levels up (`../../core/…`).
- **`effect() must be called within an injection context`** → the `effect()` must be inside the constructor
  (it is here). Don't move it to a method.
- **Poll never fires later** → it starts only when something injects `PlayerStore`. That's the header (step
  07); nothing's wrong yet.
