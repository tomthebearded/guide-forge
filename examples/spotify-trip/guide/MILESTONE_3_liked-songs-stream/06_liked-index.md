# M3 · Step 06 of 07 — The pipeline: the `LikedIndex` store
> Nav: [← The cache](05_liked-index-cache.md) · [Overview](00_overview.md) · [Render the likes →](07_render-likes.md)

## Glossary for this step
> **working set** — the in-memory copy of the index the app reads and mutates during a scan (a `Map` keyed by
> track id). `commit` writes it through to the cache; a read `hydrate`s it back from the cache.
> **upsert** — insert-or-replace: `map.set(id, …)` adds a new key or overwrites an existing one, so re-adding a
> track already seen just refreshes it (no duplicates).
> **revision signal** — a monotonically increasing counter bumped on every change. Non-signal reads (like
> `all()`, which returns a plain array) can't be tracked by Angular, so a computed reads `revision()` to
> declare "recompute me when the index changes".

## Why / design
`LikedIndex` is the app's single source of truth for "your liked songs", and the first **feature store** in
the guide:

> **One store per feature: readonly signals out, methods in.** A `@Injectable({ providedIn: 'root' })` service
> holds private state, exposes it only as `readonly` signals, and mutates it only through methods. Components
> read the signals and call the methods; they never poke the state directly. See
> [conventions](../foundation/conventions.md).

Its lifecycle mirrors the scan (step 07 calls these in order):

1. **`beginFull()`** — clear the working set so removed likes don't linger, and reset the count/cursor. (Its
   sibling `beginIncremental()` keeps what's persisted and merges new likes on top — for the M9 boot-sync;
   built now, unused in M3.)
2. **`add(track)`** — flatten a `LikedTrack` to an `IndexedTrack` (via `toIndexedTrack`) and upsert it by id.
3. **`commit(newest)`** — publish the working set: update the `count` + `newest` signals, bump `revision`, and
   **persist to `localStorage`**. Safe to call **after every page** — that's the per-page watermark commit the
   milestone hinges on.

And the read side:

- **`count` / `newest` / `hasData`** — reactive signals the page binds to.
- **`all()`** — every indexed track (unordered); pair it with `revision()` in a computed so the list recomputes
  as pages commit. Used by the M3 page and later globe aggregates.
- **`tracksByArtist(id)`** — liked tracks featuring an artist, newest-first (the library page consumes it in
  M10; built now).
- **`hydrate()`** — force the persisted snapshot into memory **synchronously**, with no network. This is what
  makes a reload instant: the page calls it on init and the count/list appear from `localStorage` alone.

And the reset:

- **`clear()`** — wipe the working set **and** the persisted snapshot, then bump `revision`. The globe's
  `clearData()` (from M5 on, and the M11 "start fresh" action) calls it so a fresh scan doesn't inherit a stale
  index. Built now because the globe store depends on it two milestones before its own local mutations arrive
  (M10) — the whole public surface of `LikedIndex` is easier to reason about in one place.

