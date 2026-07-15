# Troubleshooting — spotify-trip (global sheet)

> The consolidated first-timer trap list promised in [PLAN §6](PLAN.md). Every milestone's `NN_verify.md` has
> its own **Troubleshooting** / **If it breaks** section for milestone-specific failures — this sheet
> aggregates the **cross-cutting** traps that bite regardless of where you are, plus an index into the
> per-milestone sections. When a symptom here names a step, that step's own "If it breaks" has the detail.

## Setup & Spotify auth (the big first-timer wall — M0/M1)
| Symptom | Likely cause → fix |
|---------|--------------------|
| `INVALID_CLIENT` / "Invalid redirect URI" on Spotify's consent page | Dashboard redirect URI must be **exactly** `http://127.0.0.1:4200/callback`. Don't use `localhost` — register the loopback IP and serve on it (`ng serve --host 127.0.0.1`). See [M0/13](MILESTONE_0_scaffold/13_spotify-dashboard.md). |
| `localhost` "works" in the browser but auth fails | Spotify now rejects `localhost` redirect URIs; `crypto.subtle` (PKCE hashing) also needs a **secure context**. Both are satisfied by `127.0.0.1`, never a bare LAN IP. |
| Login button disabled + "Set your Spotify Client ID" | `spotify-client-id.ts` is missing/empty → copy `spotify-client-id.example.ts` and paste your dashboard Client ID ([M0/09](MILESTONE_0_scaffold/09_environments.md)). It's gitignored on purpose. |
| `403` at login: "user may not be registered" | Dev-Mode app has a **25-user cap** — add your Spotify account under **Users & Access** in the dashboard ([M0/13](MILESTONE_0_scaffold/13_spotify-dashboard.md)). |
| A feature returns `403 Insufficient client scope` | The requested scope wasn't granted at authorize time — the scope list is fixed in the auth service ([M1/04](MILESTONE_1_spotify-auth-pkce/04_spotify-auth-service.md)); log out and back in after changing it. |
| Callback toasts "Your login session expired" | The PKCE `code_verifier` lives in `sessionStorage`; you started and finished login in **different tabs**. Do both in the same tab ([M1/07](MILESTONE_1_spotify-auth-pkce/07_callback-page.md)). |
| Token POST `400 invalid_grant` / `415` | `code_verifier`/`redirect_uri` at exchange ≠ what authorize used, or form encoding dropped. Both must match exactly and the token endpoint needs `application/x-www-form-urlencoded` ([M1/04](MILESTONE_1_spotify-auth-pkce/04_spotify-auth-service.md)). |
| Reload logs you out | Token cache key drift, or `set()` not calling `persist()` — the `evm.spotify.tokens` key must be spelled identically ([M1/02](MILESTONE_1_spotify-auth-pkce/02_token-store.md)). |

## HTTP resilience, rate limits & caching (M2)
| Symptom | Likely cause → fix |
|---------|--------------------|
| Floods of `429 Too Many Requests` | The per-host AIMD gate isn't wired, or the interceptor isn't registered in `app.config.ts` ([M2/08–09](MILESTONE_2_http-resilience/08_rate-limit-interceptor.md)). |
| Retries hammer a genuinely-failing request | `429` is deliberately **excluded** from retry (the gate handles it); only transient network/5xx retry ([M2/03](MILESTONE_2_http-resilience/03_http-retry.md)). |
| `QuotaExceededError` writing to localStorage | The shared `storage-cache.ts` is quota-safe — a raw `localStorage.setItem` bypassed it. Route every write through the cache ([M2/02](MILESTONE_2_http-resilience/02_storage-cache.md)); see **Data & localStorage** below. |

