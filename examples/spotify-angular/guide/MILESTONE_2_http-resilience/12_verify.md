# M2 · Verify — HTTP resilience layer
> Nav: [← Liked-songs summary](11_liked-summary.md) · [Overview](00_overview.md) · [M3 · Liked Songs streaming →](../MILESTONE_3_liked-songs-stream/00_overview.md)

Run the full Done-when gate by hand, then use the **file checkpoint** below to diff any file whose state you
lost track of. Start with the app running (`npm start`) and logged in.

## Done-when gate (the real test — check every box by hand)

### 1. The smoke call renders
- [ ] Open `http://127.0.0.1:4200/globe` → after a moment the page reads **"You have N liked songs."** where N
  is your real Liked Songs count (`0` if you have none). No red toast, no console error.

### 2. Requests are visibly spaced (min-spacing)
- [ ] DevTools → **Network**, filter `api.spotify.com`, tick **Preserve log**, reload `/globe`. You see **two**
  requests: `.../v1/me` and `.../v1/me/tracks?limit=1`. Hover the waterfall / read *Start Time*: the second
  request **starts ≥ 600 ms after** the first — the gate's `minSpacingMs`. (They were fired at the same instant
  by `Promise.all`; the gap is entirely the gate.)

### 3. The schedule persists (cross-reload, no fresh burst)
- [ ] DevTools → **Application → Local Storage → `http://127.0.0.1:4200`**. After the calls, key
  **`evm.ratelimit.spotify`** exists, e.g.
  `{"blockedUntil":0,"consecutive":0,"recent":[1720…,1720…],"lastSent":1720…,"lastGrewAt":0,"cap":20}`.
- [ ] Reload `/globe` again immediately. In Network, the **first** request of the new load does **not** fire at
  t=0 — it's spaced off the persisted `lastSent` (it waits until ≥ 600 ms since the previous send). That "no
  fresh burst on reload" is the persistence doing its job.

### 4. A forced 429 trips a cooldown + one toast, then auto-recovers
Reproducing a real Spotify ban in dev is impractical, so **temporarily** force one. Make these three edits in
`src/app/core/api/rate-limit-interceptor.ts`, then **revert them all** after the check.

1. Add `HttpHeaders` to the `@angular/common/http` import:
   `import { HttpErrorResponse, HttpEventType, HttpHeaders, HttpInterceptorFn } from '@angular/common/http';`
2. Add a module-scope one-shot flag just above the `export const rateLimitInterceptor` line:
   ```ts
   let __force429 = true; // TEMP — DELETE after verifying M2's 429 path.
   ```
3. Replace the line `switchMap(() => next(req)),` with:
   ```ts
   switchMap(() => {
     if (__force429) {
       __force429 = false; // one-shot: only the very first Spotify call is forced to 429
       return throwError(
         () => new HttpErrorResponse({ status: 429, headers: new HttpHeaders({ 'Retry-After': '5' }) }),
       );
     }
     return next(req);
   }),
   ```

Save (the dev server reloads), then reload `/globe` and observe:

- [ ] **Exactly one** red toast: *"Spotify is rate-limiting the app — please try again in a while."* (One, not
  two — the second call is *held by the cooldown*, so it never gets its own 429.)
- [ ] In Local Storage, `evm.ratelimit.spotify` now shows `blockedUntil` ≈ 5000 ms in the future,
  `consecutive":1`, and **`cap":10`** — halved from 20 (the AIMD multiplicative-decrease).
- [ ] After ~5 s the page renders **"You have N liked songs."** on its own — the held call fired once the
  cooldown lifted and succeeded. (`succeeded()` then resets `consecutive` back to `0` on that response.)
- [ ] **Revert all three edits.** Reload once more → the count renders immediately again, no toast.

### 5. Quality gate
- [ ] `npm run format:check` → clean. `npm run lint` → clean. `npm run build` → clean (no `any`, no unused).

## Files after this milestone (complete — the checkpoint)

### `src/app/core/util/delay.ts`
```ts
/** Resolve after `ms` milliseconds — the shared timer primitive for throttles, backoff, and polling. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### `src/app/core/cache/storage-cache.ts`
```ts
/**
 * Shared localStorage read/write primitives for the typed cache services in this folder. Each cache
 * keeps its own key, validator, and public API; these just fold away the repeated
 * `getItem` → `JSON.parse` → try/catch → fallback boilerplate.
 */

