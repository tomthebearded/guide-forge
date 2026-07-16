# M5 · Verify — Country resolution + heat 🚦
> Nav: [← Wire the globe page](09_globe-page-wiring.md) · [Overview](00_overview.md) · [Hover/select panel + fixups →](../MILESTONE_6_hover-panel-fixups/00_overview.md)

This is the **reality-check gate**. Run the pre-flight quality bar, then work the gate by hand — and when it
passes, actually *use* the app for a minute before moving on.

## Done-when gate (the real test — check every box by hand)
Run `npm run format:check`, `npm run lint`, `npm run build` first — all clean (`Application bundle generation
complete`, no lint errors). Then `ng serve --host 127.0.0.1 --port 4200`, log in, open `/globe`:

- [ ] **Resolution streams as pages arrive.** Click **Load my music** → within the first page or two, countries
      fade from the muted "no data" slate onto a blue→warm ramp. The HUD's **Resolved** count climbs and
      **Pending** falls toward 0. In the Network panel: batched `GET https://query.wikidata.org/sparql?query=…`
      (fast pass) and, for the misses, individual `GET https://musicbrainz.org/ws/2/artist?query=…` (slow pass)
      — both visibly spaced by the rate-limit gate.
- [ ] **Neither pass stalls on a failure.** Toggle your network off for a few seconds mid-scan, then back on →
      an error line appears in the console log, but the scan keeps going and resolution resumes on the next
      page. **No** unhandled promise rejection appears in the console.
- [ ] **Counts visible + internally consistent.** After the scan settles the HUD reads e.g.
      `Resolved 412 · Unplaced 38 · Pending 0 · Artists 450`, with `Resolved + Unplaced = Artists`, plus a date
      range like `2019-04-12 → 2026-06-30`.
- [ ] **Persisted to `evm.origins`.** DevTools → Application → Local Storage → key `evm.origins` holds
      `{"version":2,"computedAt":<epoch ms>,"oldest":"…","newest":"…","artists":[…]}`, and `artists.length`
      equals the HUD's **Artists** count.
- [ ] **Reload restores instantly, no refetch.** Reload `/globe` → the coloured globe reappears immediately with
      the same counts, and the Network panel shows **no** `sparql`, `musicbrainz`, or `/me/tracks` request until
      you click **Recalculate**.
- [ ] **Deterministic tie-break (force a *fresh* resolve).** A plain **Recalculate** reuses already-resolved
      countries — it won't re-query Wikidata for an artist it's already placed, so on its own it proves
      persistence, not the `ORDER BY ?iso` tie-break. To exercise the tie-break: note a known multi-nationality
      artist's code, then in the console run `localStorage.removeItem('evm.origins')`, reload `/globe`, and run a
      full scan. The fresh resolve returns the **same** ISO —
      `JSON.parse(localStorage['evm.origins']).artists.find(a => a.name === 'Rihanna')?.countryCode` is `BB`
      (alphabetically before her other nationality `US`). Identical results across an independent re-resolution —
      for any multi-nationality artist — is the determinism proof.
- [ ] **Render loop stays signal-free.** DevTools → Performance, record ~3 s while the globe just spins → the
      flame chart shows `requestAnimationFrame`/three.js render work per frame but **no** Angular
      change-detection frames per animation frame.

## Files after this milestone (complete — the checkpoint)

### `src/app/core/dto/wikidata.dto.ts`
```ts
/** Minimal shape of a Wikidata SPARQL JSON result for our `?spotifyId`/`?iso` projection. */

export interface WikidataCountryBinding {
  spotifyId?: { value: string };
  iso?: { value: string };
}

export interface WikidataSparqlDto {
  results: { bindings: WikidataCountryBinding[] };
}
```

