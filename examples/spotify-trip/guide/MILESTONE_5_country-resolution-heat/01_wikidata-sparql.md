# M5 · Step 01 of 10 — The Wikidata SPARQL client (batched, by Spotify id)
> Nav: — · [Overview](00_overview.md) · [MusicBrainz fallback →](02_musicbrainz-fallback.md)

**This step creates two files, committed together:** `src/app/core/dto/wikidata.dto.ts` (the raw result shape)
and `src/app/core/api/wikidata-api.ts` (the typed client). They ship as one commit because the client is
meaningless without the DTO it parses.

## Glossary for this step
> **SPARQL** — the query language for **Wikidata**'s graph database. One query can resolve all 50 artists in a
> batch at once. [glossary](../foundation/glossary.md#sparql) · [docs](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service).
> **P-property** — a Wikidata property id, e.g. `P495` (country of origin) or `P297` (ISO alpha-2). Statements
> in Wikidata are `subject → property → value`, so "this artist's country" is a P-property lookup.
> [glossary](../foundation/glossary.md#p-property).
> **ISO 3166-1 alpha-2** — the two-letter country code (`US`, `GB`, `BR`) that matches a GeoJSON polygon's
> `ISO_A2` field. This is the *output* of resolution. [glossary](../foundation/glossary.md#iso-3166-1-alpha-2).

## Why / design
A Spotify track gives us an artist **id** and **name**, not a country. Wikidata knows the country for a huge
share of notable artists — and, crucially, it stores each artist's **Spotify artist id** as property `P1902`.
That lets us look artists up by the id we already have (exact, no fuzzy name matching) and get back an ISO code,
**50 at a time in a single request**. This is the *fast pass* of the two-tier resolver
([D3](../foundation/decision-log.md#d3--two-tier-country-resolution)).

> 📚 New concept — **How a SPARQL query is shaped.** Read the query below as: "find rows of `?spotifyId` and
> `?iso`, where…". The `WHERE` block is a set of graph patterns (`subject property object`), each ending in a
> period:
> - `VALUES ?spotifyId { "id1" "id2" … }` — seed the query with the exact batch of Spotify ids we're asking about.
> - `?artist wdt:P1902 ?spotifyId.` — bind `?artist` to whatever entity has that Spotify id (`wdt:` is the
>   "truthy value" prefix for a P-property).
> - `OPTIONAL { … }` — try to match, but don't drop the row if it's missing. We try three country sources in
>   priority order: `P495` (country of origin), then `P740`→`P17` (location of formation → its country), then
>   `P27` (country of citizenship).
> - `BIND(COALESCE(?origin, ?formed, ?citizen) AS ?country)` — pick the **first** of those that exists. This
>   is the priority chain: origin beats formation-place beats citizenship.
> - `?country wdt:P297 ?iso.` — map that country entity to its ISO 3166-1 alpha-2 code (`P297`).
> - `ORDER BY ?spotifyId ?iso` — sort deterministically (see below).
>
> See the [Wikidata SPARQL service docs](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service).

**Why `ORDER BY` + keep-first-row matters (determinism).** An artist can have several origins/citizenships
(a dual national, a band with members from two countries). Without a sort, WDQS may return those rows in any
order, so the "first" one we keep could differ between runs — the globe would flicker a country between reloads.
`ORDER BY ?spotifyId ?iso` makes the rows come back sorted, and we **keep the first row per id**, so we always
pick the alphabetically-first ISO code — the *same* one every run. That's the deterministic tie-break the
Done-when gate checks.

## Do this
1. In `src/app/core/dto/`, create `wikidata.dto.ts` with the result shape below. A **DTO** is the raw API
   payload; a mapper (or here, the client itself) turns it into domain data so the raw shape never leaks out.
   The SPARQL JSON nests every value under `.value`, so each binding field is `{ value: string }`.
2. In `src/app/core/api/`, create `wikidata-api.ts` with the client below.
3. `countriesBySpotifyIds(ids)` builds the batched query and returns a `Map<spotifyId, iso>` covering **only
   the ids that resolved** — absent ids mean "unresolved", which the caller handles. `countryByMbid(mbid)` is
   the single-artist bridge the MusicBrainz fallback (step 02–03) uses.
4. Both methods wrap the HTTP call in `withRetry` (M2) for transient failures. Pacing + 429 handling are
   already done for you: the M2 rate-limit interceptor matches `query.wikidata.org` by URL prefix and paces it
   through the shared Wikidata gate — **this client adds no throttle of its own.**
5. Load-bearing: the P-property ids (`P1902`, `P495`, `P740`, `P17`, `P27`, `P297`), the `Accept:
   application/sparql-results+json` header, and `environment.wikidata.sparqlUrl`. The SPARQL variable names
   (`?spotifyId`, `?iso`, `?artist`, …) are cosmetic *inside* the query, but `?spotifyId`/`?iso` must match the
   DTO field names you read in `results.bindings`.

## Code
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

## Done when (this step)
- [ ] `npm run build` is clean. To sanity-check the query itself before it's wired in, paste this into the
      [Wikidata Query Service](https://query.wikidata.org) and run it — Rihanna's Spotify id `5pKCCKE2ajJHZ9KAiaK11H`:
      ```sparql
      SELECT ?spotifyId ?iso WHERE {
        VALUES ?spotifyId { "5pKCCKE2ajJHZ9KAiaK11H" }
        ?artist wdt:P1902 ?spotifyId.
        OPTIONAL { ?artist wdt:P495 ?origin. }
        OPTIONAL { ?artist wdt:P740 ?place. ?place wdt:P17 ?formed. }
        OPTIONAL { ?artist wdt:P27 ?citizen. }
        BIND(COALESCE(?origin, ?formed, ?citizen) AS ?country)
        ?country wdt:P297 ?iso.
      } ORDER BY ?spotifyId ?iso
      ```
      → at least one row; the first `iso` is `BB` (Barbados, alphabetically before `US`). That first-row-wins
      order is exactly what the client keeps.

## If it breaks
- **`Property 'wikidata' does not exist on type ...environment`** → the `wikidata` block wasn't added to
  **both** `environment.ts` and `environment.development.ts` in M2 (step 06). TypeScript type-checks against
  `environment.ts`; add it there too.
- **Query returns nothing for an artist you know is on Wikidata** → the artist's Wikidata item has no `P1902`
  (Spotify id) statement, so the fast pass can't find it by id. That's expected — the MusicBrainz fallback
  (steps 02–03) catches it by name.
- **`400 Bad Request` from WDQS** → a malformed query string, usually a stray quote from an id. Spotify ids are
  base-62 so they need no escaping; if you changed the interpolation, revert it.