/**
 * Read and JSON-parse a localStorage entry, mapping the parsed value through `revive`. Returns
 * `fallback` when the key is absent, parsing throws, or `revive` returns `undefined` (its signal for
 * "invalid/missing — use the fallback"). `revive` owns validation, merging, and any reshaping.
 */
export function readJson<T>(
  key: string,
  revive: (parsed: unknown) => T | undefined,
  fallback: T,
): T {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return fallback;
  }
  try {
    const value = revive(JSON.parse(raw));
    return value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

/**
 * JSON-serialize and persist a localStorage entry. Returns `true` on success and `false` when the
 * write fails — most commonly `QuotaExceededError` on a large dataset, but also a serialization
 * throw. Callers that care (e.g. the origins snapshot) can surface this; the rest fire-and-forget.
 */
export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeJson(key: string): void {
  localStorage.removeItem(key);
}
```

### `src/app/core/pipeline/http-retry.ts`
```ts
import { HttpErrorResponse } from '@angular/common/http';

import { delay } from '../util/delay';

/**
 * Transient statuses worth retrying (0 = network/CORS failure). **429 is deliberately excluded**:
 * the {@link RateLimitGate} is the single authority for rate limiting — it opens a cooldown that the
 * gate then waits out before any subsequent request. Retrying a 429 here too would re-enter the gate
 * and wait out the cooldown again per attempt (compounding to several times the ban for one request),
 * so 429s propagate immediately and the gate handles the pacing.
 */
const RETRYABLE_STATUS = new Set([0, 500, 502, 503, 504]);

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
}

/**
 * Retries a promise-returning call on transient HTTP failures with exponential backoff,
 * honouring a `Retry-After` header when present. Non-retryable errors rethrow immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, baseDelayMs = 500 }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !isRetryable(error)) {
        throw error;
      }
      await delay(retryAfterMs(error) ?? baseDelayMs * 2 ** attempt);
    }
  }
}

function isRetryable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && RETRYABLE_STATUS.has(error.status);
}

/**
 * Parse a `Retry-After` header to milliseconds, or null to fall back to exponential backoff. Handles
 * both spec-legal forms — delta-seconds and an HTTP-date — and ignores non-positive values, so a
 * `Retry-After: 0` (or a past date) can't collapse the backoff into an immediate retry storm.
 */
function retryAfterMs(error: unknown): number | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }
  const header = error.headers.get('Retry-After');
  if (header === null) {
    return null;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return seconds > 0 ? seconds * 1000 : null;
  }
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? delta : null;
  }
  return null;
}

/**
 * Maps `items` through async `fn` with at most `concurrency` calls in flight, preserving input
 * order in the result. Used to replace the bulk `?ids=` endpoints the Feb 2026 Spotify Dev Mode
 * migration removed with throttled per-id fetches that don't burst into the rate limit.
 * `onProgress` (optional) is invoked with the running completed-count after each item settles —
 * lets a long per-id fan-out (e.g. genre enrichment) surface progress instead of looking stalled.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  let completed = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      if (item === undefined) {
        return;
      }
      results[index] = await fn(item, index);
      onProgress?.(++completed, items.length);
    }
  }
  const lanes = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: lanes }, () => worker()));
  return results;
}
```

### `src/app/core/api/rate-limit-gate.ts`
```ts
import { delay } from '../util/delay';

/** Per-host tuning for a {@link RateLimitGate}. All durations are milliseconds. */
export interface RateLimitConfig {
  /** Minimum gap between any two requests to this host — smooths bursts inside the window. */
  minSpacingMs: number;
  /** Rolling window length the per-window cap is measured over (≈ the API's own limit window). */
  windowMs: number;
  /** AIMD **ceiling**: the most requests per rolling {@link RateLimitConfig.windowMs} ever allowed. The
   *  effective cap starts here and only ever drops below it (halved on a 429) then creeps back. */
  maxPerWindow: number;
  /** AIMD **floor**: the fewest requests per window the adaptive cap can shrink to under a ban. */
  minPerWindow: number;
  /** First blind cooldown after a 429 with no readable `Retry-After` (CORS can hide the header). */
  baseCooldownMs: number;
  /** Cap for the blind exponential backoff — a persistent ban shouldn't be poked more often than this. */
  maxCooldownMs: number;
}