## Globe / three.js render loop (M4–M8)
| Symptom | Likely cause → fix |
|---------|--------------------|
| Globe is black / no land | Lights missing (`AmbientLight` + `DirectionalLight`), or GeoJSON reached with empty `polygonsData` / no `ISO_A2` ([M4/03–04](MILESTONE_4_globe-base/03_renderer-scene.md)). |
| `Too many active WebGL contexts` after a few navigations | `dispose()` isn't running — cleanup must be in `DestroyRef.onDestroy` and the `/globe` route must be **lazy** so the component is destroyed ([M4/05](MILESTONE_4_globe-base/05_globe-canvas.md), [M4/07](MILESTONE_4_globe-base/07_globe-route.md)). |
| Frame rate tanks / change detection churns every frame | Something in the render loop touches a signal. The loop stays **signal-free** ([D4](foundation/decision-log.md#d4--signal-free-render-loop)); the only bridge is the canvas component's `effect()`s. |
| Hover picks the wrong country / never fires | `setHoverHandler` called before `init`, missing `#host` template ref, or a GeoJSON without proper `ISO_A2` ([M4/05](MILESTONE_4_globe-base/05_globe-canvas.md)). |

## Live player (M7)
| Symptom | Likely cause → fix |
|---------|--------------------|
| Transport controls (play/pause/skip) return `403` | Playback control requires **Spotify Premium** ([R4](foundation/decision-log.md#r4--split-the-m7-gate-read-only-vs-premium-controls)); the now-playing readout is free for all accounts. This is expected on a free account, not a bug. |
| Player bar stays empty | Nothing is playing on any device — start playback in an official Spotify client first; the app polls, it doesn't start a session. |

## Data & localStorage (M8–M11)
| Symptom | Likely cause → fix |
|---------|--------------------|
| `QuotaExceededError` as the library grows | localStorage is ~5 MB. The caches version + sanitize their payloads; if you hit the ceiling, use **Actions → Clear all data** ([M11/09](MILESTONE_11_settings-data-polish/09_actions-clear-data.md)) or export first ([M11/05](MILESTONE_11_settings-data-polish/05_data-transfer.md)). |
| Stale/broken data after editing a cache shape | Bump the cache's `version` field so `revive` discards the old payload instead of trusting it ([M2/02](MILESTONE_2_http-resilience/02_storage-cache.md)). |
| Imported JSON doesn't apply | `DataTransfer` only accepts the namespaced `evm.*` keys it wrote; a hand-edited file with the wrong shape is rejected ([M11/05](MILESTONE_11_settings-data-polish/05_data-transfer.md)). |

## Per-milestone troubleshooting index
Each milestone's own section lives in its verify (or the flagged step's "If it breaks"):

- **M0** — [15_verify.md](MILESTONE_0_scaffold/15_verify.md) · scaffold, theme, dashboard setup
- **M1** — [11_verify.md](MILESTONE_1_spotify-auth-pkce/11_verify.md) · PKCE auth end-to-end
- **M2** — [12_verify.md](MILESTONE_2_http-resilience/12_verify.md) · retry / rate-limit / cache
- **M3** — [08_verify.md](MILESTONE_3_liked-songs-stream/08_verify.md) · Liked Songs streaming
- **M4** — [08_verify.md](MILESTONE_4_globe-base/08_verify.md) · globe, disposal, hover
- **M5** — [10_verify.md](MILESTONE_5_country-resolution-heat/10_verify.md) · country resolution + heat
- **M6** — [11_verify.md](MILESTONE_6_hover-panel-fixups/11_verify.md) · hover panel + fixups
- **M7** — [08_verify.md](MILESTONE_7_live-player/08_verify.md) · live player (Premium note)
- **M8** — [13_verify.md](MILESTONE_8_trip-flight-mode/13_verify.md) · trip / flight mode
- **M9** — [15_verify.md](MILESTONE_9_explore-filters-sync/15_verify.md) · filters + boot-sync
- **M10** — [18_verify.md](MILESTONE_10_library-console/18_verify.md) · library console
- **M11** — [11_verify.md](MILESTONE_11_settings-data-polish/11_verify.md) · settings, data transfer, a11y

> **Reconcile-before-follow:** if a Spotify/Wikidata/MusicBrainz API or a pinned tool has drifted since this
> guide was written, **reality wins** — patch the step and log it in [status.md](foundation/status.md). Use
> `/review-before-follow` before executing against the live APIs.
