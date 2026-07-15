# M5 · Step 04 of 10 — The origin models
> Nav: [← Two-tier resolver](03_two-tier-resolver.md) · [Overview](00_overview.md) · [Persistence + log →](05_persistence-and-log.md)

**This step creates two files, committed together:** `src/app/core/models/artist-origin.ts` (one artist's
resolved state) and `src/app/core/models/origins-snapshot.ts` (the whole persisted dataset). They're the shapes
the store (step 06) and the cache (step 05) exchange.

## Glossary for this step
> **`ArtistOrigin`** — a discovered artist plus its (possibly still-pending) resolved country and its weight
> (liked-track count + Σ runtime). The unit the globe aggregates by country.
> **`OriginsSnapshot`** — the versioned, serializable container of the whole dataset, saved to and restored
> from `localStorage` under `evm.origins`.

## Why / design
The globe colours by *country*, but resolution happens per *artist*, and each artist carries the weight (how
many liked tracks, how much runtime) that decides how hot its country burns. `ArtistOrigin` holds all of that,
plus the resolution status flags (`tried` / `failed`) the HUD counts and the workers key off.

`OriginsSnapshot` is deliberately a **flat, plain-data** shape (no methods, no class) so `JSON.stringify` /
`JSON.parse` round-trips it losslessly. Its `version: 2` field is the schema stamp: the cache (step 05) refuses
to load a snapshot whose version it doesn't recognize, so a future format change can't feed stale data into a
newer store.

> 📚 Why `version: 2` (not 1). This is the *second* persisted dataset the app defines — M3's `LikedIndex`
> snapshot is `version: 1` under a different key (`evm.likedIndex`). The number is per-schema, not global; it
> starts at 2 here to match the source project's history. It's load-bearing: the cache checks it exactly.

**Forward-compat fields.** A few optional fields (`manual`, `hidden`, `following`, `genres`) are declared now so
the persisted `version: 2` shape is stable across milestones, but M5 only ever *writes* `manual: false`. They're
marked with the milestone that starts using them — resolution in M5 never sets them, so leaving them here costs
nothing and avoids a schema bump later.

## Do this
1. In `src/app/core/models/`, create `artist-origin.ts` with the interface below. The fields M5 uses:
   `id`, `name`, `trackCount`, `durationMs`, `countryCode`, `tried`, `failed`, `manual`. The optional
   `hidden`/`following`/`genres` are declared for later milestones (see the `// grows in` notes).
2. In `src/app/core/models/`, create `origins-snapshot.ts`. `version` is the literal `2`; `computedAt` is epoch
   ms; `oldest`/`newest` are the Liked-Song `added_at` bounds (ISO 8601) that drive the incremental cursor.
3. Load-bearing: the field **names** (they're serialized verbatim into `evm.origins` and re-read on reload) and
   `version: 2`. `ArtistOrigin` does **not** replace M3's `ArtistRef` in `artist.ts` — that file is untouched
   (see the overview's note).

## Code
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

## Done when (this step)
- [ ] `npm run build` is clean. Both interfaces are pure types (they emit no JS), so the only proof here is that
      importing `OriginsSnapshot` and assigning `version: 2` type-checks, while `version: 1` is a **type error**
      (the literal type enforces the schema stamp).

## If it breaks
- **`Type 'number' is not assignable to type '2'`** when you build the snapshot in step 06 → you wrote
  `version: someNumber`. The field is the literal `2`; write it literally.
- **Fields come back `undefined` after a reload** → a field name in the snapshot doesn't match what the store
  writes. These names are the serialization contract — spell them identically in the store (step 06) and cache
  (step 05).