/** The full rate-limit schedule for one host, persisted so it is shared across tabs and reloads. */
export interface GateState {
  /** Epoch ms until which all sends are held (an open 429 cooldown), or 0 when clear. */
  blockedUntil: number;
  /** Consecutive 429 *episodes* with no intervening success — drives the blind exponential backoff. */
  consecutive: number;
  /** Send timestamps within the current rolling window (oldest first), for the per-window cap. */
  recent: number[];
  /** When the last request was released, for {@link RateLimitConfig.minSpacingMs} spacing. */
  lastSent: number;
  /** When the adaptive cap last grew, so AIMD additive-increase happens at most once per window. */
  lastGrewAt: number;
  /** The learned AIMD cap. Absent in a legacy (cooldown-only) entry — seeded from the ceiling then. */
  cap?: number;
}

/** {@link GateState} with the adaptive cap resolved — the shape the gate mutates internally. */
type Schedule = Required<GateState>;

/**
 * Shares a host's rate-limit schedule across tabs and reloads. Without it the gate is purely
 * in-memory: a second tab (or a reload) starts a private window budget, so N tabs send at N× the
 * intended rate and a reload mid-scan resets the window into a fresh burst — the exact bursts that
 * earn a 429. Injected by {@link RateLimiters}; see `rate-limit-state-cache.ts` for the localStorage
 * implementation. Every read/write is done inside a cross-tab Web Lock so it stays consistent.
 */
export interface GateStatePersistence {
  /** The saved schedule, or null when none is stored. */
  load(): GateState | null;
  save(state: GateState): void;
  clear(): void;
}

/**
 * Global throttle + circuit breaker for one host's rolling-window rate limit. Every request to that
 * host (via {@link rateLimitInterceptor}) `await`s {@link acquire} first, so all callers — **across
 * every open tab** — flow through one serialized, persisted schedule that:
 *  - spaces sends by at least {@link RateLimitConfig.minSpacingMs},
 *  - never exceeds an **adaptive** cap (AIMD) per rolling {@link RateLimitConfig.windowMs} — halved on
 *    each fresh 429 episode, grown back by 1 per clean window, so it converges just under the host's
 *    real (often undocumented) ceiling instead of relying on a hand-tuned guess, and
 *  - holds everything back while a 429 cooldown is open.
 *
 * Cross-tab consistency comes from persisting the whole schedule and guarding every read-modify-write
 * with the Web Locks API ({@link withLock}); a tab without `navigator.locks` degrades to per-tab
 * pacing. One instance per external API — Spotify, Wikidata, MusicBrainz — each tuned via
 * {@link RateLimitConfig}. Not an Angular provider: instances are created + held by {@link RateLimiters}.
 */
export class RateLimitGate {
  private readonly lockName: string;

  constructor(
    private readonly config: RateLimitConfig,
    name: string,
    private readonly persistence?: GateStatePersistence,
  ) {
    this.lockName = `evm-ratelimit-${name}`;
  }

  /** In-memory fallback schedule, used only when no persistence is wired (single-instance mode). */
  private memory: GateState = {
    blockedUntil: 0,
    consecutive: 0,
    recent: [],
    lastSent: 0,
    lastGrewAt: 0,
  };
  /** FIFO chain: each acquire waits for the previous one's slot, so the schedule stays serialized. */
  private chain: Promise<void> = Promise.resolve();

  /**
   * Reserve the next send slot for a request to this host, resolving only when it's safe to fire.
   * Serial (FIFO within a tab), spaced, window-capped, and cooldown-aware — re-evaluated in a loop
   * because another in-flight call (here or in another tab) can extend the cooldown or fill the
   * window while this one waits.
   */
  acquire(): Promise<void> {
    const turn = this.chain.then(() => this.reserve());
    // Advance the chain on the gate only (swallowing errors) so request durations don't compound it.
    this.chain = turn.catch(() => undefined);
    return turn;
  }

  private async reserve(): Promise<void> {
    for (;;) {
      const wait = await this.withLock(() => this.tryClaim());
      if (wait <= 0) {
        return;
      }
      await delay(wait);
    }
  }

  /** Under the cross-tab lock: claim + persist a send slot if it's clear, else return the wait until it is. */
  private tryClaim(): number {
    const s = this.read();
    const now = Date.now();
    this.dropExpired(s, now);
    // recent.length - cap ≥ 0 means we're at/over the window cap; the element at that index must age
    // out for the window to have room again (handles a cap freshly halved below the current count).
    const overBy = s.recent.length - s.cap;
    const bindingTs = overBy >= 0 ? s.recent[overBy] : undefined;
    const windowWait = bindingTs !== undefined ? bindingTs + this.config.windowMs - now : 0;
    const wait = Math.max(
      s.blockedUntil - now,
      s.lastSent + this.config.minSpacingMs - now,
      windowWait,
      0,
    );
    if (wait > 0) {
      return wait;
    }
    s.lastSent = now;
    s.recent.push(now);
    this.write(s);
    return 0;
  }

