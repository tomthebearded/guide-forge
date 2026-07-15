# M9 · Step 06 of 14 — BootSync + the nav guard
> Nav: [← Persist sync timestamps](05_sync-state-cache.md) · [Overview](00_overview.md) · [The genre filter →](07_genre-filter.md)

> **This step touches 2 files, committed together:** `core/pipeline/boot-sync.ts` (the reconcile orchestrator)
> and `core/pipeline/boot-sync-guard.ts` (the route guard that blocks navigation while it runs).

## Glossary for this step
> **cheap diff** — a single request that tells you whether anything changed before you page anything. Here:
> `GET /me/tracks?limit=1` returns the library's `total` + newest `added_at`; if both match the persisted
> `LikedIndex`, the library is unchanged and boot-sync pages nothing.
> **`pauseIfLimited`** — the check that bails out of the reconcile if any data source has an open 429 cooldown,
> so a step doesn't enter the rate-limit gate's `acquire()` (which *waits out* the ban, holding the blocking
> overlay for minutes) — see [decision-log D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry).
> **nav-lock** — while the boot sequence runs, the `busy` signal blocks route changes (via the guard) and
> disables the header nav, so the user can't navigate into a half-synced state.

## Why / design
On every open, the app should quietly reconcile with Spotify — but **cheaply**. `BootSync.run()` walks the three
domains **sequentially** (liked → playlists → artists), each awaited, each with two guards:

1. **Staleness guard** — skip a domain synced under `STALE_MS` (15 min) ago. A warm reopen touches nothing.
2. **`pauseIfLimited`** — between steps, if any host has an open cooldown, stop the sequence (the next reconcile
   picks it up) rather than block on a multi-minute ban.

The **liked** step leads with the cheap diff: compare `getLikedTracksSummary()` against the `LikedIndex`'s
`count()` + `newest()`; only if they differ does it call `globe.recalculate(false)` (the incremental page).

`busy` drives the app's blocking overlay + the nav-lock, raised only for the **boot** sequence (not the manual
per-domain reloads, which the Actions page fires with their own `running` flag). The per-domain `force` methods
(`syncLiked(true)`, etc.) and the `fullRescan*` methods back the Actions page's buttons.

**Recurring model:** every entry point funnels through `wrap()`, a single in-flight guard — so two triggers
can't run concurrently — which also raises `busy` for the boot run and always clears `phase`/`busy`/`running`
in a `finally`.