### `src/app/core/api/wikidata-api.ts`
```ts
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { WikidataSparqlDto } from '../dto/wikidata.dto';
import { withRetry } from '../pipeline/http-retry';

const SPARQL_HEADERS = new HttpHeaders({ Accept: 'application/sparql-results+json' });

/**
 * Resolves artists' countries from Wikidata in one query, keyed by their Spotify artist id (P1902):
 * preferring country of origin (P495) → formation-location country (P740→P17) → citizenship (P27),
 * mapped to an ISO 3166-1 alpha-2 code (P297). Every query is paced + 429-guarded by the shared
 * rate-limit interceptor (Wikidata gate), so overlapping callers never burst WDQS.
 *
 * Spotify IDs without a Wikidata link (or without a country there) simply don't appear in the
 * result; the caller treats their absence as "unresolved". Pass a bounded batch (≤ ~50) so the
 * query URL and server-side cost stay small.
 */
@Injectable({ providedIn: 'root' })
export class WikidataApi {
  private readonly http = inject(HttpClient);

  /** Map of Spotify artist id → ISO 3166-1 alpha-2, for the subset that resolved. */
  countriesBySpotifyIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) {
      return Promise.resolve(new Map());
    }
    return withRetry(() => this.query(ids));
  }

  /** Resolve a single country by MusicBrainz id (P434) — the fallback bridge from MusicBrainz. */
  countryByMbid(mbid: string): Promise<string | null> {
    return withRetry(() => this.queryByMbid(mbid));
  }

  private async query(ids: string[]): Promise<Map<string, string>> {
    // Spotify IDs are base-62 (no quotes/escaping needed), so direct interpolation is safe.
    const values = ids.map((id) => `"${id}"`).join(' ');
    const sparql = `SELECT ?spotifyId ?iso WHERE {
      VALUES ?spotifyId { ${values} }
      ?artist wdt:P1902 ?spotifyId.
      OPTIONAL { ?artist wdt:P495 ?origin. }
      OPTIONAL { ?artist wdt:P740 ?place. ?place wdt:P17 ?formed. }
      OPTIONAL { ?artist wdt:P27 ?citizen. }
      BIND(COALESCE(?origin, ?formed, ?citizen) AS ?country)
      ?country wdt:P297 ?iso.
    }
    ORDER BY ?spotifyId ?iso`;

    const params = new HttpParams().set('query', sparql).set('format', 'json');
    const dto = await firstValueFrom(
      this.http.get<WikidataSparqlDto>(environment.wikidata.sparqlUrl, {
        params,
        headers: SPARQL_HEADERS,
      }),
    );

    const countries = new Map<string, string>();
    for (const binding of dto.results.bindings) {
      const id = binding.spotifyId?.value;
      const iso = binding.iso?.value;
      // Keep the first row per id; ORDER BY ?iso makes that the alphabetically-first country, so an
      // artist with several origins/citizenships resolves to the same code on every run.
      if (id !== undefined && iso !== undefined && !countries.has(id)) {
        countries.set(id, iso);
      }
    }
    return countries;
  }

  private async queryByMbid(mbid: string): Promise<string | null> {
    // MBIDs are UUIDs (hex + hyphens), so direct interpolation is safe.
    const sparql = `SELECT ?iso WHERE {
      ?artist wdt:P434 "${mbid}".
      OPTIONAL { ?artist wdt:P495 ?origin. }
      OPTIONAL { ?artist wdt:P740 ?place. ?place wdt:P17 ?formed. }
      OPTIONAL { ?artist wdt:P27 ?citizen. }
      BIND(COALESCE(?origin, ?formed, ?citizen) AS ?country)
      ?country wdt:P297 ?iso.
    }
    ORDER BY ?iso
    LIMIT 1`;

    const params = new HttpParams().set('query', sparql).set('format', 'json');
    const dto = await firstValueFrom(
      this.http.get<WikidataSparqlDto>(environment.wikidata.sparqlUrl, {
        params,
        headers: SPARQL_HEADERS,
      }),
    );
    return dto.results.bindings[0]?.iso?.value ?? null;
  }
}
```

### `src/app/core/dto/musicbrainz.dto.ts`
```ts
/** Raw MusicBrainz `/ws/2/artist` search payloads (fmt=json). */

export interface MusicBrainzAreaDto {
  id: string;
  name: string;
  'iso-3166-1-codes'?: string[];
}

export interface MusicBrainzArtistDto {
  id: string;
  name: string;
  score: number;
  country?: string;
  area?: MusicBrainzAreaDto;
  'begin-area'?: MusicBrainzAreaDto;
}

export interface MusicBrainzSearchDto {
  artists: MusicBrainzArtistDto[];
}
```

### `src/app/core/mappers/musicbrainz.mapper.ts`
```ts
import { MusicBrainzArtistDto } from '../dto/musicbrainz.dto';

/** A MusicBrainz identity match: the MBID (links to Wikidata via P434) plus its country, if known. */
export interface MusicBrainzMatch {
  mbid: string;
  /** ISO 3166-1 alpha-2, or null when MusicBrainz has no area — Wikidata fills this in. */
  countryCode: string | null;
}

export function toMusicBrainzMatch(dto: MusicBrainzArtistDto): MusicBrainzMatch {
  return { mbid: dto.id, countryCode: countryFromArtist(dto) };
}

function countryFromArtist(dto: MusicBrainzArtistDto): string | null {
  return (
    dto.country ??
    dto.area?.['iso-3166-1-codes']?.[0] ??
    dto['begin-area']?.['iso-3166-1-codes']?.[0] ??
    null
  );
}
```

