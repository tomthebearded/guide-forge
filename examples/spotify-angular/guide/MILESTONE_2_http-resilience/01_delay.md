# M2 · Step 01 of 12 — The `delay` primitive
> Nav: — · [Overview](00_overview.md) · [Storage cache →](02_storage-cache.md)

## Why / design
Three different mechanisms in this milestone need to *wait* a while and then continue: `withRetry` waits out an
exponential backoff, the rate-limit gate waits out its spacing/cooldown, and (later) the player poll waits
between ticks. Rather than sprinkle `new Promise(r => setTimeout(r, …))` everywhere, we factor the one-liner
into a single named primitive so every waiter reads the same and there's one place to reason about. Start with
it because everything else in Sitting 1 imports it.

## Do this
1. Create the folder `src/app/core/util/` if it doesn't already exist — `util` is the home for tiny,
   dependency-free helpers in the feature-first tree (see [conventions](../foundation/conventions.md#structure--architecture-feature-first)).
2. In it, create `delay.ts` with the single exported function below. It returns a `Promise<void>` that resolves
   after `ms` milliseconds, so callers can `await delay(500)`. The whole file is load-bearing only in that the
   **export name `delay`** is imported by name elsewhere; the implementation is as plain as it looks.

## Code
### `src/app/core/util/delay.ts`
```ts
/** Resolve after `ms` milliseconds — the shared timer primitive for throttles, backoff, and polling. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

## Done when (this step)
- [ ] The file exists and `npx tsc --noEmit` (or your editor) reports no error for it → `import { delay } from './delay'` resolves and `await delay(0)` type-checks as `Promise<void>`.

## If it breaks
- **`Cannot find module '../util/delay'` in a later step** → the file is in the wrong folder or misnamed. It
  must be exactly `src/app/core/util/delay.ts` and export `delay` (the name is what later files import).

---
> Nav: — · [Overview](00_overview.md) · [Storage cache →](02_storage-cache.md)
