# Reference — The pedagogy principles (the writing contract)

> These **principles** are the heart of GuideForge. Each groups a small family of rules, and each rule
> exists because of a *real* way a reader gets lost. Together they turn "teach well" from a vibe into a
> checklist a model can satisfy and you can audit. This file explains each principle, its rules (cited by a
> dotted id like `3.1`), why each exists, and shows a before/after.
>
> **Every example below is illustrative.** Concrete values — ports, endpoints, versions, file names,
> jump heights, reader profiles — are there to show the *shape* of a good answer. None of them is a
> recommended value; the right value always comes from your own build and your own reader.
>
> **Principles 1–4 and 7** are things you apply while *writing/rewriting* a step (prompts 01–03).
> **Principle 5** (anticipate failure) and **Principle 6** (prove the gate) are also what you check at the
> *review-before-follow* gate (prompt 04). Rule **3.5** is a *whole-guide* consistency property, checked across
> steps rather than within one. In practice they all belong in every finished step.

---

## The principles behind the rules (three lenses applied to every rule below)

### The audience principle

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

### The sourcing principle (facts come from the docs, not from memory)

A teaching guide loses all trust the moment a version number is wrong or an API doesn't exist. So:

- **Pin versions once, up front.** The [Verified stack](../templates/stack.md) (produced by the planner's
  online Phase 0.5) is the single reference; every step builds against those exact versions.
- **Verify APIs against the current official docs before writing code** — names, signatures, flags,
  config keys. Training memory is stale; the docs are truth. If they disagree, the docs win.
- **Verify a capability on the exact name, never on its family.** When the docs grant a behaviour to a *class*
  of things — "all `editor.*` settings", "any hook", "every `/v2` endpoint", "all serializable fields" — do not
  carry that over to the specific member you're teaching without confirming it **on that member**. Platforms
  declare capabilities per item; docs prose generalizes, and the generalization is usually *mostly* true, which
  is what makes it dangerous. The tell is a sentence in your own draft shaped like "X works here **because**
  it's a Y" — that `because` is an inference, not a citation. If you can't verify the individual name, teach the
  route that doesn't depend on the capability at all.
  - ❌ "`editor.tokenColorCustomizations` takes a per-language override — it's an `editor.*` setting, and those
    accept one."
  - ✅ "A per-language override needs the setting to be scoped `language-overridable`; this one is
    `application`-scoped, so the language goes *inside* the value instead."
  - *(Origin: a guide taught the `"[languageId]"` override for a setting that rejects it. The docs said "all
    editor settings and some non-editor settings are supported", the namespace matched, and the code threw at
    runtime — after the reader had been told exactly why it should work.)*
- **When the reader's toolchain contradicts the docs, the toolchain wins.** The docs describe *semantics*;
  the schema validator, compiler, linter, formatter or type-checker you tell the reader to run decides what
  they actually *see*. Where they disagree about what a code or config block must **contain**, write the
  block that comes out clean and add a note saying why it differs from the docs — otherwise the reader who
  checks the docs concludes the guide is wrong. (This scopes the bullet above to semantics; names,
  signatures, flags and versions still come from the docs.)
- **Link the authoritative source.** When rule 1.1 introduces an external API/tool concept, deep-link its
  official docs page so the reader can go further at the source — and so the claim is checkable.
- **No link → no claim.** If you can't verify a version or API online, say "unverified" rather than assert it.

### The voice principle (address the reader directly as "you")

The person following the guide is **"you"** — always second person, spoken to directly. **Never refer to the
reader in the third person** — not "the Human", "the human", "the user", "the developer", "the reader", or
"one". Those labels read as if the guide is describing someone else performing the steps, which distances the
very person holding the keyboard. Write instructions and gates as things **you** do and see.

This applies everywhere the reader is the actor: step actions, Done-when gates, troubleshooting, overviews,
and handoffs. (Referring to a *different* actor — an end-user of the app you're building, a teammate — in the
third person is fine; the rule is only about naming the guide-follower.)

- ❌ "The Human presses F5 and the Extension Development Host opens." / "The user then runs the tests."
- ✅ "Press <kbd>F5</kbd> — the Extension Development Host opens." / "Now run the tests."
- ❌ "Done when: the human sees the square glide across the canvas."
- ✅ "Done when: **you** see the square glide across the canvas."

