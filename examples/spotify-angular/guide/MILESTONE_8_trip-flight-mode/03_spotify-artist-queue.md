# M8 · Step 03 of 12 — Spotify: artist photo + queue peek
> Nav: [← Persist the trip log](02_trip-log-cache.md) · [Overview](00_overview.md) · [FlightStore →](04_flight-store.md)

This step touches **3 files, committed together** — all edits to files M7 created: `spotify.dto.ts` (two new
payload shapes), `spotify.mapper.ts` (one helper), and `spotify-api.ts` (two methods). These were **deferred
from M7 to here** because they only exist to feed Trip mode. Each file's *complete* M8 state is in
[13_verify.md](13_verify.md); below are the additions and exactly where they go.

## Glossary for this step
> **queue peek** — reading `GET /me/player/queue` to see the *next* item Spotify will play, without changing
> anything. Trip mode uses it to pre-resolve the upcoming artist's country so the plane can launch the instant
> the track flips.

## Why / design
`FlightStore` (next step) needs two things Spotify hasn't been asked for yet:
1. **The artist's photo** for the plane badge / trip-log row — from `GET /artists/{id}`.
2. **The next queued artist**, so the slow MusicBrainz fallback can be *warmed* before the track changes — from
   `GET /me/player/queue`. Without this, a country resolved only by the slow path would arrive late and the
   plane would teleport instead of fly.

Both follow the house rules: raw payloads are `…Dto`, a mapper (`largestImageUrl`) turns image lists into a
plain URL, and the typed calls live in `SpotifyApi` (never HTTP from a component). The queue's `queue[]` can
contain non-track items (podcast episodes have no `artists`), so its DTO is typed loosely and the method
**guards** with `'artists' in next`.

> The `SpotifyArtistDto` also carries `genres` — that field feeds the **M9** genre filter. It's included now
> because it rides on the same payload; nothing in M8 reads it. `// grows in M9`.

## Do this
1. **`src/app/core/dto/spotify.dto.ts`** — at the end of the file, add the `SpotifyArtistDto` and
   `SpotifyQueueDto` interfaces (both reuse the existing `SpotifyImageDto` / `SpotifyTrackDto`).
2. **`src/app/core/mappers/spotify.mapper.ts`** — add an **exported** `largestImageUrl` next to the existing
   (private) `smallestImageUrl`. It's exported because `FlightStore` calls it directly.
3. **`src/app/core/api/spotify-api.ts`** — add `SpotifyArtistDto` + `SpotifyQueueDto` to the DTO import, add
   `import { ArtistRef } from '../models/artist';`, and add the two methods in a new M8 section.

## Code
### `src/app/core/dto/spotify.dto.ts` — add at the end
```ts
// --- M8: flight lookups (artist photo + queue peek) ---

/**
 * Payload of `GET /artists/{id}` — used for the artist photo that rides the flight plane. Its
 * `genres` tags also drive the M9 globe genre filter (unused in M8). // grows in M9
 */
export interface SpotifyArtistDto {
  id: string;
  name: string;
  images: SpotifyImageDto[];
  /** Spotify's genre tags for the artist; may be empty. Consumed by the M9 genre filter. */
  genres: string[];
}

/**
 * Payload of `GET /me/player/queue`. `queue[0]` is the next item up. Items may be episodes (no
 * `artists`), so the array is typed loosely and the caller guards.
 */
export interface SpotifyQueueDto {
  currently_playing: SpotifyTrackDto | null;
  queue: (SpotifyTrackDto | { id: string | null })[];
}
```

### `src/app/core/mappers/spotify.mapper.ts` — add below `smallestImageUrl`
```ts
/** Largest available image (Spotify lists them largest-first) — used for the plane's artist photo. */
export function largestImageUrl(images: SpotifyImageDto[]): string | null {
  if (images.length === 0) {
    return null;
  }
  const largest = images.reduce((max, image) =>
    (image.width ?? 0) > (max.width ?? 0) ? image : max,
  );
  return largest.url;
}
```

### `src/app/core/api/spotify-api.ts` — imports + two methods
Add `SpotifyArtistDto` and `SpotifyQueueDto` to the existing `from '../dto/spotify.dto'` import block, and add
this import beside the model imports:
```ts
import { ArtistRef } from '../models/artist';
```
Then add a new section at the end of the class body (after the M7 playlists methods, before the closing `}`):
```ts
  // --- M8: flight lookups (artist photo + queue peek) ---

  /**
   * Full artist object — used for the artist photo that rides the flight plane. Public data: needs
   * only a valid token. (The `genres` tags on the same payload drive the M9 genre filter.)
   */
  async getArtist(id: string): Promise<SpotifyArtistDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyArtistDto>(`${base}/artists/${id}`));
  }

  /**
   * Primary artist of the next item in the playback queue, or null when the queue is empty or the
   * next item is a non-track (e.g. a podcast episode with no artists). Lets the flight store
   * pre-resolve the upcoming destination so the plane can launch the instant the track changes.
   */
  async getNextQueuedArtist(): Promise<ArtistRef | null> {
    const base = environment.spotify.apiBaseUrl;
    const dto = await firstValueFrom(this.http.get<SpotifyQueueDto>(`${base}/me/player/queue`));
    const next = dto.queue[0];
    if (next === undefined || !('artists' in next)) {
      return null;
    }
    const artist = next.artists[0];
    return artist === undefined ? null : { id: artist.id, name: artist.name };
  }
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no `any`, no unused-import error.
- [ ] With the app running and something playing, in DevTools console:
      `angular.getInjector? …` isn't needed — instead confirm the endpoints exist: the Network panel will show
      `GET .../v1/artists/<id>` and `GET .../v1/me/player/queue` once the `FlightStore` (next step) is wired.

## If it breaks
- **`Property 'getArtist' does not exist on type 'SpotifyApi'`** in the next step → the methods landed outside
  the class body (after the final `}`); they must be *inside* the class.
- **`'ArtistRef' refers to a type… used as a value`** → you imported it but returned the wrong shape;
  `getNextQueuedArtist` returns `{ id, name }`, which *is* an `ArtistRef`.
- **`largestImageUrl` "is not exported"** in step 04 → you added it but forgot `export`, or added it inside
  another function. It must be a top-level `export function`.

---
> Nav: [← Persist the trip log](02_trip-log-cache.md) · [Overview](00_overview.md) · [FlightStore →](04_flight-store.md)
