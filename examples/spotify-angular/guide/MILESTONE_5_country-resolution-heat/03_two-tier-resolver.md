# M5 · Step 03 of 10 — The two-tier resolver
> Nav: [← MusicBrainz fallback](02_musicbrainz-fallback.md) · [Overview](00_overview.md) · [Origin models →](04_origin-models.md)

## Glossary for this step
> **two-tier resolution** — resolve artist countries fast via batched Wikidata, then fall back per-artist to
> MusicBrainz for the misses. This file is that policy in one place.
> [glossary](../foundation/glossary.md#two-tier-resolution) ·
> [D3](../foundation/decision-log.md#d3--two-tier-country-resolution).

## Why / design
Steps 01–02 built two data sources. This step composes them into the **one policy the orchestrator calls**, so
the `GlobeStore` never has to know how a country is found — it just asks "resolve these ids" (fast) or "resolve
this name" (slow). Two methods:

1. `resolveBatchBySpotifyId(ids)` — the **fast pass**. One Wikidata query for the whole batch; returns a map
   covering **every** requested id, with misses mapped to `null` (so the caller can tell "tried, not found"
   from "not tried").
2. `resolveByName(name)` — the **slow pass**. MusicBrainz search → its country if it has one, else its MBID →
   Wikidata (`countryByMbid`). Returns the ISO code or `null`.

> 📚 Mental model — **neither pass ever throws.** This is the load-bearing design rule. A scan enqueues
> thousands of artists across two rate-limited APIs; if a single failed request rejected, it would abort the
> whole `Promise.all` and stall the queue. So both methods wrap their work in `try/catch` and **resolve to
> `null`/all-null on failure** instead of rejecting. One bad artist or one flaky batch is a miss, not a crash.
> You'll rely on this in step 06 where the workers run concurrently — a rejection there would kill the scan.

Why the fast pass swallows a batch error into *all-null* (not partial): if the single batched query fails,
we don't know which ids would have resolved, so we mark them all unresolved and let the slow pass retry each by
name. That's the safe, deterministic fallback.

## Do this
1. In `src/app/core/pipeline/`, create `artist-resolution.ts` with the code below.
2. It's a root singleton (`@Injectable({ providedIn: 'root' })`) that injects the two clients from steps 01–02.
   No state of its own — it's pure policy.
3. `resolveBatchBySpotifyId` seeds the result map with `null` for every id first, then overwrites the ones
   Wikidata returned. That guarantees the returned map has an entry for **every** requested id — the worker in
   step 06 iterates the batch expecting exactly that.
4. Method names (`resolveBatchBySpotifyId`, `resolveByName`) are load-bearing — `GlobeStore` calls them by name.

## Code
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

## Done when (this step)
- [ ] `npm run build` is clean and `ArtistResolution` injects without a circular-dependency error. You can't
      exercise it on screen yet (no caller until step 06); the observable proof arrives in the milestone gate.
      For now confirm the shape: `resolveBatchBySpotifyId(['x'])` would resolve to a `Map` of size 1 with
      `x → null` (an unknown id), never a rejected promise.

## If it breaks
- **`NG0200` / circular dependency injecting `ArtistResolution`** → `WikidataApi`/`MusicBrainzApi` must not
  import anything that imports back into this file. They only depend on `HttpClient` + `environment` + the
  DTOs/mappers, so a cycle means an accidental cross-import — check the imports at the top of each client.
- **A whole batch comes back unresolved every time** → the `try` swallowed a real error (e.g. a 400 from a
  malformed query in step 01). Temporarily log inside the `catch` to see it; the `catch` is meant for
  *transient* failures, not a broken query.

---
> Nav: [← MusicBrainz fallback](02_musicbrainz-fallback.md) · [Overview](00_overview.md) · [Origin models →](04_origin-models.md)
