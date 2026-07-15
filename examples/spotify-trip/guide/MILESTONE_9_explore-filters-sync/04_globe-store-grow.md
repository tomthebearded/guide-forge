# M9 · Step 04 of 14 — Grow GlobeStore: genre worker, temporal pass, filters, artist-info sweeps
> Nav: [← The PlaylistIndex service](03_playlist-index.md) · [Overview](00_overview.md) · [Persist sync timestamps →](05_sync-state-cache.md)

This is the milestone's centrepiece. `GlobeStore` last changed in **M6** (M7/M8 didn't touch it). The M9
changes are large and interlocking, so the **complete M9 file** is below — paste it whole rather than patching
the M6 version by hand.

## Glossary for this step
> **fast (artist-level) pass** — the default aggregation: sum each *placed artist's* lifetime `trackCount` /
> `durationMs` into per-country totals. One pass over the artists map; no per-track detail.
> **per-track pass** — the aggregation used whenever a **temporal filter** is active: walk the persisted
> `LikedIndex` track-by-track, attribute each track to its primary artist's country, and apply the
> month/decade/genre filters *before* summing. It needs each track's `addedAt` / `releaseDate`, which the
> artist-level totals can't provide.
> **temporal filter** — an as-of month (timeline) and/or a release-decade set (era filter). Either one flips the
> store to the per-track pass.
> **genre worker** — a background loop that enriches placed artists with Spotify genre tags *during* the scan,
> draining a queue fed the instant each artist is placed — so the per-id fetches spread across the paging
> instead of bursting at the end.

## Why / design
Five capabilities land here, all on the one store so every view (heat, legend, leaderboards, hover) sees the
same filtered totals:

1. **The temporal aggregation swap.** `aggregates` is a computed that returns the **fast pass** normally, but
   defers to `perTrackAggregates` the moment `temporalActive()` is true. The two agree **exactly** with no
   temporal filter — the fast pass sums the same tracks the per-track pass would, just pre-aggregated per
   artist. That equivalence is a Done-when gate.
2. **The genre worker.** `genreWorker()` runs alongside the country workers, draining `genreQueue` (fed by
   `enqueueGenre` when an artist is placed) in batches that fan out per-id via `getArtistGenres`. A tail
   `loadGenres()` mops up any placed artist still missing tags after the scan.
3. **The filters.** `setGenre` / `setAsOfMonth` / `setEraDecades`, plus `availableGenres` / `timelineMonths` /
   `availableDecades` computed for the controls to bind.
4. **Incremental-vs-full recalculate** (kept from M6) now also **reuses genres** on a full rescan (so a rescan
   doesn't re-hit `/artists/{id}` for known artists) and gates on a **rate-limit cooldown pre-check** (don't
   launch a scan into an open 429 ban). Plus `recheckUnplaced()` re-resolves only the couldn't-place artists.
5. **Artist-info sweeps + playlist ride-along.** `syncArtistInfo()` (genres + follow state) and
   `refreshArtistInfo()` back boot-sync's "artists" domain; each scan ends by kicking `playlistIndex.sync()` so
   the membership index stays fresh without a separate pass.