---

## P1 — Explain what's new
*Build the reader's understanding: define concepts as they arrive, and teach the framing ideas where they bite.*

### 1.1 — Explain every concept on first use (inline, or a callout right above)
**Why:** an undefined term stops a reader cold; they either guess (dangerous) or leave to look it up (lost
momentum). The worst case is a term stated as a **bare rule or decision** — "use Gamma color space, PPU 32,
Point filter" — with neither a definition nor a pointer to where it's explained: the reader can't even tell
there's something they're missing.

**(a) Use whichever form fits the sentence — and explain *before or at* first use, never after.**
- **Inline gloss** — a one-sentence plain-language definition in dashes or parentheses. Best when the term
  sits inside prose.
- **"New concept" callout right above** — when the term first lands on a command, menu, or code line where
  an inline aside would wreck the flow, put a one-line callout on its own line *immediately above* that line:
  `> New concept — **term**: one-sentence definition.` (The marker is this exact plain-text form — no emoji,
  so it renders identically in every terminal and viewer. Deep-link the term's *official docs* here when it's
  an external API — the sourcing principle requires it — but **not** the glossary; see 1.1b.)

If a step introduces many terms, also add a "Glossary for this step" block at the top. **Never leave a
load-bearing term as a bare rule with no gloss and no pointer** — if a decision names a concept, either define
it or point to where it's defined.

- ❌ "Register the middleware and it'll wrap every handler."
- ✅ (inline) "Register the **middleware** — a function that runs on every request *before* your handler,
  used here for logging — and it'll wrap every handler."
- ❌ "Set **Color Space** to Gamma." (a load-bearing term as a bare rule — no gloss, no pointer)
- ✅ (callout, on its own line right above the action):
  `> New concept — Gamma color space: texture values render exactly as authored (no sRGB curve), so`
  `hand-picked palettes look right.` (its glossary link lives once in `## Glossary for this step`, not here.)

**(b) Link the glossary once, in the step's block — not after every term.** The body gloss/callout *defines*
the term; it does **not** append a `see [glossary](…)` link. The glossary is pointed to a single time, from the
step's `## Glossary for this step` block (which carries the per-term `../glossary.md#slug` deep-links). Trailing
"see glossary" after each term is repetitive noise — drop it from the body and let the block be the one door to
the glossary.

- ❌ (body callout) `> New concept — middleware: code that runs on every request. See [glossary](../glossary.md#middleware).`
- ✅ (body callout) `> New concept — middleware: code that runs on every request before your handler.`
  — the glossary link for `middleware` lives once, in `## Glossary for this step`.

**(c) Built-in library methods are first-use terms too.** When the reader is **New/Beginner** on a language or
engine, its standard-library and built-in surface counts as first-use terms — `Math.round()`,
`Number.toFixed()`, `ctx.fillRect()` for JS-new. Explain them at first use, at the topic's depth. The defect is
an **inconsistent bar**: explaining `const` but using `toFixed()` bare on the next line. If the bar is high
enough to explain `const`, apply it to the built-in too. Non-function concept terms — `Math.PI`, `Transform`,
`Clear Flags`, `IL2CPP`, Gamma color space — are words, so they get glossed and go in the glossary as usual.

- ❌ explained `const` but used `Math.round`, `Math.PI`, `toFixed` with no definition.

**(d) Explain a *function* with an inline code comment, not a glossary entry.** A function's explanation belongs
in an inline code comment right on its line, never as a glossary `### entry` — the glossary holds *words/
concepts* only. (Deep-link the function's official docs from the prose if it's an external API; that's the
sourcing principle, separate from the glossary ban.)

- ❌ "Use `angle.toFixed(2)` to round the readout." (built-in method, bar set high elsewhere, left bare)
- ❌ a `### Number.toFixed()` entry in the glossary. (a function does not belong in the glossary)
- ✅ an inline comment on the code line:
  ```js
  const readout = angle.toFixed(2); // toFixed(n) → rounds to n decimals, returns a string
  ```

