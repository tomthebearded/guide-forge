# M5 · Step 06 of 10 — `GlobeStore`, the orchestrator
> Nav: [← Persistence + log](05_persistence-and-log.md) · [Overview](00_overview.md) · [Heat ramp →](07_heat-ramp.md)

## Glossary for this step
> **orchestrator store** — the one root-singleton service that owns the whole Liked-Songs → country dataset:
> it pages tracks, dedupes artists, drives the two resolvers, aggregates per-country heat, publishes readonly
> signals, and persists. The page is dumb; this holds the logic.
> **working set** — the mutable `Map<artistId, ArtistOrigin>` the scan mutates in place. It's snapshotted into
> a signal on *publish* so the UI churns at a controlled rate, not on every mutation.
> **idle-wait** — a worker whose queue is momentarily empty `await delay(…)`s and loops instead of exiting,
> because more work may still stream in. It's how the fast/slow passes run *while* pages are still arriving.

## Why / design
This is the milestone's centre. It wires everything from Sittings 1–2 into one flow. Four ideas make it work;
understand them before the code:

**1. Accumulate by primary artist.** Only a track's **primary** artist (Spotify lists it first) counts toward
the globe. As each track streams in, `accumulate()` upserts that artist in the working set — `+1 trackCount`,
`+durationMs` — and, for a brand-new artist, enqueues its id for resolution. The same pass feeds M3's
`LikedIndex`, so Library and Globe share one `/me/tracks` scan
([D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles)).

**2. Fast + slow workers run concurrently, while paging.** A full scan is *long* (Spotify's gate paces paging
to well under 1 req/s), so we can't wait until the whole library is paged to start resolving. Instead:
`Promise.all([fastWorker(), slowWorker()])` starts **before** the paging loop. The `streaming` flag is `true`
while pages arrive; when a worker's queue drains but `streaming` is still `true`, it **idle-waits** (`await
delay(WORKER_IDLE_MS)`) and loops instead of finishing. Paging flips `streaming = false` in its `finally`, and
`await resolveAll` then lets the workers drain the tail and exit.

> 📚 Mental model — **the fast/slow handoff.** `fastWorker` splices up to 50 ids off `fastQueue`, resolves them
> in one Wikidata batch, and for each miss **enqueues the id onto `slowQueue`**. `slowWorker` drains `slowQueue`
> one name at a time via MusicBrainz. `slowWorker` only stops once `fastDone` is set (so it can't exit while the
> fast pass is still feeding it). This is why step 03's "never throws" rule is load-bearing: a rejection in
> either worker would reject `resolveAll` and abort the scan.

**3. Throttled publish (~5 paints/s).** The fast worker can place dozens of artists per second. If every
mutation snapshotted the working set into the signal, the globe would recompute its aggregates and repaint
dozens of times a second. `publishProgress()` coalesces to at most one paint per `PUBLISH_THROTTLE_MS` (200 ms)
*while streaming*; the scan's `finally` calls `publish()` directly to flush the final state so no update is
dropped.

**4. Debounced save, restore-first.** Mutations schedule a debounced `save()` (500 ms) so a burst of placements
is one write, not hundreds. `restore()` loads the persisted snapshot straight into the working set and publishes
— **no network** — so a reload shows the coloured globe instantly.

**Scope note — this is the M5 intermediate.** The genre worker, follow-state sweep, playlist sync, manual
`setCountry`, and the temporal/genre aggregation passes are **not** here. Their hook points are marked
`// grows in M6/M9`. The aggregation below is the simple artist-level sum; the filter-aware version arrives in M9.

## Do this
1. In `src/app/features/globe/`, create `globe-store.ts` with the complete code below.
2. It injects the pieces you built: `SpotifyApi` (M3), `ArtistResolution` (step 03), `OriginsCache` (step 05),
   `LikedIndex` (M3), `LogStore` (step 05), plus `delay` (M2).
