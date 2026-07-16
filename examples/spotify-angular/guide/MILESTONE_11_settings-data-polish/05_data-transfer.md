# M11 · Step 05 of 10 — The data-transfer service: export, wipe, import
> Nav: [← Grow the canvas](04_canvas-palette-capture.md) · [Overview](00_overview.md) · [The settings panel →](06_settings-panel.md)

## Glossary for this step
> **portable key** — an `evm.*` localStorage entry that's safe to move between browsers: namespaced app data,
> **not** a secret (`evm.spotify.*`) and **not** per-browser transient state (`evm.ratelimit.*`, `evm.syncState`).
> **data bundle** — the versioned, self-describing JSON wrapper the export produces: `{ format, version,
> exportedAt, data }`, where `data` maps each portable key to its stored value.

## Why / design
This service is what makes the whole dataset **portable** — the reason the app persists to `localStorage` at all
([R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted)). It has exactly three jobs:
`serialize` (export), `clear` (wipe), `apply` (import). Two design rules matter:

1. **Keys are discovered dynamically, never hard-coded.** `portableKeys()` walks `localStorage` at runtime and
   keeps every `evm.*` key **except** the auth prefix (`evm.spotify.*` — secret, tied to *this* browser's PKCE
   flow, so you just log in again on the other browser) and the transient prefixes (`evm.ratelimit.*` — 429
   cooldowns you don't want to carry; `evm.syncState` — per-browser last-sync timestamps that must stay local so
   the destination always reconciles a fresh import against Spotify). Because nothing is listed by name, a cache
   added in *any* milestone (M3's origins, M9's view-prefs, M11's appearance, …) exports automatically.

2. **Import validates *before* it wipes.** `apply` parses + validates the bundle first and **throws** on
   anything that isn't a real EarthViewMusic bundle (or a newer format version) — so a bad file changes nothing.
   Only after validation does it `clear()` the portable keys and write the bundle's keys back, and it re-checks
   `isPortable` on each restored key so a tampered file can't inject auth or foreign keys. It **replaces**, not
   merges, so the destination can't become a half-old/half-new hybrid.

> 📚 New concept — why a `version` field: the bundle stamps `version: 1`. `apply` refuses a bundle whose
> `version` is **greater** than the code's `VERSION` ("made by a newer version") but accepts equal-or-older, so a
> future format bump can add a migration path instead of silently mis-reading an old file.

**Load-bearing:** `FORMAT = 'earthviewmusic'`, the `KEY_PREFIX` / `AUTH_PREFIX` / `TRANSIENT_PREFIXES` strings,
and the bundle field names are load-bearing — an export from one build must import into another.

## Do this
1. Create `src/app/core/cache/data-transfer.ts` with the code below.
2. It has no Angular dependencies beyond `@Injectable` — it talks to `localStorage` directly (it *is* the
   storage-portability layer, so it's the one place that walks raw keys rather than going through a typed cache).

## Code
### `src/app/core/cache/data-transfer.ts`
```ts
import { Injectable } from '@angular/core';

const FORMAT = 'earthviewmusic';
const VERSION = 1;

/** Every app localStorage entry is namespaced with this prefix. */
const KEY_PREFIX = 'evm.';
/**
 * Auth keys (`evm.spotify.*`) are deliberately excluded from transfer: they're secret and tied to
 * this browser's PKCE flow, so the user simply logs in again on the other browser.
 *
 * Everything else under {@link KEY_PREFIX} is portable and discovered dynamically — the origins
 * dataset, the liked-songs index, appearance, and every preference — so a new cache is exported
 * automatically without anyone remembering to add it to a list.
 */
const AUTH_PREFIX = 'evm.spotify.';
/**
 * Transient, per-browser session state that must never travel in a bundle:
 *  - `evm.ratelimit.*` — 429 cooldowns/schedule; carrying one would needlessly delay the destination.
 *  - `evm.syncState` — per-browser last-sync timestamps. Exporting them would make the destination's
 *    staleness guard skip its reconcile (up to 15 min), silently showing imported data unverified
 *    against Spotify. The destination should always reconcile a fresh import, so this stays local.
 * Each browser tracks its own.
 */
const TRANSIENT_PREFIXES = ['evm.ratelimit.', 'evm.syncState'];

/** Whether a localStorage key is portable app data (namespaced, and not a secret/transient key). */
function isPortable(key: string): boolean {
  return (
    key.startsWith(KEY_PREFIX) &&
    !key.startsWith(AUTH_PREFIX) &&
    !TRANSIENT_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

/** A versioned, self-describing snapshot of the portable localStorage entries. */
export interface DataBundle {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  /** Each portable key's stored value (parsed JSON, or the raw string for bare-string entries). */
  data: Record<string, unknown>;
}

/** Serialises/restores the app's portable data so it can be moved between browsers as one JSON file. */
@Injectable({ providedIn: 'root' })
export class DataTransfer {
  /** Bundle every portable localStorage entry into a pretty-printed JSON string. */
  serialize(now: Date): string {
    const data: Record<string, unknown> = {};
    for (const key of portableKeys()) {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        continue;
      }
      // Keep structured values readable in the file; any bare-string entries stay as-is.
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
    const bundle: DataBundle = {
      format: FORMAT,
      version: VERSION,
      exportedAt: now.toISOString(),
      data,
    };
    return JSON.stringify(bundle, null, 2);
  }

  /**
   * Wipe every portable entry (globe dataset, liked index + preferences) from localStorage. The
   * Spotify auth keys are left untouched — same scope as {@link serialize} — so the user stays
   * logged in. Returns how many entries were actually removed.
   */
  clear(): number {
    const keys = portableKeys();
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    return keys.length;
  }

  /**
   * Validate a bundle and write its entries back to localStorage, **replacing** the destination's
   * current data (not merging). Portable keys are wiped first, so a destination holding keys the
   * bundle lacks (a different app version, or a partial older export) can't end up a hybrid,
   * internally-inconsistent dataset. Only portable keys are restored, so a tampered/old bundle can
   * never inject auth or foreign keys. Returns how many entries were restored. Throws if the JSON
   * isn't an EarthViewMusic bundle — validation runs *before* the wipe, so a bad file changes nothing.
   */
  apply(json: string): number {
    const parsed: unknown = JSON.parse(json);
    if (!isBundle(parsed)) {
      throw new Error('Not an EarthViewMusic data file.');
    }
    if (parsed.version > VERSION) {
      throw new Error('This data file was made by a newer version of EarthViewMusic.');
    }
    this.clear();
    let restored = 0;
    for (const [key, value] of Object.entries(parsed.data)) {
      if (!isPortable(key)) {
        continue;
      }
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      restored++;
    }
    return restored;
  }
}

/** The current portable localStorage keys — every `evm.*` entry except the secret auth keys. */
function portableKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null && isPortable(key)) {
      keys.push(key);
    }
  }
  return keys;
}

function isBundle(value: unknown): value is DataBundle {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate['format'] === FORMAT &&
    typeof candidate['version'] === 'number' &&
    candidate['data'] !== null &&
    typeof candidate['data'] === 'object'
  );
}
```

## Done when (this step)
- [ ] `npm run build` → clean.
- [ ] In the console (with a prior scan, so `evm.origins` etc. exist):
      `JSON.parse(getService(DataTransfer).serialize(new Date())).data` — or, once the panel is wired (step 06),
      the exported file — lists `evm.origins`, `evm.appearance`, `evm.viewPrefs`, … and contains **no**
      `evm.spotify.*`, `evm.ratelimit.*`, or `evm.syncState` key.
- [ ] `apply('{"nope":true}')` throws `Not an EarthViewMusic data file.` **and** `localStorage` is unchanged
      (validate-before-wipe).

## If it breaks
- **Export includes `evm.spotify.*`** → the `AUTH_PREFIX` check in `isPortable` is missing/misspelled; the auth
  keys must never leave the browser.
- **Import leaves the old data mixed with the new** → `apply` didn't call `this.clear()` before writing, so keys
  the bundle lacked survived. `apply` must wipe (after validating) then restore.
- **A large library throws `QuotaExceededError` on import** → `localStorage` is ~5–10 MB
  ([R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted)); the shared `storage-cache`
  already warns once per session on quota — the import itself uses raw `setItem`, so a giant bundle can still hit
  the ceiling. That's the documented trade-off, not a bug.

---
> Nav: [← Grow the canvas](04_canvas-palette-capture.md) · [Overview](00_overview.md) · [The settings panel →](06_settings-panel.md)
