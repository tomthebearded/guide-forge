# Milestone 0 · Step 03 of 3 — Verify the milestone
> Nav: [← Folder skeleton](02_folder-skeleton.md) · [Overview](00_overview.md) · [M1 Backend read path →](../MILESTONE_1_backend-read/00_overview.md)

## Done-when gate (the whole milestone)
Run each command and match the expected output.

- [ ] **Node** — `node -v` → `v24.x`
  ```text
  v24.15.0
  ```
- [ ] **.NET SDK** — `dotnet --version` → `10.0.x`
  ```text
  10.0.100
  ```
- [ ] **Ionic CLI** — `ionic -v` → `7.2.x`
  ```text
  7.2.1
  ```
- [ ] **Folders** — from the project root, `ls` shows only `backend/`; `frontend/` does not exist yet.

(Your patch numbers may differ — `v24.15.0` vs `v24.16.0` etc. Only the major/minor shown in
[foundation/stack.md](../foundation/stack.md) must match.)

## Files after this milestone
No code files yet. The directory tree is:
```text
todo-ionic-dotnet/
└─ backend/        (empty)
```

## Troubleshooting
- **A version is one major behind** — you likely have an older install ahead on `PATH`. Uninstall it or fix
  `PATH` ordering; re-open the terminal.
- **`ionic -v` prints a v6 number** — you have an old global CLI. Re-run `npm install -g @ionic/cli@7`.

## Next
→ [M1 — Backend read path](../MILESTONE_1_backend-read/00_overview.md)

---
> Nav: [← Folder skeleton](02_folder-skeleton.md) · [Overview](00_overview.md) · [M1 Backend read path →](../MILESTONE_1_backend-read/00_overview.md)
