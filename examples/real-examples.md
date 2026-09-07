# Real examples

Guides the GuideForge pipeline produced, each published as its own repository — the answer to "fine, but what
does the output actually look like?". They're linked, not vendored: this repo ships the method. Two lines each
below, plus the **GuideForge version that generated it** — the toolkit's structure and conventions move
between releases, so an older example won't match what you'd get today. The details are in each project's own
README.

They are split by **how far the guide has been taken**, because the two states prove different things. A guide
someone followed to the end is evidence the *teaching* worked. A guide that exists but hasn't been built is
evidence only that the *contract* was satisfied — the layout, the gates and the audit are in place, and
nothing yet says a reader reaches the end unaided. Both are worth reading; conflating them is not.

Looking for examples of what to *type* rather than what comes out? See
[plan-guide-prompts.md](plan-guide-prompts.md).

---

## Followed to the end

Someone built the whole thing from the guide, and the finished project ships beside it in the same repository.

### [guide-forge-web-platformer](https://github.com/tomthebearded/guide-forge-web-platformer) — GuideForge `v1.1.0`

Takes a reader with **no prior programming experience** to *Shape Jumper*, a 2D browser platformer in vanilla
JavaScript and Canvas with zero dependencies — 7 milestones, 25 steps and 7 verify gates, shipped next to the
finished game.

Followed end to end: the repo's own history walks the ladder milestone by milestone through M7, one commit per
step. Its `foundation/status.md` still shows the gates unticked — the build outran the guide's own status
authority, which is worth knowing before you read that file as reality.

### [guide-forge-vscode-extension](https://github.com/tomthebearded/guide-forge-vscode-extension) — GuideForge `v1.2.0`

Takes a reader to *Van Code*, a TypeScript VS Code extension whose sidebar panel live-recolors the entire
editor — workbench chrome *and* syntax/semantic tokens — non-destructively, ending at a packaged `.vsix`.
7 milestones, 43 steps and 7 verify gates, audited twice with every finding fixed.

Followed to the end, through M7 to the packaged extension, which ships beside the guide in the same
repository — and past it: the `.vsix` the last milestone builds is now published as
[**Vincent Van Code**](https://marketplace.visualstudio.com/items?itemName=TommasoMastroberardino.vincent-van-code)
on the VS Code Marketplace, which is as far as "the reader finishes with something real" goes. Running it for
real is also what produced several of the rules the toolkit now carries: the debug host masking a milestone's
headline gate (rule 6.2), a step that ended on a deliberately broken build (rule 4.4), and a capability
claimed on a setting's *namespace* rather than the setting itself (the sourcing principle).

---

## Guide only — not followed to the end yet

The guide is drafted and audited, but nobody has taken it all the way through — a build may be well under
way and still not have reached the last gate. Read these for the shape of the output, not as proof a reader
gets to the finish line on their own.

### [guide-forge-unity-platformer](https://github.com/tomthebearded/guide-forge-unity-platformer) — GuideForge `v1.18.0`

Takes a reader to *Cavern Dash*, a 2D pixel platformer in **Unity 6.3 LTS** and C# — run, jump, dash and
wall-jump through a tilemap cavern, past moving and one-way platforms, coins, enemies, lives and checkpoints,
to menus, rebindable keys, a persisted best time and a double-clickable desktop build. 13 milestones, 64 steps
and 13 verify gates across 77 step files, on Kenney's CC0 art and audio.

Executed through **M11 of 13** — the frontier sits at M12, and M9 and M10 are back at `⏳` awaiting a
re-run of their gates after two late fixes, so nothing here yet says a reader reaches the finish line unaided.
What running it in the Editor did produce is field evidence: three audits and a run of `/report-issue` fixes
that reached back into the toolkit — a mashed jump re-arming the coyote window mid-rise, Unity 6.3 dropping the
*Used By Composite* checkbox, a moving platform that carried its rider by re-parenting and threw on Play, an
opening HUD read from `OnEnable` in an order Unity never promised, and a stomp measured against the enemy's
head that only ever passed on a slow approach. Two pedagogy rules came out of it: **4.6** (the 231 tiles
imported one at a time) and **6.7** (the gates that went green because they were performed gently).

---

## Add yours

Run the pipeline on a domain nobody covers, publish the output as your own repository, and open a PR adding it
here — a heading, the link, the GuideForge version you generated it with, two lines. File it under the section
that matches reality: **Followed to the end** only if someone built the whole thing from it, **Guide only**
otherwise. Moving an entry up later, when you finish the build, is a welcome PR of its own. See
[CONTRIBUTING.md](../CONTRIBUTING.md).
