# M8 · Step 04 of 12 — `FlightStore` — the isolated playback→flight bridge
> Nav: [← Spotify: artist photo + queue peek](03_spotify-artist-queue.md) · [Overview](00_overview.md) · [FlightLayer →](05_flight-layer.md)

## Glossary for this step
> **isolated resolution** — resolving a played artist's country **only** for the flight, into a *local* memo,
> and **never** writing it back to `GlobeStore`. This is what stops playing a song from adding its artist to the
> scanned map (`evm.origins`) — the core promise of D5.
> **memoise** — cache a computed result by key so a repeat lookup is instant and doesn't re-hit the network.

## Why / design
`FlightStore` is the single bridge between the M7 live player and the M8 flight animation. It's a root singleton
(one per app) that watches `PlayerStore.state()` and, on every **track change**, publishes a `FlightTarget` the
renderer will fly to — plus it grows the persisted trip log.

Three design points carry the milestone:

1. **It reacts to track *changes*, not every poll.** `PlayerStore` polls `/me/player` every ~3 s, so the
   `effect` fires constantly; we compare `trackId` to `lastTrackId` and bail on a mere progress tick. Only a
   real change builds a new target — and, because the *previous* destination has now been reached, archives the
   old target as a finished `TripStop` first.

2. **Country resolution is isolated (D5).** `resolveCountry` reads `GlobeStore.countryOf()` first (free, from
   the scanned data), but a *miss* runs the same two-tier chain the scan uses (`resolveBatchBySpotifyId` →
   `resolveByName`) and memoises the hit in a **local** `Map` — it is *never* written back to `GlobeStore`. So
   playing an artist who isn't in your library flies the plane without ever polluting `evm.origins`.

3. **The next artist is pre-warmed.** After publishing a target it peeks the queue (`getNextQueuedArtist`, step
   03) and resolves that artist's country + photo into the same memos, so when the track actually flips the
   destination is already known and the plane launches immediately rather than after a slow MusicBrainz round-trip.

A `buildSeq` counter guards against a slow lookup for an old track overwriting a newer track's target (a race
when you skip fast). If a build is superseded, the song still *played*, so its stop is archived rather than
dropped.

> Mental model (recurring): **signals are the state, the renderer is imperative.** `FlightStore` exposes
> `target` + `history` as signals; the canvas `effect()` (step 07) is the only place they cross into the
> signal-free three.js layer.

## Do this
1. Create `src/app/features/globe/flight-store.ts` as a root-singleton service.
2. In the constructor, run an `effect()` that reads `player.state()`, short-circuits when the `trackId` is
   unchanged, archives the previous target, and (for a real track) kicks off `build()`.
3. `build()` resolves country + photo in parallel, sets the `_target` signal, then fire-and-forgets
   `prefetchNext()`. `archiveTarget()` appends a finished `TripStop` (bounded to `MAX_HISTORY = 25`) and saves it.

