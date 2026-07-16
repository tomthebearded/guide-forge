# M2 · Step 02 of 12 — The localStorage cache helpers
> Nav: [← delay](01_delay.md) · [Overview](00_overview.md) · [HTTP retry →](03_http-retry.md)

## Glossary for this step
> 📚 New concept — **[localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)**: a
> synchronous, string-only, ~5–10 MB key/value store that persists per-origin across reloads and tabs. This app
> keeps its *entire* dataset here (see [decision-log R6](../foundation/decision-log.md#r6--localstorage-only-persistence-accepted)),
> so every cache goes through the three helpers below.
> **revive** — a per-cache validator function that takes the raw `JSON.parse`d value and either returns a clean,
> typed object or `undefined` to mean "invalid/legacy — use the fallback instead."

## Why / design
Every persisted thing in spotify-angular (the rate-limit schedule you build this milestone, and later the liked
index, view prefs, appearance, sync state…) owns one `evm.*` key. If each re-implemented `getItem` →
`JSON.parse` → try/catch → fallback, a single malformed entry could throw on boot and brick the app, and a
`QuotaExceededError` on a big write could crash a scan mid-flight. So we fold that boilerplate into three
primitives and enforce two rules that recur across the whole app:

1. **Validate on read.** `readJson` never trusts what's in storage — it runs the caller's `revive` and falls
   back on *anything* unexpected (missing key, parse error, `revive` returns `undefined`). Corrupt or
   old-shaped data degrades to the default; it never throws.
2. **Writes are quota-safe.** `writeJson` returns `true`/`false` instead of throwing, so a caller that cares
   (a large snapshot) can warn the user, and the rest can fire-and-forget without a `try/catch`.

This read/write/validate pattern is the mental model for every cache file from here on.

## Do this
1. Create the folder `src/app/core/cache/` — the home for the typed cache services (each will own one key + its
   own `revive`); these three functions are the shared substrate they call.
2. In it, create `storage-cache.ts` with the three exports below. `readJson<T>` is generic: `revive` maps the
   parsed `unknown` to `T | undefined`, and `fallback` is returned whenever `revive` opts out. `writeJson`
   serializes and returns success. `removeJson` deletes a key.
3. Note the deliberate choices (leave them as-is): the empty `catch {}` in `readJson` is intentional — any
   throw *is* the "use fallback" signal; and `writeJson`'s `catch` swallows `QuotaExceededError` into a `false`
   return rather than rethrowing.

## Code
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

## Done when (this step)
- [ ] The file compiles and, in the DevTools console on the running app, `readJson('nope', () => undefined, 42)` → returns `42` (absent key falls back) and `writeJson('evm.test', { ok: true })` → returns `true`, after which `localStorage.getItem('evm.test')` → `'{"ok":true}'`. (Delete `evm.test` afterwards.)

## If it breaks
- **ESLint flags the empty `catch {}`** → it's intentional here (the throw *is* the fallback signal). The
  project's config allows an empty catch; if yours doesn't, add a `// eslint-disable-next-line` rather than
  changing the behaviour — swallowing the error is the whole point.
- **`QuotaExceededError` still surfaces** → you're calling `localStorage.setItem` directly somewhere instead of
  `writeJson`. Route every write through `writeJson` so quota failures become a `false`, not a crash.

---
> Nav: [← delay](01_delay.md) · [Overview](00_overview.md) · [HTTP retry →](03_http-retry.md)