### `src/app/core/api/musicbrainz-api.ts`
```ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MusicBrainzSearchDto } from '../dto/musicbrainz.dto';
import { MusicBrainzMatch, toMusicBrainzMatch } from '../mappers/musicbrainz.mapper';
import { withRetry } from '../pipeline/http-retry';

/**
 * MusicBrainz artist search — the broad, name-based fallback when Wikidata's Spotify-id link is
 * missing. Paced to ≤1 req/s (MusicBrainz's ask for anonymous clients) and 429-guarded by the shared
 * rate-limit interceptor (MusicBrainz gate), and retried on transient errors. (The configured
 * User-Agent can't be set from the browser; the pacing is our compliance.)
 */
@Injectable({ providedIn: 'root' })
export class MusicBrainzApi {
  private readonly http = inject(HttpClient);

  searchArtist(name: string): Promise<MusicBrainzMatch | null> {
    return withRetry(() => this.search(name));
  }

  private async search(name: string): Promise<MusicBrainzMatch | null> {
    const params = new HttpParams()
      .set('query', escapeLucene(name))
      .set('fmt', 'json')
      .set('limit', 1);
    const dto = await firstValueFrom(
      this.http.get<MusicBrainzSearchDto>(`${environment.musicbrainz.apiBaseUrl}/artist`, {
        params,
      }),
    );
    const top = dto.artists[0];
    return top !== undefined ? toMusicBrainzMatch(top) : null;
  }
}

/**
 * Escape Lucene query syntax so artist names containing reserved characters resolve instead of
 * silently returning no match — e.g. "AC/DC" or names with ":", "+", "!", "(" would otherwise be
 * parsed as query operators. Each reserved character (and the `&`/`|` of `&&`/`||`) is backslashed.
 */
function escapeLucene(value: string): string {
  return value.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&');
}
```

### `src/app/core/pipeline/artist-resolution.ts`
```ts
import { inject, Injectable } from '@angular/core';

import { MusicBrainzApi } from '../api/musicbrainz-api';
import { WikidataApi } from '../api/wikidata-api';

/**
 * Resolves Spotify artists to ISO 3166-1 alpha-2 countries via a hybrid chain:
 *  - fast pass: `resolveBatchBySpotifyId` — one Wikidata query per batch keyed by Spotify id (P1902).
 *  - fallback:  `resolveByName` — MusicBrainz name search (its `area`, else its MBID → Wikidata P434).
 * Both never throw: transient failures resolve to null so one artist/batch never stalls the queue.
 */
@Injectable({ providedIn: 'root' })
export class ArtistResolution {
  private readonly wikidata = inject(WikidataApi);
  private readonly musicBrainz = inject(MusicBrainzApi);

  /** Fast batch pass. Returns a map covering every requested id (misses map to null). */
  async resolveBatchBySpotifyId(ids: string[]): Promise<Map<string, string | null>> {
    const resolved = new Map<string, string | null>(ids.map((id) => [id, null]));
    if (ids.length === 0) {
      return resolved;
    }
    try {
      const countries = await this.wikidata.countriesBySpotifyIds(ids);
      for (const [id, iso] of countries) {
        resolved.set(id, iso);
      }
    } catch {
      // Leave all entries null on a transient failure; the fallback pass will retry by name.
    }
    return resolved;
  }

  /** Slow per-artist fallback for the misses: MusicBrainz → its area, else its MBID → Wikidata. */
  async resolveByName(name: string): Promise<string | null> {
    try {
      const match = await this.musicBrainz.searchArtist(name);
      if (match === null) {
        return null;
      }
      if (match.countryCode !== null) {
        return match.countryCode;
      }
      return await this.wikidata.countryByMbid(match.mbid);
    } catch {
      return null;
    }
  }
}
```

