# M10 · Step 06 of 18 — Grow `PlaylistIndex`: membership reads + edits
> Nav: [← Grow LikedIndex](05_liked-index-grow.md) · [Overview](00_overview.md) · [Grow GlobeStore →](07_globe-store-grow.md)

## Glossary for this step
> **membership read** — asking the built index "which of my playlists is this track in?" (or "which
> playlist-held tracks credit this artist?") with no network — the whole reason the index was built in M9.
> **membership edit** — patching the index in memory after a Spotify add/remove confirms, so the chips update
> without re-paging every playlist.

## Why / design
M9 built the `PlaylistIndex` and left a `// grows in M10` marker for its **library consumers**. This step fills
it: the reads the artist page renders and the edits the store applies after a Spotify change. Five additions:

- **`editablePlaylists`** (computed) — the playlists the user can write to (owned or collaborative). Gates every
  add/remove affordance in the UI.
- **`playlistIdsForTrack(trackId)`** — ids of the user's playlists currently holding a track (for the chips).
- **`tracksByArtist(artistId)`** — playlist-held tracks crediting an artist (the "In your playlists" section —
  catches tracks the discography misses, e.g. features on others' albums).
- **`playlistById(id)`** — resolve a playlist id to its full object (name + editability).
- **`addMembership(ref, playlistId)` / `removeMembership(trackId, playlistId)`** — patch the index after a
  Spotify add/remove confirms, bumping `revision` + re-persisting (they reuse the M9 `upsert` helper and the
  `dropPlaylist`-style cleanup).

> **Recurring model:** this mirrors `LikedIndex` (step 05) — dumb, synchronous patches that bump a `revision`
> signal and re-persist; the store (step 08) owns the "Spotify first, then patch" ordering.

The M9 `playlist-index.ts` is long, so these are shown as **additions**; the whole file lands in [step 18](18_verify.md).

## Do this
1. In `src/app/core/pipeline/playlist-index.ts`, add the `editablePlaylists` computed alongside the other
   `readonly` signals near the top (it reads `_myUserId` + `_playlists`).
2. Add the three read methods and the two edit methods (below), removing the `// grows in M10` comment.
3. `addMembership` reuses the file's existing `upsert` helper; `removeMembership` mirrors the private
   `dropPlaylist` cleanup (delete the entry once it's in no playlists).

## Code
### `src/app/core/pipeline/playlist-index.ts` — add the `editablePlaylists` computed (with the readonly signals)
```ts
/** Playlists the user can add to / remove from (owned by them or collaborative). */
readonly editablePlaylists = computed(() => {
  const me = this._myUserId();
  return this._playlists().filter((p) => p.ownerId === me || p.collaborative);
});
```

### `src/app/core/pipeline/playlist-index.ts` — add the membership reads
```ts
// --- Library membership reads (M10) ---

/** Ids of the user's playlists currently containing the given track. */
playlistIdsForTrack(trackId: string): string[] {
  this.ensureLoaded();
  return this.byId.get(trackId)?.playlistIds ?? [];
}

/** Playlist-held tracks crediting the given artist (for the "In your playlists" section). */
tracksByArtist(artistId: string): PlaylistTrackEntry[] {
  this.ensureLoaded();
  return [...this.byId.values()].filter((entry) => entry.artistIds.includes(artistId));
}

/** Resolve a playlist id to its full object (name + editability), or undefined if unknown. */
playlistById(id: string): Playlist | undefined {
  return this._playlists().find((p) => p.id === id);
}
```

### `src/app/core/pipeline/playlist-index.ts` — add the membership edits
```ts
// --- Library membership edits (M10 — applied after a Spotify playlist change confirms) ---

/** Add a track to a playlist's membership, then persist + bump the revision. */
addMembership(ref: PlaylistTrackRef, playlistId: string): void {
  this.ensureLoaded();
  upsert(this.byId, ref, playlistId);
  this.persist();
  this._revision.update((r) => r + 1);
}

/** Drop a track from a playlist; remove the entry entirely once it's in no playlists. */
removeMembership(trackId: string, playlistId: string): void {
  this.ensureLoaded();
  const entry = this.byId.get(trackId);
  if (entry === undefined) {
    return;
  }
  entry.playlistIds = entry.playlistIds.filter((id) => id !== playlistId);
  if (entry.playlistIds.length === 0) {
    this.byId.delete(trackId);
  }
  this.persist();
  this._revision.update((r) => r + 1);
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — `PlaylistIndex` now exposes
      `editablePlaylists`, `playlistIdsForTrack`, `tracksByArtist`, `playlistById`, `addMembership`,
      `removeMembership`; the `// grows in M10` marker is gone.
- [ ] `npm run lint` → clean — `editablePlaylists` returns `Playlist[]`, `tracksByArtist` `PlaylistTrackEntry[]`
      (no `any`).

## If it breaks
- **`upsert is not defined`** → it's the module-level helper from M9's `playlist-index.ts`; `addMembership` reuses
  it — don't redeclare it.
- **`Property 'byId' / '_myUserId' / '_revision' is private`** → these methods belong **inside** the
  `PlaylistIndex` class (so they can reach the private working map + signals), not in a separate file.
- **`tracksByArtist` name clash** → both `LikedIndex` and `PlaylistIndex` have a `tracksByArtist` — that's fine,
  they're different services; the store calls each explicitly.

---
> Nav: [← Grow LikedIndex](05_liked-index-grow.md) · [Overview](00_overview.md) · [Grow GlobeStore →](07_globe-store-grow.md)