**(e) Forward-explained concepts — gloss + point forward at first use.** A concept is often *used* (in a config
key, a code comment, a value) a few steps before the step that *teaches* it in depth. "First use" is still
first use: the reader meets the term there, so it can't be left bare just because a later step will explain it.
At the **first appearance**, give a **one-line mini-gloss AND a forward pointer** to the step that teaches it
fully — not silence, and not a bare pointer with no definition (the reader still hits an undefined term). The
deep-dive stays where the ladder puts it; the first mention just needs a plain-language definition and a
signpost. (This is the pedagogy twin of the structural *dependency-ordering* rule, which forbids a code
identifier being *used* before it's *defined*.)

- ❌ (a config comment) "`maxDt` — the delta-time **clamp** (max seconds simulated in
  one frame)." — names *delta time* three steps before it's taught later, with no gloss and no pointer.
- ✅ "`maxDt` — the **delta-time** clamp. *Delta time* (`dt`) is the seconds elapsed since the previous frame;
  we cap it so one slow frame can't teleport the player. You'll build and fully understand `dt` in
  [step 05](05_delta-time.md); here you're just setting the ceiling."

### 1.2 — Teach the recurring mental model at the point of use
**Why:** one or two framing ideas make dozens of later steps obvious — but only if introduced where they
first bite, then reinforced. **Do:** state the model in place, and note where it'll recur.

- ✅ "Remember: in Go an interface is satisfied *implicitly* — you never write `implements`. A type just has
  the methods. We rely on this again when we swap the storage backend in M3."

---

## P2 — Anchor every action
*Every instruction says where it happens and why, so the reader never guesses location or purpose.*

### 2.1 — Every action says WHERE
**Why:** "add the route" is useless if the reader doesn't know which file/panel/menu. Locating things is
half the friction for a newcomer. **Do:** name the exact file + location, or the exact menu path, or the
exact command context.

- ❌ "Add the route."
- ✅ "In `cmd/server/main.go`, inside the `setupRoutes()` function, add the route."

### 2.2 — Every action says WHAT it does and WHY
**Why:** copying without understanding produces brittle knowledge — the "learn" fails. **Do:** one clause on
the mechanism/purpose, not just the keystroke.

- ❌ "Run `go mod init example/api`."
- ✅ "Run `go mod init example/api` — this creates `go.mod`, which declares your module path so imports
  resolve and dependencies get tracked."

---

## P3 — Leave nothing ambiguous
*Remove every "which one? / how much? / can I change this?" — be exact, and stay exact across the whole guide.*

### 3.1 — Be exact where the outcome depends on it
**Why:** "a reasonable value" makes the reader guess, and a wrong guess breaks the gate. **Do:** give the
concrete value. If a value is genuinely free, *say so* — that's also information. (Once you've chosen a value,
keep it identical everywhere it recurs — that whole-guide property is **rule 3.5**.)

- ❌ "Set a sensible timeout."
- ✅ "Set the timeout to `5 * time.Second`. (Any value ≥ 1s works; we use 5s.)"

### 3.2 — Separate MANDATORY from ILLUSTRATIVE
**Why:** readers can't tell your arbitrary example choice from a load-bearing requirement, so they either
cargo-cult everything or change something critical. **Do:** mark which is which.

- ❌ "Create a `Book` struct with `Title` and `Author`."
- ✅ "The struct's *fields* are up to your domain (illustrative: `Title`, `Author`). The **JSON tags are
  mandatory** — the API contract depends on `\"title\"` and `\"author\"` exactly."

### 3.3 — State which fields to change and which to LEAVE AT DEFAULT
**Why:** a config screen with 20 fields makes the reader wonder "did I miss one?" **Do:** be exhaustive for
the object in hand; explicitly say "leave the rest at defaults."

- ❌ "Configure the server."
- ✅ "On the `http.Server`, set `Addr` and `Handler`. **Leave every other field at its default.**"

### 3.4 — Flag load-bearing names vs cosmetic ones
**Why:** the reader doesn't know which strings are safe to rename. Rename a load-bearing one and it breaks
mysteriously. **Do:** say which before they type.

- ✅ "The handler *function* name is cosmetic — call it what you like. The route string `/books` is
  **load-bearing**: the tests and the frontend hit it exactly."