3. The public **signals** are load-bearing by name, but not all are consumed in M5. The **M5 page binds eight**
   (step 09): `heat`, `total`, `resolvedCount`, `failedCount`, `pendingCount`, `hasData`, `isResolving`,
   `dateRange`. The remaining aggregates — `maxHeat`, `artistsByCountry`, `tracksByCountry`,
   `durationByCountry`, `unplaced`, `phase`, `computedAt`, `artists` — are **forward-looking**: they're built
   now (the store is the single source) but not consumed in M5. In particular `maxHeat` is **not** read by the
   canvas here — the renderer's own `applyHeat` (step 08) computes its ramp from an internal `maxWeight`;
   `maxHeat` is first read by the heat-legend max in M6. The hover panel, filters, and library read the rest
   from M6 on. The public **methods** are `restore()`, `recalculate(fullRescan?)`, `clearData()`, `countryOf(id)`.
4. `RESOLVE_BATCH_SIZE = 50` (bounds the Wikidata query), `WORKER_IDLE_MS = 120`, `PUBLISH_THROTTLE_MS = 200`,
   `SAVE_DEBOUNCE_MS = 500` are the tuning constants (illustrative values from the source; the *mechanism* is
   what matters).

## Code
### `src/app/features/globe/globe-store.ts`
```ts
import { computed, inject, Injectable, signal } from '@angular/core';

import { SpotifyApi } from '../../core/api/spotify-api';
import { OriginsCache } from '../../core/cache/origins-cache';
import { LogStore } from '../../core/logging/log-store';
import { ArtistRef } from '../../core/models/artist';
import { ArtistOrigin } from '../../core/models/artist-origin';
import { OriginsSnapshot } from '../../core/models/origins-snapshot';
import { ArtistResolution } from '../../core/pipeline/artist-resolution';
import { LikedIndex } from '../../core/pipeline/liked-index';
import { delay } from '../../core/util/delay';

const SAVE_DEBOUNCE_MS = 500;
const WORKER_IDLE_MS = 120;
/**
 * Min gap between globe repaints while a scan streams. The fast worker resolves 50 artists per
 * Wikidata round-trip with no throttle, so it would otherwise snapshot the working set into the
 * signal (and recompute every aggregate + repaint the canvas) dozens of times a second. Coalescing
 * to ~5 paints/s keeps progress visible without the recompute storm; the final state is flushed
 * explicitly when the scan ends.
 */
const PUBLISH_THROTTLE_MS = 200;
/** Artists resolved per fast Wikidata request — bounds query URL size and server-side cost. */
const RESOLVE_BATCH_SIZE = 50;

/** Kept for the page's view switching; the Liked-Songs source stays on 'globe' throughout M5. */
export type GlobePhase = 'scanning' | 'placing' | 'globe';

/**
 * Owns the **Liked Songs → country** dataset for the globe. Pages `/me/tracks` newest-first,
 * dedupes artists with a real per-artist liked-track count + Σ runtime, and resolves countries via
 * Wikidata-by-Spotify-id (with a MusicBrainz-by-name fallback), recolouring live. Persists the whole
 * dataset so a reload restores instantly with no refetch.
 */
@Injectable({ providedIn: 'root' })
export class GlobeStore {
  private readonly spotify = inject(SpotifyApi);
  private readonly resolution = inject(ArtistResolution);
  private readonly cache = inject(OriginsCache);
  private readonly likedIndex = inject(LikedIndex);
  private readonly log = inject(LogStore);

  /** Mutable working set; snapshotted into the signal on publish() to bound signal churn. */
  private working = new Map<string, ArtistOrigin>();
  /** artistId → manually assigned country, sticky across reloads. Populated by restore(); the
   * setCountry() write path + fixup UI grow in M6. */
  private readonly manualOverrides = new Map<string, string>();
  /** artistId → country auto-resolved by a previous scan, reused by a full rescan to skip re-resolving. */
  private reuseOrigins = new Map<string, string>();
  private readonly fastQueue: string[] = [];
  private readonly fastQueued = new Set<string>();
  private readonly slowQueue: string[] = [];
  private readonly slowQueued = new Set<string>();
  private fastDone = false;
  /** True while pages are still streaming in, so the fast worker idle-waits instead of exiting. */
  private streaming = false;
  private saveTimer?: ReturnType<typeof setTimeout>;
  /** Set once a snapshot save is rejected (e.g. quota), to avoid re-warning on every debounce. */
  private saveFailed = false;
  private publishTimer?: ReturnType<typeof setTimeout>;

  private readonly _artists = signal<ReadonlyMap<string, ArtistOrigin>>(new Map());
  private readonly _computedAt = signal<number | null>(null);
  private readonly _oldest = signal<string | null>(null);
  private readonly _newest = signal<string | null>(null);
  private readonly _phase = signal<GlobePhase>('globe');
  private readonly _resolving = signal(false);

  readonly artists = computed(() => [...this._artists().values()]);
  readonly total = computed(() => this._artists().size);
  readonly resolvedCount = computed(
    () => this.artists().filter((a) => a.countryCode !== null).length,
  );
  readonly failedCount = computed(() => this.artists().filter((a) => a.failed).length);
  readonly pendingCount = computed(() => this.artists().filter((a) => !a.tried).length);
  readonly phase = this._phase.asReadonly();
  readonly isResolving = this._resolving.asReadonly();
  readonly hasData = computed(() => this.total() > 0);
  readonly computedAt = this._computedAt.asReadonly();
  /** Oldest / newest liked-song dates spanned by the dataset — surfaced in the HUD. */
  readonly dateRange = computed(() => ({ oldest: this._oldest(), newest: this._newest() }));

  /** Resolved artists where the country couldn't be found — count only in M5; fixup UI is M6. */
  readonly unplaced = computed(() =>
    this.artists()
      .filter((a) => a.failed && !a.hidden)
      .sort((a, b) => b.trackCount - a.trackCount),
  );

  /**
   * The single source of the three per-country aggregates, so the globe heat and (later) the legend
   * and leaderboards all agree. Sums each placed artist's lifetime totals. The genre + temporal
   * (as-of-month / release-era) filter-aware passes grow in M9.
   */
  private readonly aggregates = computed<{
    tracks: Map<string, number>;
    duration: Map<string, number>;
    artists: Map<string, ArtistOrigin[]>;
  }>(() => {
    const artists = this._artists();
    const tracks = new Map<string, number>();
    const duration = new Map<string, number>();
    const byCountry = new Map<string, ArtistOrigin[]>();

    for (const artist of artists.values()) {
      if (artist.countryCode === null) {
        continue;
      }
      addTo(tracks, artist.countryCode, artist.trackCount);
      addTo(duration, artist.countryCode, artist.durationMs);
      pushTo(byCountry, artist.countryCode, artist);
    }

    for (const list of byCountry.values()) {
      list.sort((a, b) => b.trackCount - a.trackCount);
    }
    return { tracks, duration, artists: byCountry };
  });

  /** Resolved artists grouped by country (ISO alpha-2), each list sorted by trackCount desc. */
  readonly artistsByCountry = computed(() => this.aggregates().artists);

  /** Σ liked-track count per country — the heat metric and (later) the tracks leaderboard. */
  readonly tracksByCountry = computed(() => this.aggregates().tracks);

  /** Σ liked-track runtime (ms) per country — powers the listening-hours stat. */
  readonly durationByCountry = computed(() => this.aggregates().duration);

  /** Heat per country, keyed by ISO 3166-1 alpha-2 — Σ liked-track count. */
  readonly heat = this.tracksByCountry;

  /** The busiest country's value — the hot end of the legend's scale. */
  readonly maxHeat = computed(() => {
    let max = 0;
    for (const weight of this.heat().values()) {
      if (weight > max) {
        max = weight;
      }
    }
    return max;
  });

  /** Resolved ISO alpha-2 for a Spotify artist id from the current dataset, else null. */
  countryOf(artistId: string): string | null {
    return this._artists().get(artistId)?.countryCode ?? null;
  }

  /** Hydrate the saved dataset from localStorage straight into the globe view. No network. */
  restore(): void {
    const snapshot = this.cache.load();
    if (snapshot === null) {
      return;
    }
    this.working = new Map(snapshot.artists.map((artist) => [artist.id, { ...artist }]));
    for (const artist of this.working.values()) {
      if (artist.manual && artist.countryCode !== null) {
        this.manualOverrides.set(artist.id, artist.countryCode);
      }
    }
    this._computedAt.set(snapshot.computedAt);
    this._oldest.set(snapshot.oldest);
    this._newest.set(snapshot.newest);
    this.publish();
  }

  /**
   * Refresh the dataset. `fullRescan` (or having no data) re-pages the entire library and retries
   * every unresolved artist, while reusing countries already resolved by a previous scan so only new
   * or previously-failed artists hit the network; otherwise an incremental pass fetches only likes
   * newer than the last scan. Runs in the background; `isResolving` reflects progress.
   */
  async recalculate(fullRescan = false): Promise<void> {
    if (this._resolving()) {
      return;
    }
    // A rate-limit cooldown pre-check ("try again in N min") is added alongside richer sync in M9.
    if (fullRescan || !this.hasData()) {
      await this.load();
    } else {
      await this.incremental();
    }
  }

  /** Wipe persisted + in-memory data (e.g. before a fresh run). */
  clearData(): void {
    this.cache.clear();
    this.likedIndex.clear();
    this.working = new Map();
    this.manualOverrides.clear();
    this.resetQueues();
    this._computedAt.set(null);
    this._oldest.set(null);
    this._newest.set(null);
    this.publish();
  }

  /** Full scan: re-page the whole library from scratch, then resolve every artist's country. */
  private async load(): Promise<void> {
    this.log.clear();
    this.log.log('Starting a full scan of your Liked Songs…');
    // Carry over auto-resolved countries from the previous scan so re-paging the library (to pick up
    // added/removed likes) doesn't re-resolve artists we already placed. Manual fixups ride along via
    // `manualOverrides`; previously-failed artists are left out so the rescan retries them.
    this.reuseOrigins = new Map(
      [...this.working.values()]
        .filter((a) => a.countryCode !== null && !a.manual)
        .map((a) => [a.id, a.countryCode as string]),
    );
    this.working = new Map();
    this.resetQueues();
    this.likedIndex.beginFull();
    this._oldest.set(null);
    this._newest.set(null);
    this.publish();

    this._resolving.set(true);
    this.streaming = true;
    // Resolve countries + paint the globe as pages stream in, rather than after the whole library
    // is paged — a full scan is long, so progress must be visible from the first page.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker()]);
    try {
      let oldest: string | null = null;
      let newest: string | null = null;
      let tracks = 0;
      for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          if (oldest === null || track.addedAt < oldest) {
            oldest = track.addedAt;
          }
          if (newest === null || track.addedAt > newest) {
            newest = track.addedAt;
          }
          this.likedIndex.add(track);
          // Only the primary (main) artist counts toward the globe; Spotify lists them first.
          const main = track.artists[0];
          if (main !== undefined) {
            this.accumulate(main, track.durationMs);
          }
        }
        tracks += page.length;
        // Commit the watermarks per page so a mid-stream failure still persists scan progress
        // (otherwise newest stays null and every later recalculate falls back to a full rescan).
        this._oldest.set(oldest);
        this._newest.set(newest);
        this.likedIndex.commit(newest);
        this.publishProgress();
        this.log.log(`Fetched ${tracks} liked songs · ${this.working.size} artists so far`);
      }
    } catch {
      this.log.log('Could not load your Liked Songs from Spotify.', 'error');
    } finally {
      // Signal the workers no more artists are coming, then let them drain what's queued.
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.reuseOrigins = new Map();
      this.save();
    }
  }

  /** Incremental pass: page only likes newer than the last scan, then resolve the new artists. */
  private async incremental(): Promise<void> {
    const since = this._newest();
    if (since === null) {
      await this.load();
      return;
    }
    this.resetQueues();
    this.likedIndex.beginIncremental();
    this.log.clear();
    this.log.log('Checking Spotify for new favourites…');

    this._resolving.set(true);
    this.streaming = true;
    // Resolve + paint as new likes stream in (see load()); workers idle until pages arrive.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker()]);
    try {
      let newest = since;
      let added = 0;
      pages: for await (const page of this.spotify.streamLikedTracks()) {
        for (const track of page) {
          // Newest-first: once we reach the last scan's frontier, everything older is known.
          if (track.addedAt <= since) {
            break pages;
          }
          if (track.addedAt > newest) {
            newest = track.addedAt;
          }
          this.likedIndex.add(track);
          added += 1;
          // Only the primary (main) artist counts toward the globe; Spotify lists them first.
          const main = track.artists[0];
          if (main !== undefined) {
            this.accumulate(main, track.durationMs);
          }
        }
        // Advance the watermark per page so a mid-stream failure keeps the progress made so far.
        this._newest.set(newest);
        this.likedIndex.commit(newest);
        this.publishProgress();
        this.log.log(`Found ${added} new liked songs so far`);
      }
      // Covers the case where the frontier is reached on the first page (no per-page set ran).
      this._newest.set(newest);
      this.likedIndex.commit(newest);
      this.log.log(
        added === 0 ? 'No new liked songs since the last scan.' : `${added} new liked songs`,
      );
      // Retry previously-unresolved artists alongside any newly discovered ones. Done while still
      // streaming=true so the workers can't drain-and-exit before these are enqueued.
      let retried = 0;
      for (const artist of this.working.values()) {
        if (artist.failed && !artist.manual) {
          artist.tried = false;
          artist.failed = false;
          this.enqueueFast(artist.id);
          retried += 1;
        }
      }
      if (retried > 0) {
        this.log.log(`Retrying ${retried} previously unplaced artists`);
      }
      this.publishProgress();
    } catch {
      this.log.log('Could not fetch new favourites.', 'error');
    } finally {
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.save();
    }
  }

  /** Fast pass: drains the fast queue in batches via Wikidata-by-Spotify-id; misses → slow queue. */
  private async fastWorker(): Promise<void> {
    for (;;) {
      const batch = this.fastQueue.splice(0, RESOLVE_BATCH_SIZE);
      if (batch.length === 0) {
        // Empty queue: keep waiting while pages are still arriving; only stop once paging is done.
        if (this.streaming) {
          await delay(WORKER_IDLE_MS);
          continue;
        }
        break;
      }
      const results = await this.resolution.resolveBatchBySpotifyId(batch);
      let placed = 0;
      for (const id of batch) {
        const artist = this.working.get(id);
        if (artist === undefined || artist.manual || artist.tried) {
          continue;
        }
        const code = results.get(id) ?? null;
        if (code !== null) {
          artist.countryCode = code;
          artist.tried = true;
          artist.failed = false;
          placed += 1;
        } else {
          this.enqueueSlow(id);
        }
      }
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        `Wikidata: placed ${placed} of ${batch.length} artists`,
        placed > 0 ? 'success' : 'info',
      );
    }
    this.fastDone = true;
  }

  /** Slow pass: per-artist MusicBrainz fallback for the fast-pass misses. */
  private async slowWorker(): Promise<void> {
    for (;;) {
      const id = this.slowQueue.shift();
      if (id === undefined) {
        // Nothing queued: exit only once the fast pass is done feeding this queue; else idle-wait.
        if (this.fastDone) {
          break;
        }
        await delay(WORKER_IDLE_MS);
        continue;
      }
      const artist = this.working.get(id);
      if (artist === undefined || artist.manual || artist.tried) {
        continue;
      }
      const code = await this.resolution.resolveByName(artist.name);
      artist.tried = true;
      artist.countryCode = code;
      artist.failed = code === null;
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        code !== null ? `MusicBrainz: ${artist.name} → ${code}` : `Couldn't place ${artist.name}`,
        code !== null ? 'success' : 'warn',
      );
    }
  }

  /** Count one liked-track appearance for an artist (new or existing), summing its runtime. */
  private accumulate(ref: ArtistRef, durationMs: number): void {
    const existing = this.working.get(ref.id);
    if (existing !== undefined) {
      existing.trackCount += 1;
      existing.durationMs += durationMs;
      return;
    }
    const manual = this.manualOverrides.get(ref.id) ?? null;
    // A manual fixup wins; otherwise reuse a country resolved by a previous scan (full-rescan only).
    const known = manual ?? this.reuseOrigins.get(ref.id) ?? null;
    this.working.set(ref.id, {
      id: ref.id,
      name: ref.name,
      trackCount: 1,
      durationMs,
      countryCode: known,
      tried: known !== null,
      failed: false,
      manual: manual !== null,
    });
    if (known === null) {
      this.enqueueFast(ref.id);
    }
  }

  private enqueueFast(id: string): void {
    if (!this.fastQueued.has(id)) {
      this.fastQueued.add(id);
      this.fastQueue.push(id);
    }
  }

  private enqueueSlow(id: string): void {
    if (!this.slowQueued.has(id)) {
      this.slowQueued.add(id);
      this.slowQueue.push(id);
    }
  }

  private resetQueues(): void {
    this.fastQueue.length = 0;
    this.slowQueue.length = 0;
    this.fastQueued.clear();
    this.slowQueued.clear();
    this.fastDone = false;
    this.streaming = false;
  }

  private publish(): void {
    clearTimeout(this.publishTimer);
    this.publishTimer = undefined;
    this._artists.set(new Map(this.working));
  }

  /**
   * Publish a mid-scan progress update, coalesced to at most one paint per {@link PUBLISH_THROTTLE_MS}
   * while streaming (outside a scan it publishes immediately). The scan's finally block flushes the
   * final state with a direct {@link publish}, so a pending throttle never drops the last update.
   */
  private publishProgress(): void {
    if (!this.streaming) {
      this.publish();
      return;
    }
    if (this.publishTimer !== undefined) {
      return; // a paint is already scheduled — this update rides along with it
    }
    this.publishTimer = setTimeout(() => {
      this.publishTimer = undefined;
      this._artists.set(new Map(this.working));
    }, PUBLISH_THROTTLE_MS);
  }

  private snapshot(): OriginsSnapshot {
    return {
      version: 2,
      computedAt: this._computedAt() ?? Date.now(),
      oldest: this._oldest(),
      newest: this._newest(),
      artists: [...this.working.values()],
    };
  }

  private saveDebounced(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), SAVE_DEBOUNCE_MS);
  }

  private save(): void {
    clearTimeout(this.saveTimer);
    if (!this.cache.save(this.snapshot()) && !this.saveFailed) {
      // Warn once per session so a full localStorage doesn't spam on every debounced save.
      this.saveFailed = true;
      this.log.log('Could not save your globe data — browser storage may be full.', 'error');
    }
  }
}

