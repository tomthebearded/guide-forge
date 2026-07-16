# M2 · Step 10 of 12 — The minimal Spotify client
> Nav: [← Wire it up](09_wire-interceptor.md) · [Overview](00_overview.md) · [Liked-songs summary →](11_liked-summary.md)

> **This step touches two files, committed together:** `src/app/core/dto/spotify.dto.ts` (the raw payload
> types) and `src/app/core/api/spotify-api.ts` (the typed client). They're one unit — the client returns these
> DTOs.

## Glossary for this step
> **[DTO (Data Transfer Object)](../foundation/glossary.md)** — the raw shape an API returns, suffixed `Dto`. A
> mapper converts it to a clean domain model so API shapes never leak into the UI. This milestone's two calls
> don't need a mapper (they read one or two primitive fields straight off the DTO); the DTO→domain mappers land
> in **M3** when the full liked-track shape arrives.

## Why / design
Now we prove the whole resilience stack with the smallest real client that exercises it: two calls to Spotify.
This is [suggestion S1](../PLAN.md) — a "verify your setup" health check that also smoke-tests auth + HTTP end
to end before any globe work.

Two mental models to reinforce here:

- **DTO at the edge, domain everywhere else.** Raw Spotify payloads are `…Dto` types that live only in
  `core/dto` and never leak past a mapper. M2's two calls are the exception that proves the rule — they read a
  field or two directly (`page.total`, `page.items[0]?.added_at`), so no mapper is needed *yet*.
- **The client keeps no throttle of its own.** `SpotifyApi` just makes HTTP calls. The M1 auth interceptor adds
  the bearer token; the M2 rate-limit interceptor paces the call. That's why this service can be so plain — the
  cross-cutting concerns are interceptors, not methods here.

Notice the deliberate contrast between the two methods, which teaches when to reach for `withRetry`:

- `getMe()` is a **bare** paced call (`firstValueFrom(http.get(...))`) — the gate spaces it; a transient blip
  just fails this one health check, no retry needed.
- `getLikedTracksSummary()` wraps its call in **`withRetry`** — it's the cheap diff M3's boot sync leans on, so
  it should ride out a transient 5xx/network hiccup. Either way, **neither retries a 429** (that's the gate).

This `SpotifyApi` is the **minimal M2 slice**: the rest of the client — `streamLikedTracks()`, the per-id
fan-outs, player controls, playlist/library methods — grows across **M3 / M5 / M7 / M10**. A `// grows in …`
note marks it.

## Do this
1. Create `src/app/core/dto/spotify.dto.ts` with just the two payload types below. `SpotifyMeDto` is `GET /me`;
   `SpotifySavedTracksDto` (+ its item type) is `GET /me/tracks`. Keep only the fields M2 reads — the full track
   shape (artists, album, ISRC, uri…) arrives in M3.
2. Create `src/app/core/api/spotify-api.ts` with the two methods below. It imports `HttpClient`, `environment`,
   the two DTOs, and `withRetry` (step 03). The class name **`SpotifyApi`** and method names **`getMe`** /
   **`getLikedTracksSummary`** are load-bearing — the globe page calls them by name next step.
3. Build the URLs off `environment.spotify.apiBaseUrl` (so `RateLimiters.match` recognises them as Spotify) —
   don't hard-code `https://api.spotify.com/v1`.

## Code
### `src/app/core/dto/spotify.dto.ts`
```ts
/** Raw Spotify Web API payloads. Never used outside mappers — domain code uses models. Grows in M3/M5/M7. */

/** Payload of `GET /me` — only the current user's id is needed (to decide playlist ownership later). */
export interface SpotifyMeDto {
  id: string;
}

/** One saved track from `GET /me/tracks`. M2 reads only `added_at`; the full track shape lands in M3. */
export interface SpotifySavedTrackDto {
  added_at: string;
}

/** Payload of `GET /me/tracks`. `total` is the whole library size; `next` is the paging cursor (used in M3). */
export interface SpotifySavedTracksDto {
  items: SpotifySavedTrackDto[];
  next: string | null;
  total: number;
}
```

### `src/app/core/api/spotify-api.ts`
```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SpotifyMeDto, SpotifySavedTracksDto } from '../dto/spotify.dto';
import { withRetry } from '../pipeline/http-retry';

/**
 * Typed client for the Spotify Web API. The M1 auth interceptor adds the bearer token; the shared
 * RateLimitGate (via `rateLimitInterceptor`) is the **single** pacer for every call here — this service
 * keeps no throttle of its own. This is the minimal M2 slice: two smoke calls that prove the resilience
 * layer end to end. It grows in M3 (`streamLikedTracks` + mappers), M5, M7, and M10.
 */
@Injectable({ providedIn: 'root' })
export class SpotifyApi {
  private readonly http = inject(HttpClient);

  /** The current user's profile — only the id is used. A bare paced call: the gate spaces it, no retry. */
  async getMe(): Promise<SpotifyMeDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyMeDto>(`${base}/me`));
  }

  /**
   * A one-call summary of the user's Liked Songs — the total count and the newest track's `added_at` —
   * via `GET /me/tracks?limit=1`. `withRetry` rides out a transient 5xx/network blip; the gate handles
   * pacing and any 429. In M3 the boot sync uses this cheap diff to decide whether the library changed.
   */
  async getLikedTracksSummary(): Promise<{ total: number; newest: string | null }> {
    const base = environment.spotify.apiBaseUrl;
    const page = await withRetry(() =>
      firstValueFrom(this.http.get<SpotifySavedTracksDto>(`${base}/me/tracks?limit=1`)),
    );
    return { total: page.total, newest: page.items[0]?.added_at ?? null };
  }
}
```

## Done when (this step)
- [ ] Both files compile with no `any`. `npm run build` is clean. (You'll see the calls actually run in step 11,
  once the globe page invokes them.)

## If it breaks
- **`page.items[0]` is `possibly undefined`** → that's `noUncheckedIndexedAccess`; the `?.added_at ?? null`
  handles it (an empty library returns no items). Keep the optional chaining.
- **The call isn't paced** → the URL didn't start with `environment.spotify.apiBaseUrl`. Build it off `base`, as
  shown, so `RateLimiters.match` recognises the host.
- **401 on the call** → you're not logged in, or the M1 auth interceptor isn't attaching the bearer. Confirm M1's
  Done-when still passes before debugging M2.

---
> Nav: [← Wire it up](09_wire-interceptor.md) · [Overview](00_overview.md) · [Liked-songs summary →](11_liked-summary.md)