  /** Drop send timestamps that have aged out of the rolling window. */
  private dropExpired(s: Schedule, now: number): void {
    const cutoff = now - this.config.windowMs;
    while (s.recent.length > 0 && (s.recent[0] ?? 0) <= cutoff) {
      s.recent.shift();
    }
  }

  /** Whether a 429 cooldown is currently active (lets the player skip polls instead of queuing them). */
  get limited(): boolean {
    return this.read().blockedUntil > Date.now();
  }

  /** Milliseconds until the current cooldown lifts, or 0 when not limited — for a "try again in N" UI. */
  get retryAfterMs(): number {
    return Math.max(0, this.read().blockedUntil - Date.now());
  }

  /**
   * Open the gate after a 429. Honours `Retry-After` (seconds) when the host exposes it; otherwise
   * backs off exponentially on consecutive 429 *episodes* (base → 2× → 4× … capped). A 429 that
   * arrives while a cooldown is **already open** is treated as a concurrent sibling (or a retry) of
   * the same episode: it neither escalates the backoff nor re-cuts the adaptive cap — so a burst of
   * ~20 simultaneous 429s can't instantly saturate the backoff or crater the cap. Returns `true` only
   * on the leading edge of a fresh episode, so the caller notifies the user exactly once.
   */
  async trip(retryAfterSeconds: number | null): Promise<boolean> {
    return this.withLock(() => {
      const s = this.read();
      const now = Date.now();
      const explicit =
        retryAfterSeconds !== null && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : null;
      // Sibling/retry 429 inside an open cooldown: don't escalate — only honour a longer Retry-After.
      if (s.blockedUntil > now) {
        if (explicit !== null && now + explicit > s.blockedUntil) {
          s.blockedUntil = now + explicit;
          this.write(s);
        }
        return false;
      }
      // Leading edge of a fresh episode: escalate the streak, halve the cap once, open the cooldown.
      const cooldown =
        explicit ??
        Math.min(this.config.baseCooldownMs * 2 ** s.consecutive, this.config.maxCooldownMs);
      s.consecutive += 1;
      s.blockedUntil = now + cooldown;
      s.cap = Math.max(this.config.minPerWindow, Math.floor(s.cap / 2));
      this.write(s);
      return true;
    });
  }

  /**
   * A call came back OK. Ends the 429 streak so the next episode notifies + backs off afresh, and
   * drives the AIMD additive-increase: the cap grows by 1 at most once per rolling window, creeping
   * back toward the configured ceiling after a quiet spell. Fast-paths the common case (streak
   * already clear, growth not yet due) with a lock-free read so it stays cheap on every response.
   */
  async succeeded(): Promise<void> {
    const s = this.read();
    const now = Date.now();
    const needClear = s.consecutive !== 0;
    const canGrow = s.cap < this.config.maxPerWindow && now - s.lastGrewAt >= this.config.windowMs;
    if (!needClear && !canGrow) {
      return;
    }
    await this.withLock(() => {
      const cur = this.read();
      const at = Date.now();
      let changed = false;
      if (cur.consecutive !== 0) {
        cur.consecutive = 0;
        changed = true;
      }
      if (cur.cap < this.config.maxPerWindow && at - cur.lastGrewAt >= this.config.windowMs) {
        cur.cap = Math.min(this.config.maxPerWindow, cur.cap + 1);
        cur.lastGrewAt = at;
        changed = true;
      }
      if (changed) {
        this.write(cur);
      }
    });
  }

  /** Load the shared schedule (persisted, else in-memory), resolving + clamping the adaptive cap. */
  private read(): Schedule {
    const loaded = this.persistence?.load() ?? this.memory;
    const cap = Math.min(
      this.config.maxPerWindow,
      Math.max(this.config.minPerWindow, loaded.cap ?? this.config.maxPerWindow),
    );
    return {
      blockedUntil: loaded.blockedUntil,
      consecutive: loaded.consecutive,
      recent: [...loaded.recent],
      lastSent: loaded.lastSent,
      lastGrewAt: loaded.lastGrewAt,
      cap,
    };
  }

