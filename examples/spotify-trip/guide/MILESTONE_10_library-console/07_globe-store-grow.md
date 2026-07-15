# M10 · Step 07 of 18 — Grow `GlobeStore`: follow / genre write-back helpers
> Nav: [← Grow PlaylistIndex](06_playlist-index-grow.md) · [Overview](00_overview.md) · [The LibraryStore orchestrator →](08_library-store.md)

## Glossary for this step
> **write-back** — the library edits an artist's follow state or genres, and the change is written *back* onto
> the shared globe dataset (where those fields live), so it persists and the globe re-colours consistently.

## Why / design
Following state and genre tags live on the **globe dataset** (`ArtistOrigin.following` / `.genres`), resolved in
bulk during a scan (M9's sweeps). The library reads and edits those fields — but rather than duplicate the
storage, it goes through `GlobeStore`, which owns and persists the dataset. M9 left a `// grows in M10` marker
for exactly these four helpers:

- **`followingOf(artistId)` / `genresOf(artistId)`** — reads off the current dataset (`boolean | undefined` /
  `string[] | undefined`; `undefined` = not yet checked).
- **`setFollowing(artistId, value)`** — record a follow/unfollow locally (the optimistic UI from the library
  list); sticky + persisted via `saveDebounced()`.
- **`setGenres(artistId, genres)`** — fold fresh genre tags back in (the artist page's `GET /artists/{id}` already
  returns them on open, so no separate fetch is needed).

> **Recurring model — one dataset, one owner ([decision-log D5](../foundation/decision-log.md#d5--likedindex-is-a-byproduct-of-the-globe-scan-tripexplore-are-overlay-toggles)):** the globe scan is the single source of the
> per-artist dataset; the library *edits through* it rather than keeping a parallel copy. `setFollowing` /
> `setGenres` `publish()` + `saveDebounced()` so a follow toggle both re-colours anything that reads the dataset
> and survives a reload.

These are shown as **additions**; the whole `globe-store.ts` lands in [step 18](18_verify.md).

## Do this
1. In `src/app/features/globe/globe-store.ts`, replace the `// grows in M10` comment block (the one noting the
   deferred `following` / `genres` helpers, after `countryOf`) with the two read helpers below.
2. Add the two write helpers (`setFollowing`, `setGenres`) — `setFollowing` beside the reads; `setGenres` fits
   naturally next to `setCountry` (both mutate one artist + `publish()` + `saveDebounced()`).
3. Both writers early-return if the artist isn't in `this.working` — the library only edits artists that came
   from a scan, so there's nothing to create here.

## Code
### `src/app/features/globe/globe-store.ts` — add the read helpers (replacing the `// grows in M10` note)
```ts
/** Whether the user follows an artist (from the dataset), or undefined if not yet checked. */
followingOf(artistId: string): boolean | undefined {
  return this._artists().get(artistId)?.following;
}

/** Spotify genre tags for an artist (from the dataset), or undefined if not yet checked. */
genresOf(artistId: string): string[] | undefined {
  return this._artists().get(artistId)?.genres;
}

/** Record a follow/unfollow locally (optimistic UI from the library list); sticky + persisted. */
setFollowing(artistId: string, value: boolean): void {
  const artist = this.working.get(artistId);
  if (artist === undefined) {
    return;
  }
  artist.following = value;
  this.publish();
  this.saveDebounced();
}
```

### `src/app/features/globe/globe-store.ts` — add `setGenres` (beside `setCountry`)
```ts
/** Fold fresh genre tags for an artist back into the dataset (from the artist page's `GET /artists/{id}`). */
setGenres(artistId: string, genres: string[]): void {
  const artist = this.working.get(artistId);
  if (artist === undefined) {
    return;
  }
  artist.genres = genres;
  this.publish();
  this.saveDebounced();
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — `GlobeStore` now exposes
      `followingOf`, `genresOf`, `setFollowing`, `setGenres`; the `// grows in M10` marker is gone.
- [ ] The globe still colours from restored data on reload (nothing regressed) — the additions are read/patch
      helpers only; `restore` / the scan pipeline are untouched.

## If it breaks
- **`Property 'working' / '_artists' is private`** → these helpers belong **inside** the `GlobeStore` class (they
  read the private `_artists` signal and mutate the private `working` map).
- **A follow toggle doesn't persist across reload** → `setFollowing` must call `this.saveDebounced()` (and
  `publish()` so the read helper's `_artists` snapshot updates) — both are required.
- **`setGenres` throws for an artist opened from the library that isn't in the dataset** → it early-returns when
  the artist isn't in `working`; a library artist always came from a scan, so this is a safe no-op, not a bug.