## Code
### `src/app/features/globe/flight-store.ts`
```ts
import { effect, inject, Injectable, signal } from '@angular/core';

import { SpotifyApi } from '../../core/api/spotify-api';
import { TripLogCache } from '../../core/cache/trip-log-cache';
import { largestImageUrl } from '../../core/mappers/spotify.mapper';
import { ArtistRef } from '../../core/models/artist';
import { PlaybackState } from '../../core/models/playback-state';
import { ArtistResolution } from '../../core/pipeline/artist-resolution';
import { PlayerStore } from '../player/player-store';
import { FlightTarget, TripStop } from './flight-target';
import { GlobeStore } from './globe-store';

/** How many past stops the trip log keeps. */
const MAX_HISTORY = 25;

/**
 * Bridges live Spotify playback to the globe's flight animation. On every **track change** it finds
 * the primary artist's country — from the scanned dataset first, then resolving any other played
 * artist on the fly via Wikidata — and fetches the artist photo, then publishes a {@link FlightTarget}.
 * Async lookups are memoised so repeated plays don't re-query. Signal-only; the renderer consumes it.
 */
@Injectable({ providedIn: 'root' })
export class FlightStore {
  private readonly player = inject(PlayerStore);
  private readonly globe = inject(GlobeStore);
  private readonly spotify = inject(SpotifyApi);
  private readonly resolution = inject(ArtistResolution);
  private readonly tripLog = inject(TripLogCache);

  private readonly _target = signal<FlightTarget | null>(null);
  readonly target = this._target.asReadonly();

  /** Past stops, newest first — each song logged with its arrival time as the plane moves on. */
  private readonly _history = signal<TripStop[]>(this.tripLog.load());
  readonly history = this._history.asReadonly();

  /** artistId → resolved country / photo, so we never re-query the same artist. Only *hits* are
   * memoised for country, so a transient lookup failure retries on the next play. */
  private readonly countryMemo = new Map<string, string>();
  private readonly photoMemo = new Map<string, string | null>();
  private lastTrackId: string | null = null;
  /** Guards against an older slow lookup overwriting a newer track's target. */
  private buildSeq = 0;

  constructor() {
    effect(() => {
      const state = this.player.state();
      const trackId = state?.trackId ?? null;
      if (trackId === this.lastTrackId) {
        return; // same track, just a progress/poll tick — nothing to fly
      }
      this.lastTrackId = trackId;
      // The track just changed, so the previous destination has now been reached — log it.
      this.archiveCurrent();
      if (state === null || trackId === null) {
        this._target.set(null);
        return;
      }
      void this.build(state, trackId);
    });
  }

  /** Append the current destination to the trip log as a finished stop (arrived = now). */
  private archiveCurrent(): void {
    this.archiveTarget(this._target());
  }

  /** Log a destination as a finished stop, unless it's empty or already the newest entry. */
  private archiveTarget(target: FlightTarget | null): void {
    if (target === null || this._history()[0]?.trackId === target.trackId) {
      return; // nothing playing, or already logged (e.g. a pause/resume of the same track)
    }
    const stop: TripStop = {
      trackId: target.trackId,
      artistId: target.artistId,
      countryCode: target.countryCode,
      label: target.label,
      imageUrl: target.imageUrl,
      arrivedAt: Date.now(),
    };
    this._history.update((stops) => [stop, ...stops].slice(0, MAX_HISTORY));
    this.tripLog.save(this._history());
  }

  private async build(state: PlaybackState, trackId: string): Promise<void> {
    const seq = ++this.buildSeq;
    const primary = state.artists[0] ?? null;
    const [countryCode, imageUrl] = await Promise.all([
      this.resolveCountry(primary),
      this.resolvePhoto(primary),
    ]);
    const target: FlightTarget = {
      trackId,
      artistId: primary?.id ?? null,
      countryCode,
      label: state.artistNames,
      imageUrl,
      durationMs: state.durationMs,
      progressMs: state.progressMs,
    };
    if (seq !== this.buildSeq) {
      // A newer track superseded this build before it resolved — the song still played, so log its
      // stop here (archiveCurrent() couldn't, the target wasn't set yet when the track changed).
      this.archiveTarget(target);
      return;
    }
    this._target.set(target);
    void this.prefetchNext(seq);
  }

  /**
   * Warm the country + photo memos for the next item in the playback queue, so when the track
   * actually changes its destination resolves instantly (the slow MusicBrainz fallback especially).
   * Best-effort and fire-and-forget: a missing queue, an unplaced artist, or a rate-limit just skips.
   */
  private async prefetchNext(seq: number): Promise<void> {
    if (seq !== this.buildSeq) {
      return; // already superseded — don't bother
    }
    try {
      const next = await this.spotify.getNextQueuedArtist();
      if (next === null || seq !== this.buildSeq) {
        return;
      }
      await Promise.all([this.resolveCountry(next), this.resolvePhoto(next)]);
    } catch {
      // Lookahead is purely an optimisation — ignore any failure.
    }
  }

  /**
   * Resolves a played artist's country for the flight only. Reads from the scanned dataset, but
   * misses are resolved into a local memo — never written back to {@link GlobeStore}. So playing a
   * song (favourite or not) flies the plane without ever adding the artist to the scanned map.
   */
  private async resolveCountry(artist: ArtistRef | null): Promise<string | null> {
    if (artist === null) {
      return null;
    }
    const fromData = this.globe.countryOf(artist.id);
    if (fromData !== null) {
      return fromData;
    }
    const memoised = this.countryMemo.get(artist.id);
    if (memoised !== undefined) {
      return memoised;
    }
    // Fast Wikidata-by-id pass, then the same MusicBrainz-by-name fallback the globe scan uses, so a
    // played artist resolves consistently whether it came from the dataset or live playback.
    const map = await this.resolution.resolveBatchBySpotifyId([artist.id]);
    const code = map.get(artist.id) ?? (await this.resolution.resolveByName(artist.name));
    // Memoise only a real hit — leaving misses unmemoised lets a transient failure retry next play.
    if (code !== null) {
      this.countryMemo.set(artist.id, code);
    }
    return code;
  }

  private async resolvePhoto(artist: ArtistRef | null): Promise<string | null> {
    if (artist === null) {
      return null;
    }
    if (this.photoMemo.has(artist.id)) {
      return this.photoMemo.get(artist.id) ?? null;
    }
    try {
      const dto = await this.spotify.getArtist(artist.id);
      const url = largestImageUrl(dto.images);
      this.photoMemo.set(artist.id, url);
      return url;
    } catch {
      this.photoMemo.set(artist.id, null);
      return null;
    }
  }
}
```

## Done when (this step)
- [ ] `npm run build` clean. With the app running, playing a song and opening DevTools → Network shows a
      `GET .../v1/artists/<id>` (photo) and, on a track change, a `GET .../v1/me/player/queue` (prefetch).
- [ ] In DevTools console, `JSON.parse(localStorage['evm.origins']).artists.length` **does not change** when
      you play an artist who isn't in your scanned library → confirms isolated resolution.

## If it breaks
- **Playing a song does nothing yet** → expected here: nothing consumes `FlightStore.target()` until the canvas
  is wired (step 07). This step just builds the data.
- **`NG0203: inject() must be called from an injection context`** → an `inject()` was moved out of a field
  initializer; keep all `inject()` calls at field-declaration level (constructor is fine for the `effect`).
- **The trip log gains a duplicate on pause/resume** → the `archiveTarget` guard (`history[0]?.trackId === …`)
  was dropped; it's what stops the same track logging twice.
- **`evm.origins` grows when you just play music** → something wrote a flight resolution back to `GlobeStore`.
  `resolveCountry` must memoise into `this.countryMemo`, never call `globe.setCountry`/`accumulate`.
