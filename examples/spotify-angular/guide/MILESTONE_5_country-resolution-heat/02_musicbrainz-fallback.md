# M5 · Step 02 of 10 — The MusicBrainz fallback (search by name)
> Nav: [← Wikidata SPARQL](01_wikidata-sparql.md) · [Overview](00_overview.md) · [Two-tier resolver →](03_two-tier-resolver.md)

**This step creates three files, committed together:** `src/app/core/dto/musicbrainz.dto.ts` (the raw payload),
`src/app/core/mappers/musicbrainz.mapper.ts` (DTO → a clean match), and
`src/app/core/api/musicbrainz-api.ts` (the client). One feature, three thin files, one commit.

## Glossary for this step
> **MusicBrainz** — an open music encyclopedia with a public REST API (`/ws/2`). We use its **artist search**
> to look an artist up by *name* when Wikidata had no Spotify-id link. [docs](https://musicbrainz.org/doc/MusicBrainz_API).
> **MBID** — a MusicBrainz identifier (a UUID) for an artist. It's the bridge back to Wikidata: Wikidata stores
> an artist's MBID as property `P434`, so an MBID → country lookup is possible even when the name match had no
> area. [glossary](../foundation/glossary.md#mbid).
> **Lucene** — the query syntax MusicBrainz search uses; several characters (`/`, `:`, `+`, `(`…) are
> operators, so an unescaped name like `AC/DC` would be misparsed. [docs](https://musicbrainz.org/doc/MusicBrainz_API/Search).

## Why / design
Wikidata's fast pass only finds artists whose Wikidata item carries a `P1902` Spotify id. Plenty don't. The
**slow pass** catches that long tail: search MusicBrainz by the artist's name, take the top hit, and read its
country two ways —
1. MusicBrainz's own `country` / `area` / `begin-area` ISO code if present, else
2. the hit's **MBID**, handed to `WikidataApi.countryByMbid()` (step 01) via `P434`.

It's the *fallback* because it's slower and less precise: one request **per artist** (MusicBrainz asks anonymous
clients for ≤1 req/s), and a name search can mis-hit. So it only runs for what Wikidata missed.

> 📚 New concept — **Why escape the name (`escapeLucene`).** MusicBrainz search parses the query as Lucene. If
> an artist name contains a reserved character — `/` in "AC/DC", `:` `+` `!` `(` `)` etc. — Lucene reads it as
> an operator and the search silently returns *no match*. `escapeLucene` backslashes every reserved character
> (including the `&`/`|` of `&&`/`||`) so the name is matched literally. Without it, a chunk of your library
> with punctuated names would fail to resolve for no visible reason.

## Do this
1. In `src/app/core/dto/`, create `musicbrainz.dto.ts` with the search payload shape below. Only the fields we
   read are typed; the API returns much more. Note `iso-3166-1-codes` is a quoted key (it has hyphens), so it's
   read with bracket access in the mapper.
2. In `src/app/core/mappers/`, create `musicbrainz.mapper.ts`. It defines the domain `MusicBrainzMatch`
   (`mbid` + `countryCode | null`) and `toMusicBrainzMatch()`, which pulls the country in priority order:
   `country` → `area`'s first ISO code → `begin-area`'s first ISO code → `null`.
3. In `src/app/core/api/`, create `musicbrainz-api.ts`. `searchArtist(name)` escapes the name, requests the top
   1 result (`limit=1`, `fmt=json`), and maps it — or returns `null` when there's no hit. `withRetry` (M2)
   covers transient failures; the M2 rate-limit interceptor already paces `musicbrainz.org` (its 1 req/s gate),
   so **this client adds no throttle of its own.**
4. Load-bearing: `environment.musicbrainz.apiBaseUrl`, the `/artist` path, and the DTO field names
   (`iso-3166-1-codes`, `area`, `begin-area`, `country`) — they must match MusicBrainz's JSON exactly. The
   `escapeLucene` character class is load-bearing (drop one and those names silently stop resolving).

## Code
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

## Done when (this step)
- [ ] `npm run build` is clean. To confirm the endpoint + shape, run in a terminal (no auth needed):
      ```bash
      curl -s "https://musicbrainz.org/ws/2/artist?query=AC%5C%2FDC&fmt=json&limit=1"
      ```
      → JSON whose `artists[0]` has an `id` (a UUID MBID) and a `country` of `AU`. The escaped `AC\/DC` matches;
      the unescaped `AC/DC` would not.

## If it breaks
- **`Property 'musicbrainz' does not exist on type ...environment`** → the `musicbrainz` block wasn't added to
  both environment files in M2 (step 06). Add it to `environment.ts` too.
- **Search returns `artists: []` for a punctuated name** → the name reached MusicBrainz unescaped. Confirm
  `escapeLucene` is applied to the `query` param, and that its character class still includes `/` and `:`.
- **`503` / `Service Unavailable` in bursts** → you exceeded 1 req/s. That's the gate's job, not this client's —
  make sure `musicbrainz.org` is matched in `RateLimiters.byHost` (M2 step 07); don't add a `setTimeout` here.

---
> Nav: [← Wikidata SPARQL](01_wikidata-sparql.md) · [Overview](00_overview.md) · [Two-tier resolver →](03_two-tier-resolver.md)
