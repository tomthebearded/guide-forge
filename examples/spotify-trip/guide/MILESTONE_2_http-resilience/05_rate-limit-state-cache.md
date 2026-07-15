# M2 · Step 05 of 12 — Persist the schedule (`evm.ratelimit.<host>`)
> Nav: [← The gate](04_rate-limit-gate.md) · [Overview](00_overview.md) · [Environment config →](06_environment-config.md)

## Why / design
The gate's `GateStatePersistence` port (step 04) is just an interface — this step gives it a localStorage body,
built on the `readJson` / `writeJson` / `removeJson` helpers from step 02. **Persisting the *whole* schedule is
what actually closes the two burst holes:**

- *"N tabs = N× the rate"* — without a shared store, each tab keeps its own window budget, so three tabs send
  at 3× the intended rate. Sharing one persisted schedule makes them behave like one client.
- *"reload resets the window → fresh burst"* — an in-memory-only window starts empty on every reload, so a
  reload mid-scan fires a fresh burst. Reattaching to the persisted send-log + learned cap prevents that.

Two robustness rules are load-bearing here:

1. **Tolerant `revive`.** A stored blob might be a legacy cooldown-only entry (no `recent`/`lastSent`/`cap`) or
   a half-written blob. `revive` fills any missing field with a safe default so an old entry never throws — the
   validate-on-read rule from step 02.
2. **An elapsed cooldown is normalised to `0`, not dropped.** If the stored `blockedUntil` is in the past,
   `revive` zeroes just that field while keeping the rest of the schedule (the window log + learned cap), so a
   reload after a ban lifts doesn't throw away what the gate learned.

The key is **`evm.ratelimit.<host>`** — a load-bearing name. It's the `evm.*` namespace M2's overview lists, and
it's deliberately excluded from the data-transfer export later (a schedule is transient session state, not
portable app data).

## Do this
1. In `src/app/core/api/`, create `rate-limit-state-cache.ts` with the code below. It imports the storage
   helpers from step 02 and the `GateState` / `GateStatePersistence` types from step 04.
2. `gateStatePersistence(host)` returns an object literal implementing the three port methods (`read`, `write`,
   `clear`), all keyed by `evm.ratelimit.${host}`. `KEY_PREFIX` is **load-bearing** — `evm.ratelimit.` exactly
   (the export exclusion and the M2 gate all key off it). Note the gate drives `read`/`write`; `clear()` is a
   **convenience affordance** to wipe one host's schedule that this guide never calls — it rounds out the port,
   nothing depends on it.
3. Read `revive`: every field runs through the `num()` guard (a finite number, else `0`); `recent` keeps only
   positive numbers; `cap` stays `undefined` when absent (so the gate seeds it from config — step 04's `read()`).

## Code
### `src/app/core/api/rate-limit-state-cache.ts`
```ts
import { readJson, removeJson, writeJson } from '../cache/storage-cache';
import { GateState, GateStatePersistence } from './rate-limit-gate';

/**
 * localStorage-backed {@link GateStatePersistence} for one host's rate-limit schedule — the 429
 * cooldown **and** the rolling-window send log + learned AIMD cap. Sharing the whole schedule (not
 * just the cooldown) across tabs and reloads is what actually closes the "N tabs = N× the rate" and
 * "reload resets the window → fresh burst" holes: every tab/load reattaches to one persisted budget
 * instead of starting a private one. Keyed per host and deliberately kept out of the data-transfer
 * export (see the `evm.ratelimit.` exclusion in `data-transfer.ts`): a schedule is transient,
 * browser/session state, not portable app data.
 */

/** Prefix for every persisted per-host schedule entry. Excluded from data-transfer. */
const KEY_PREFIX = 'evm.ratelimit.';

/** A {@link GateStatePersistence} storing `<host>`'s schedule under `evm.ratelimit.<host>`. */
export function gateStatePersistence(host: string): GateStatePersistence {
  const key = `${KEY_PREFIX}${host}`;
  return {
    load: () => readJson<GateState | null>(key, revive, null),
    save: (state) => void writeJson(key, state),
    clear: () => removeJson(key),
  };
}

/**
 * Revive a stored schedule, staying tolerant of both the legacy cooldown-only shape (no `recent`/
 * `lastSent`/`cap`) and a partially-written blob: any missing field falls back to a safe default so
 * an older entry never throws. An already-elapsed cooldown is normalised to 0 here (rather than
 * dropped) so the rest of the schedule — the window log and learned cap — still survives.
 */
function revive(parsed: unknown): GateState | undefined {
  if (parsed === null || typeof parsed !== 'object') {
    return undefined;
  }
  const c = parsed as Record<string, unknown>;
  const now = Date.now();
  const blockedUntil = num(c['blockedUntil']);
  return {
    blockedUntil: blockedUntil > now ? blockedUntil : 0,
    consecutive: num(c['consecutive']),
    recent: Array.isArray(c['recent']) ? c['recent'].filter((n): n is number => num(n) > 0) : [],
    lastSent: num(c['lastSent']),
    lastGrewAt: num(c['lastGrewAt']),
    // A missing cap means a legacy entry — leave it undefined so the gate seeds it from config.
    cap: typeof c['cap'] === 'number' ? c['cap'] : undefined,
  };
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
```

## Done when (this step)
- [ ] The file compiles. In the DevTools console:
  `localStorage.setItem('evm.ratelimit.test', '{"blockedUntil":0}')` then reloading and reading it back still
  parses — and more importantly, `npm run build` is clean. (The persistence is fully exercised in step 12, where
  `evm.ratelimit.spotify` appears after the first paced call.)

## If it breaks
- **`num()` flagged as unused** → it's used inside `revive`; make sure you copied the whole file, `revive`
  included.
- **`Property 'cap' is missing`** on the `save` call → `save` takes a full `GateState`, and the gate always
  writes one with `cap` present; the `cap?` optionality is only for *reading* legacy blobs.
- **Schedule not shared across tabs** → confirm both `readJson`/`writeJson` are the step-02 helpers (not a
  direct `localStorage.getItem`), and that the key is exactly `evm.ratelimit.<host>` in every tab.
