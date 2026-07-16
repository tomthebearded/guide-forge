# M0 · Step 13 of 15 — Register a Spotify app
> Nav: [← The app shell + header](12_shell.md) · [Overview](00_overview.md) · [Write the README →](14_readme.md)

## Glossary for this step
> **PKCE (Proof Key for Code Exchange)** — the OAuth extension that lets a browser app do the Authorization Code flow with **no client secret**. That's why only a public Client ID is needed here. See [glossary](../foundation/glossary.md#pkce-proof-key-for-code-exchange).
> **Development Mode** — the state every new Spotify app starts in: it works only for users you **manually allowlist** (max 25), until you apply for an extended quota.

## Why / design
M1 will run the real login flow, and it needs two things registered with Spotify *now*: a **Client ID** and an
exact **redirect URI**. Doing it in M0 means M1 starts with auth already possible. Two Spotify realities shape
the whole app and surprise people if unstated ([decision R3](../foundation/decision-log.md#r3--teach-the-rate-limit-mechanism-document-dev-mode-limits-up-front)):

- **Dev-Mode 25-user cap.** Your app only works for accounts you add by hand — up to **25**. If you don't add
  your own account, M1's login returns an error. ("It only works for me" is this cap, not a bug.)
- **`127.0.0.1`, not `localhost`.** Spotify's redirect-URI rules **reject `localhost`** but allow the loopback
  **IP**. Our dev redirect is `http://127.0.0.1:4200/callback` — it must match the dashboard **character for
  character** (scheme, host, port, path), or you get `INVALID_CLIENT` / redirect-mismatch.

## Do this
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in with your
   Spotify account.
2. Click **Create app**. Fill in:
   - **App name** / **App description** → anything (illustrative — e.g. `Spotify Trip`, `dev`).
   - **Redirect URIs** → add **exactly** `http://127.0.0.1:4200/callback` (**mandatory** — load-bearing). If
     you'll deploy later, also add your `https://<host>/callback` (optional now).
   - **Which API/SDKs are you planning to use?** → check **Web API**.
   - Accept the terms → **Save**.
3. Open the app's **Settings** and copy the **Client ID** (a public id — not the secret; PKCE needs no secret).
4. Add yourself as a user so login works in Dev Mode: **Settings → User Management** → add the email on your
   Spotify account → **Save**. (Repeat for anyone else who'll test, up to 25.)
5. Paste the Client ID into `src/environments/spotify-client-id.ts` (the gitignored file from step 09):
   ```ts
   export const SPOTIFY_CLIENT_ID = 'paste-your-client-id-here';
   ```

The Client ID string is **load-bearing** (auth fails silently-ish without it) but **your value** — it's unique
to your app.

## Done when (this step)
- [ ] The Spotify dashboard shows your app with redirect URI `http://127.0.0.1:4200/callback` listed.
- [ ] Your own Spotify account appears under **User Management**.
- [ ] `src/environments/spotify-client-id.ts` contains your real Client ID (a ~32-char hex string), and
      `git status` still does **not** list that file.

## If it breaks
- **Dashboard rejects the redirect URI**: you used `localhost` — Spotify forbids it. Use `http://127.0.0.1:4200/callback`.
- **You can't find a "Client Secret"**: there isn't one to use — PKCE is secretless. Only the Client ID matters.
- **(Preview of M1) login later returns `User not registered`**: you skipped step 4 — the Dev-Mode app only
  admits allowlisted accounts.

---
> Nav: [← The app shell + header](12_shell.md) · [Overview](00_overview.md) · [Write the README →](14_readme.md)