**Kept exactly:** the M6 **heat-mode toggle** (tracks ↔ hours, [decision-log D8](../foundation/decision-log.md#d8--heat-mode-toggle-tracks--hours-added-as-a-small-guide-extension)) — `heat` stays a computed switching
between `tracksByCountry` and `durationByCountry` (both now filter-aware).

**Recurring model:** the store snapshots a mutable `working` map into a signal on `publish()` (bounding signal
churn); `publishProgress()` coalesces mid-scan paints; the single rate-limit gate is the only pacer.

**Deferred to M10:** the `following` / `genres` **read helpers** (`followingOf`, `genresOf`, `setFollowing`,
`setGenres`) the library list will use — M9 *populates* those fields via the sweeps but nothing reads them yet.

## Do this
1. Replace `src/app/features/globe/globe-store.ts` with the complete file below.
2. Confirm the three new injects resolve: `PlaylistIndex` (step 03), `RateLimiters` (M2), `Toast` (M1).
3. Note what did **not** change: the fast/slow country workers, `accumulate`, `publish`/`publishProgress`,
   `snapshot`/`save`, and the `restore`/`setCountry`/`hideUnplaced`/`clearData` shapes are the M6 logic plus the
   marked M9 additions (genre queue, reuse-genres, filter resets).

## Code
### `src/app/features/globe/globe-store.ts`
```ts
import { computed, inject, Injectable, signal } from '@angular/core';

import { RateLimiters } from '../../core/api/rate-limiters';
import { SpotifyApi } from '../../core/api/spotify-api';
import { OriginsCache } from '../../core/cache/origins-cache';
import { LogStore } from '../../core/logging/log-store';
import { ArtistRef } from '../../core/models/artist';
import { ArtistOrigin } from '../../core/models/artist-origin';
import { OriginsSnapshot } from '../../core/models/origins-snapshot';
import { ArtistResolution } from '../../core/pipeline/artist-resolution';
import { LikedIndex } from '../../core/pipeline/liked-index';
import { PlaylistIndex } from '../../core/pipeline/playlist-index';
import { delay } from '../../core/util/delay';
import { Toast } from '../../shared/toast';

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

/** Kept for the (now unused) scan experience; the Liked-Songs source stays on 'globe'. */
export type GlobePhase = 'scanning' | 'placing' | 'globe';

/** Which metric the globe heat encodes. Guide extension (M6, D8) — the source only uses 'tracks'. */
export type HeatMode = 'tracks' | 'hours';

/**
 * Owns the **Liked Songs → country** dataset for the globe. Pages `/me/tracks` newest-first,
 * dedupes artists with a real per-artist liked-track count + Σ runtime, and resolves countries via
 * Wikidata-by-Spotify-id (with a MusicBrainz-by-name fallback), recolouring live. A background genre
 * worker enriches placed artists with Spotify genre tags during the scan; the heat is filterable by
 * genre, release decade, and an as-of month (the last two swap in a per-track aggregation pass). The
 * heat metric switches between liked-track count and rounded listening hours (M6, D8); manual country
 * fixups are sticky. Persists the whole dataset so a reload restores instantly.
 */
@Injectable({ providedIn: 'root' })
export class GlobeStore {
  private readonly spotify = inject(SpotifyApi);
  private readonly resolution = inject(ArtistResolution);
  private readonly cache = inject(OriginsCache);
  private readonly likedIndex = inject(LikedIndex);
  private readonly playlistIndex = inject(PlaylistIndex);
  private readonly toast = inject(Toast);
  private readonly log = inject(LogStore);
  private readonly limits = inject(RateLimiters);

  /** Mutable working set; snapshotted into the signal on publish() to bound signal churn. */
  private working = new Map<string, ArtistOrigin>();
  /** artistId → manually assigned country, sticky across reloads. */
  private readonly manualOverrides = new Map<string, string>();
  /** artistId → country auto-resolved by a previous scan, reused by a full rescan to skip re-resolving. */
  private reuseOrigins = new Map<string, string>();
  /** artistId → genre tags from a previous scan, reused by a full rescan to skip re-fetching `/artists/{id}`. */
  private reuseGenres = new Map<string, string[]>();
  private readonly fastQueue: string[] = [];
  private readonly fastQueued = new Set<string>();
  private readonly slowQueue: string[] = [];
  private readonly slowQueued = new Set<string>();
  /** Placed artists awaiting genre enrichment — drained by the genre worker *during* the scan. */
  private readonly genreQueue: string[] = [];
  private readonly genreQueued = new Set<string>();
  private fastDone = false;
  private slowDone = false;
  /** True while pages are still streaming in, so the fast worker idle-waits instead of exiting. */
  private streaming = false;
  private saveTimer?: ReturnType<typeof setTimeout>;
  /** Set once a snapshot save is rejected (e.g. quota), to avoid re-toasting on every debounce. */
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
  /** Oldest / newest liked-song dates spanned by the dataset — surfaced in the Actions HUD. */
  readonly dateRange = computed(() => ({ oldest: this._oldest(), newest: this._newest() }));

  /** Resolved artists where the country couldn't be found — candidates for manual fixup. */
  readonly unplaced = computed(() =>
    this.artists()
      .filter((a) => a.failed && !a.hidden)
      .sort((a, b) => b.trackCount - a.trackCount),
  );

  /** Active genre tag the heat is filtered to, or null = all genres. */
  private readonly _genreFilter = signal<string | null>(null);
  readonly genreFilter = this._genreFilter.asReadonly();

  /**
   * Timeline scrubber cursor: `'YYYY-MM'` upper bound on liked-track `added_at`, or null = live
   * (whole library). When set, the heat replays how the map filled in *up to and including* that
   * month, so dragging it animates the globe colouring on.
   */
  private readonly _asOfMonth = signal<string | null>(null);
  readonly asOfMonth = this._asOfMonth.asReadonly();

  /**
   * Release-era filter: the set of decade-start years (e.g. 1990, 2000) the heat is restricted to by
   * *track release date*, or null = all eras. Recolours the globe by *when* the music was made.
   */
  private readonly _eraDecades = signal<ReadonlySet<number> | null>(null);
  readonly eraDecades = this._eraDecades.asReadonly();

  /** Whether any temporal filter is engaged — switches the aggregates to the per-track pass. */
  private readonly temporalActive = computed(
    () => this._asOfMonth() !== null || this._eraDecades() !== null,
  );

  /**
   * The single source of the three per-country aggregates, so every filter applies everywhere at
   * once (globe heat, legend, leaderboards, hover card). With no temporal filter this sums each
   * placed artist's lifetime totals (fast artist-level pass), narrowed by any genre filter. When a
   * timeline or release-era filter is active it defers to the {@link perTrackAggregates} pass, which
   * needs the individual liked tracks' `added_at` / `releaseDate` — the artist-level totals can't be
   * split by time. The two passes agree exactly when no temporal filter is set.
   */
  private readonly aggregates = computed<{
    tracks: Map<string, number>;
    duration: Map<string, number>;
    artists: Map<string, ArtistOrigin[]>;
  }>(() => {
    if (this.temporalActive()) {
      return this.perTrackAggregates();
    }
    const genre = this._genreFilter();
    const artists = this._artists();
    const tracks = new Map<string, number>();
    const duration = new Map<string, number>();
    const byCountry = new Map<string, ArtistOrigin[]>();

    const passesGenre = (artist: ArtistOrigin): boolean =>
      genre === null || (artist.genres ?? []).includes(genre);

    for (const artist of artists.values()) {
      if (artist.countryCode === null || !passesGenre(artist)) {
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

  /**
   * Per-track aggregation used whenever a temporal filter is active. Walks the persisted liked-track
   * index, attributing each track to its **primary** artist's resolved country (Spotify lists the
   * main artist first — same rule the scan uses), then applies the genre, `added_at`-month, and
   * release-decade filters before summing. Per-artist track counts / durations are recomputed from
   * the surviving tracks so the hover card and leaderboards match the filtered heat.
   */
  private readonly perTrackAggregates = computed<{
    tracks: Map<string, number>;
    duration: Map<string, number>;
    artists: Map<string, ArtistOrigin[]>;
  }>(() => {
    this.likedIndex.revision(); // recompute as the index changes
    const artists = this._artists();
    const genre = this._genreFilter();
    const asOf = this._asOfMonth();
    const decades = this._eraDecades();

    const tracks = new Map<string, number>();
    const duration = new Map<string, number>();
    // artistId → the artist plus its filtered running totals, so the lists show the narrowed counts.
    const perArtist = new Map<string, { artist: ArtistOrigin; count: number; duration: number }>();

    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      if (genre !== null && !(artist.genres ?? []).includes(genre)) {
        continue;
      }
      if (asOf !== null && track.addedAt.slice(0, 7) > asOf) {
        continue;
      }
      if (decades !== null) {
        const year = releaseYear(track.releaseDate);
        if (year === null || !decades.has(Math.floor(year / 10) * 10)) {
          continue;
        }
      }
      addTo(tracks, artist.countryCode, 1);
      addTo(duration, artist.countryCode, track.durationMs);
      const entry = perArtist.get(primaryId);
      if (entry === undefined) {
        perArtist.set(primaryId, { artist, count: 1, duration: track.durationMs });
      } else {
        entry.count += 1;
        entry.duration += track.durationMs;
      }
    }

    const byCountry = new Map<string, ArtistOrigin[]>();
    for (const { artist, count, duration: d } of perArtist.values()) {
      // Shallow clone carrying the filtered totals so hover/leaderboards agree with the heat.
      pushTo(byCountry, artist.countryCode as string, {
        ...artist,
        trackCount: count,
        durationMs: d,
      });
    }
    for (const list of byCountry.values()) {
      list.sort((a, b) => b.trackCount - a.trackCount);
    }
    return { tracks, duration, artists: byCountry };
  });

  /** Resolved artists grouped by country (ISO alpha-2), each list sorted by trackCount desc. */
  readonly artistsByCountry = computed(() => this.aggregates().artists);

  /** Σ liked-track count per country — the 'tracks' heat metric and the tracks leaderboard. */
  readonly tracksByCountry = computed(() => this.aggregates().tracks);

  /** Σ liked-track runtime (ms) per country — the 'hours' heat metric and the listening-hours stat. */
  readonly durationByCountry = computed(() => this.aggregates().duration);

  /**
   * Which metric colours the globe. Guide extension (M6, D8): the source hard-codes `heat =
   * tracksByCountry`. Both underlying maps are filter-aware (they come from {@link aggregates}), so
   * the genre / era / timeline filters apply in either mode.
   */
  private readonly _heatMode = signal<HeatMode>('tracks');
  readonly heatMode = this._heatMode.asReadonly();

  /** Heat per country (ISO alpha-2 → weight): liked-track count in 'tracks' mode, Σ ms in 'hours'. */
  readonly heat = computed(() =>
    this._heatMode() === 'hours' ? this.durationByCountry() : this.tracksByCountry(),
  );

  /** Set the heat metric (recolours the globe). */
  setHeatMode(mode: HeatMode): void {
    this._heatMode.set(mode);
  }

  /** Flip tracks ↔ hours. */
  toggleHeatMode(): void {
    this._heatMode.update((mode) => (mode === 'tracks' ? 'hours' : 'tracks'));
  }

  /**
   * Genre tags present across placed artists, most-common first, for the genre-filter picker.
   * Only artists with a resolved country count, since those are the ones that colour the globe.
   */
  readonly availableGenres = computed(() => {
    const counts = new Map<string, number>();
    for (const artist of this._artists().values()) {
      if (artist.countryCode === null) {
        continue;
      }
      for (const genre of artist.genres ?? []) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
  });

  /**
   * Distinct `'YYYY-MM'` months in which the user liked a track by a *placed* artist, oldest-first —
   * the discrete steps the timeline scrubber slides across. Only placed artists count, since they're
   * the ones that colour the globe as the map fills in.
   */
  readonly timelineMonths = computed(() => {
    this.likedIndex.revision();
    const artists = this._artists();
    const months = new Set<string>();
    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      months.add(track.addedAt.slice(0, 7));
    }
    return [...months].sort();
  });

  /**
   * Release decades present across placed artists' liked tracks (decade-start year + track count),
   * oldest-first — the chips for the release-era filter. Tracks with an unparseable release date are
   * skipped.
   */
  readonly availableDecades = computed(() => {
    this.likedIndex.revision();
    const artists = this._artists();
    const counts = new Map<number, number>();
    for (const track of this.likedIndex.all()) {
      const primaryId = track.artistIds[0];
      if (primaryId === undefined) {
        continue;
      }
      const artist = artists.get(primaryId);
      if (artist === undefined || artist.countryCode === null) {
        continue;
      }
      const year = releaseYear(track.releaseDate);
      if (year === null) {
        continue;
      }
      const decade = Math.floor(year / 10) * 10;
      counts.set(decade, (counts.get(decade) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([decade, count]) => ({ decade, count }));
  });

  /** Restrict the heat to a single genre tag; null clears it. */
  setGenre(genre: string | null): void {
    this._genreFilter.set(genre);
  }

  /** Replay the map's fill-in up to this `'YYYY-MM'` (inclusive); null returns to the live view. */
  setAsOfMonth(month: string | null): void {
    this._asOfMonth.set(month);
  }

  /** Restrict the heat to tracks released in these decades (decade-start years); null/empty clears it. */
  setEraDecades(decades: ReadonlySet<number> | null): void {
    this._eraDecades.set(decades === null || decades.size === 0 ? null : decades);
  }

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

  // The library-facing following/genres read + write helpers (followingOf, genresOf, setFollowing,
  // setGenres) land with the M10 library console. M9 only *populates* those fields (the sweeps below).
  // grows in M10

  /** Dismiss an artist from the "couldn't place" list (e.g. one that has no real country). */
  hideUnplaced(artistId: string): void {
    const artist = this.working.get(artistId);
    if (artist === undefined) {
      return;
    }
    artist.hidden = true;
    this.publish();
    this.saveDebounced();
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
   * every unresolved artist, while reusing countries + genres already resolved by a previous scan so
   * only new or previously-failed artists hit the network; otherwise an incremental pass fetches only
   * likes newer than the last scan. Runs in the background; `isResolving` reflects progress.
   */
  async recalculate(fullRescan = false): Promise<void> {
    if (this._resolving()) {
      return;
    }
    // Don't launch a scan into an open 429 cooldown (persisted, so it survives reloads): queueing
    // thousands of paced requests behind a multi-minute ban would just hang and re-trip it. Checked
    // across all hosts — a scan drives Spotify (paging) plus Wikidata + MusicBrainz (resolution).
    const waitMs = this.limits.maxRetryAfterMs();
    if (waitMs > 0) {
      const mins = Math.ceil(waitMs / 60_000);
      this.log.log(
        `A music data source is rate-limiting the app — try again in about ${mins} min.`,
        'error',
      );
      this.toast.error(`The app is being rate-limited. Please try again in about ${mins} min.`);
      return;
    }
    if (fullRescan || !this.hasData()) {
      await this.load();
    } else {
      await this.incremental();
    }
  }

  /**
   * Re-resolve only the artists whose country couldn't be found — no Spotify refetch. Runs in the
   * background; `isResolving` reflects progress.
   */
  async recheckUnplaced(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    const failed = [...this.working.values()].filter((a) => a.failed && !a.manual);
    if (failed.length === 0) {
      return;
    }
    this.resetQueues();
    for (const artist of failed) {
      artist.tried = false;
      artist.failed = false;
      this.enqueueFast(artist.id);
    }
    this.publish();
    this.log.clear();
    this.log.log(`Rechecking ${failed.length} unplaced artists…`);

    this._resolving.set(true);
    try {
      await Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed, ${this.failedCount()} still unplaced`,
        'success',
      );
    } catch {
      this.log.log('Could not recheck artists.', 'error');
      this.toast.error('Could not recheck artists. Please try again.');
    } finally {
      this._resolving.set(false);
      this.save();
    }
  }

  /**
   * Backfill artist metadata — Spotify genres + follow state — for placed artists still missing it.
   * Backs the boot sync's "artists" step and the Actions "Check for updates" for artists: cheap (zero
   * network) when nothing is missing. No-op while a scan is already running.
   */
  async syncArtistInfo(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    this._resolving.set(true);
    try {
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
    } finally {
      this._resolving.set(false);
      this.save();
    }
  }

  /**
   * Re-fetch genres + follow state for every placed artist from scratch — the Actions "Full re-scan"
   * for the artists domain — dropping the cached values first so they're all re-resolved.
   */
  async refreshArtistInfo(): Promise<void> {
    if (this._resolving()) {
      return;
    }
    for (const artist of this.working.values()) {
      if (artist.countryCode !== null) {
        artist.genres = undefined;
        artist.following = undefined;
      }
    }
    await this.syncArtistInfo();
  }

  /** Kept for the (now unused) scan experience's done callback. */
  showGlobe(): void {
    this._phase.set('globe');
  }

  /**
   * Manually assign a country to an artist; sticky across future runs. Works even for an artist not
   * yet in the globe dataset (e.g. opened from the library): a minimal entry is created so the choice
   * persists and shows up. `name` labels that new entry — ignored when the artist already exists.
   */
  setCountry(artistId: string, countryCode: string, name = ''): void {
    this.manualOverrides.set(artistId, countryCode);
    let artist = this.working.get(artistId);
    if (artist === undefined) {
      artist = {
        id: artistId,
        name,
        trackCount: 0,
        durationMs: 0,
        countryCode: null,
        tried: false,
        failed: false,
        manual: false,
      };
      this.working.set(artistId, artist);
    }
    artist.countryCode = countryCode;
    artist.manual = true;
    artist.tried = true;
    artist.failed = false;
    this.publish();
    this.save();
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
    // Clear heat filters so a stale genre/era/timeline choice can't blank the next dataset's globe.
    this._genreFilter.set(null);
    this._eraDecades.set(null);
    this._asOfMonth.set(null);
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
    // Genre tags are a stable per-artist fact; carry them over so a full rescan doesn't re-hit
    // `GET /artists/{id}` (no bulk endpoint since the Feb 2026 migration) for every known artist.
    this.reuseGenres = new Map(
      [...this.working.values()]
        .filter((a) => a.genres !== undefined)
        .map((a) => [a.id, a.genres as string[]]),
    );
    this.working = new Map();
    this.resetQueues();
    this.likedIndex.beginFull();
    this._oldest.set(null);
    this._newest.set(null);
    this.publish();

    this._resolving.set(true);
    this.streaming = true;
    // Resolve countries + genres + paint the globe as pages stream in, rather than after the whole
    // library is paged — a full scan is long, so progress must be visible from the first page.
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
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
      this.toast.error('Could not load your Liked Songs from Spotify. Please try again.');
    } finally {
      // Signal the workers no more artists are coming, then let them drain what's queued.
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      // Independent tail fetches (disjoint fields) — run together to halve the post-scan wait.
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.reuseOrigins = new Map();
      this.reuseGenres = new Map();
      this.save();
      this.syncPlaylists();
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
    const resolveAll = Promise.all([this.fastWorker(), this.slowWorker(), this.genreWorker()]);
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
      this.toast.error('Could not fetch new favourites. Please try again.');
    } finally {
      this.streaming = false;
      await resolveAll;
      this.publish(); // flush the final resolved state (clears any pending throttled paint)
      // Independent tail fetches (disjoint fields) — run together to halve the post-scan wait.
      await Promise.all([this.loadFollowing(), this.loadGenres()]);
      this._computedAt.set(Date.now());
      this.log.log(
        `Done — ${this.resolvedCount()} artists placed across ${this.heat().size} countries` +
          (this.failedCount() > 0 ? `, ${this.failedCount()} unplaced` : ''),
        'success',
      );
      this._resolving.set(false);
      this.save();
      this.syncPlaylists();
    }
  }

  /**
   * Keep the playlist-membership index fresh alongside the favourites scan, so the library tools
   * reflect playlist changes without a separate manual refresh. Runs after country resolution as a
   * background ride-along: it drives its own progress UI and never blocks or breaks the scan (the
   * favourites scan surfaces its own errors; a sync failure just leaves the last good index).
   */
  private syncPlaylists(): void {
    void this.playlistIndex.sync().catch(() => undefined);
  }

  /**
   * Bulk-resolve Spotify "is following" for every artist whose state is still unknown, then persist
   * it on the dataset. Run at the tail of each scan so the library list (M10) reads it straight from
   * cache. Non-fatal: on error (e.g. a token issued before the `user-follow-read` scope) the state
   * stays unknown and a later scan retries, so it never breaks the country scan it rides along with.
   */
  private async loadFollowing(): Promise<void> {
    const ids = [...this.working.values()]
      .filter((artist) => artist.following === undefined)
      .map((artist) => artist.id);
    if (ids.length === 0) {
      return;
    }
    try {
      const flags = await this.spotify.getFollowedArtistsContains(ids);
      ids.forEach((id, i) => {
        const artist = this.working.get(id);
        if (artist !== undefined) {
          artist.following = flags[i] ?? false;
        }
      });
      this.publish();
      this.log.log(`Loaded follow status for ${ids.length} artists`);
    } catch {
      // Leave following unknown — a later scan retries it.
    }
  }

  /**
   * Tail genre sweep for any placed artist still missing tags once the scan ends. The {@link
   * genreWorker} enriches artists live as they're placed, so this normally finds nothing — it only
   * mops up stragglers that never passed through the country workers (manual fixups, or a pre-genre
   * dataset being backfilled). Only placed artists are fetched, since unplaced ones never colour the
   * globe. Non-fatal: on error the tags stay unknown and a later scan retries.
   */
  private async loadGenres(): Promise<void> {
    const ids = [...this.working.values()]
      .filter((artist) => artist.genres === undefined && artist.countryCode !== null)
      .map((artist) => artist.id);
    if (ids.length === 0) {
      return;
    }
    try {
      this.log.log(`Fetching genres for ${ids.length} remaining artists…`);
      const genres = await this.spotify.getArtistGenres(ids, (done, total) => {
        if (done % RESOLVE_BATCH_SIZE === 0 && done !== total) {
          this.log.log(`Genres: ${done} / ${total} artists`);
        }
      });
      ids.forEach((id, i) => {
        const artist = this.working.get(id);
        const fetched = genres[i];
        // null/undefined = the per-artist fetch failed; leave genres undefined so a later sweep
        // retries it rather than persisting a transient failure as a permanent empty result.
        if (artist !== undefined && fetched != null) {
          artist.genres = fetched;
        }
      });
      this.publish();
      this.log.log(`Loaded genres for ${ids.length} artists`, 'success');
    } catch {
      // Leave genres unknown — a later scan retries them.
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
          this.enqueueGenre(id);
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
      if (code !== null) {
        this.enqueueGenre(id);
      }
      this.publishProgress();
      this.saveDebounced();
      this.log.log(
        code !== null ? `MusicBrainz: ${artist.name} → ${code}` : `Couldn't place ${artist.name}`,
        code !== null ? 'success' : 'warn',
      );
    }
    this.slowDone = true;
  }

  /**
   * Genre pass: runs *alongside* the country workers, draining artists queued the moment they're
   * placed and fetching their Spotify genre tags in batches (each batch fans out per-artist, since
   * the Feb 2026 migration removed the bulk `/artists?ids=`). Overlapping the genre fetch with the
   * rate-limited paging spreads those per-artist calls across the whole scan — gentler on Spotify's
   * limit than bursting them at the end, and it hides the wait behind paging. Idles while more
   * artists may still arrive (streaming, or the country workers aren't finished); exits once both are
   * done and the queue is empty. Non-fatal: {@link SpotifyApi.getArtistGenres} swallows per-id
   * errors, so it never rejects the scan.
   */
  private async genreWorker(): Promise<void> {
    for (;;) {
      const batch = this.genreQueue.splice(0, RESOLVE_BATCH_SIZE);
      if (batch.length === 0) {
        if (this.streaming || !this.fastDone || !this.slowDone) {
          await delay(WORKER_IDLE_MS);
          continue;
        }
        break;
      }
      const genres = await this.spotify.getArtistGenres(batch);
      batch.forEach((id, i) => {
        const artist = this.working.get(id);
        const fetched = genres[i];
        // Leave genres undefined on a failed fetch (null/undefined) so the tail sweep retries it,
        // instead of persisting a transient blip as a permanent "no genres".
        if (artist !== undefined && fetched != null) {
          artist.genres = fetched;
        }
      });
      this.publishProgress();
      this.saveDebounced();
      this.log.log(`Genres: fetched ${batch.length} artists`);
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
      // Reuse genres from a previous scan (full-rescan only) so loadGenres() skips re-fetching them.
      genres: this.reuseGenres.get(ref.id),
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

  /** Queue a just-placed artist for genre enrichment (skips ones whose genres are already known). */
  private enqueueGenre(id: string): void {
    if (this.working.get(id)?.genres !== undefined) {
      return;
    }
    if (!this.genreQueued.has(id)) {
      this.genreQueued.add(id);
      this.genreQueue.push(id);
    }
  }

  private resetQueues(): void {
    this.fastQueue.length = 0;
    this.slowQueue.length = 0;
    this.genreQueue.length = 0;
    this.fastQueued.clear();
    this.slowQueued.clear();
    this.genreQueued.clear();
    this.fastDone = false;
    this.slowDone = false;
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
      // Warn once per session so a full localStorage doesn't spam a toast on every debounced save.
      this.saveFailed = true;
      this.toast.error('Could not save your globe data — browser storage may be full.');
    }
  }
}

