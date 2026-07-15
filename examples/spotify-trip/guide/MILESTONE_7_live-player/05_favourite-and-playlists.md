# M7 · Step 05 of 8 — Toggle ❤ + add-to-playlist
> Nav: [← Optimistic controls](04_optimistic-controls.md) · [Overview](00_overview.md) · [The player-bar component →](06_player-bar.md)

## Why / design
The last three `PlayerStore` methods finish the control surface:

- **`toggleFavourite()`** — like/unlike the current track (`user-library-modify`), the same optimistic pattern
  as the transport controls: flip the ❤ signal **and** the memo immediately, call `saveTracks` /
  `removeSavedTracks`, and revert both on failure. Updating the memo (from step 03) keeps the indicator correct
  if you skip away and back. A 403 here means the token predates `user-library-modify` → a specific toast.
- **`loadPlaylists()`** — lazily fetch the playlists the user can *write* to (owned or collaborative), for the
  "add to playlist" menu. It's a no-op once loaded, and it needs the current user's id (`getMe`) to decide
  ownership. Failures toast and leave the list empty.
- **`addCurrentToPlaylist(playlistId)`** — append the current track to a playlist. **No optimistic update and
  no undo** — a playlist edit isn't reversible from here, so it just fires and toasts the result.

> Why lazy? Most sessions never open the playlist menu, and paging every playlist is several requests through
> the rate-limit gate. `loadPlaylists()` runs only when the menu opens (wired in step 06 via `(menuOpened)`),
> and the `if (already loaded) return` guard means opening it twice costs nothing.

## Do this
All edits are in `src/app/features/player/player-store.ts`. Add these three methods inside the `PlayerStore`
class (e.g. after `toggleShuffle`, before the private `control`). No new imports are needed — `Toast` and the
`_playlists` / `_playlistsLoading` / `myUserId` fields already exist from steps 03–04.

## Code
### Add inside the `PlayerStore` class
```ts
  /**
   * Add or remove the current track to/from the user's Liked Songs (`user-library-modify`),
   * optimistically flipping the heart and reverting on failure. The memo is updated too, so the
   * indicator stays correct if the track is skipped to and back.
   */
  async toggleFavourite(): Promise<void> {
    const trackId = this._state()?.trackId ?? null;
    if (trackId === null) {
      return;
    }
    const current = this._isFavourite() ?? false;
    const next = !current;
    this._isFavourite.set(next);
    this.favouriteMemo.set(trackId, next);
    try {
      if (next) {
        await this.api.saveTracks([trackId]);
      } else {
        await this.api.removeSavedTracks([trackId]);
      }
    } catch (error) {
      this._isFavourite.set(current);
      this.favouriteMemo.set(trackId, current);
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.toast.error(
        status === 403
          ? 'Liking songs needs the latest permissions — log out and back in.'
          : 'Could not update your Liked Songs.',
      );
    }
  }

  /**
   * Lazily load the playlists the user can write to (owned or collaborative), for the "add to
   * playlist" menu. No-op once loaded; failures toast and leave the list empty.
   */
  async loadPlaylists(): Promise<void> {
    if (this._playlists().length > 0 || this._playlistsLoading()) {
      return;
    }
    this._playlistsLoading.set(true);
    try {
      if (this.myUserId === null) {
        this.myUserId = (await this.api.getMe()).id;
      }
      const me = this.myUserId;
      const playlists = await this.api.getMyPlaylists();
      this._playlists.set(playlists.filter((p) => p.ownerId === me || p.collaborative));
    } catch {
      this.toast.error('Could not load your playlists.');
    } finally {
      this._playlistsLoading.set(false);
    }
  }

  /** Append the current track to a playlist by id (no undo — playlist edits stand). */
  async addCurrentToPlaylist(playlistId: string): Promise<void> {
    const trackId = this._state()?.trackId ?? null;
    if (trackId === null) {
      return;
    }
    try {
      await this.api.addTracksToPlaylist(playlistId, [`spotify:track:${trackId}`]);
      this.toast.info('Added to playlist.');
    } catch {
      this.toast.error('Could not add to the playlist.');
    }
  }
```

## Done when (this step)
- [ ] `npm run build` and `npm run lint` → both clean. `PlayerStore` is now complete: `toggleFavourite`,
  `loadPlaylists`, and `addCurrentToPlaylist` are public, and every field declared in step 03 (`_playlists`,
  `_playlistsLoading`, `myUserId`, `favouriteMemo`) is now used.
- [ ] The full `PlayerStore` file matches the checkpoint in [08_verify.md](08_verify.md).

## If it breaks
- **`'_playlists' is declared but never read`** → this step is what uses it. If you skipped step 03's field
  declarations, add them back; the fields live in the class body from step 03.
- **`toast.info is not a function`** → `Toast` (M1) has `error`, `info`, and `action`. Confirm you imported the
  `Toast` from `../../shared/toast` in step 04.
- **Playlist menu later shows nothing** → `loadPlaylists` filters to `ownerId === me || collaborative`; if the
  user's id (`getMe`) failed, `me` is stale. That surfaces as the "Could not load your playlists." toast, not a
  silent empty menu.