### 3.5 — Reuse a value; define it once (whole-guide consistency)
**Why:** a value that is *derived* or *cited* more than once — a jump height, a tick rate, a timeout, a grid
size, a colour hex — breaks trust the moment two places disagree: the reader can't tell which figure is right.
This is a **cross-step** property, not a within-step one (which is why it's separated from rule 3.1, the
per-step "be exact" rule). **Do:** calculate the value **once**, then quote that exact figure in every place it
appears — the code, the prose that explains it, the Done-when gate, the glossary, the overview. Never re-derive
it (you'll round differently) or eyeball a "close enough" number in prose. If the value changes, change it
everywhere in the same pass. (`audit-guide` checks this as a consistency sweep across the guide, not just inside
one step.)

- ❌ code sets `jumpHeight = 2.5f` but the prose says "the character jumps 2 units" and the gate says "~2.5".
- ✅ code, prose, and gate all say **`2.5`** units — one figure, quoted verbatim wherever it recurs.

> **The defect this prevents:** a jump height that reads `2` in one file and `2.5` in another, so the reader
> can't tell which is right. (Observed in an earlier worked example.)

### 3.6 — Every identifier you write is self-describing
**Why:** in a teaching guide the **names are half the explanation**. A reader meets the code twice — once here,
with your prose beside it, and once later in their own project, with nothing beside it. `const d = t2 - t1`
teaches nothing the second time; `const elapsedMs = endedAtMs - startedAtMs` still does. Cryptic names also
force a comment to do the name's job, and make the prose ambiguous: "check `res`" doesn't say which of the two
`res` on screen. **Do:** name every identifier **you** introduce — variable, constant, function/method, class,
file, CSS class, config key, test name — for **what it holds or what it does**, readable in isolation:

- **Nouns for state, verbs for behavior.** `pendingSnapshots`, `applyPaletteToSettings()`, not `arr`, `handle()`.
- **Include the unit or type when it prevents a mistake** — `timeoutMs`, `widthPx`, `priceCents`.
- **Banned unless the ecosystem itself uses them:** single letters, `data`, `temp`, `tmp`, `val`, `obj`, `foo`,
  `doStuff()`, `Manager`, `Helper`, and abbreviations the domain doesn't already speak (`cfgSvcRtr`).
- **Match the ecosystem's idiom where one exists** — this rule never fights the docs. If the API, framework or
  language convention names it `ctx`, `req`/`res`, `e`, `self`, or a loop index `i`, use that: matching the
  idiom the reader will meet in the official docs *is* the teaching move. The rule targets the names **you**
  invent, not the ones the platform hands you.
- **One concept, one name.** The same thing is called the same thing in the code, the prose, the gate, and the
  next step (the naming twin of rule 3.5).

- ❌ `const d = Date.now() - t; if (d > 500) retry(x);`
- ✅ `const elapsedMs = Date.now() - startedAtMs; if (elapsedMs > REQUEST_TIMEOUT_MS) retryRequest(request);`
- ❌ `function handle(p) { … }` — and prose that then has to say "the handler that takes the palette".
- ✅ `function applyPaletteToSettings(palette) { … }` — the prose just says "call it".

> **The defect this prevents:** guide code the reader can only understand while the surrounding paragraph is on
> screen — so what they paste into their project is a black box, and the guide taught the keystrokes instead of
> the idea. (Related: rule 3.4 tells the reader *which* names are safe to change; this rule makes the names
> worth keeping. Rule 1.1d still puts a *function's* explanation in an inline comment — a good name shortens
> that comment, it doesn't delete it.)

---

## P4 — Structure steps & code
*Order actions and place code so the reader reads-then-does in one motion, and never overwrites their own work.*

### 4.1 — Sequences are numbered lists, never arrow-chains
**Why:** an arrow chain hides how many distinct actions there are and where one ends. **Do:** number
distinct actions. Reserve `→` for a *single* menu-navigation path inside one action.

- ❌ "Open the file → edit the handler → save → run the tests."
- ✅ "1. Open `main.go`. 2. Edit `booksHandler`. 3. Save. 4. Run `go test ./...`."
- ✅ (arrow OK — one action) "Menu: **File → New → Go File**."

### 4.2 — Put each code block directly under the instruction it implements
**Why:** when a step lists every "Do this" action and *then* dumps all the code in a trailing block, the
reader has to re-pair each block with the action that described it — scrolling back and forth, guessing which
block goes where. That pairing is exactly the thing that teaches: read "do X", see X's code right there. A
batched code dump breaks the read-then-see rhythm and hides which snippet answers which instruction. **Do:**
when a step's code has **two or more distinct parts**, place each part's fenced block **immediately below the
numbered instruction that introduces it**, so the reader never moves between the words and the code they
describe. A single small block explained by one instruction can stay under one heading — the rule targets
*multi-part* code, the case in the observed defect.

**Interleave-only — the whole file lives in the checkpoint, not at the step's end.** Because the code is split
across the instructions, a step shows **fragments**, not one complete file. That is deliberate, not a defect:
the single authoritative, paste-able copy of every file is rendered whole in the milestone's `NN_verify.md`
checkpoint (see [canonical-layout.md](canonical-layout.md)). Do **not** also append a consolidated
end-of-step "complete file" block — it duplicates the checkpoint and re-introduces the code dump this rule
removes.

**Each fragment must say WHERE it goes — clarity is mandatory.** With no consolidated block to assemble from,
every fragment must name its **file** and its **position in that file** (append, replace region, inside which
function/block), so the reader can place it unambiguously and still reconstruct the whole. An interleaved
fragment with no location is worse than the old dump — this is rule 2.1 (WHERE) applied to code placement. If
the reader can't tell how the pieces assemble, the interleave has failed.

- ❌ (multi-part step) all of `## Do this` — "1. Add the config. 2. Add the loader. 3. Wire it up." — then a
  single trailing `## Code` block containing config + loader + wiring, leaving the reader to split it back
  apart and match each region to a step.
- ✅ under instruction 1, the config block (`In game.js, at the top:`); under instruction 2, the loader block
  (`In game.js, below the config:`); under instruction 3, the wiring block (`In game.js, inside init():`).
  No trailing `## Code` section; the whole `game.js` is shown complete in `NN_verify.md`.

> **The defect this prevents:** a step that explains every action first and stacks the code blocks at the
> bottom, so "what to do" and "the code that does it" sit paragraphs apart and the reader has to re-pair them.

### 4.3 — When a file already exists, add to it; don't reproduce the whole file
**Why:** re-pasting an entire file the reader already has just to add one function is wasteful *and* dangerous —
it invites them to overwrite their real file (losing edits, or clobbering code a later step added). The twin
defect is an **ambiguous insertion anchor**: "place it under `x = true;`" when the file has three `x = true;`
lines, so the reader can't tell *which* one and guesses. **Do:** for a file that already has code, show only the
**fragment** to add plus a placement instruction whose anchor is **unique** — name a function, block, or a line
that occurs exactly once, and quote enough of it to pin a single location. If the natural anchor recurs, add
surrounding context until it matches one spot only. Never reproduce a pre-existing file whole to make a small
addition. (This is rule 2.1 (WHERE) and rule 4.2's fragment-placement clause applied to files that already
exist.)

- ❌ "Add `spawnEnemy()` — here's the full `game.js`:" followed by the entire 200-line file re-pasted.
- ❌ "In `game.js`, add `spawnEnemy()` under `let ready = true;`." (the file has three `let ready = true;` lines)
- ✅ "In `game.js`, add `spawnEnemy()` **immediately after the `init()` function** (the block that ends with
  `canvas.focus();`) — leave the rest of the file untouched." Then just the `spawnEnemy()` fragment.

> **The defect this prevents:** a step that dumps a whole existing file to add one function, or points at an
> anchor that appears several times so the reader inserts the code in the wrong place.

### 4.4 — Cut every step so it ends on a green build
**Why:** the step boundary is the reader's only checkpoint. If a step ends with the project *not building*, the
reader can no longer tell **their** mistake from the guide's plan — every red squiggle and every watch-task line
is now ambiguous. "This error is expected, step 05 fixes it" only works if the reader's error list matches the
author's *exactly*; one typo of their own hides inside the expected list, and a reader who "fixes" the expected
error quietly diverges from the guide. A broken build also disables the step's own `Done-when` (the gate can't
be run), makes the sitting an unsafe stopping point (they close the laptop on a tree they can't commit or come
back to), and defers the first real verification to a later step — where a failure no longer localizes to the
action that caused it.