  /** Persist the schedule (and mirror it in memory for the no-persistence fallback). */
  private write(s: Schedule): void {
    this.memory = s;
    this.persistence?.save(s);
  }

  /**
   * Run a read-modify-write of the schedule inside a cross-tab exclusive lock, so two tabs never both
   * claim the last window slot or double-escalate a cooldown. Falls back to running inline when the
   * Web Locks API is unavailable (older browsers) — degrading to today's per-tab pacing, no worse.
   */
  private async withLock<T>(fn: () => T): Promise<T> {
    const locks: LockManager | undefined = navigator.locks;
    if (locks === undefined) {
      return fn();
    }
    return locks.request(this.lockName, () => fn());
  }
}
```

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

### `src/environments/environment.development.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: false,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'http://127.0.0.1:4200/callback', // Spotify forbids `localhost`; loopback IP is allowed
    scopes: [
      'user-read-private',
      'user-top-read',
      'user-follow-read',
      'user-follow-modify',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBaseUrl: 'https://api.spotify.com/v1',
    // Spotify's Dev-Mode quota is undocumented, so the gate's cap is *adaptive* (AIMD): it starts at
    // `maxPerWindow` (the ceiling) and halves toward `minPerWindow` on each 429, then creeps back —
    // converging just under the real limit instead of relying on a fixed guess. `maxPerWindow` is
    // deliberately low (≈0.7 req/s sustained); the window shape mirrors Spotify's own rolling limit.
    rateLimit: {
      minSpacingMs: 600,
      windowMs: 30_000,
      maxPerWindow: 20,
      minPerWindow: 3,
      baseCooldownMs: 10_000,
      maxCooldownMs: 300_000,
    },
  },
  musicbrainz: {
    apiBaseUrl: 'https://musicbrainz.org/ws/2',
    // MusicBrainz wants a descriptive User-Agent, but browsers forbid setting it — the 1 req/s
    // throttle is our compliance. Kept here as documentation; swap in your own contact address.
    userAgent: 'EarthViewMusic/0.1 (contact: contact@example.com)',
    // MusicBrainz asks anonymous clients for ≤1 req/s; the window cap is set so spacing dominates.
    rateLimit: {
      minSpacingMs: 1_000,
      windowMs: 30_000,
      maxPerWindow: 30,
      minPerWindow: 3,
      baseCooldownMs: 5_000,
      maxCooldownMs: 120_000,
    },
  },
  wikidata: {
    sparqlUrl: 'https://query.wikidata.org/sparql',
    // WDQS has no published per-query ceiling but 429s under concurrent load; light spacing keeps the
    // batched scan + on-the-fly flight lookups from bursting. Window cap set so spacing dominates.
    rateLimit: {
      minSpacingMs: 250,
      windowMs: 30_000,
      maxPerWindow: 120,
      minPerWindow: 5,
      baseCooldownMs: 5_000,
      maxCooldownMs: 120_000,
    },
  },
};
```

### `src/environments/environment.ts`
```ts
import { SPOTIFY_CLIENT_ID } from './spotify-client-id';

