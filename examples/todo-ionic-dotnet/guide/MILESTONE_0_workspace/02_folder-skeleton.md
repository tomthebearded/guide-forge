# Milestone 0 · Step 02 of 3 — Create the project folder skeleton
> Nav: [← Prerequisites](01_prerequisites.md) · [Overview](00_overview.md) · [Verify →](03_verify.md)

## Why / design
The app is two independent programs — a .NET API and an Ionic app — living side by side in one repo (see
[foundation/conventions.md](../foundation/conventions.md#repo-layout)). We create the root and the `backend/`
folder now. We deliberately do **not** create `frontend/`: the `ionic start` command in
[M4](../MILESTONE_4_frontend-scaffold/00_overview.md) creates that folder itself and errors if it already
exists.

## Do this
1. **Choose where the project lives** and create the root folder. Pick any location you like; the folder
   **name** `todo-ionic-dotnet` is cosmetic (rename freely) — nothing in the code depends on it.
   ```bash
   mkdir todo-ionic-dotnet
   cd todo-ionic-dotnet
   ```
2. **Create the `backend/` folder.** The name `backend` is **load-bearing in this guide's paths** — every
   later command that says `cd backend` assumes it. Keep it exactly `backend`.
   ```bash
   mkdir backend
   ```
3. **Confirm the layout.** Run `ls` (macOS/Linux) or `dir` (Windows `cmd`) in the project root. You should see
   exactly one entry: `backend`.

Do not create `frontend/`, a `.git` folder, or any config files yet — those arrive in later milestones.

## Done when (this step)
- [ ] From the project root, listing the directory shows a single `backend/` folder and nothing else.
- [ ] Running `pwd` (or `cd` on Windows) shows you are inside `…/todo-ionic-dotnet`.

## If it breaks
- **`cd backend` later says "no such file or directory"** — you created `backend` somewhere other than the
  project root, or you're not in the root. Run `pwd` and confirm you're in `todo-ionic-dotnet`.