**Do:** treat **"the project builds"** as a hard step boundary. When one atomic edit forces others — changing a
constructor signature, renaming a symbol, moving a file, extracting an interface — the step **includes every
call site it breaks**, in the same step. A longer step that ends green always beats two short steps with a
broken interval between them. **This outranks the granularity dial:** granularity sets step *size*, but when
staying green means a bigger step, take the bigger step. Then prove it — for any stack with a compiler,
type-checker or bundler, the step's `Done-when` ends with the build clean (`npm run compile` exits 0,
`tsc --noEmit` silent, `cargo check` green, the watch task showing **0 errors**).

- **Never write "this error is expected; step NN fixes it."** That sentence *is* the defect, not a mitigation —
  re-cut the step so it absorbs the fix.
- **A failing *test* is not a broken build.** Test-first (red → green) is fine: the project still compiles, and
  the gate names exactly which test fails and why. The ban is on code that doesn't build.
- **If the toolchain genuinely can't be green mid-step** — a generated file that doesn't exist until a codegen
  command runs — that command belongs in the **same** step, before the gate.

- ❌ "**Done when:** `ThemePanelProvider.ts` matches the checkpoint. It will show a compile error where
  `extension.ts` still calls `new ThemePanelProvider(history)` with the old signature — expected; step 05 fixes
  it. Full behavior is verified after step 05."
