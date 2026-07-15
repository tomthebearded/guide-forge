# Reference — The pedagogy rules (the writing contract)

> These ten rules are the heart of GuideForge. Each one exists because of a *real* way a reader gets lost.
> They turn "teach well" from a vibe into a checklist a model can satisfy and you can audit. This file
> explains each rule, why it exists, and shows a before/after.
>
> The **first six** are for *writing/rewriting* a step (prompts 01–03). The **last four** overlap with the
> *review-before-follow* gate (prompt 04) — they're what you check before executing a step. In practice all
> ten belong in every finished step.

---

## The audience principle (the rule behind the rules)

Every rule below is applied *relative to the audience model* — a **per-topic expertise matrix** plus a
**granularity** dial (full treatment: [audience-model.md](audience-model.md)).

- **Depth is per topic, and graded.** Each concept is explained at its topic's level: **Expert** → name only;
  **Intermediate** → reminder + link; **Beginner** → define + link + why; **New** → define + link + deep-dive
  + failure notes. Over-explaining an Expert topic is a *real defect*, exactly as harmful as under-explaining
  a New one.
- **Granularity is separate.** It sets step *size* and prose *density*, not which concepts get defined. A
  highly-granular guide for an expert has many small steps but almost no concept explanation.

When in doubt, match depth to the reader's level *on that specific topic*. A guide for a reader who is
"Expert in Python, New to Kubernetes" explains every `kubectl` verb with a doc link and no Python syntax.

---

## The sourcing principle (facts come from the docs, not from memory)

A teaching guide loses all trust the moment a version number is wrong or an API doesn't exist. So:

- **Pin versions once, up front.** The [Verified stack](../templates/stack.md) (produced by the planner's
  online Phase 0.5) is the single reference; every step builds against those exact versions.
- **Verify APIs against the current official docs before writing code** — names, signatures, flags,
  config keys. Training memory is stale; the docs are truth. If they disagree, the docs win.
- **Link the authoritative source.** When rule R1 introduces an external API/tool concept, deep-link its
  official docs page so the reader can go further at the source — and so the claim is checkable.
- **No link → no claim.** If you can't verify a version or API online, say "unverified" rather than assert it.

---

## R1 — Explain every concept on first use (inline, or a callout right above)
**Why:** an undefined term stops a reader cold; they either guess (dangerous) or leave to look it up (lost
momentum). The worst case is a term stated as a **bare rule or decision** — "use Gamma color space, PPU 32,
Point filter" — with neither a definition nor a pointer to where it's explained: the reader can't even tell
there's something they're missing. **Do:** the first time a term outside "knows already" appears, explain it
*at or before* that point, using whichever form fits the sentence:

- **Inline gloss** — a one-sentence plain-language definition in dashes or parentheses, then link the
  glossary. Best when the term sits inside prose.