### `src/app/core/models/artist-origin.ts`
```ts
/** A discovered artist plus its (possibly still pending) resolved origin. Reactive + persisted. */
export interface ArtistOrigin {
  id: string;
  name: string;
  /** Number of liked tracks featuring this artist — ordering + heat weight. */
  trackCount: number;
  /** Σ runtime (ms) of this artist's liked tracks — powers the listening-hours stat. */
  durationMs: number;
  /** ISO 3166-1 alpha-2, or null when unknown. */
  countryCode: string | null;
  /** Resolution has been attempted. */
  tried: boolean;
  /** Attempted but no country was found (or it errored) — surfaced for manual fixup. */
  failed: boolean;
  /** Country was set by the user; never overwritten by auto-resolution. Write path grows in M6. */
  manual: boolean;
  /** User dismissed this artist from the "couldn't place" list — kept out of it, persisted. Grows in M6. */
  hidden?: boolean;
  /** Whether the user follows this artist on Spotify — resolved during a scan. Grows in M9. */
  following?: boolean;
  /** Spotify genre tags — resolved during a scan; drives the globe genre filter. Grows in M9. */
  genres?: string[];
}
```

### `src/app/core/models/origins-snapshot.ts`
```ts
import { ArtistOrigin } from './artist-origin';

/** The whole persisted dataset — restored on load, saved as resolution progresses. */
export interface OriginsSnapshot {
  version: 2;
  /** Epoch ms of the last completed run. */
  computedAt: number;
  /** Oldest / newest Liked-Song `added_at` (ISO 8601) seen — drives the incremental cursor. */
  oldest: string | null;
  newest: string | null;
  artists: ArtistOrigin[];
}
```

### `src/app/core/cache/origins-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { OriginsSnapshot } from '../models/origins-snapshot';
import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.origins';
const VERSION = 2;

/** Persists the whole artist-origin dataset to localStorage so it restores instantly on reload. */
@Injectable({ providedIn: 'root' })
export class OriginsCache {
  load(): OriginsSnapshot | null {
    return readJson(STORAGE_KEY, (parsed) => (isSnapshot(parsed) ? parsed : undefined), null);
  }

  /** Persist the snapshot. Returns `false` if localStorage rejected it (e.g. quota exceeded). */
  save(snapshot: OriginsSnapshot): boolean {
    return writeJson(STORAGE_KEY, snapshot);
  }

  clear(): void {
    removeJson(STORAGE_KEY);
  }
}

function isSnapshot(value: unknown): value is OriginsSnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate['version'] === VERSION && Array.isArray(candidate['artists']);
}
```

### `src/app/core/logging/log-store.ts`
```ts
import { Injectable, signal } from '@angular/core';

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface LogEntry {
  readonly id: number;
  readonly level: LogLevel;
  readonly text: string;
}

/** Max lines kept in the live loading terminal; older lines scroll off the top. */
const MAX_ENTRIES = 250;

/**
 * A tiny append-only buffer of human-readable progress lines for the loading-terminal overlay. The
 * pipeline ({@link GlobeStore}) pushes a line whenever it finishes loading something; the overlay
 * renders them live. Transient by design — not persisted — it's a view of the current scan only.
 */
@Injectable({ providedIn: 'root' })
export class LogStore {
  private nextId = 0;
  private readonly _entries = signal<readonly LogEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  /** Append a line to the terminal (default level 'info'). */
  log(text: string, level: LogLevel = 'info'): void {
    this._entries.update((entries) => {
      const next = [...entries, { id: this.nextId++, level, text }];
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    });
  }

  /** Drop every line — called at the start of each scan so the terminal shows only the current run. */
  clear(): void {
    this._entries.set([]);
  }
}
```

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

### `src/app/features/globe/globe-renderer.ts` *(modified — heat ramp added to M4's renderer)*
```ts
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GeoFeature, isoA2, pickCountryCode } from '../../core/geo/geo-data';

/** three-globe renders the sphere at this radius; frame the camera + picking relative to it. */
const GLOBE_RADIUS = 100;
const INITIAL_DISTANCE = 320;
/** White, lerped into the hovered country's cap colour so it reads as highlighted. */
const HIGHLIGHT = new Color(0xffffff);

// Base globe colours. Ocean/stroke/atmosphere hardcoded since M4. The heat-ramp endpoints below are
// hardcoded for M5; live palette customization (reading them from user settings) is M11.
const OCEAN = '#112233';
const STROKE = '#9fe0cf';
const ATMOSPHERE = '#a9d4f0';
/** Heat-ramp endpoints: cold = fewest liked tracks, hot = the busiest country. */
const LAND_COLD = '#7fa8c9';
const LAND_HOT = '#ef9a8a';
/** Flat fill for countries with no liked artists — a muted "no data" tone, set apart from the ramp. */
const LAND_EMPTY = '#5a6672';
/** Where the single "sun" sits — a soft directional light so the sphere isn't flat. */
const SUN_POSITION = new Vector3(-200, 120, 220);

