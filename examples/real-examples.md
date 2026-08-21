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
repository. Running it for real is also what produced several of the rules the toolkit now carries: the debug
host masking a milestone's headline gate (rule 6.2), a step that ended on a deliberately broken build (rule
4.4), and a capability claimed on a setting's *namespace* rather than the setting itself (the sourcing
principle).

---

## Guide only — not followed to the end yet

The guide is drafted and audited; nobody has taken it all the way through. Read these for the shape of the
output, not as proof a reader gets to the finish line on their own.

*Nothing sits here right now — both published guides have been built end to end. The heading stays because
the distinction does: a drafted, audited guide is not yet evidence that a reader reaches the finish line
unaided.*

---

## Add yours

Run the pipeline on a domain nobody covers, publish the output as your own repository, and open a PR adding it
here — a heading, the link, the GuideForge version you generated it with, two lines. File it under the section
that matches reality: **Followed to the end** only if someone built the whole thing from it, **Guide only**
otherwise. Moving an entry up later, when you finish the build, is a welcome PR of its own. See
[CONTRIBUTING.md](../CONTRIBUTING.md).
