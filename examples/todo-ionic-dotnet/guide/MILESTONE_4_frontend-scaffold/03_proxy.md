# Milestone 4 · Step 03 of 4 — Add the dev proxy to the backend
> Nav: [← HttpClient + environments](02_http-and-environment.md) · [Overview](00_overview.md) · [Verify →](04_verify.md)

## Glossary for this step
- **dev proxy** — a rule in the Angular dev server that forwards matching requests (here `/api/*`) to another
  server, so the browser only ever talks to one origin. See [glossary](../foundation/glossary.md).

## Why / design
The app fetches `/api/todos` (a relative URL). Without a proxy that would hit the Ionic dev server at `:8100`,
which has no such route. The proxy forwards anything under `/api` to the backend at `http://localhost:5080`.
In dev this means the browser sees a single origin (`:8100`) — no cross-origin call, no CORS preflight — even
though CORS is also configured on the API ([decision D4](../foundation/decision-log.md#d4--dev-proxy-on-the-frontend-instead-of-relying-on-cors)).

## Do this
1. **Create `frontend/src/proxy.conf.json`** with the rule below. `target` is **load-bearing** — it must be the
   backend URL from [M1](../MILESTONE_1_backend-read/01_create-api-project.md) (`http://localhost:5080`).
2. **Point the serve target at it in `frontend/angular.json`.** Find `projects → app → architect → serve`
   (the target whose `builder` ends in `:dev-server`) and add a `proxyConfig` key to its `options` object.
   > **This is a deliberate partial edit of a generated file.** `angular.json` is large and written by
   > `ng new`/`ionic start`; we do **not** reproduce it in full. Change **only** the serve target's `options`
   > object as shown below and leave every other serve option — and the rest of the file — exactly as the
   > scaffold wrote it. The complete file already lives on disk from the scaffold; the exact block you should
   > end up with is shown again in [04_verify.md](04_verify.md).

## Code
```json
// frontend/src/proxy.conf.json
{
  "/api": {
    "target": "http://localhost:5080",
    "secure": false
  }
}
```

```jsonc
// frontend/angular.json  →  projects.app.architect.serve  (only the options object shown)
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "proxyConfig": "src/proxy.conf.json"
  },
  "configurations": {
    // ...leave the existing production / development configurations unchanged...
  },
  "defaultConfiguration": "development"
}
```

> If the serve target has no `options` object yet, add one containing just `proxyConfig` as shown. Don't touch
> the `configurations` block.

## Done when (this step)
- [ ] `frontend/src/proxy.conf.json` exists with the `/api` → `:5080` rule.
- [ ] `angular.json`'s serve target has `"proxyConfig": "src/proxy.conf.json"` in its `options`.
- [ ] After **restarting** `ionic serve`, the terminal logs a proxy line similar to
      `[proxy] /api -> http://localhost:5080` (wording varies by version).

## If it breaks
- **Proxy changes seem ignored** — the dev server reads `proxy.conf.json` only at startup. Stop and restart
  `ionic serve` after editing it.
- **Sub-paths like `/api/todos/1` aren't proxied** — change the key from `"/api"` to `"/api/**"` in
  `proxy.conf.json` and restart (some dev-server versions need the glob for nested paths).
- **`Could not read proxy configuration file`** — the path in `angular.json` must be `src/proxy.conf.json`
  relative to the workspace root; confirm the file is under `src/`.