/**
 * Owns the three.js + three-globe scene for the country globe. Plain three.js with its own render
 * loop — it never touches signals / Angular change detection, which is what keeps the zoneless app
 * cheap. `init(host, features)` once; `applyHeat(map)` to recolour land by country weight;
 * `setHoverHandler` to be told which country is hovered; `dispose()` to tear down. (Flight + live
 * palette are added in later milestones.)
 */
export class GlobeRenderer {
  private readonly scene = new Scene();
  private renderer?: WebGLRenderer;
  private camera?: PerspectiveCamera;
  private controls?: OrbitControls;
  private globe?: ThreeGlobe;
  private resizeObserver?: ResizeObserver;
  private frameId = 0;

  private features: GeoFeature[] = [];

  // Heat state: the current per-country weights, the max (hot end of the scale), and the ramp colours.
  private readonly cold = new Color(LAND_COLD);
  private readonly hot = new Color(LAND_HOT);
  private readonly empty = new Color(LAND_EMPTY);
  private heat: ReadonlyMap<string, number> = new Map();
  private maxWeight = 0;

  private ambient?: AmbientLight;
  private sun?: DirectionalLight;

  // Hover picking: raycast the pointer against an invisible sphere, then point-in-polygon the hit.
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private pickSphere?: Mesh;
  private pendingPick = false;
  private hoveredCode: string | null = null;
  /** Last pointer position in canvas pixels — passed to the hover handler to anchor a card later. */
  private readonly pointerPx = { x: 0, y: 0 };
  private hoverHandler?: (code: string | null, x: number, y: number) => void;

  init(host: HTMLElement, features: GeoFeature[]): void {
    this.features = features;

    const { clientWidth: width, clientHeight: height } = host;
    // alpha: true → transparent background, so the page's space gradient shows through the canvas.
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    // Cap the device-pixel-ratio at 2: retina sharpness without rendering 3–4× the pixels on phones.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    host.appendChild(this.renderer.domElement);

    // FOV 50°, aspect from the host, near/far clip planes. Pull back so the whole globe is in frame.
    this.camera = new PerspectiveCamera(50, width / height, 0.1, 4000);
    this.camera.position.z = INITIAL_DISTANCE;

    // Studio lighting: bright ambient (flat, fully lit) + a soft directional sun for a little shape.
    this.ambient = new AmbientLight(0xffffff, 0.95);
    this.scene.add(this.ambient);
    this.sun = new DirectionalLight(0xffffff, 0.6);
    this.sun.position.copy(SUN_POSITION);
    this.scene.add(this.sun);

    this.globe = this.buildGlobe();
    this.globe.polygonsData(this.features);
    this.scene.add(this.globe);

    // Invisible sphere at the globe surface — the raycast target for hover picking.
    this.pickSphere = new Mesh(new SphereGeometry(GLOBE_RADIUS, 64, 64), new MeshBasicMaterial());
    this.pickSphere.visible = false;
    this.scene.add(this.pickSphere);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerleave', this.onPointerLeave);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // inertia: the globe glides to a stop after a drag
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.enablePan = false; // never slide the globe off-centre
    this.controls.minDistance = 160; // zoom clamps (relative to GLOBE_RADIUS = 100)
    this.controls.maxDistance = 600;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.12; // a slow idle spin

    this.observeResize(host);
    this.start();
  }

  /** Recolour countries from a heat map (ISO alpha-2 → weight). Safe to call repeatedly/live. */
  applyHeat(heat: ReadonlyMap<string, number>): void {
    this.heat = heat;
    this.maxWeight = heat.size > 0 ? Math.max(...heat.values()) : 0;
    this.globe?.polygonsData(this.features); // re-evaluates every cap colour
  }

  /**
   * Register a callback fired whenever the hovered country changes, with its ISO alpha-2 (or null)
   * and the pointer's canvas-pixel position so a page can anchor a hover card to the cursor.
   */
  setHoverHandler(handler: (code: string | null, x: number, y: number) => void): void {
    this.hoverHandler = handler;
  }