/** Add `value` to a country's running total in `map` (initialising the entry at 0). */
function addTo(map: Map<string, number>, code: string, value: number): void {
  map.set(code, (map.get(code) ?? 0) + value);
}

/** Append an artist to its country's list in `map` (initialising the list). */
function pushTo(map: Map<string, ArtistOrigin[]>, code: string, artist: ArtistOrigin): void {
  const list = map.get(code);
  if (list === undefined) {
    map.set(code, [artist]);
  } else {
    list.push(artist);
  }
}
```

## Done when (this step)
- [ ] `npm run build` is clean (no unused-symbol errors — every private field and method above is referenced).
      You can't drive it on screen until the page is wired (step 09); the full behavioural proof is the
      milestone gate. Type-check anchor: `store.heat()` is a `ReadonlyMap<string, number>` and
      `store.recalculate` returns `Promise<void>`.

## If it breaks
- **`'genreWorker'`/`'reuseGenres'`/`'setCountry'` referenced but not defined** → you pasted a line from the
  full source that belongs to M6/M9. The M5 store has no genre worker, follow sweep, or `setCountry`; remove
  the stray reference.
- **The scan never ends (spinner spins forever)** → a worker isn't exiting. `fastWorker` breaks only when
  `streaming` is `false`; `slowWorker` breaks only when `fastDone` is `true`. Confirm the paging loop's
  `finally` sets `this.streaming = false` **before** `await resolveAll`, and that `fastWorker` sets
  `this.fastDone = true` after its loop.
- **The globe repaints in bursts / stutters** → `publishProgress` isn't throttling. While `streaming`, it must
  early-return when `publishTimer` is already set; the final `publish()` in `finally` is what flushes the tail.
- **`ExpressionChanged…` or a signal-write-in-computed error** → you called a `_signal.set()` from inside a
  `computed`. The store only writes signals from methods (`load`/`incremental`/`publish`), never from a
  `computed` — keep it that way.
- **`build` fails: "Property 'clear' does not exist on type 'LikedIndex'"** → `clearData()` calls
  `this.likedIndex.clear()`, which is built in [M3 step 06](../MILESTONE_3_liked-songs-stream/06_liked-index.md#code).
  If it's missing, your M3 `LikedIndex` predates that method — re-paste the M3 file (it exposes `clear()`).

---
> Nav: [← Persistence + log](05_persistence-and-log.md) · [Overview](00_overview.md) · [Heat ramp →](07_heat-ramp.md)
