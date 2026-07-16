# M0 · Step 05 of 15 — Create the feature-first folder tree
> Nav: [← Prettier & ESLint](04_prettier-eslint.md) · [Overview](00_overview.md) · [Add Angular Material →](06_add-material.md)

## Why / design
[conventions.md](../foundation/conventions.md) lays out a **feature-first** architecture: cross-cutting
plumbing under `core/`, user-facing features under `features/` (each owning one root-singleton store), and
reusable UI under `shared/`. Stamping the empty tree now gives every later milestone an obvious home for its
files — M1 drops auth into `core/auth/` + `features/auth/`, M4 drops the renderer into `features/globe/`, and so
on. Git doesn't track empty directories, so we drop a `.gitkeep` in each to commit the shape.

> The folder tree is a **map, not a mandate** — creating a folder introduces no code and no dependency, so it
> stays inside M0's scope. We are only reserving the structure, not filling it.

## Do this
1. From the project root, create the directory tree under `src/app/`. On macOS/Linux (or Git Bash on Windows):
   ```bash
   mkdir -p \
     src/app/core/{auth,api,cache,geo,pipeline,models,dto,mappers,logging,util} \
     src/app/features/{auth,globe,player,settings,library,actions} \
     src/app/shared/{toast,confirm,components}
   ```
   In PowerShell:
   ```powershell
   'core/auth','core/api','core/cache','core/geo','core/pipeline','core/models','core/dto','core/mappers','core/logging','core/util','features/auth','features/globe','features/player','features/settings','features/library','features/actions','shared/toast','shared/confirm','shared/components' |
     ForEach-Object { New-Item -ItemType Directory -Force "src/app/$_" | Out-Null }
   ```
2. Drop a `.gitkeep` (an empty file — the name is a convention, not a Git feature) into each leaf folder so the
   empty tree can be committed. Git Bash:
   ```bash
   find src/app/core src/app/features src/app/shared -type d -empty -exec touch {}/.gitkeep \;
   ```
   PowerShell:
   ```powershell
   Get-ChildItem src/app/core,src/app/features,src/app/shared -Directory -Recurse |
     Where-Object { -not (Get-ChildItem $_.FullName) } |
     ForEach-Object { New-Item -ItemType File "$($_.FullName)/.gitkeep" | Out-Null }
   ```

The folder **names** are load-bearing in the sense that later steps import from these exact paths
(`./core/auth/...`, `./features/globe/...`) — keep them spelled as above. The `.gitkeep` files are cosmetic and
disappear the moment a folder gets real content.

## Done when (this step)
- [ ] `src/app/core/`, `src/app/features/`, and `src/app/shared/` exist with the sub-folders listed above.
- [ ] Listing shows the tree, e.g. `find src/app/core -type f` → prints a `.gitkeep` in each `core/*` folder.

## If it breaks
- **`mkdir` complains about the brace expansion**: your shell isn't bash — use the PowerShell block instead (or
  create the folders one per line).
- **The folders vanish from Git**: a truly empty folder is invisible to Git; that's exactly why the `.gitkeep`
  files exist — make sure step 2 actually created them.

---
> Nav: [← Prettier & ESLint](04_prettier-eslint.md) · [Overview](00_overview.md) · [Add Angular Material →](06_add-material.md)
