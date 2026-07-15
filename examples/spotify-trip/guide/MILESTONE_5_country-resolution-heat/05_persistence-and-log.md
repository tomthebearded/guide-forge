# M5 · Step 05 of 10 — Persistence (`origins-cache`) + the log store
> Nav: [← Origin models](04_origin-models.md) · [Overview](00_overview.md) · [GlobeStore →](06_globe-store.md)

**This step creates two files, committed together:** `src/app/core/cache/origins-cache.ts` (persist the dataset)
and `src/app/core/logging/log-store.ts` (a progress-line buffer). Both are direct prerequisites of the
`GlobeStore` in step 06 — the store saves through the cache and logs through the log store.

## Glossary for this step
> **`OriginsCache`** — the typed `localStorage` service that owns the `evm.origins` key, validating on read and
> reporting quota failures on write.
> **`LogStore`** — a tiny in-memory, append-only buffer of human-readable progress lines ("Wikidata: placed 42
> of 50 artists"). Transient — it's a view of the *current* scan, never persisted.

## Why / design
**The cache.** Persistence is `localStorage`, via the shared `storage-cache` primitives from M2
([R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted)). `OriginsCache` is one more
thin wrapper in the established pattern (like M3's `LikedIndexCache`): it owns exactly one `evm.*` key, one
version, and a validator. Two things make it more than a `getItem`/`setItem` pair:
- **Validated read.** `load()` runs the parsed value through `isSnapshot()` — wrong version or missing `artists`
  array → `null` (treated as "no data"), so a partial/legacy blob can't crash the store.
- **Quota-aware write.** `save()` returns a `boolean`. A large library can blow the ~5 MB `localStorage` quota;
  `writeJson` catches the `QuotaExceededError` and returns `false`, so the store can warn **once** instead of
  throwing on every debounced save.

> 📚 New concept — **`LogStore` as a needed prerequisite (flagged).** The `GlobeStore` narrates its scan
> ("Fetched 250 liked songs · 180 artists so far", "MusicBrainz: Bonobo → GB") by pushing lines into a
> `LogStore`. The overlay terminal that *renders* those lines is polished in a later milestone, but the store
> can't compile without something to log to — so we build the buffer here. It's append-only, capped at 250 lines
> (older lines scroll off), and cleared at the start of each scan so the terminal shows only the current run.

## Do this
1. In `src/app/core/cache/`, create `origins-cache.ts`. It imports `readJson`/`writeJson`/`removeJson` from the
   M2 `storage-cache` and the `OriginsSnapshot` model (step 04).
2. `STORAGE_KEY = 'evm.origins'` and `VERSION = 2` are **load-bearing** — the key is the exact string the
   Done-when gate inspects; the version must match the snapshot's `version: 2`.
3. In `src/app/core/logging/`, create `log-store.ts` with the append-only buffer below. `LogLevel` is a small
   union (`'info' | 'success' | 'warn' | 'error'`); `MAX_ENTRIES = 250` caps memory.
4. Both are `@Injectable({ providedIn: 'root' })` singletons. `LogStore.entries` is a readonly signal so a view
   can render it reactively later.

## Code
### `src/app/core/cache/origins-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { OriginsSnapshot } from '../models/origins-snapshot';
import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.origins';
const VERSION = 2;

/** Persists the whole artist-origin dataset to localStorage so it restores instantly on reload. */
@Injectable({ providedIn: 'root' })
export class OriginsCache {
  load(): OriginsSnapshot | null {
    return readJson(STORAGE_KEY, (parsed) => (isSnapshot(parsed) ? parsed : undefined), null);
  }

  /** Persist the snapshot. Returns `false` if localStorage rejected it (e.g. quota exceeded). */
  save(snapshot: OriginsSnapshot): boolean {
    return writeJson(STORAGE_KEY, snapshot);
  }

  clear(): void {
    removeJson(STORAGE_KEY);
  }
}

function isSnapshot(value: unknown): value is OriginsSnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate['version'] === VERSION && Array.isArray(candidate['artists']);
}
```

### `src/app/core/logging/log-store.ts`
```ts
import { Injectable, signal } from '@angular/core';

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface LogEntry {
  readonly id: number;
  readonly level: LogLevel;
  readonly text: string;
}

/** Max lines kept in the live loading terminal; older lines scroll off the top. */
const MAX_ENTRIES = 250;

/**
 * A tiny append-only buffer of human-readable progress lines for the loading-terminal overlay. The
 * pipeline ({@link GlobeStore}) pushes a line whenever it finishes loading something; the overlay
 * renders them live. Transient by design — not persisted — it's a view of the current scan only.
 */
@Injectable({ providedIn: 'root' })
export class LogStore {
  private nextId = 0;
  private readonly _entries = signal<readonly LogEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  /** Append a line to the terminal (default level 'info'). */
  log(text: string, level: LogLevel = 'info'): void {
    this._entries.update((entries) => {
      const next = [...entries, { id: this.nextId++, level, text }];
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    });
  }

  /** Drop every line — called at the start of each scan so the terminal shows only the current run. */
  clear(): void {
    this._entries.set([]);
  }
}
```

## Done when (this step)
- [ ] `npm run build` is clean. In the DevTools console (on `/globe`), verify the round-trip primitives by hand:
      `localStorage.setItem('evm.origins', JSON.stringify({version:2,computedAt:0,oldest:null,newest:null,artists:[]}))`
      then reload — the store's `restore()` (step 06) will accept it. A blob with `version:1` is rejected as
      `null` by `isSnapshot`.

## If it breaks
- **A saved dataset never restores** → the `version` written doesn't equal `2`, or `artists` isn't an array;
  `isSnapshot` then returns `false` and `load()` yields `null`. Check the snapshot builder in step 06.
- **`evm.origins` never appears after a scan** → `save()` returned `false` — almost always
  `QuotaExceededError` on a very large library (`localStorage` is ~5 MB). Confirm via the console; this is the
  accepted R6 trade-off, and the store warns once.
- **Two datasets collide** → you reused `evm.likedIndex` (M3's key) instead of `evm.origins`. Each cache owns
  its own key.
