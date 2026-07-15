# M0 · Step 01 of 15 — Verify your toolchain
> Nav: — · [Overview](00_overview.md) · [Scaffold the project →](02_scaffold-project.md)

## Why / design
Angular 21 refuses to run on the wrong Node, and the whole guide is pinned to specific tool versions so the
code stays byte-for-byte reproducible ([stack.md](../foundation/stack.md), decision
[R1](../foundation/decision-log.md#r1--pin-angular-212-not-22)). The single most common "nothing works and I
don't know why" at scaffold time is a stale Node. Check it *before* you generate anything — a mismatch caught
now is one command; caught after scaffolding it's a confusing wall of errors.

## Do this
1. In a terminal, run `node -v` — Angular 21 requires Node **`^20.19 || ^22.12 || ^24`**. We pin **24 LTS**.
   If yours is older (or an odd-numbered non-LTS like 23/25), install Node 24 LTS from
   [nodejs.org](https://nodejs.org) first.
2. Run `npm -v` — you want **npm 11.x** (ships with Node 24). If you're on an older npm, run
   `npm install -g npm@11`.
3. Pick the folder where the project should live and `cd` into it. The scaffold command in the next step
   creates a **`spotify-trip/`** subfolder here — so run it from the *parent* directory, not inside an
   existing project.

> 📚 New concept — [LTS](https://nodejs.org/en/about/previous-releases): Node's "Long-Term Support" even-numbered
> releases get years of patches. Angular targets LTS lines; odd-numbered "Current" releases (23, 25, …) are not supported.

## Done when (this step)
- [ ] `node -v` → prints `v24.x.x` (or `v22.12`+).
- [ ] `npm -v` → prints `11.x.x`.

## If it breaks
- **`node -v` prints v20.x or a v23/v25**: install Node **24 LTS** from nodejs.org — Angular 21's CLI will error
  on an unsupported engine during `ng new` otherwise.
- **`npm -v` prints 9.x/10.x**: run `npm install -g npm@11`; an old npm can resolve the wrong peer versions.