  dispose(): void {
    // 1. Stop the loop so no frame runs against a half-freed scene.
    cancelAnimationFrame(this.frameId);
    // 2. Stop observing resize, drop pointer + controls listeners, dispose the pick sphere's GPU mem.
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    if (this.pickSphere) {
      this.pickSphere.geometry.dispose();
      (this.pickSphere.material as MeshBasicMaterial).dispose();
    }
    // 3. Release the GPU: detach the canvas, dispose the renderer, force the WebGL context to close.
    //    Browsers allow only a handful of live contexts — skipping this leaks one per navigation and
    //    eventually throws "Too many active WebGL contexts".
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.renderer.domElement.removeEventListener('pointerleave', this.onPointerLeave);
      this.renderer.domElement.remove();
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }

  private buildGlobe(): ThreeGlobe {
    const globe = new ThreeGlobe()
      .showAtmosphere(true)
      .atmosphereColor(ATMOSPHERE)
      .atmosphereAltitude(0.16)
      .showGraticules(true) // the faint lat/long grid
      .polygonCapColor((feature) => this.capColor(feature as GeoFeature))
      .polygonSideColor(() => 'rgba(40, 60, 80, 0.5)')
      .polygonStrokeColor(() => STROKE)
      .polygonAltitude((feature) => this.capAltitude(feature as GeoFeature))
      // Short transition so the hover lift/whiten + heat recolour feel responsive (default is ~1s).
      .polygonsTransitionDuration(200);

    // A plain lit ocean sphere. (The source uses a cel-shaded toon material — cosmetic, trimmed here.)
    globe.globeMaterial(new MeshPhongMaterial({ color: new Color(OCEAN) }));
    return globe;
  }

  /** A country is "empty" (no liked artists) when its heat weight is zero/absent. */
  private isEmpty(code: string | null): boolean {
    return code === null || (this.heat.get(code) ?? 0) <= 0;
  }

  /** Cap (top face) colour per country: muted when empty, on the heat ramp otherwise, whitened on hover. */
  private capColor(feature: GeoFeature): string {
    const code = isoA2(feature.properties);
    const color = this.isEmpty(code) ? this.empty.clone() : this.weightColor(code);
    if (code !== null && code === this.hoveredCode) {
      color.lerp(HIGHLIGHT, 0.5);
    }
    return color.getStyle();
  }

  /** Heat colour for a country, as a fresh Color (caller may mutate it). */
  private weightColor(code: string | null): Color {
    const weight = code !== null ? (this.heat.get(code) ?? 0) : 0;
    if (weight <= 0 || this.maxWeight <= 0) {
      return this.cold.clone();
    }
    // sqrt spreads the ramp so a few dominant countries don't wash out the rest.
    const intensity = Math.sqrt(weight / this.maxWeight);
    // Interpolate cold → hot in HSL so the two endpoints yield a vivid ramp
    // (a straight RGB lerp would pass through a muddy grey mid-tone).
    return this.cold.clone().lerpHSL(this.hot, intensity);
  }

  /** Lift the hovered country slightly off the sphere so it reads as raised. */
  private capAltitude(feature: GeoFeature): number {
    const code = isoA2(feature.properties);
    return code !== null && code === this.hoveredCode ? 0.03 : 0.006;
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.renderer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerPx.x = event.clientX - rect.left;
    this.pointerPx.y = event.clientY - rect.top;
    // Canvas pixels → normalized device coordinates (−1…+1), y flipped (screen y grows downward).
    this.pointer.x = (this.pointerPx.x / rect.width) * 2 - 1;
    this.pointer.y = -(this.pointerPx.y / rect.height) * 2 + 1;
    this.pendingPick = true; // resolved in the render loop to throttle to frame rate
  };

  private readonly onPointerLeave = (): void => {
    this.pendingPick = false;
    this.setHovered(null);
  };