/** Leading 4-digit year of a Spotify release date (`YYYY` | `YYYY-MM` | `YYYY-MM-DD`), else null. */
function releaseYear(releaseDate: string): number | null {
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
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
- [ ] `npm run build` → `Application bundle generation complete`, no errors, no `any` — the store compiles with
      its three new injects.
- [ ] The globe still colours from restored data on reload (nothing regressed): serve, log in, open `/globe`
      with a prior scan → the map is coloured (the M9 store's `restore` + fast pass are unchanged from M6).
- [ ] Full end-to-end proof (filters recolour, per-track == fast pass, genres enrich live) is exercised once the
      controls (steps 07–11) and Actions scan (step 12) are wired — see [step 15](15_verify.md).

## If it breaks
- **`No provider for PlaylistIndex` / `RateLimiters` / `Toast`** → these are `providedIn: 'root'` (steps 03 /
  M2 / M1); confirm the imports point at `../../core/pipeline/playlist-index`, `../../core/api/rate-limiters`,
  `../../shared/toast`.
- **`Property 'all'`/`'revision'` does not exist on LikedIndex** → those were added in M3; if missing, your M3
  `liked-index.ts` is stale — the per-track pass needs both.
- **Heat toggle vanished / hours mode broken** → you pasted the source's `heat = this.tracksByCountry`; keep the
  **computed** `heat` + `_heatMode` (D8), or the M6/M8 hours toggle regresses.
- **Filtered leaderboards disagree with the heat** → the per-track pass must rebuild per-artist counts from the
  surviving tracks (the `perArtist` map); returning the unfiltered artist objects would desync the hover card.