## Do this
1. Create `src/app/core/pipeline/boot-sync.ts` with the `BootSync` service, the `SyncDomain`/`SyncPhase` types,
   and the `PHASE_LABEL` map (the app root's overlay caption, step 14).
2. Create `src/app/core/pipeline/boot-sync-guard.ts` — a `CanActivateFn` that returns `!busy()`. Returning the
   *current* URL semantics (a `false`) leaves the user put instead of bouncing them to a fallback.
3. Note the domain steps all early-return when `!globe.hasData()`: a **first-ever run** has nothing to
   reconcile, so boot-sync defers to the explicit Actions "Full re-scan" rather than auto-paging a whole library.

## Code
### `src/app/core/pipeline/boot-sync.ts`
```ts
import { inject, Injectable, signal } from '@angular/core';

import { GlobeStore } from '../../features/globe/globe-store';
import { Toast } from '../../shared/toast';
import { RateLimiters } from '../api/rate-limiters';
import { SpotifyApi } from '../api/spotify-api';
import { SyncState, SyncStateCache } from '../cache/sync-state-cache';
import { LogStore } from '../logging/log-store';
import { LikedIndex } from './liked-index';
import { PlaylistIndex } from './playlist-index';

/** The data domain currently being reconciled, or `idle` when nothing is running. */
export type SyncDomain = 'liked' | 'playlists' | 'artists';
export type SyncPhase = 'idle' | SyncDomain;

/** How recently a domain must have synced to be skipped on open. */
const STALE_MS = 15 * 60 * 1000;

/**
 * Orchestrates the on-open reconcile: liked → playlists → artists, in that order, each awaited so
 * the sequence is strictly sequential. Every step is skipped when it synced under {@link STALE_MS}
 * ago (a **staleness guard**), so a warm reopen costs zero network. The liked step leads with a
 * one-call cheap diff ({@link SpotifyApi.getLikedTracksSummary}) and only pages when the library
 * actually changed. {@link busy} drives the app's blocking overlay + nav-lock while the boot
 * sequence runs; the per-domain `force` methods back the Actions page's manual reloads.
 */
@Injectable({ providedIn: 'root' })
export class BootSync {
  private readonly spotify = inject(SpotifyApi);
  private readonly globe = inject(GlobeStore);
  private readonly likedIndex = inject(LikedIndex);
  private readonly playlistIndex = inject(PlaylistIndex);
  private readonly cache = inject(SyncStateCache);
  private readonly log = inject(LogStore);
  private readonly toast = inject(Toast);
  private readonly limits = inject(RateLimiters);

  private state: SyncState = this.cache.load();

  private readonly _phase = signal<SyncPhase>('idle');
  private readonly _running = signal(false);
  private readonly _boot = signal(false);
  private readonly _state = signal<SyncState>(this.state);

  /** The domain currently syncing, or `idle`. */
  readonly phase = this._phase.asReadonly();
  /** Any sync (boot or manual) is in flight — for disabling the Actions controls. */
  readonly running = this._running.asReadonly();
  /** The **boot** sequence is in flight — drives the blocking overlay + nav-lock only. */
  readonly busy = this._boot.asReadonly();
  /** Per-domain last-sync timestamps, reactive for the Actions "synced N ago" labels. */
  readonly syncState = this._state.asReadonly();

  /** Last-sync epoch ms for one domain, or null if never synced. */
  lastSyncedAt(domain: SyncDomain): number | null {
    return this._state()[domain].lastSyncedAt;
  }

  /**
   * The on-open reconcile: liked → playlists → artists, sequential and staleness-guarded. Assumes
   * the caller has already confirmed there's data to reconcile (a first-ever run defers to the
   * explicit scan UI). Holds {@link busy} for the whole sequence so the shell blocks navigation.
   */
  async run(): Promise<void> {
    await this.wrap(async () => {
      await this.doSyncLiked(false);
      if (this.pauseIfLimited()) return;
      await this.doSyncPlaylists(false);
      if (this.pauseIfLimited()) return;
      await this.doSyncArtists(false);
    }, true);
  }

  /** Cheap liked-songs diff (force bypasses the staleness guard) — Actions "Check for updates". */
  async syncLiked(force = false): Promise<void> {
    await this.wrap(() => this.doSyncLiked(force));
  }

  /** Incremental playlist reconcile (snapshot diff) — Actions "Check for updates". */
  async syncPlaylists(force = false): Promise<void> {
    await this.wrap(() => this.doSyncPlaylists(force));
  }

  /** Backfill artist genres + follow state for what's missing — Actions "Check for updates". */
  async syncArtists(force = false): Promise<void> {
    await this.wrap(() => this.doSyncArtists(force));
  }

  /** Full liked-songs rescan (re-page everything, retry failures) — Actions "Full re-scan". */
  async fullRescanLiked(): Promise<void> {
    await this.wrap(async () => {
      this._phase.set('liked');
      await this.globe.recalculate(true);
      this.stamp('liked');
    });
  }

  /** Full playlist rebuild from scratch — Actions "Full re-scan". */
  async fullRescanPlaylists(): Promise<void> {
    await this.wrap(async () => {
      this._phase.set('playlists');
      await this.playlistIndex.refresh();
      this.stamp('playlists');
    });
  }

  /** Re-fetch genres + follow state for every placed artist — Actions "Full re-scan". */
  async fullRescanArtists(): Promise<void> {
    await this.wrap(async () => {
      this._phase.set('artists');
      await this.globe.refreshArtistInfo();
      this.stamp('artists');
    });
  }

  // --- Domain steps (no re-entrancy management; run inside wrap()) ---

  private async doSyncLiked(force: boolean): Promise<void> {
    if (!this.globe.hasData() || (!force && this.isFresh('liked'))) {
      return;
    }
    this._phase.set('liked');
    try {
      const summary = await this.spotify.getLikedTracksSummary();
      const unchanged =
        summary.total === this.likedIndex.count() && summary.newest === this.likedIndex.newest();
      if (unchanged) {
        this.log.log('Liked Songs unchanged — nothing to fetch.');
      } else {
        await this.globe.recalculate(false);
      }
      this.stamp('liked');
    } catch {
      this.log.log('Could not check your Liked Songs.', 'error');
    }
  }

  private async doSyncPlaylists(force: boolean): Promise<void> {
    if (!this.globe.hasData() || (!force && this.isFresh('playlists'))) {
      return;
    }
    this._phase.set('playlists');
    try {
      await this.playlistIndex.sync();
      this.stamp('playlists');
    } catch {
      this.log.log('Could not check your playlists.', 'error');
    }
  }

  private async doSyncArtists(force: boolean): Promise<void> {
    if (!this.globe.hasData() || (!force && this.isFresh('artists'))) {
      return;
    }
    this._phase.set('artists');
    try {
      await this.globe.syncArtistInfo();
      this.stamp('artists');
    } catch {
      this.log.log('Could not refresh artist info.', 'error');
    }
  }

  // --- Internals ---

  /** Serialise every entry point through one in-flight guard; `boot` also raises the nav-lock. */
  private async wrap(fn: () => Promise<void>, boot = false): Promise<void> {
    if (this._running()) {
      return;
    }
    // A persisted cooldown means a data source (Spotify / Wikidata / MusicBrainz) has rate-limited us
    // and the ban is still open (it survives reloads). Firing a sync into it would only re-trip and
    // extend it — pause and tell the user. Checked across all hosts, since the sync drives all three.
    if (this.pauseIfLimited()) {
      return;
    }
    this._running.set(true);
    if (boot) {
      this._boot.set(true);
    }
    try {
      await fn();
    } finally {
      this._phase.set('idle');
      this._boot.set(false);
      this._running.set(false);
    }
  }

  /**
   * If any data source has an open 429 cooldown, surface it once and return true so the caller
   * bails out. Between boot steps this matters for more than politeness: a step whose host is banned
   * would otherwise enter {@link RateLimitGate.acquire}, which does not fail fast — it loops on
   * `delay()` until the cooldown lifts (minutes), holding the blocking overlay + nav-lock the whole
   * time. Skipping the remaining steps keeps the app responsive; the next reconcile picks them up.
   */
  private pauseIfLimited(): boolean {
    const waitMs = this.limits.maxRetryAfterMs();
    if (waitMs <= 0) {
      return false;
    }
    const mins = Math.ceil(waitMs / 60_000);
    this.log.log(
      `A music data source is rate-limiting the app — paused for about ${mins} min.`,
      'error',
    );
    this.toast.error(`The app is being rate-limited. Please try again in about ${mins} min.`);
    return true;
  }

  private isFresh(domain: SyncDomain): boolean {
    const at = this.state[domain].lastSyncedAt;
    return at !== null && Date.now() - at < STALE_MS;
  }

  private stamp(domain: SyncDomain): void {
    this.state = { ...this.state, [domain]: { lastSyncedAt: Date.now() } };
    this.cache.save(this.state);
    this._state.set(this.state);
  }
}

/** Human phase label for the blocking overlay. */
export const PHASE_LABEL: Record<SyncPhase, string> = {
  idle: '',
  liked: 'Checking your Liked Songs…',
  playlists: 'Checking your playlists…',
  artists: 'Refreshing artist details…',
};
```

### `src/app/core/pipeline/boot-sync-guard.ts`
```ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { BootSync } from './boot-sync';

/**
 * Blocks navigation between the main pages while the boot sync is reconciling — page switching is
 * locked (alongside the shell's overlay + the header's disabled nav) only for as long as a diff
 * actually runs. Returning the current URL (false) leaves the user where they are instead of
 * bouncing them to a fallback route.
 */
export const bootSyncGuard: CanActivateFn = () => !inject(BootSync).busy();
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — `BootSync` resolves
      `globe.recalculate` / `refreshArtistInfo` / `syncArtistInfo` (step 04), `playlistIndex.sync`/`refresh`
      (step 03), `likedIndex.count`/`newest` (M3), and `spotify.getLikedTracksSummary` (M2).
- [ ] Not yet triggered by anything (app root wires it in step 14) — its behaviour is proven end-to-end in
      [step 15](15_verify.md): a warm reopen logs `Liked Songs unchanged — nothing to fetch.` and makes no
      network calls.

## If it breaks
- **`Property 'getLikedTracksSummary' does not exist`** → it's the M2 `SpotifyApi` method (added with the
  liked-summary call); if missing, your M2 client is stale.
- **Circular import warning (boot-sync ↔ globe-store)** → expected and fine — both are `providedIn:'root'`
  singletons; Angular's DI resolves lazily. Don't try to break it by moving types around.
- **Boot never skips fresh domains** → `isFresh` reads `this.state` (the plain field loaded once in the
  constructor), not `_state()`; the field is the source of truth, the signal is only for the UI labels.