  private pick(): void {
    if (!this.camera || !this.pickSphere || !this.globe) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.pickSphere, false)[0];
    if (hit === undefined) {
      this.setHovered(null);
      return;
    }
    const { lat, lng } = this.globe.toGeoCoords(hit.point);
    this.setHovered(pickCountryCode(this.features, lat, lng));
  }

  private setHovered(code: string | null): void {
    if (code === this.hoveredCode) return;
    this.hoveredCode = code;
    // Stop auto-rotating while inspecting a country so it doesn't drift out from under the cursor.
    if (this.controls) this.controls.autoRotate = this.hoveredCode === null;
    this.globe?.polygonsData(this.features); // re-evaluates cap colour + altitude
    this.hoverHandler?.(code, this.pointerPx.x, this.pointerPx.y);
  }

  private observeResize(host: HTMLElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.camera) return;
      const { clientWidth: width, clientHeight: height } = host;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix(); // must call after changing aspect
      this.renderer.setSize(width, height);
    });
    this.resizeObserver.observe(host);
  }

  private start(): void {
    const tick = (): void => {
      if (this.pendingPick) {
        this.pendingPick = false;
        this.pick();
      }
      this.controls?.update(); // required every frame when damping/auto-rotate are on
      if (this.renderer && this.camera) this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }
}
```

### `src/app/features/globe/globe-canvas/globe-canvas.ts` *(modified — `heat` input + first `effect()`)*
```ts
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { GeoData } from '../../../core/geo/geo-data';
import { GlobeRenderer } from '../globe-renderer';

/** Hovered country (ISO alpha-2, or null off-country) plus the cursor position in canvas pixels. */
export interface CountryHoverEvent {
  code: string | null;
  x: number;
  y: number;
}

/** Dumb host for the three.js globe: owns the renderer's DOM lifecycle and pushes heat into it. */
@Component({
  selector: 'app-globe-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-canvas.html',
  styleUrl: './globe-canvas.scss',
})
export class GlobeCanvas {
  /** Per-country heat (ISO alpha-2 → liked-track count). Recolours the globe live as it changes. */
  readonly heat = input<ReadonlyMap<string, number>>(new Map());

  /** Emits the hovered country (or null off-country) with the cursor position, anchoring a card later. */
  readonly countryHover = output<CountryHoverEvent>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly geoData = inject(GeoData);
  private readonly renderer = new GlobeRenderer();
  /** Guards the effect: the renderer's methods are unsafe until init() has run (afterNextRender). */
  private ready = false;

  constructor() {
    // afterNextRender: the first moment the host <div> is a real DOM element — mount the renderer here.
    afterNextRender(async () => {
      const features = await this.geoData.features();
      this.renderer.setHoverHandler((code, x, y) => this.countryHover.emit({ code, x, y }));
      this.renderer.init(this.host().nativeElement, features);
      this.ready = true;
      // Push whatever heat already exists (e.g. a dataset restored from cache) now that the renderer
      // is live — an effect that fired before `ready` flipped would have skipped it.
      this.renderer.applyHeat(this.heat());
    });

    // The one signal→imperative bridge: whenever `heat` changes, push it into the render loop. This
    // effect is the ONLY place a signal touches the renderer — the loop itself stays signal-free (D4).
    effect(() => {
      const heat = this.heat();
      if (this.ready) {
        this.renderer.applyHeat(heat);
      }
    });

    // Component destroyed (e.g. navigating away from /globe) → release the WebGL context + GPU memory.
    inject(DestroyRef).onDestroy(() => this.renderer.dispose());
  }
}
```

> `globe-canvas.html` and `globe-canvas.scss` are **unchanged** from M4 (the `<div #host class="globe-host">`
> template and its full-size styles).

### `src/app/features/globe/globe-page/globe-page.ts` *(modified)*
```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { GlobeCanvas } from '../globe-canvas/globe-canvas';
import { GlobeStore } from '../globe-store';

@Component({
  selector: 'app-globe-page',
  imports: [GlobeCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage {
  protected readonly store = inject(GlobeStore);

  constructor() {
    // Restore the persisted dataset synchronously — NO network. A reload recolours the globe
    // instantly; the scan runs only on demand.
    this.store.restore();
  }

  /** Scan Liked Songs and resolve countries. The store picks full-vs-incremental from its own state. */
  protected load(): void {
    void this.store.recalculate();
  }
}
```

### `src/app/features/globe/globe-page/globe-page.html` *(modified)*
```html
<app-globe-canvas class="globe" [heat]="store.heat()" />

<div class="hud">
  <button type="button" class="hud__btn" (click)="load()" [disabled]="store.isResolving()">
    @if (store.isResolving()) {
      Scanning…
    } @else if (store.hasData()) {
      Recalculate
    } @else {
      Load my music
    }
  </button>

  @if (store.hasData() || store.isResolving()) {
    <dl class="hud__stats">
      <div><dt>Resolved</dt><dd>{{ store.resolvedCount() }}</dd></div>
      <div><dt>Unplaced</dt><dd>{{ store.failedCount() }}</dd></div>
      <div><dt>Pending</dt><dd>{{ store.pendingCount() }}</dd></div>
      <div><dt>Artists</dt><dd>{{ store.total() }}</dd></div>
    </dl>

    @if (store.dateRange().oldest !== null) {
      <p class="hud__range">
        {{ store.dateRange().oldest?.slice(0, 10) }} → {{ store.dateRange().newest?.slice(0, 10) }}
      </p>
    }
  } @else {
    <p class="hud__hint">Load your Liked Songs to colour the globe by artist country.</p>
  }
</div>
```

