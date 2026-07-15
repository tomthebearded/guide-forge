# M0 · Step 14 of 15 — Write the README
> Nav: [← Register a Spotify app](13_spotify-dashboard.md) · [Overview](00_overview.md) · [Verify the milestone →](15_verify.md)

## Why / design
A project README is the front door: the next person (or future you) needs the Spotify registration steps, the
`127.0.0.1` requirement, the Dev-Mode cap, and how to run the app — without re-reading this guide. We write it
now while all of that is fresh and correct. It restates the two Spotify gotchas so they're impossible to miss.

## Do this
1. Create `README.md` at the project root with the block below. The redirect URI, the `localhost`-vs-`127.0.0.1`
   note, and the Dev-Mode 25-user cap are the load-bearing facts — keep them exact.

## Code
### `README.md`
````markdown
# Spotify Trip

A 3D globe colored by where your favourite Spotify artists come from. Built with Angular 21 (zoneless) +
Angular Material 3, three-globe, and Wikidata/MusicBrainz.

## Prerequisites

- **Node 24 LTS** (or ≥ 22.12) and **npm 11**.
- A free Spotify account.

## Register a Spotify app

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → **Create app**.
2. Add the redirect URI **exactly** (must match character-for-character):
   - Dev: `http://127.0.0.1:4200/callback` — Spotify **forbids `localhost`**; the loopback IP is allowed.
   - Prod (optional): your deployed `https://<host>/callback`.
3. Under **Which API/SDKs…**, check **Web API**. Save.
4. **Development Mode:** a new app only works for accounts you allowlist under **Settings → User Management**
   — up to **25 users**. Add your own Spotify account, or login will fail.
5. Copy the **Client ID** (a *public* PKCE id — no secret needed) and set it up:
   ```bash
   cp src/environments/spotify-client-id.example.ts src/environments/spotify-client-id.ts
   # then paste your Client ID into spotify-client-id.ts
   ```
   `spotify-client-id.ts` is gitignored.

## Run

```bash
npm install
npm start        # serves http://127.0.0.1:4200
```

`npm start` binds to `127.0.0.1` on purpose, so the Spotify redirect URI matches its loopback requirement.

## Scripts

```bash
npm run build          # production build
npm run lint           # angular-eslint
npm run format         # prettier --write
npm run format:check   # prettier --check
```
````

## Done when (this step)
- [ ] `README.md` exists at the project root and states the `http://127.0.0.1:4200/callback` redirect, the
      `localhost`-forbidden note, and the Dev-Mode 25-user cap.
- [ ] `npm run format:check` → still `All matched files use Prettier code style!` (Markdown isn't matched by the
      `src/**` glob, so the README won't trip it).

## If it breaks
- **`format:check` suddenly fails**: it only globs `src/**/*.{ts,html,scss}` — a root `README.md` shouldn't
  affect it. If it does, a `src` file changed; run `npm run format`.
