# M3 · Step 04 of 07 — `streamLikedTracks()`: the async generator
> Nav: [← The mapper](03_mapper.md) · [Overview](00_overview.md) · [The cache →](05_liked-index-cache.md)

> This step touches **one file** — `core/api/spotify-api.ts` (created in M2) — adding **two** paging methods in
> one commit: `streamLikedTracks()` and `getLikedTrackUris()`.

## Glossary for this step
> 📚 **New concept — async generator** — a function declared `async function*` that `yield`s values *over
> time*. The caller pulls them one at a time with `for await (… of …)`, can `break` out early (the generator
> stops mid-flight — no wasted pages), and never holds the whole list in memory at once. It's the streaming
> counterpart to returning an array. See [glossary](../foundation/glossary.md#async-generator) and
> [MDN: async generators](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/async_function*).

## Why / design
A library can be 10 songs or 10,000. Fetching everything into one giant array before the UI can react means a
long dead wait, then a single repaint. Instead we **stream**:

> **The scan is a generator, not a fetch-all.** `streamLikedTracks()` yields one mapped page (≤50 tracks) at a
> time; the consumer (step 07) updates the count and persists after *each* page. The user sees progress
> immediately, and an early `break` (used by the M9 incremental sync to stop at a known date) simply stops
> pulling — no extra requests fire.

How the paging works, and why it's newest-first:

1. `GET /me/tracks?limit=50` returns the **newest** 50 saved tracks plus a `next` URL.
2. The generator `yield`s that page (mapped to `LikedTrack[]`), then follows `next`.
3. Spotify returns saved tracks in reverse-chronological order, so page after page arrives newest→oldest.
4. When `next` is `null`, the loop ends and the generator completes.

Each fetch is wrapped in `withRetry` (from M2) and paced by the rate-limit gate through the interceptor — so
this method keeps **no throttle of its own**; the gate is the single pacing authority (M2, decision-log D2).

The sibling `getLikedTrackUris(limit)` is the *non-generator* counterpart: an interactive "press play" helper
(wired up by the player in M7) that pages only as far as `limit` requires and **stops early** with
`uris.length < limit`. Built now because it belongs beside `streamLikedTracks()`; nothing calls it in M3.

## Do this
1. Open `src/app/core/api/spotify-api.ts` (M2 created it with `getMe` + `getLikedTracksSummary`). Replace its
   contents with the code below — it keeps both M2 methods and adds the two paging methods.
2. `async *streamLikedTracks()` — the `*` after `async` is **mandatory**: it's what makes this a generator.
   The return type `AsyncIterable<LikedTrack[]>` says "an async stream of pages".
3. Note `const next: string = url;` inside the loop. `url` is typed `string | null`; copying it into a
   non-null `const` before the `http.get` call is what lets TypeScript accept it under
   `strictNullChecks` — leave it.
4. The URL string `` `${environment.spotify.apiBaseUrl}/me/tracks?limit=${PAGE_SIZE}` `` is **load-bearing**:
   `/me/tracks` is the Liked Songs endpoint and `PAGE_SIZE = 50` is Spotify's per-page maximum.

## Code
### `src/app/core/api/spotify-api.ts`
```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SpotifyMeDto, SpotifySavedTracksDto } from '../dto/spotify.dto';
import { toLikedTracks } from '../mappers/spotify.mapper';
import { LikedTrack } from '../models/liked-track';
import { withRetry } from '../pipeline/http-retry';

/** `GET /me/tracks` returns at most 50 saved tracks per page. */
const PAGE_SIZE = 50;

/**
 * Typed client for the Spotify Web API. The M1 auth interceptor adds the bearer token; the M2
 * rate-limit gate (via `rateLimitInterceptor`) is the single pacer for every call here, so a large
 * library never bursts into the rate limit. This service keeps no throttle of its own. Grows in
 * M5/M7/M10 (artists, player, playlists, library mutations).
 */
@Injectable({ providedIn: 'root' })
export class SpotifyApi {
  private readonly http = inject(HttpClient);

  /**
   * Streams the user's Liked Songs newest-first, one page (≤50) at a time, following Spotify's
   * `next` cursor. Consumers may stop iterating early (e.g. an incremental sync that stops at a
   * known date). Each page is mapped to clean {@link LikedTrack}s before it leaves this method.
   */
  async *streamLikedTracks(): AsyncIterable<LikedTrack[]> {
    let url: string | null = `${environment.spotify.apiBaseUrl}/me/tracks?limit=${PAGE_SIZE}`;
    while (url !== null) {
      const next: string = url;
      const page: SpotifySavedTracksDto = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifySavedTracksDto>(next)),
      );
      yield toLikedTracks(page);
      url = page.next;
    }
  }

  /**
   * A one-call summary of the user's Liked Songs — the total count and the newest track's
   * `added_at` — via `GET /me/tracks?limit=1`. The cheap diff a boot sync uses (M9) to decide
   * whether the library changed before paging anything.
   */
  async getLikedTracksSummary(): Promise<{ total: number; newest: string | null }> {
    const base = environment.spotify.apiBaseUrl;
    const page = await withRetry(() =>
      firstValueFrom(this.http.get<SpotifySavedTracksDto>(`${base}/me/tracks?limit=1`)),
    );
    return { total: page.total, newest: page.items[0]?.added_at ?? null };
  }

  /**
   * URIs of the user's Liked Songs, newest-first, up to `limit` — used by the player (M7) to
   * auto-start favourites when nothing is playing. Pages in ≤50s only as far as `limit` requires,
   * then stops early. Built now beside `streamLikedTracks()`; unused until M7.
   */
  async getLikedTrackUris(limit: number): Promise<string[]> {
    const base = environment.spotify.apiBaseUrl;
    let url: string | null = `${base}/me/tracks?limit=${Math.min(PAGE_SIZE, limit)}`;
    const uris: string[] = [];
    while (url !== null && uris.length < limit) {
      const next: string = url;
      const page: SpotifySavedTracksDto = await withRetry(() =>
        firstValueFrom(this.http.get<SpotifySavedTracksDto>(next)),
      );
      for (const item of page.items) {
        uris.push(item.track.uri);
      }
      url = page.next;
    }
    return uris.slice(0, limit);
  }

  /** The current user's profile — only the id is used (to decide playlist ownership later). */
  async getMe(): Promise<SpotifyMeDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyMeDto>(`${base}/me`));
  }
}
```

## Done when (this step)
- [ ] Run `npm run build` → completes clean (`Application bundle generation complete`).
- [ ] `SpotifyApi` exposes `streamLikedTracks()`, `getLikedTracksSummary()`, `getLikedTrackUris()`, and
      `getMe()`; `streamLikedTracks` is declared `async *` and returns `AsyncIterable<LikedTrack[]>`.

## If it breaks
- **`build` fails: "A 'yield' expression is only allowed in a generator body"** → the method is missing the
  `*`. It must read `async *streamLikedTracks()`, not `async streamLikedTracks()`.
- **`build` fails: "Type 'string | null' is not assignable to parameter of type 'string'"** → you passed
  `url` straight into `http.get`. Copy it into `const next: string = url;` first (inside the `while`, after the
  null check).
- **At runtime later: 401 on `/me/tracks`** → the auth interceptor (M1) isn't adding the bearer, or your token
  expired — log out and back in. This method deliberately doesn't touch auth; that's the interceptor's job.

---
> Nav: [← The mapper](03_mapper.md) · [Overview](00_overview.md) · [The cache →](05_liked-index-cache.md)