### `src/app/features/globe/globe-page/globe-page.scss` *(modified)*
```scss
:host {
  display: block;
  position: relative;
  // Fill the viewport below the 64px toolbar so the globe sits in full-bleed space.
  height: calc(100dvh - 64px);
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #0b1626 0%, var(--space-void, #070b14) 70%);
}

.globe {
  display: block;
  width: 100%;
  height: 100%;
}

.hud {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 16rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.6rem;
  color: #e8f1ff;
  background: rgba(11, 22, 38, 0.72);
  backdrop-filter: blur(6px);
  font: 500 0.9rem/1.3 system-ui, sans-serif;
}

.hud__btn {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: 0;
  border-radius: 0.4rem;
  background: #1db954; // Spotify green — cosmetic
  color: #04210f;
  font: inherit;
  font-weight: 700;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.hud__stats {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.3rem 0.9rem;

  div {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  dt {
    opacity: 0.7;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
}

.hud__range {
  margin: 0;
  opacity: 0.65;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.hud__hint {
  margin: 0;
  opacity: 0.75;
}
```

## What you have now (cumulative)
The `spotify-angular` app now has a **working core**: log in (M1) → the resilience layer paces every call (M2) →
Liked Songs stream into a persisted index (M3) → the globe mounts and orbits (M4) → **and now those songs
resolve to countries and colour the planet** (M5). Artists resolve via batched Wikidata with a MusicBrainz
fallback, the heat map paints live as resolution progresses, resolved/unplaced/pending counts show in the HUD,
and the whole dataset persists to `evm.origins` and restores instantly on reload with no refetch. This is the
🚦 **reality-check gate** — the app is genuinely useful here.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Globe mounts but nothing ever colours | `[heat]="store.heat()"` not bound, or `restore()`/`recalculate()` not called → check `globe-page` (step 09) and the canvas `heat` input (step 08). |
| Scan spinner never stops | A worker never exits: `streaming` not set `false` before `await resolveAll`, or `fastDone` never set → check the `finally` in `load()`/`incremental()` and the end of `fastWorker` (step 06). |
| `Property 'wikidata'/'musicbrainz' does not exist on environment` | Those blocks live only in `environment.development.ts` → add them to `environment.ts` too (M2 step 06); TS type-checks against the base file. |
| Wikidata returns `400` | Malformed SPARQL — usually a stray quote. Spotify ids are base-62 and need no escaping (step 01). |
| Punctuated artist names never resolve | `escapeLucene` missing or its char class trimmed → names like `AC/DC` misparse as Lucene operators (step 02). |
| A multi-nationality artist flips country between runs | The `ORDER BY ?spotifyId ?iso` + keep-first-row logic changed → both are required for determinism (step 01). |
| `evm.origins` never written | `save()` returned `false` — `QuotaExceededError` on a huge library (accepted R6 trade-off); the store warns once. |
| Reload triggers a `/me/tracks` or `sparql` request | The page called `recalculate()` on init instead of `restore()` → only `restore()` runs in the constructor (step 09). |
| Globe repaints in stuttering bursts | `publishProgress` isn't coalescing while `streaming` → confirm the early-return when `publishTimer` is set (step 06). |
| CD frames fire every animation frame | Something in the render loop reads a signal → the loop must stay signal-free ([D4](../foundation/decision-log.md#d4--signal-free-render-loop)); the canvas `effect()` is the only bridge. |

## Next
Continue to **[M6 — Hover/select panel + fixups](../MILESTONE_6_hover-panel-fixups/00_overview.md)** — a hover
card with the country's flag + name + counts (REST Countries is descoped, D7) and the manual "couldn't place"
fixup UI that assigns a country to an unplaced artist and makes it stick.

---
> Nav: [← Wire the globe page](09_globe-page-wiring.md) · [Overview](00_overview.md) · [Hover/select panel + fixups →](../MILESTONE_6_hover-panel-fixups/00_overview.md)
