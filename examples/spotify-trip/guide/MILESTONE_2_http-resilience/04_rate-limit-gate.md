# M2 · Step 04 of 12 — The AIMD rate-limit gate
> Nav: [← HTTP retry](03_http-retry.md) · [Overview](00_overview.md) · [Persist the schedule →](05_rate-limit-state-cache.md)

## Glossary for this step
> **[AIMD (Additive-Increase / Multiplicative-Decrease)](../foundation/glossary.md)** — a self-tuning rate
> strategy: grow the allowed rate slowly (+1 per clean window), cut it sharply (halve) the moment you hit a
> limit. Converges just under an unknown ceiling. It's the same math TCP congestion control uses.
> **[rolling window](../foundation/glossary.md)** — a limit measured over a *sliding* span (≤ N requests in the
> last 30 s), not a fixed clock interval.
> 📚 New concept — **circuit breaker**: a component that, after a failure, *holds everything back* for a
> cooldown instead of letting calls keep hammering a struggling service. The gate is a circuit breaker for 429s.
> 📚 New concept — **[Web Locks API (`navigator.locks`)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)**:
> a browser API for a *named, cross-tab* exclusive lock. `navigator.locks.request(name, fn)` runs `fn` only
> when no other tab (same origin) holds that lock — so two tabs can't both mutate the shared schedule at once.

## Why / design
This is the heart of the milestone. `RateLimitGate` is a **global throttle + circuit breaker for one host**.
Every request to that host `await`s `gate.acquire()` before it fires (wired up in step 08), so *all* callers —
across *every* open tab — flow through **one** serialized, persisted schedule that does three things:

1. **Spaces** sends by at least `minSpacingMs` (smooths bursts within the window).
2. **Caps** sends to an **adaptive** number per rolling `windowMs` — the AIMD cap. It starts at the configured
   ceiling `maxPerWindow`, **halves** (down to the floor `minPerWindow`) on each fresh 429 episode, and **grows
   +1 per clean window** back toward the ceiling. So it *learns* Spotify's undocumented Dev-Mode limit instead
   of trusting a hand-tuned guess ([R3](../foundation/decision-log.md#r3--teach-the-rate-limit-mechanism-document-dev-mode-limits-up-front)).
3. **Blocks** everything while a 429 **cooldown** is open.

**Why this is the single rate-limit authority.** Because the cap and cooldown are *shared and persisted* (step
05), N tabs behave like one client and a reload doesn't reset the window into a fresh burst. That's only
coherent if exactly one thing reacts to a 429 — the gate. Hence `withRetry` excludes 429 (step 03,
[D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry)).

The recurring mental model for the rest of the app: **the gate is the only pacer.** Clients just make calls;
they never sleep, never throttle, never retry a 429.

### How the mechanism fits together (read once, then the code is obvious)
- **`acquire()`** appends to a FIFO promise `chain` so requests are handed slots one at a time (serialized
  *within* a tab), then loops in `reserve()` re-checking `tryClaim()` — because while this call waits, another
  in-flight call (here or in another tab) can extend the cooldown or fill the window.
- **`tryClaim()`** runs *under the cross-tab lock*: it computes the longest of three waits — cooldown remaining,
  spacing remaining, and window remaining — and either records the send (returns 0) or returns how long to wait.
- **`trip()`** opens the cooldown on a 429 and does the *multiplicative-decrease* (halve the cap), but only on
  an episode's **leading edge**; a 429 arriving while a cooldown is already open is a sibling and neither
  escalates the backoff nor re-halves the cap. It returns `true` only on that leading edge, so the caller
  toasts exactly once.
- **`succeeded()`** clears the 429 streak and does the *additive-increase* (+1 cap, at most once per window).

> **Teach the shape, not the numbers.** The `RateLimitConfig` values (spacing, window, cap, cooldown) are set
> per host in `environment` (step 06). Everything here is written against the *config*, never a literal —
> that's what makes the mechanism reusable and the constants tunable without touching this file (R3).

## Do this
1. In `src/app/core/api/` (create the folder — it's the home for all typed API clients + this pacing layer),
   create `rate-limit-gate.ts` with the full code below. It imports only `delay` from step 01.
2. Read the four interfaces first — `RateLimitConfig` (per-host tuning), `GateState` (the persisted schedule),
   `GateStatePersistence` (the storage port, implemented in step 05), and the internal `Schedule` (state with
   the cap resolved). The class body follows the flow described above.
3. Leave every constant reference as-is — there are **no literals** in the algorithm; each threshold reads from
   `this.config`. The only string here, `this.lockName = \`evm-ratelimit-${name}\``, is **load-bearing** (it's
   the cross-tab lock name; it must be stable across tabs — it is, because it's derived from the host `name`).

## Code
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

## Done when (this step)
- [ ] The file compiles with no `any` and no unresolved imports (only `delay` is imported). `npm run build`
  reports no error in `rate-limit-gate.ts`. (It has no observable runtime effect yet — it's exercised once the
  interceptor is wired in step 08 and proven in step 12.)

## If it breaks
- **`Cannot find name 'LockManager'`** → that's the DOM lib type for `navigator.locks`. It ships with
  TypeScript's `lib.dom`; make sure `tsconfig`'s `lib` includes `"DOM"` (the M0 scaffold sets this). No package
  install is needed.
- **Type error: `loaded.cap` possibly undefined** → keep the `?? this.config.maxPerWindow` in `read()`; a
  legacy/absent `cap` is *meant* to be seeded from the ceiling there, which is why `GateState.cap` is optional
  but the internal `Schedule` requires it.
- **Two tabs still burst** → that's expected until step 05 wires persistence; without it, each tab uses its own
  in-memory `memory` schedule. The lock alone doesn't share state — the persistence does.
