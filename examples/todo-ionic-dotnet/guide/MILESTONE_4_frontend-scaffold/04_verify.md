# Milestone 4 · Step 04 of 4 — Verify the milestone
> Nav: [← Dev proxy](03_proxy.md) · [Overview](00_overview.md) · [M5 Frontend read path →](../MILESTONE_5_frontend-read/00_overview.md)

## Done-when gate (the whole milestone)
You need **both servers running** for the proxy check.

1. **Start the backend** — terminal 1, from `backend/Api`: `dotnet run` → listening on `:5080`.
2. **Start the frontend** — terminal 2, from `frontend`: `ionic serve`. The browser opens
   `http://localhost:8100` showing the **Blank** page.
   - [ ] No red errors in the browser devtools console.
3. **Test the proxy** — terminal 3:
   ```bash
   curl http://localhost:8100/api/todos
   ```
   Expect the same seeded JSON the backend returns (the dev server forwarded it to `:5080`):
   ```json
   [{"id":1,"title":"Buy groceries","isDone":false},{"id":2,"title":"Walk the dog","isDone":true}]
   ```
   - [ ] The two seeded todos come back **through port 8100** — proving the proxy works.

## Files after this milestone
Most of `frontend/` is untouched scaffold. The files this milestone created or edited:

```typescript
// frontend/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
  ],
});
```

```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: '/api',
};
```

```typescript
// frontend/src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: '/api',
};
```

```json
// frontend/src/proxy.conf.json
{
  "/api": {
    "target": "http://localhost:5080",
    "secure": false
  }
}
```

`frontend/angular.json` is scaffold-default **except** two edits made earlier this milestone: (1) the serve
target now carries the `proxyConfig` line (added in step 03), and (2) `ng generate environments`
([step 02](02_http-and-environment.md)) inserted a `fileReplacements` block into the **build** target's
`configurations.development`, swapping `environment.ts` for `environment.development.ts`. The rest of the
(large, generated) file is untouched. The serve target should read:

```jsonc
// frontend/angular.json  →  projects.app.architect.serve  (only this target changed)
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "proxyConfig": "src/proxy.conf.json"
  },
  "configurations": {
    // ...existing production / development configurations, unchanged from the scaffold...
  },
  "defaultConfiguration": "development"
}
```

## Troubleshooting
- **`curl :8100/api/todos` returns HTML, not JSON** — the proxy isn't active. Restart `ionic serve` after the
  `proxy.conf.json` edit; confirm the `proxyConfig` line is in `angular.json`.
- **`curl` returns a connection error** — the backend isn't running; start `dotnet run` in `backend/Api`.
- **`@angular/core` is not 20.3** — a different Angular came down; that's fine as long as it built, but note
  the drift in [status.md](../foundation/status.md) since later steps assume 20.3 idioms.

## Next
→ [M5 — Frontend read path](../MILESTONE_5_frontend-read/00_overview.md)

---
> Nav: [← Dev proxy](03_proxy.md) · [Overview](00_overview.md) · [M5 Frontend read path →](../MILESTONE_5_frontend-read/00_overview.md)
