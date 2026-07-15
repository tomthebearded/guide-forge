# M2 · Step 03 of 12 — `withRetry` + `mapWithConcurrency`
> Nav: [← Storage cache](02_storage-cache.md) · [Overview](00_overview.md) · [The gate →](04_rate-limit-gate.md)

## Glossary for this step
> 📚 New concept — **exponential backoff**: after a failed attempt, wait `base`, then `2×base`, `4×base`, …
> before each retry, so a struggling server gets exponentially more breathing room instead of a retry storm.
> 📚 New concept — **[`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After)**:
> an HTTP header a server may send with a 429/503 telling you exactly how long to wait — either delta-seconds
> (`Retry-After: 5`) or an HTTP-date. Honour it over your own guess when present.

## Why / design
`withRetry` wraps any promise-returning HTTP call and retries it on *transient* failures with exponential
backoff, honouring `Retry-After` when the server sends one. Two design points are load-bearing for the whole
app:

**429 is deliberately *excluded* from the retryable set.** The retryable statuses are exactly
`{0, 500, 502, 503, 504}` (0 = a network/CORS failure). A 429 ("Too Many Requests") is *not* here — because the
**rate-limit gate** you build next is the single authority for rate limiting. When a 429 comes back, the gate
opens a cooldown that it then waits out before any later request. If `withRetry` *also* retried the 429, each
attempt would re-enter the gate and wait out that cooldown again — compounding one banned request into several
times the ban. So 429s propagate immediately and the gate does the pacing. This is
[decision-log D2](../foundation/decision-log.md#d2--single-rate-limit-authority-429-excluded-from-retry) — the
recurring rule *"the gate is the only pacer; nothing else reacts to 429."*

**`mapWithConcurrency` replaces Spotify's removed bulk endpoints.** The Feb-2026 Spotify Dev-Mode migration
removed the bulk `GET /tracks?ids=` / `GET /artists?ids=` endpoints, so the app now fetches per-id — but firing
5000 requests at once would instantly trip the rate limit. `mapWithConcurrency` runs at most `concurrency`
calls in flight, preserving input order, so a fan-out stays brisk without bursting. You don't call it this
milestone (the smoke call is a single request), but it lives with `withRetry` because they're the two HTTP
pipeline helpers. `withRetry` is used from M3 on; `mapWithConcurrency`'s first real consumer is **M5**'s per-id
country fan-out (its optional `onProgress` param is used later still). →
[decision-log D6](../foundation/decision-log.md#d6--isrc-only-duplicate-detection-per-id-fan-out-after-bulk-endpoint-removal).

## Do this
1. Create the folder `src/app/core/pipeline/` — the home for cross-cutting request helpers (retry now; the
   streaming generator lands here in M3).
2. In it, create `http-retry.ts` with the code below. It imports `delay` from step 01. Note the exact
   `RETRYABLE_STATUS` set — **`0, 500, 502, 503, 504` and *not* 429** is the whole point; don't "helpfully" add
   429.
3. Leave the defaults as written: `retries = 3`, `baseDelayMs = 500`. These are illustrative starting values,
   not a tuned constant — a caller can override via the options object.

## Code
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

## Done when (this step)
- [ ] The file compiles with no `any`. Sanity-check the concurrency helper in the DevTools console:
  `mapWithConcurrency([1,2,3], async (n) => n * 2, 2)` → resolves to `[2, 4, 6]` (order preserved).

## If it breaks
- **A 429 gets retried anyway** → you added `429` to `RETRYABLE_STATUS`. Remove it — 429 must fall through to
  the gate (D2).
- **`Cannot find name 'HttpErrorResponse'`** → the import is `from '@angular/common/http'`; check the spelling
  and that `@angular/common` is installed (it is, from the M0 scaffold).
- **`noUncheckedIndexedAccess` error on `items[index]`** → that's why the `if (item === undefined) return;`
  guard exists; keep it — strict mode types the indexed read as `T | undefined`.
