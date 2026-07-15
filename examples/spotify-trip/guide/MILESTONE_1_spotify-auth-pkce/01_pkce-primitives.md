# M1 · Step 01 of 10 — PKCE primitives: verifier, challenge, state
> Nav: — · [Overview](00_overview.md) · [The token store →](02_token-store.md)

## Glossary for this step
> **PKCE (Proof Key for Code Exchange)** — the OAuth extension that lets a browser app run the Authorization
> Code flow with **no client secret**. See [glossary](../foundation/glossary.md).
> **code verifier** — a random, high-entropy string your app generates and keeps private for one login.
> **code challenge** — the SHA-256 hash of the verifier, base64url-encoded, sent *out* with the authorize
> request. See [glossary](../foundation/glossary.md).
> **base64url** — base64 with URL-safe substitutions (`+`→`-`, `/`→`_`) and padding (`=`) stripped, so the
> value survives inside a URL query string untouched.
> **state** — a random value round-tripped through the redirect to detect a forged/replayed callback.
> **CSRF (Cross-Site Request Forgery)** — an attack where a malicious page tricks your browser into completing
> someone else's login/callback; the `state` check defeats it by proving *this* callback belongs to the login
> *you* started. See [glossary](../foundation/glossary.md#csrf-cross-site-request-forgery).

## Why / design
Spotify's login is **OAuth Authorization Code flow**. Classically that flow proves *"the app redeeming this
code is the same app that started the login"* with a **client secret** the app sends when it swaps the code
for tokens. A single-page app can't keep a secret — anything shipped to the browser is readable by anyone. So
we use **PKCE** instead.

> 📚 **New concept — how PKCE replaces the secret.** Before redirecting to Spotify, your app invents a
> one-time random **code verifier** and sends only its **SHA-256 hash** (the **code challenge**) to the
> authorize endpoint. Spotify remembers the hash against the authorization code it issues. When your app later
> exchanges that code for tokens, it presents the **original verifier**; Spotify hashes it and checks it
> matches the challenge it stored. A hash is one-way, so an attacker who intercepts the redirect URL (and the
> challenge in it) still can't derive the verifier — only the app that generated it can complete the exchange.
> No shared secret ever ships to the browser. Full flow:
> [Spotify PKCE tutorial](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow).

Three primitives implement this, all built on the browser's Web Crypto API (`crypto.getRandomValues` for
entropy, `crypto.subtle.digest` for SHA-256):

1. **`generateCodeVerifier()`** — 64 random bytes, base64url-encoded (well above Spotify's 43–128-char range).
2. **`challengeFromVerifier()`** — SHA-256 of the verifier, base64url-encoded → the `code_challenge`.
3. **`generateState()`** — 16 random bytes, base64url-encoded → the CSRF `state`.

The recurring model to hold onto: **secrets stay in the browser; only hashes and one-time codes travel over
the wire.** Every value here is **base64url**, not plain base64 — a `+`, `/`, or `=` in a query string would
be re-interpreted by the URL parser and corrupt the value, so we substitute and strip them.

## Do this
This step creates **one file**: `src/app/core/auth/pkce.ts`. It exports pure functions only — no Angular, no
DI (it's plumbing the `SpotifyAuth` service will call in step 04).

1. In `src/app/core/auth/`, create **`pkce.ts`** — the folder was scaffolded in M0; create the file.
2. Paste the code below. `VERIFIER_BYTES` (64) and `STATE_BYTES` (16) are the entropy sizes — **mandatory as
   shown** for comfortable margin; any verifier that base64url-encodes to 43–128 chars is legal, but use 64.
3. Note `base64UrlEncode` does the three URL-safe fixups (`+`→`-`, `/`→`_`, strip trailing `=`). That fixup is
   **load-bearing** — Spotify rejects a challenge that isn't valid base64url.
4. `challengeFromVerifier` is `async` because `crypto.subtle.digest` returns a `Promise`. Keep it `async`.

## Code
### `src/app/core/auth/pkce.ts`
```ts
const VERIFIER_BYTES = 64;
const STATE_BYTES = 16;

export function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(VERIFIER_BYTES)));
}

export function generateState(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(STATE_BYTES)));
}

export async function challengeFromVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
```

## Done when (this step)
- [ ] `npm run build` compiles with `pkce.ts` present → **no TypeScript errors**.
- [ ] Sanity-check in the browser devtools console (on any served page):
  `import('/@fs/…/pkce.ts')` isn't practical, so instead paste the body of `generateCodeVerifier` inline —
  or simply trust the build. A quick manual check: run
  `btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(64)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')`
  in the console → you get a **~86-character string containing only `A–Z a–z 0–9 - _`** (no `+`, `/`, or `=`).

## If it breaks
- **`btoa` throws `InvalidCharacterError`** → you passed a raw `Uint8Array` or multi-byte string to `btoa`.
  `btoa` only accepts a "binary string" (one char per byte); the `for … String.fromCharCode(byte)` loop builds
  exactly that. Don't replace it with `btoa(bytes)`.
- **Challenge contains `+`, `/`, or `=`** → you skipped the `.replace(...)` chain. Spotify will later reject
  the authorize request; the fixup is mandatory.
- **`crypto.subtle is undefined`** → Web Crypto's `subtle` requires a **secure context**. `http://127.0.0.1`
  counts as secure (so does `https`); `http://<LAN-IP>` does **not**. Serve on `127.0.0.1` (M0's `npm start`).