> **Why `untracked` inside `ensureLoaded`?** Lazy hydration can be triggered by the first read *inside a
> computed* (a reactive context), where signal *writes* are forbidden. Wrapping the writes in `untracked(...)`
> applies them outside any active consumer, so hydration is safe to trigger from anywhere. See
> [glossary: signal](../foundation/glossary.md#signal).

## Do this
1. Create `src/app/core/pipeline/liked-index.ts` with the code below.
2. The private `byId` map, `loaded` flag, and the `_`-prefixed signals are internal — only the `readonly`
   signals (`count`, `newest`, `hasData`, `revision`) and the methods are public. Field names are cosmetic;
   the method names are the store's contract used by step 07.
3. `commit` calls `persist()` every time — leave that. Committing per page is what makes a mid-scan reload keep
   its progress.

## Code
### `src/app/core/pipeline/liked-index.ts`
```typescript
import { computed, inject, Injectable, signal, untracked } from '@angular/core';

import { LikedIndexCache } from '../cache/liked-index-cache';
import { toIndexedTrack } from '../mappers/spotify.mapper';
import { IndexedTrack } from '../models/indexed-track';
import { LikedTrack } from '../models/liked-track';

/**
 * Flattened, per-track view of the user's Liked Songs — built as a byproduct of the `/me/tracks`
 * scan and persisted via {@link LikedIndexCache}. Reads an artist's liked tracks (with album + ISRC)
 * without re-paging the library. Grows in M9/M10 with incremental merge + relink/dedup mutations.
 */
@Injectable({ providedIn: 'root' })
export class LikedIndex {
  private readonly cache = inject(LikedIndexCache);

  /** Working set keyed by saved track id (each liked track is unique by id). */
  private byId = new Map<string, IndexedTrack>();
  private loaded = false;

  private readonly _count = signal(0);
  private readonly _newest = signal<string | null>(null);

  readonly count = this._count.asReadonly();
  readonly newest = this._newest.asReadonly();
  readonly hasData = computed(() => this._count() > 0);

  /** A scan fed new data — bump this so dependent views recompute. */
  private readonly _revision = signal(0);
  readonly revision = this._revision.asReadonly();

  /**
   * Hydrate the persisted index into memory (idempotent) so `hasData` and lookups reflect the
   * localStorage cache without waiting for a scan. Called when the page opens so a cached library
   * doesn't look empty (which would re-prompt a full scan).
   */
  hydrate(): void {
    this.ensureLoaded();
  }

  /** Liked tracks featuring the given artist, newest-first. */
  tracksByArtist(artistId: string): IndexedTrack[] {
    this.ensureLoaded();
    return [...this.byId.values()]
      .filter((track) => track.artistIds.includes(artistId))
      .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  }

  /** Every indexed liked track (unordered). Pair with {@link revision} inside a computed. */
  all(): IndexedTrack[] {
    this.ensureLoaded();
    return [...this.byId.values()];
  }

  // --- Scan feed (called by the page while paging `/me/tracks`) ---

  /** Begin a full rescan: drop the working set so removed likes don't linger. */
  beginFull(): void {
    this.ensureLoaded();
    this.byId.clear();
    this._newest.set(null);
    this._count.set(0);
  }

  /** Begin an incremental pass: keep what's persisted, merge new likes on top (M9 boot-sync). */
  beginIncremental(): void {
    this.ensureLoaded();
  }

  /** Record one liked track (upsert by id). */
  add(track: LikedTrack): void {
    this.byId.set(track.id, toIndexedTrack(track));
  }

  /** Persist the working set and advance the newest-seen cursor. Safe to call per page. */
  commit(newest: string | null): void {
    this._newest.set(newest);
    this._count.set(this.byId.size);
    this._revision.update((r) => r + 1);
    this.persist();
  }

  // --- Reset (used by a full "start fresh" and the globe's `clearData`, from M5 on) ---

  /** Wipe the index and its persisted snapshot. Leaves `loaded = true` so the next read sees the empty set, not a stale reload. */
  clear(): void {
    this.byId.clear();
    this.loaded = true;
    this._count.set(0);
    this._newest.set(null);
    this.cache.clear();
    this._revision.update((r) => r + 1);
  }

  private ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    const snapshot = this.cache.load();
    if (snapshot !== null) {
      this.byId = new Map(snapshot.tracks.map((track) => [track.id, track]));
    }
    this.loaded = true;
    // Hydration can be triggered by the first read inside a reactive context (a computed reading
    // `all()`); signal writes are forbidden there, so apply them outside any active consumer.
    untracked(() => {
      if (snapshot !== null) {
        this._newest.set(snapshot.newest);
      }
      this._count.set(this.byId.size);
    });
  }

  private persist(): void {
    this.cache.save({ version: 1, newest: this._newest(), tracks: [...this.byId.values()] });
  }
}
```

## Done when (this step)
- [ ] Run `npm run build` → completes clean (`Application bundle generation complete`).
- [ ] `LikedIndex` exposes readonly signals `count`, `newest`, `hasData`, `revision` and methods `hydrate`,
      `all`, `tracksByArtist`, `beginFull`, `beginIncremental`, `add`, `commit`, `clear`.

## If it breaks
- **`build` fails: "Property 'set' does not exist on type 'Signal<number>'"** → you exposed `_count` directly
  or called `.set` on a readonly signal. Mutate the private `_count`; expose `count = this._count.asReadonly()`.
- **`build` fails: "'untracked' is declared but its value is never read" or not found** → add `untracked` to
  the `@angular/core` import list.
- **Runtime: writing to a signal inside a computed throws** → a read path bumped a signal without `untracked`.
  Keep the `_count`/`_newest` writes inside the `untracked(...)` block in `ensureLoaded`.
- **`build` fails: "Property 'clear' does not exist on type 'LikedIndexCache'"** → `clear()` calls
  `this.cache.clear()`, which was added to the cache in [step 05](05_liked-index-cache.md). If it's missing,
  finish step 05 first.