- **"New concept" callout right above** — when the term first lands on a command, menu, or code line where
  an inline aside would wreck the flow, put a one-line callout on its own line *immediately above* that line:
  `> 📚 New concept — [term](glossary-or-doc-link): one-sentence definition.` (The emoji is optional; match
  the guide's other callouts.)

Either way the term is explained *before or at* first use, never after. If a step introduces many terms, also
add a "Glossary for this step" block at the top. **Never leave a load-bearing term as a bare rule with no
gloss and no link** — if a decision names a concept, either define it or point to where it's defined.

**Built-in library methods are R1 terms too.** When the reader is **New/Beginner** on a language or engine,
its standard-library and built-in surface counts as first-use terms — `Math.round()`, `Math.PI`,
`Number.toFixed()`, `ctx.fillRect()` for JS-new; `Transform`, `Clear Flags`, `IL2CPP` for Unity-new. Gloss
them at first use, at the topic's depth. The defect is an **inconsistent bar**: glossing `const` but using
`toFixed()` bare on the next line. If the bar is high enough to explain `const`, apply it to the built-in too.

- ❌ "Use `angle.toFixed(2)` to round the readout." (built-in method, bar set high elsewhere, left bare)
- ✅ `> 📚 New concept — Number.toFixed(n): rounds a number to n decimal places and returns it as a string. See`
  `[glossary](../glossary.md#numbertofixed).` then "Use `angle.toFixed(2)` to round the readout."
- ❌ (web-platformer) glossed `const` but used `Math.round`, `Math.PI`, `toFixed` with no definition.

- ❌ "Register the middleware and it'll wrap every handler."
- ✅ (inline) "Register the **middleware** — a function that runs on every request *before* your handler,
  used here for logging — and it'll wrap every handler."
- ❌ "Set **Color Space** to Gamma." (a load-bearing term as a bare rule — no gloss, no link)
- ✅ (callout, on its own line right above the action):
  `> 📚 New concept — Gamma color space: texture values render exactly as authored (no sRGB curve), so`
  `hand-picked palettes look right. See [glossary](../glossary.md#gamma).`

## R2 — Every action says WHERE
**Why:** "add the route" is useless if the reader doesn't know which file/panel/menu. Locating things is
half the friction for a newcomer. **Do:** name the exact file + location, or the exact menu path, or the
exact command context.

- ❌ "Add the route."
- ✅ "In `cmd/server/main.go`, inside the `setupRoutes()` function, add the route."

## R3 — Every action says WHAT it does and WHY
**Why:** copying without understanding produces brittle knowledge — the "learn" fails. **Do:** one clause on
the mechanism/purpose, not just the keystroke.

- ❌ "Run `go mod init example/api`."
- ✅ "Run `go mod init example/api` — this creates `go.mod`, which declares your module path so imports
  resolve and dependencies get tracked."

## R4 — Be exact where the outcome depends on it
**Why:** "a reasonable value" makes the reader guess, and a wrong guess breaks the gate. **Do:** give the
concrete value. If a value is genuinely free, *say so* — that's also information.

- ❌ "Set a sensible timeout."
- ✅ "Set the timeout to `5 * time.Second`. (Any value ≥ 1s works; we use 5s.)"

**Compute a value once, reuse the same figure everywhere.** A value that is *derived* or *cited* more than
once — a jump height, a tick rate, a timeout, a grid size, a colour hex — must be **identical** in every place
it appears: the code, the prose that explains it, the Done-when gate, the glossary, the overview. Calculate it
once, then quote that exact figure; never re-derive it (you'll round differently) or eyeball a "close enough"
number in prose. If the value changes, change it everywhere in the same pass.

- ❌ code sets `jumpHeight = 2.5f` but the prose says "the character jumps 2 units" and the gate says "~2.5".
- ✅ code, prose, and gate all say **`2.5`** units — one figure, quoted verbatim wherever it recurs.

> **The defect this prevents:** a jump height that reads `2` in one file and `2.5` in another, so the reader
> can't tell which is right. (Observed: unity example.)

## R5 — Separate MANDATORY from ILLUSTRATIVE
**Why:** readers can't tell your arbitrary example choice from a load-bearing requirement, so they either
cargo-cult everything or change something critical. **Do:** mark which is which.

- ❌ "Create a `Book` struct with `Title` and `Author`."
- ✅ "The struct's *fields* are up to your domain (illustrative: `Title`, `Author`). The **JSON tags are
  mandatory** — the API contract depends on `\"title\"` and `\"author\"` exactly."

## R6 — State which fields to change and which to LEAVE AT DEFAULT
**Why:** a config screen with 20 fields makes the reader wonder "did I miss one?" **Do:** be exhaustive for
the object in hand; explicitly say "leave the rest at defaults."

- ❌ "Configure the server."
- ✅ "On the `http.Server`, set `Addr` and `Handler`. **Leave every other field at its default.**"

## R7 — Teach the recurring mental model at the point of use
**Why:** one or two framing ideas make dozens of later steps obvious — but only if introduced where they
first bite, then reinforced. **Do:** state the model in place, and note where it'll recur.

- ✅ "Remember: in Go an interface is satisfied *implicitly* — you never write `implements`. A type just has
  the methods. We rely on this again when we swap the storage backend in M3."

## R8 — Flag load-bearing names vs cosmetic ones
**Why:** the reader doesn't know which strings are safe to rename. Rename a load-bearing one and it breaks
mysteriously. **Do:** say which before they type.

- ✅ "The handler *function* name is cosmetic — call it what you like. The route string `/books` is
  **load-bearing**: the tests and the frontend hit it exactly."

## R9 — Sequences are numbered lists, never arrow-chains
**Why:** an arrow chain hides how many distinct actions there are and where one ends. **Do:** number
distinct actions. Reserve `→` for a *single* menu-navigation path inside one action.

- ❌ "Open the file → edit the handler → save → run the tests."
- ✅ "1. Open `main.go`. 2. Edit `booksHandler`. 3. Save. 4. Run `go test ./...`."
- ✅ (arrow OK — one action) "Menu: **File → New → Go File**."

## R10 — Name the likely failure and its usual cause
**Why:** the first error a newcomer hits is where most give up. Pre-empting it turns panic into a
one-line diagnosis and teaches the underlying cause. **Do:** for each step's common error, give the first
thing to check.

- ✅ "If you see `undefined: mux`, you skipped the import in step 2 — check the top of the file first."

---

## The gate principle (a Done-when must exercise what it claims to prove)

A `Done-when` gate is a *proof*, not a label. Its observable action must **exercise exactly the property it
claims to prove** — otherwise a green check certifies nothing.

- **The action must touch the code-path of the claimed property.** If the gate claims "the ordering is
  deterministic," the action must **re-run** the thing and compare outputs across runs — not merely produce
  one output once. If it claims "the record persisted," the action must **restart and re-read** — not just
  write. A gate that says "proves X" but whose action never invokes X's code-path is a false gate.
- **If the property isn't observable, reword the claim to what IS observed.** Don't assert an unprovable
  property behind a checkbox. Either make the property observable (re-query, restart, diff two runs) or shrink
  the claim to exactly what the action demonstrates.

- ❌ "**Done when:** the query is deterministic — run it and see the list." (one run proves nothing about
  determinism)
- ✅ "**Done when:** running the query **twice** returns byte-identical order both times — run it, copy the
  output, run it again, diff: no differences."

> **The defect this prevents:** a gate that claims to "prove the ordering is deterministic" but only queries
> once, so it never exercises the re-run that determinism is about. (Observed: spotify-trip M5.)

---

## Review-gate corollaries (for prompt 04)

When you're about to *follow* a guide rather than write it, three extra checks apply:

- **No unclear operation survives.** If a step leaves a "how exactly?" question, resolve it before acting.
- **List implied/missing steps.** Enumerate any silently-assumed prerequisite as its own numbered step.
- **Reconcile — reality wins.** Diff assumptions (versions, labels, paths, API names) against the real tool;
  patch the guide and log the drift. A clear-but-stale step is the dangerous kind.

---

## How to add a rule

Only add a rule that comes from a **real** point of confusion. Write it as: the confusion → the rule → a
before/after. Speculative rules bloat the contract and get ignored. See [CONTRIBUTING](../CONTRIBUTING.md).
