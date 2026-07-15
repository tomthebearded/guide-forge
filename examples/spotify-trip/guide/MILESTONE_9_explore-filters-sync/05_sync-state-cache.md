# M9 · Step 05 of 14 — Persist per-domain sync timestamps
> Nav: [← Grow GlobeStore](04_globe-store-grow.md) · [Overview](00_overview.md) · [BootSync + the nav guard →](06_boot-sync.md)

## Glossary for this step
> **staleness guard** — the rule that a data domain is *skipped* on open when it was reconciled less than a
> fixed window ago (here 15 min), so a warm reopen does zero network. This cache is where those "last synced"
> timestamps live.
> **domain** — one of the three data areas the app reconciles independently: `liked` (the globe dataset),
> `playlists` (the membership index), `artists` (genres + follow state).

## Why / design
Boot-sync (next step) must know when each domain last synced so it can skip fresh ones. That's a tiny bit of
state — three timestamps — but it has to **survive reloads** (the whole point of a staleness guard is a warm
*reopen*), so it's a `localStorage` cache like all the others: one namespaced key (`evm.syncState`), a
`version` field, and a validator that coerces anything malformed back to "never synced" rather than throwing.

**Recurring model:** same `storage-cache` read/write/validate shape as every other cache. The `revive`
validator returns `undefined` on a version mismatch or bad shape, so `readJson` falls back to `EMPTY` — a
corrupt or old-format entry silently degrades to "never synced" (worst case: one extra sync), never a crash.

## Do this
1. Create `src/app/core/cache/sync-state-cache.ts` with the `DomainSyncState` + `SyncState` interfaces, the
   `SyncStateCache` service, and the `revive` / `domain` validators.
2. The key `evm.syncState` is **load-bearing** (must match the M11 export's key list); the three domain names
   `liked` / `playlists` / `artists` are **load-bearing** (boot-sync indexes state by them).

## Code
### `src/app/core/cache/sync-state-cache.ts`
```ts
import { Injectable } from '@angular/core';

import { readJson, removeJson, writeJson } from './storage-cache';

const STORAGE_KEY = 'evm.syncState';
const VERSION = 1;

/** When each data domain was last reconciled with Spotify (epoch ms), or null if never. */
export interface DomainSyncState {
  lastSyncedAt: number | null;
}

/**
 * Per-domain last-sync timestamps that drive the boot-time staleness guard: a domain is skipped on
 * open when it was reconciled less than the guard window ago, so a warm reopen costs zero network.
 */
export interface SyncState {
  liked: DomainSyncState;
  playlists: DomainSyncState;
  artists: DomainSyncState;
}

const EMPTY: SyncState = {
  liked: { lastSyncedAt: null },
  playlists: { lastSyncedAt: null },
  artists: { lastSyncedAt: null },
};

/** Persists the three domains' last-sync timestamps (globe/liked, playlists, artist info). */
@Injectable({ providedIn: 'root' })
export class SyncStateCache {
  load(): SyncState {
    return readJson(STORAGE_KEY, revive, EMPTY);
  }

  save(state: SyncState): void {
    writeJson(STORAGE_KEY, { version: VERSION, ...state });
  }

  clear(): void {
    removeJson(STORAGE_KEY);
  }
}

function revive(parsed: unknown): SyncState | undefined {
  if (parsed === null || typeof parsed !== 'object') {
    return undefined;
  }
  const candidate = parsed as Record<string, unknown>;
  if (candidate['version'] !== VERSION) {
    return undefined;
  }
  return {
    liked: domain(candidate['liked']),
    playlists: domain(candidate['playlists']),
    artists: domain(candidate['artists']),
  };
}

/** Coerce one persisted domain entry into a valid {@link DomainSyncState}. */
function domain(value: unknown): DomainSyncState {
  if (value !== null && typeof value === 'object') {
    const at = (value as Record<string, unknown>)['lastSyncedAt'];
    if (typeof at === 'number') {
      return { lastSyncedAt: at };
    }
  }
  return { lastSyncedAt: null };
}
```

## Done when (this step)
- [ ] `npm run build` → `Application bundle generation complete`, no errors — the cache compiles.
- [ ] Nothing writes it yet, so `localStorage.getItem('evm.syncState')` → `null` after serving. It gets stamped
      by boot-sync in the next step (proven in [step 15](15_verify.md): after a sync, the key holds a JSON object
      with numeric `lastSyncedAt` per domain).

## If it breaks
- **`readJson`/`writeJson`/`removeJson` not found** → the shared `storage-cache` helpers are from M3; the import
  path is `./storage-cache`.
- **Type error on `{ version: VERSION, ...state }`** → `writeJson` accepts `unknown`; if it's generic, pass the
  object as-is — don't cast to `SyncState` (the version field isn't part of that interface, by design).