- ✅ the step changes the constructor **and** updates the one call site in `extension.ts` it breaks.
  "**Done when:** the watch task reports **0 errors** and `npm run compile` exits 0."

> **The defect this prevents:** a step that ends on a deliberately broken build and asks the reader to carry
> "which errors are expected" in their head until a later step — so a real error of their own hides inside the
> expected list, and the sitting has no safe stopping point. (Observed: a reader following a VS Code extension
> guide was told a constructor-signature error in `extension.ts` was expected until step 05.)

---

## P5 — Anticipate failure
*Pre-empt the error the reader is most likely to hit, and turn it into a one-line diagnosis.*

### 5.1 — Name the likely failure and its usual cause
**Why:** the first error a newcomer hits is where most give up. Pre-empting it turns panic into a
one-line diagnosis and teaches the underlying cause. **Do:** for each step's common error, give the first
thing to check.

- ✅ "If you see `undefined: mux`, you skipped the import in step 2 — check the top of the file first."

---

## P6 — Prove the gate
*A Done-when must exercise exactly the property it claims — and be observable in the environment you told the
reader to look at.*

### 6.1 — A Done-when must exercise what it claims to prove
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
> once, so it never exercises the re-run that determinism is about. (Observed: a guide claimed determinism without re-querying.)

### 6.2 — Observe the property where the environment can't mask it
**Why:** a gate is always observed *somewhere* — a debug session, a dev server, an emulator, a preview build, a
container. That environment routinely **overrides, suppresses, or duplicates** the very channel the gate reads,
so a **correct** implementation shows the **wrong** thing. This is the mirror image of rule 6.1: 6.1 kills a
false *positive* (a green check that proves nothing); 6.2 kills a false *negative* (working code that looks
broken). The false negative costs more — the reader debugs code that was already right, and a troubleshooting
table listing only real breakages sends them down a dead end, because nothing actually broke.

**Do:** before shipping a gate, ask *"what does the environment I just told the reader to run in do to this
exact signal?"* When it masks it, fix it in this order:
1. **Observe an unmasked channel** — pick an effect that environment doesn't override.
2. **Make the effect visible there too** — set the environment-specific variant alongside the normal one, so
   the observation holds where the reader is actually looking.
3. **Name the mask in the gate itself** — if neither is possible, the `Done-when` states what that environment
   will show and how to see the real effect. A mask named in the gate is information; a mask left to the
   troubleshooting table is unreachable, because the reader has no reason to look there.

Common masks: a debug/dev overlay that repaints the UI; `NODE_ENV=development` disabling the cache a gate
claims to prove; a framework's strict/dev mode double-invoking effects, so a "runs once" gate sees two;
hot-reload hiding a "survives a restart" claim; a simulator or emulator overriding a system setting.

- ❌ "**Done when:** clicking **Apply demo** turns the host window's status bar crimson — live, no reload."
  The host runs under a debug session, which paints the status bar from its own *debugging* color keys and
  overrides the one key the demo writes. Correct code → the bar stays orange → the reader reads the step as
  broken.