export const environment = {
  production: true,
  spotify: {
    clientId: SPOTIFY_CLIENT_ID, // public PKCE id, kept out of git in spotify-client-id.ts
    redirectUri: 'https://REPLACE_WITH_DEPLOYED_HOST/callback',
    scopes: [
      'user-read-private',
      'user-top-read',
      'user-follow-read',
      'user-follow-modify',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBaseUrl: 'https://api.spotify.com/v1',
    // Spotify's Dev-Mode quota is undocumented, so the gate's cap is *adaptive* (AIMD): it starts at
    // `maxPerWindow` (the ceiling) and halves toward `minPerWindow` on each 429, then creeps back —
    // converging just under the real limit instead of relying on a fixed guess. `maxPerWindow` is
    // deliberately low (≈0.7 req/s sustained); the window shape mirrors Spotify's own rolling limit.
    rateLimit: {
      minSpacingMs: 600,
      windowMs: 30_000,
      maxPerWindow: 20,
      minPerWindow: 3,
      baseCooldownMs: 10_000,
      maxCooldownMs: 300_000,
    },
  },
  musicbrainz: {
    apiBaseUrl: 'https://musicbrainz.org/ws/2',
    // MusicBrainz wants a descriptive User-Agent, but browsers forbid setting it — the 1 req/s
    // throttle is our compliance. Kept here as documentation; swap in your own contact address.
    userAgent: 'EarthViewMusic/0.1 (contact: contact@example.com)',
    // MusicBrainz asks anonymous clients for ≤1 req/s; the window cap is set so spacing dominates.
    rateLimit: {
      minSpacingMs: 1_000,
      windowMs: 30_000,
      maxPerWindow: 30,
      minPerWindow: 3,
      baseCooldownMs: 5_000,
      maxCooldownMs: 120_000,
    },
  },
  wikidata: {
    sparqlUrl: 'https://query.wikidata.org/sparql',
    // WDQS has no published per-query ceiling but 429s under concurrent load; light spacing keeps the
    // batched scan + on-the-fly flight lookups from bursting. Window cap set so spacing dominates.
    rateLimit: {
      minSpacingMs: 250,
      windowMs: 30_000,
      maxPerWindow: 120,
      minPerWindow: 5,
      baseCooldownMs: 5_000,
      maxCooldownMs: 120_000,
    },
  },
};
```

### `src/app/core/api/rate-limiters.ts`
```ts
import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { RateLimitGate } from './rate-limit-gate';
import { gateStatePersistence } from './rate-limit-state-cache';

/** A matched host's gate plus a human label for its rate-limit toast. */
export interface MatchedGate {
  gate: RateLimitGate;
  label: string;
}

/**
 * Owns one {@link RateLimitGate} per external API and matches an outgoing URL to its gate, so
 * {@link rateLimitInterceptor} paces **every** call to **every** API through the same mechanism
 * (spacing + adaptive rolling-window cap + 429 cooldown), each tuned per host in `environment`. URLs
 * that don't match a configured host — Spotify auth (`accounts.spotify.com`) and the local GeoJSON
 * asset — aren't paced.
 */
@Injectable({ providedIn: 'root' })
export class RateLimiters {
  /** Spotify gate, also read by the player poll (`.limited`) to skip polling during a cooldown. */
  readonly spotify = new RateLimitGate(
    environment.spotify.rateLimit,
    'spotify',
    gateStatePersistence('spotify'),
  );
  private readonly wikidata = new RateLimitGate(
    environment.wikidata.rateLimit,
    'wikidata',
    gateStatePersistence('wikidata'),
  );
  private readonly musicbrainz = new RateLimitGate(
    environment.musicbrainz.rateLimit,
    'musicbrainz',
    gateStatePersistence('musicbrainz'),
  );

  /** URL-prefix → gate, checked in order; the first prefix the request URL starts with wins. */
  private readonly byHost: { prefix: string; label: string; gate: RateLimitGate }[] = [
    { prefix: environment.spotify.apiBaseUrl, label: 'Spotify', gate: this.spotify },
    { prefix: environment.wikidata.sparqlUrl, label: 'Wikidata', gate: this.wikidata },
    { prefix: environment.musicbrainz.apiBaseUrl, label: 'MusicBrainz', gate: this.musicbrainz },
  ];

  /** The gate governing this URL's host, or null when the host isn't rate-limited. */
  match(url: string): MatchedGate | null {
    const hit = this.byHost.find((h) => url.startsWith(h.prefix));
    return hit === undefined ? null : { gate: hit.gate, label: hit.label };
  }

  /** Whether **any** host currently has an open 429 cooldown — the mechanism is identical per host. */
  anyLimited(): boolean {
    return this.byHost.some((h) => h.gate.limited);
  }

  /** The longest remaining cooldown across all hosts (0 when none), for a "paused for N min" notice. */
  maxRetryAfterMs(): number {
    return this.byHost.reduce((max, h) => Math.max(max, h.gate.retryAfterMs), 0);
  }
}
```

### `src/app/core/api/rate-limit-interceptor.ts`
```ts
import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, tap, throwError } from 'rxjs';

import { Toast } from '../../shared/toast';
import { RateLimiters } from './rate-limiters';

/**
 * Paces **every** call to **every** rate-limited API through that host's global gate: each request
 * `await`s a slot that is spaced, capped per rolling window, and held back during any active 429
 * cooldown (see {@link RateLimitGate}). Spotify (Liked-Songs paging, the per-id track/album/genre
 * fan-outs, the player poll, artist photos), Wikidata (country resolution), and MusicBrainz (the
 * name-search fallback) each back off on their own schedule, so a burst can never saturate a host's
 * rolling rate-limit window and earn a ban. A successful response ends that host's 429 streak; the
 * first 429 of a fresh episode surfaces one toast. URLs with no configured gate — Spotify auth and
 * the local GeoJSON asset — pass straight through.
 */