- ✅ The demo writes **both** the normal and the debugging color pairs, and the gate reads: "the status bar
  turns crimson immediately — **including while the debug session is running**, because the demo sets the
  debugging pair too."

> **The defect this prevents:** a milestone's headline gate that fails on a *correct* implementation, because
> the environment the guide prescribed for observing it overrides the exact key being observed. (Observed: a
> reader's extension wrote the right setting, but the debug host's own status-bar colors masked it — "it works
> but it applies the color only when i close the debug session.")

---

## P7 — Declare the starting state
*Never let a step assume a prerequisite the reader was never told to set up.*

### 7.1 — Declare the step's starting state (don't silently assume a prerequisite)
**Why:** the single most common field failure is a step that silently assumes something the reader hasn't done —
a tool installed, a server already running, a login completed, a previous file present, an earlier command still
in effect. The reader, missing that state, hits an error the author never saw because *their* environment
already had it. This is the proactive, authoring-time twin of the review-gate corollary "list implied/missing
steps" (which only catches the gap *after* a reader trips). **Do:** before a step's first action, state what
must **already** be true — installed, running, logged-in, built, or created by an earlier step — either as a
one-line "Before you start" note **or** by pointing to the step/milestone that established it. If a prerequisite
isn't yet established anywhere, make it its own step; don't fold it into an action's preamble.

- ❌ (M2/03) "Run `npm run dev` and open the app." — but `.env` was never created and the DB was never started;
  the reader gets a connection error the author's already-configured machine never showed.
- ✅ "**Before you start:** the API from [M1](../MILESTONE_1_api/00_overview.md) must be running (`npm run dev`
  in `server/`) and `.env` present (M1/04). Then, in a second terminal, run `npm run dev` in `web/`."

> **The defect this prevents:** a step that works only because the author's environment already had a piece of
> state the reader was never told to set up. (Root-cause class: `report-issue` names "silently-assumed
> prerequisite" as its most common finding.)

---

## Review-gate corollaries (for prompt 04)

When you're about to *follow* a guide rather than write it, three extra checks apply:

- **No unclear operation survives.** If a step leaves a "how exactly?" question, resolve it before acting.
- **List implied/missing steps.** Enumerate any silently-assumed prerequisite as its own numbered step. (This
  is the review-time backstop for **rule 7.1**, which declares starting state proactively at authoring time.)
- **Reconcile — reality wins.** Diff assumptions (versions, labels, paths, API names) against the real tool;
  patch the guide and log the drift. A clear-but-stale step is the dangerous kind.

---

## How to add or change a rule

Only add a rule that comes from a **real** point of confusion. Write it as: the confusion → the rule → a
before/after, and home it under the principle it belongs to. Speculative rules bloat the contract and get
ignored. See [CONTRIBUTING](../CONTRIBUTING.md).

### The contract sync set (this file is canonical; these mirror it)

This file is the **single source of truth** for the principles and rules. The skill prompts deliberately
**re-state** the contract inline rather than link here, because each `prompt.md` is also a **paste-prompt twin**
that must work standalone in a plain chat — so the duplication is intentional, not accidental. The cost is that
adding or changing a rule (or re-homing one under a different principle) is a **multi-file edit**. When you
touch the contract, update **every** place in the same pass:

- `reference/pedagogy-rules.md` (here — the canonical text + before/after)
- `skills/plan-guide/prompt.md` (Phase 4 writing rules)
- `skills/draft-milestone/prompt.md` (the numbered writing contract **and** the self-audit checklist)
- `skills/clarify-step/prompt.md` (the in-place rules list)
- `skills/audit-guide/prompt.md` (the pedagogy-check enumeration + any per-rule detail check)
- `EXPLAINER.md` §7 (the before/after table), plus `README.md`, `templates/step.md`, `templates/verify.md`, and
  the affected `SKILL.md` descriptions wherever they name the contract.

`scripts/check-consistency.mjs` (run by `/pre-pr-check` and CI) verifies **rule-id integrity**: no duplicate id
headings, every rule homed under a real `## P#` principle, and every `rule N.N` cited anywhere in the docs
resolving to a heading in this file — so a half-applied re-home fails the check instead of shipping silently.
Nothing counts principles: the docs cite them by id, never by number, precisely so there is no count to drift.
The id check is the backstop; keeping the *wording* in sync is still on you.