export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const matched = inject(RateLimiters).match(req.url);
  if (matched === null) {
    return next(req);
  }

  const toast = inject(Toast);
  const { gate, label } = matched;

  // Wait for the gate to release a send slot — the single chokepoint that serializes + caps every
  // request to this host so concurrent fan-outs can't overrun its rolling rate-limit window.
  return from(gate.acquire()).pipe(
    switchMap(() => next(req)),
    tap((event) => {
      if (event.type === HttpEventType.Response) {
        // Fire-and-forget: succeeded() only persists schedule bookkeeping (streak reset + AIMD growth).
        void gate.succeeded();
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 429) {
        const header = error.headers.get('Retry-After');
        // trip() is async (it takes the cross-tab lock); surface the toast only on the leading edge
        // of a fresh episode, then rethrow the original 429 so upstream handling is unchanged.
        return from(gate.trip(header !== null ? Number(header) : null)).pipe(
          switchMap((firstOfEpisode) => {
            if (firstOfEpisode) {
              toast.error(`${label} is rate-limiting the app — please try again in a while.`);
            }
            return throwError(() => error);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
```

### `src/app/app.config.ts`
```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { rateLimitInterceptor } from './core/api/rate-limit-interceptor';
import { authInterceptor } from './core/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // auth is outer, rate-limit inner: a 401 refresh-and-retry re-enters the rate-limit gate (the
    // retry would otherwise bypass an active cooldown), while a 429 still trips the gate before auth
    // sees it. The rate-limit interceptor paces every configured host (Spotify / Wikidata /
    // MusicBrainz); auth only touches Spotify API calls. Auth endpoints + local assets pass through.
    provideHttpClient(withInterceptors([authInterceptor, rateLimitInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

### `src/app/core/dto/spotify.dto.ts`
```ts
/** Raw Spotify Web API payloads. Never used outside mappers — domain code uses models. Grows in M3/M5/M7. */

/** Payload of `GET /me` — only the current user's id is needed (to decide playlist ownership later). */
export interface SpotifyMeDto {
  id: string;
}

/** One saved track from `GET /me/tracks`. M2 reads only `added_at`; the full track shape lands in M3. */
export interface SpotifySavedTrackDto {
  added_at: string;
}

/** Payload of `GET /me/tracks`. `total` is the whole library size; `next` is the paging cursor (used in M3). */
export interface SpotifySavedTracksDto {
  items: SpotifySavedTrackDto[];
  next: string | null;
  total: number;
}
```

### `src/app/core/api/spotify-api.ts`
```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SpotifyMeDto, SpotifySavedTracksDto } from '../dto/spotify.dto';
import { withRetry } from '../pipeline/http-retry';

/**
 * Typed client for the Spotify Web API. The M1 auth interceptor adds the bearer token; the shared
 * RateLimitGate (via `rateLimitInterceptor`) is the **single** pacer for every call here — this service
 * keeps no throttle of its own. This is the minimal M2 slice: two smoke calls that prove the resilience
 * layer end to end. It grows in M3 (`streamLikedTracks` + mappers), M5, M7, and M10.
 */
@Injectable({ providedIn: 'root' })
export class SpotifyApi {
  private readonly http = inject(HttpClient);

  /** The current user's profile — only the id is used. A bare paced call: the gate spaces it, no retry. */
  async getMe(): Promise<SpotifyMeDto> {
    const base = environment.spotify.apiBaseUrl;
    return await firstValueFrom(this.http.get<SpotifyMeDto>(`${base}/me`));
  }

  /**
   * A one-call summary of the user's Liked Songs — the total count and the newest track's `added_at` —
   * via `GET /me/tracks?limit=1`. `withRetry` rides out a transient 5xx/network blip; the gate handles
   * pacing and any 429. In M3 the boot sync uses this cheap diff to decide whether the library changed.
   */
  async getLikedTracksSummary(): Promise<{ total: number; newest: string | null }> {
    const base = environment.spotify.apiBaseUrl;
    const page = await withRetry(() =>
      firstValueFrom(this.http.get<SpotifySavedTracksDto>(`${base}/me/tracks?limit=1`)),
    );
    return { total: page.total, newest: page.items[0]?.added_at ?? null };
  }
}
```

### `src/app/features/globe/globe-page/globe-page.ts`
```ts
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { SpotifyApi } from '../../../core/api/spotify-api';

@Component({
  selector: 'app-globe-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './globe-page.html',
  styleUrl: './globe-page.scss',
})
export class GlobePage implements OnInit {
  private readonly spotifyApi = inject(SpotifyApi);

  /** null while loading; the total once the summary returns. Drives the placeholder text. */
  protected readonly likedCount = signal<number | null>(null);
  /** Set when a smoke call fails, so the page shows a message instead of a stuck "Loading…". */
  protected readonly loadFailed = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      // Fire both smoke calls at once: getMe() is the health check; the gate spaces them ≥600 ms apart
      // (visible in the Network tab), and getLikedTracksSummary() gives the count we render.
      const [, summary] = await Promise.all([
        this.spotifyApi.getMe(),
        this.spotifyApi.getLikedTracksSummary(),
      ]);
      this.likedCount.set(summary.total);
    } catch {
      this.loadFailed.set(true);
    }
  }
}
```

### `src/app/features/globe/globe-page/globe-page.html`
```html
<section class="globe-placeholder">
  <h1>spotify-angular</h1>

  @if (loadFailed()) {
    <p class="status status--error">Couldn't reach Spotify — check the console and reload.</p>
  } @else if (likedCount() === null) {
    <p class="status">Loading your library…</p>
  } @else {
    <p class="status">You have {{ likedCount() }} liked songs.</p>
  }
</section>
```

### `src/app/features/globe/globe-page/globe-page.scss`
```scss
.globe-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  gap: 0.5rem;
  text-align: center;
}

.status {
  font-size: 1.25rem;
  opacity: 0.85;

  &--error {
    color: var(--mat-sys-error, #ffb4ab);
  }
}
```

## What you have now (cumulative)
Logging in (M1) now leads to a `/globe` page that makes a real, **paced, retried, authenticated** Spotify call
and prints your Liked Songs count. Under it sits the whole resilience layer every future client rides on: the
`delay`/storage/`withRetry` primitives, the adaptive AIMD gate with a cross-tab/cross-reload persisted schedule,
one gate per host, and the single interceptor chokepoint. Spotify traffic is spaced, adaptively capped, and
cooldown-protected; 429s are the gate's job alone. The globe page is still a placeholder — the three.js globe
replaces it in M4.

## Troubleshooting
| Symptom | Likely cause → fix |
|---------|--------------------|
| Page stuck on "Loading your library…" | A call is still held by the gate (wait a beat), or it threw and was swallowed — open the console. If 401, M1's token/refresh is the issue, not M2. |
| "Couldn't reach Spotify" / 403 on `/me/tracks` | Missing `user-library-read` scope → check `environment.spotify.scopes` (M1). Re-log in after changing scopes. |
| No `evm.ratelimit.spotify` key appears | The interceptor isn't registered (step 09) or the URL isn't matched — confirm `withInterceptors([authInterceptor, rateLimitInterceptor])` and that URLs start with `environment.spotify.apiBaseUrl`. |
| Requests fire with no spacing | `rateLimitInterceptor` missing from `withInterceptors`, or a prefix in `byHost` doesn't match — `match` uses `startsWith`. |
| Two toasts on the forced 429 | You made the forced 429 fire on *every* response instead of one-shot — the held second call then starts a fresh episode. Use the `__force429 = false` one-shot exactly as written, then revert. |
| `cap` never drops to 10 | The `Retry-After` header wasn't parsed, or you're inspecting before the trip — reload with the forced edit and re-check `evm.ratelimit.spotify` right after the toast. |
| `NG0203: inject() must be called from an injection context` | An `inject()` moved out of the interceptor function body — keep both at the top. |
| Auth (login) stalls | A `byHost` prefix accidentally matches `accounts.spotify.com`; only `api.spotify.com/v1` should be paced. |

## Next
Continue to **[M3 — Liked Songs streaming](../MILESTONE_3_liked-songs-stream/00_overview.md)**: the
`streamLikedTracks()` async generator pages your whole library through this gate, DTO→domain mappers turn each
page into `LikedTrack`s, and a persisted `LikedIndex` grows as pages arrive — with the count rising page-by-page
and a reload restoring it instantly.

---
> Nav: [← Liked-songs summary](11_liked-summary.md) · [Overview](00_overview.md) · [M3 · Liked Songs streaming →](../MILESTONE_3_liked-songs-stream/00_overview.md)
