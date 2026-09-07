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
  `> New concept — **term**: one-sentence definition.` (The marker's **shape** is fixed — blockquote, marker
  words, em-dash, bold term, no emoji, so it renders identically in every terminal and viewer — while the
  marker *words* are prose like everything else the reader reads: in a guide whose prose isn't English, write
  them as `foundation/conventions.md` § *Writing language* → *Heading map* records, and never translate them
  freshly per step. Deep-link the term's *official docs* here when it's
  an external API — the sourcing principle requires it — but **not** the glossary; see 1.1b.)

If a step introduces many terms, also add a "Glossary for this step" block at the top — as an **index, not a
second set of definitions** (see 1.1b). **Never leave a load-bearing term as a bare rule with no gloss and no
pointer** — if a decision names a concept, either define it or point to where it's defined.

- ❌ "Register the middleware and it'll wrap every handler."
- ✅ (inline) "Register the **middleware** — a function that runs on every request *before* your handler,
  used here for logging — and it'll wrap every handler."
- ❌ "Set **Color Space** to Gamma." (a load-bearing term as a bare rule — no gloss, no pointer)
- ✅ (callout, on its own line right above the action):
  `> New concept — Gamma color space: texture values render exactly as authored (no sRGB curve), so`
  `hand-picked palettes look right.` (its glossary link lives once in `## Glossary for this step`, not here.)

**(b) One definition per term per step — the body teaches, the block indexes.** A term is defined **once** on a
page: in the body, as an inline gloss or a "New concept" callout, where the reader meets it with the work in
front of them. The `## Glossary for this step` block is an **index, not a second definition** — it lists the
terms this step introduces, deep-links each to `../glossary.md#slug`, and says where on the page it's taught.
Each term is then **explained once and findable twice**.

Two corollaries, one per device:

- The **body** gloss/callout does not append a `see [glossary](…)` link. The block is the one door to the
  glossary; a trailing "see glossary" after every term is repetitive noise.
- The **block** does not restate the definition. A step that defines a term in the block *and* again in a
  callout makes the reader meet it twice before they can act on it — and read carefully enough both times to
  work out that the two are the same thing, not two related ideas.

- ❌ (body callout) `> New concept — middleware: code that runs on every request. See [glossary](../glossary.md#middleware).`
- ✅ (body callout) `> New concept — middleware: code that runs on every request before your handler.`
- ❌ (block) `> **[middleware](../glossary.md#middleware)** — code that runs on every request before your handler.`
  — the same sentence the callout further down the page already carries.
- ✅ (block) `> New here: **[middleware](../glossary.md#middleware)** (defined under *Do this* 2).`

**The failure this shape can introduce: a term in the block that nothing in the body defines.** The block only
points; if it points at nothing, the term is now undefined and 1.1 is violated. Fix it by giving the term its
inline gloss or callout in the body — never by putting the definition back in the block.

*(Origin: a step defined `.meta` and GUID three times on one page — the block bullets, the Why/design prose,
then the callout — before the reader performed a single action. Both devices were individually well-written;
they were doing the same job.)*

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
file, CSS class, config key, test name — for **what it holds or what it does**, readable in isolation. This
holds **in whatever language `conventions.md` § *Writing language* sets for code** (English by default): a
guide writing its code in Italian owes the reader `tempoTrascorsoMs`, not `t`. Either way, names the platform
fixes — keywords, framework APIs, lifecycle methods, config keys the framework reads — are never translated:

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

### 3.7 — Say when you're hand-rolling something the ecosystem already solves
**Why:** a build guide routinely has the reader write from scratch something a mature library in that stack
already does — colour conversion, date/timezone maths, argument parsing, retry with backoff, diffing, text
segmentation, money arithmetic. Doing that on purpose is often the *whole point*: the reader learns the
mechanism instead of importing it. But a step that just hands them the code teaches a second thing nobody
intended — that writing it was **required**. The reader can't tell a deliberate teaching exercise from "this
is how it's done", because on the page the two look identical. So they ship the hand-rolled version into a real
project and meet, months later, the exact edge cases the library exists for. This is rule 3.2's ambiguity
(mandatory vs illustrative) applied to an *implementation choice* rather than a value.

**Do:** the first time a step implements a **self-contained capability a well-known, maintained library in this
stack solves**, put a one-line callout on its own line, right above the work:

`> Build vs borrow — **<library> <version>** does this in production (<official docs URL>): you're writing it`
`by hand here to learn <the mechanism>. Swap it in when <condition>.`

Same plain-text marker style as the "New concept" callout — no emoji, so it renders everywhere, and the same
language rule: the shape is fixed, the marker words come from the guide's heading map. The library
is a **verified** fact like any other: check that it exists, is maintained, and supports the pinned stack
(sourcing principle), or don't name one. And the mirror case: when the guide **borrows**, one clause says what
the library is doing for the reader, so the dependency isn't a black box either.

**The bar — this is not a licence to annotate every helper.** Apply it when the capability is something you'd
otherwise add a dependency for: a named problem with known edge cases, roughly a screen of code or more.
A three-line helper is not a build-vs-borrow decision. Two families always clear the bar because hand-rolling
them is a known trap: **correctness-critical domains** (colour spaces, dates/timezones, crypto, encodings,
locale/text handling, money) and anything the ecosystem treats as solved infrastructure.

The *choice itself* isn't made here — it's made at plan time, where borrow-vs-build is put to the reader per
capability and recorded in `decision-log.md`. This rule governs what the drafted step must **say** once the
choice exists. (Changing the choice later, on a guide someone is already following, is a change of intent:
`amend-guide`, not a silent rewrite.)

- ❌ A step titled "Write the colour helpers" that hands the reader 90 lines of hex→HSL→hex conversion, with
  prose explaining only what the code does. Nothing on the page says a colour library exists.
- ✅ `> Build vs borrow — **chroma-js 3.x** does this in production (https://…): you're writing hex→HSL by hand`
  `here to learn how a colour space converts. Swap it in when you need more than these two formats.`
- ✅ (borrow direction) "Install `<library>` — it handles the conversion between colour spaces, which is
  fiddly enough that hand-rolling it is a common source of off-by-one hue bugs."

> **The defect this prevents:** a guide that generates a whole capability from scratch without ever mentioning
> that the ecosystem's standard solution exists, so the reader can't tell whether they're learning something on
> purpose or reinventing it by accident. (Observed: a VS Code extension guide drafted its own colour-management
> code instead of surfacing an existing colour library as a choice.)

---

## P4 — Structure steps & code
*Order actions and place code so the reader reads-then-does in one motion, never overwrites their own work,
and never grinds by hand through work the tool does at once.*

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
- ❌ (another stack, same defect) "**Done when:** the migration file is written. The service won't start until
  step 07 adds the matching model — that's expected."
- ✅ the step writes the migration **and** the model it requires: "**Done when:** `<build/type-check command>`
  is clean and the service starts, answering `/health` with `200`."

> **The defect this prevents:** a step that ends on a deliberately broken build and asks the reader to carry
> "which errors are expected" in their head until a later step — so a real error of their own hides inside the
> expected list, and the sitting has no safe stopping point. (Observed: a reader following a VS Code extension
> guide was told a constructor-signature error in `extension.ts` was expected until step 05.)

### 4.5 — End every step that changes the project with a suggested commit
**Why:** rule 4.4 already makes every step boundary a point where the project **builds** — which makes it a
point the reader can **commit**. A guide that never says so leaves them two bad options: commit nothing until
the milestone ends, so a milestone's worth of unrelated work lands in one blob and undoing a single step is
impossible; or invent a message per step, which is exactly where a learner stalls ("what do I even call
this?"). Naming the change is also part of what the guide teaches — one coherent change, one message, in the
project's convention. And the change is **not always code**: a setting flipped in an engine's project settings,
an asset import preset, a manifest, a `.editorconfig` line all land in version control, and a reader who thinks
commits are for source files leaves them uncommitted until a later diff is unreadable.

**Do:** every step that leaves a change in the **version-controlled tree** ends with a `## Suggested commit`
section — after `## Done when (this step)`, before `## If it breaks` — carrying **one** message in a fenced
block, in the format `foundation/conventions.md` § *Commit messages* records (Conventional Commits
`<type>(<scope>): <subject>` by default): imperative, no trailing period, ≤72 characters, naming what this step
changed.

- **A non-code change gets one too.** `chore(project): set the color space to gamma` is a commit — the reader
  flipped a setting and their `ProjectSettings/` moved.
- **A step that changes nothing tracked gets no section** — pure observation, a request fired at a running
  service, a click-through in a hosted console, an `NN_verify.md` that only checks. Inventing a message for an
  empty diff teaches the reader to commit noise.
- **One step, one commit.** A same-commit multi-file bundle is still one message; never two blocks in one step,
  and never one message spanning several steps.
- **The message, not the command.** `git commit -m "…"` quotes differently in bash and PowerShell (see the
  cross-platform rule in `conventions.md`), and the reader may not be at a CLI at all.
- **In the guide's *code* language** — `conventions.md` § *Writing language*, English by default — and not in
  its prose language: a commit log is a literal artifact of the reader's project, not prose the guide
  translates. The `<type>` and `<scope>` tokens are Conventional Commits' own vocabulary and stay English
  in every guide.
- **A corrections section carries its own single commit.** `## Before you continue — corrections` — written by
  the maintenance skills behind the frontier gate — closes with one `**Suggested commit:**` after its
  `**Corrected when:**` checklist, covering the whole section however many dated passes it has accumulated. The
  repair is one change to the reader's project, and it is *not* the step's own commit.

- ❌ a step that has the reader create `internal/store/store.go` and stops at the Done-when: they either commit
  nine unrelated files at the end of the milestone or stop to name it themselves.
- ✅ a `## Suggested commit` block under the gate reading `feat(store): add the in-memory todo store`.
- ❌ `## Suggested commit` on a step whose only action is `curl`-ing the running server to read a response —
  nothing changed, so there is nothing to commit.

> **The defect this prevents:** a guide that teaches the build and leaves the history to improvisation — the
> reader arrives at the end of a milestone with one shapeless commit, or none, and no way back to the step
> before the one that broke. (Origin: reported from following guides drafted with this method. Every step ended
> green and none of them said what to call it, so the reader either batched a milestone into one commit or
> stopped at each boundary to invent a message; the steps that changed only *settings* were skipped entirely,
> because a step with no code reads as a step with nothing to commit.)

### 4.6 — When an action repeats, teach the bulk path — or say there isn't one
**Why:** on the page, "set these three fields on it" is ten seconds of work. If the reader has to perform it on
**231** of them — files, records, routes, test cases, config entries — it is an afternoon, and nothing on the
page said so. Three separate things then go wrong. The reader cannot tell whether the grind is inherent or
whether they missed the trick every practitioner knows, so they either grind through it resentfully or leave
the guide to go searching. Hand-repetition is also where mistakes enter: one member of the set keeps its
default, and the defect surfaces three milestones later as one item rendering wrong or one number off by a
factor of five, with nothing to localize it to. And the guide has quietly taught that this *is* how the work is
done, so the reader repeats it in their own projects. This is
rule 3.7's problem — a guide that hand-rolls what the ecosystem has solved — applied to the reader's **labour**
instead of to the code.

**Do:** when an action in a step is performed more than a handful of times — the same field on many files, the
same asset created per item, the same block pasted per case, the same value typed per row — the step **says how
many times** and gives the **bulk path** the environment already offers. That path is the taught path; the
one-by-one version, if it survives at all, is the fallback for a reader whose tool differs.

- **Look for the bulk path before writing the repetition.** Most environments have one, and it is a verified
  fact like any other (sourcing principle): a multi-selection the tool applies in one press, an import preset
  or post-processing hook, a generator or codegen command, a `for` loop or a ten-line script, a bulk-edit mode
  the editor already has, a data file the code reads at startup instead of N literals in the source.
- **State the count where the reader will feel it** — "there are **231** of them" — not in a closing note
  after they have already done it by hand.
- **If there genuinely is no bulk path, spend one clause saying so**, with the count. "There is no bulk
  setting for this; it is 12 repetitions" costs a line and buys the reader the knowledge that the grind is the
  job, not a shortcut they failed to find.
- **A script or command that does the bulk work is taught, not dropped in.** It gets its WHERE and WHY like
  any other code (2.1, 2.2), and if the reader is meant to keep it, it is a tracked file with its own commit
  (4.5). A throwaway one-liner says plainly that it is throwaway.
- **Then verify the bulk, not one sample.** The `Done-when` counts, queries or sweeps the whole set — this is
  rule 6.6 in its most common form, because a manual repetition is exactly where one member of the class
  silently diverges from the other 230.

- ❌ "Select the tile images and set **Pixels Per Unit** to `18`, **Filter Mode** to `Point (no filter)`,
  **Compression** to `None`." — on a pack of 231 PNGs, with no count on the page and no word about how the
  Inspector treats a multi-selection.
- ✅ "The pack ships **231** tile PNGs, and all of them need the same three settings. Click the first in the
  **Project** panel, **Shift**-click the last so the Inspector shows the whole selection, set the three fields
  once, and press **Apply** — Unity re-imports all 231. Setting them one at a time is the same result and about
  an hour longer."
- ✅ (no bulk path available) "There is no multi-edit for this field, so it is **12** repetitions — one per
  input action. They are identical apart from the name."
- ✅ (bulk path is code) a step that replaces 40 hand-written literals with one data file plus the six lines
  that read it, and a `Done-when` asserting the loaded count is 40.

> **The defect this prevents:** a step whose single sentence hides hours of identical manual work, so the
> reader grinds through it not knowing whether the shortcut exists, and one of the repetitions silently comes
> out wrong. (Observed: a Unity guide had the reader apply three import settings to the tiles of a downloaded
> pack — **231** PNGs — with the page reading as one action and no count anywhere on it; the reader worked
> file by file before discovering that the Inspector applies a multi-selection in a single press.)

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
- ❌ (another stack, same defect) "**Done when:** the second request is served from cache — reload and watch
  the response time drop." The dev server the step told the reader to run disables caching, so a *correct*
  cache never gets a hit and the gate never goes green.
- ✅ "**Done when:** the response carries `X-Cache: HIT` on the second request — the dev server bypasses the
  cache for pages, so run this check against `<the production build command>`."

> **The defect this prevents:** a milestone's headline gate that fails on a *correct* implementation, because
> the environment the guide prescribed for observing it overrides the exact key being observed. (Observed: a
> reader's extension wrote the right setting, but the debug host's own status-bar colors masked it — "it works
> but it applies the color only when i close the debug session.")

### 6.3 — Quote the output the reader's shell prints, not the one your capture produced
**Why:** you observe a command through a pipe, a redirect, a CI job, or a tool that captures stdout. Modern
CLIs **detect that** and render differently — colour off, progress off, often a different summary line
entirely. The gate you write is faithful to what you saw and unreachable for the reader. Worse, it is
self-confirming: re-running your own check reproduces *your* capture, not their terminal, so the defect
survives every re-verification. This is 6.2 turned on the author — the masking environment is the one **you**
observed from.

**Do:** before quoting any command output in a gate, run the command **in a terminal**. Then gate on the
**values** — a count, a status, an exit code — never on a line to match character by character. Where showing
the output *is* the lesson, show the terminal's rendering and name the captured variant beside it, **in the
gate**, not in the troubleshooting list. Where the two renderings share nothing, the exit code is the honest
gate.

- ❌ "**Done when:** `dotnet build` prints `0 Error(s)`." — true only when the output is redirected; in a
  terminal the CLI prints `Build succeeded in 1.5s` and no counts at all, so the reader cannot tick a gate
  their correct build just passed.
- ✅ "**Done when:** `dotnet build` ends on `Build succeeded`, exits 0. There is no `0 Error(s)` line in a
  terminal — that block belongs to the redirected renderer."

This is not only a CLI concern: a screenshot taken with a debug overlay on, a log read from a CI artifact, a
REPL transcript captured with `script` — each is an author-side environment the reader is not in.

> **The defect this prevents:** every gate in a guide quoting a rendering that only exists when the output is
> captured — and two audits confirming them, because both audits captured it the same way. (Observed: 24
> `dotnet build` gates expecting `0 Error(s)`, which .NET 10's default terminal logger does not print, and a
> step teaching the column padding of a `dotnet test` summary line the reader's terminal never shows.)

### 6.4 — Anchor to what your code does, not to what the tool generated
**Why:** every guide sits on a scaffold, a CLI, a bundler or a framework that emits text nobody in the guide
wrote — a generated config file, a template's demo page, a directory listing, a bundle's size, a laid-out box.
That text is a **moving target the guide does not control**: the option the CLI stopped writing, the heading the
template reworded, the file it no longer emits. It is also the text authors most often describe from memory or
from reasoning rather than from looking — a size that "must be bigger" because something was added, a width read
off the stylesheet instead of off the element. Either way the reader is told to edit a line that is not in their
file, or to tick a gate their correct build just failed. This is 6.3's neighbour: 6.3 is the same tool rendering
differently for the author, 6.4 is the tool's own output never being observed at all — or having moved since it
was.

**Do:** anchor edits and gates to what **your** code puts there.
- **An edit instruction must survive the anchor being absent.** Say what the file must **read** when the step
  is done, and handle "it isn't there" in the same breath — never "find this line and replace it" for a line a
  generator owns.
- **Never gate on a scaffold's own prose**, its exhaustive file listing, or its version banner. Gate on the
  thing your code made happen.
- **Any number you quote about the running system is one you measured.** A size, a width, a count, a duration:
  observe it, or don't put it in a gate. If it moves with a patch release, gate on the direction or the
  presence, not the value.

- ❌ "In `angular.json`, find the line `"outputPath": "dist/color-picker",` — it occurs once — and replace it."
  (`ng new` writes no such line: the option is optional and the builder defaults.)
- ✅ "Make `outputPath` read … . The CLI most likely wrote none — that is the normal case, so add it."
- ❌ "**Done when:** the page shows a heading reading `Vite + React` and a button labelled `count is 0`."
  (An unpinned scaffold reworded both.)
- ✅ "**Done when:** the page shows a counter button whose number goes up when you click it — the template's
  wording moves between releases; the counter responding is the toolchain working."
- ❌ (another stack, same defect) "**Done when:** the generated project prints the six folders the scaffold
  created." (a listing the generator owns, reworded and re-shaped between releases)
- ✅ "**Done when:** the package **your** step added, `internal/store/`, is there and its tests pass."

> **The defect this prevents:** a step that cannot be carried out as written, and a first gate that teaches the
> reader the guide's exact values are approximate. (Observed: an `outputPath` line the Angular CLI does not
> write; a `create-vite` demo page whose heading, button label and file list had all changed; a gate promising
> a *bigger* bundle where the same step's deletion made it smaller; a panel gated at "240px wide" that measures
> 266px because the CSS width is its content box.)

### 6.5 — A break recipe must be run, and must name the failure the reader sees first
**Why:** telling the reader to break something and watch the gate go red is the strongest device P6 has — it
proves the gate can fail, which no green run does. It is also the one claim in a guide that is **never
exercised by the happy path**, so a wrong one survives every clean run and every audit. Two ways it goes wrong,
both observed in the same guide: the mutation leaves the suite **green**, because nothing covers the branch it
breaks; or it fails somewhere else than the page says — a runner stops at the *first* failing assertion and a
later one never runs, or an exception is thrown before any assertion is reached. A reader who is told to expect
a specific failure and sees a different one cannot tell whether they misapplied the edit or the guide is wrong,
on a page whose whole purpose is teaching them to trust the output.

**Do:** apply the mutation, run it, and write down what came back.
- **Name what actually fails first** — the assertion the runner reports, or the exception, if the test dies
  before asserting. Say which tests go red, and say which stay green if that is surprising.
- **If the suite stays green, the recipe is not the defect — the coverage is.** A mutation nothing catches
  means no test pins that branch. Add the test; do not soften the sentence.
- **Prefer a mutation whose blast radius you can state.** "Exactly one test fails, and it is this one" is a
  claim the reader can check.

- ❌ "Change the `||` to `&&` and re-run: `…_SameKeyDifferentPayload_…` must fail with `201`." (Both fields
  differ in that test, so `&&` holds and the suite stays green — 0 failed, 13 total.)
- ✅ A second test changes **one** field, and the recipe reads: "exactly one test fails — the one-field one —
  while `…_SameKeyDifferentPayload_…` stays green, which is why both exist."
- ❌ (another stack, same defect) "Drop the index and re-run: the query test must fail." — on a fixture of
  twelve rows the planner scans the table just as fast, so the suite stays green and the recipe proves nothing.
- ✅ "Drop the index and re-run: exactly the plan assertion fails, reporting a sequential scan — the fixture
  seeds **10 000** rows, because that is what makes the planner's choice observable at all."

> **The defect this prevents:** the reader following a "watch it fail" instruction and seeing success, or a
> different failure, with nothing on the page to tell them which of the two of you is wrong. (Observed: all
> three break recipes in one guide — one that left the suite green and exposed an uncovered branch, one that
> failed two tests instead of one and by exception rather than assertion, and one naming an assertion that an
> earlier one shadows.)

---

### 6.6 — A gate that samples one case cannot assert the class
**Why:** a gate is trusted for what its label says, not for what it measures. When the two drift apart — the
label names a set (*the theme*, *the config*, *the endpoints*, *the pages*) while the check reads a single
member of it — the gate stops being able to fail. It goes green on the one case that passes and says nothing
about the rest, and because it is green nobody looks. This is worse than a missing gate: a missing gate leaves
the reader uncertain, and a sampling gate leaves them *confidently wrong*. It also hides other defects
indefinitely, since the readout is exactly where those defects would otherwise surface. The tell is a report
shaped like "the check says it's fine but it obviously isn't", and the giveaway in the source is a label whose
noun is plural or collective while the expression under it is singular.

**Do:** measure the **worst case of the set the label names**, or narrow the label to the case measured.
- **Aggregate over the set, then report the extreme** — the minimum ratio, the slowest endpoint, the first
  failing locale. An average hides one bad member; the extreme cannot.
- **Name the member that lost.** "worst pair `tab.inactive` 4.56:1" tells the reader where to look; "4.56:1"
  alone tells them nothing when it eventually goes red.
- **If sampling is genuinely enough, say so and say why** — "we check the largest file because it bounds the
  rest" is a claim the reader can evaluate. Silence is not.
- **Prefer a machine-checkable sweep** where the set is enumerable. `all AA true` over 85 generated themes is
  one line of output and cannot be argued with.

- ❌ A panel badge reading `text/bg contrast 4.88:1 AA` in green, computed from the editor's foreground and
  background alone, on a theme whose sidebar sat at 2.53:1 and whose inactive tab label sat at 1.55:1.
- ✅ `worst pair tab.inactive 4.56:1 AA`, computed as the minimum across the seven pairs the code clamps —
  plus a `node -e` gate that sweeps every generated theme and prints `all AA true`.
- ❌ (another stack, same defect) "**Done when:** *the endpoints* all answer in under 200 ms — call `/health`
  and read the timing." One endpoint measured, a whole set claimed.
- ✅ "**Done when:** the **slowest of the twelve** endpoints is under 200 ms — the run prints
  `slowest /reports/export 168 ms`, naming which one came last."

> **The defect this prevents:** a green gate that certifies a broken artifact, and the defects that survive
> behind it because the one readout meant to catch them was looking at the one case that worked. (Observed: a
> VS Code theme generator whose contrast badge graded a single color pair; 66 of its 85 generated themes failed
> WCAG AA on a pair the badge never read, and three separate engine defects had shipped underneath it.)

### 6.7 — Gate at the hardest condition the build actually reaches
**Why:** a gate names a behaviour — *"the items come back newest-first"*, *"the panel shows the current
balance from the first frame"*, *"a hit from above destroys it"* — and the reader performs it **once, in the
gentlest way available**: two rows, one request, a short hop, whatever order the process happened to start in
that run. When the behaviour is conditional on a **continuum the guide never names** —
impact speed, press rate, initialization order, collection size, concurrency, latency, load — the gentle end
passes on genuinely broken code. The gate goes green, the milestone is ticked, and the defect ships forward *underneath a check that has already certified it*. It then
surfaces milestones later, in a place with no causal link to the step that caused it, so the reader debugs the
wrong file. This is 6.6's sibling: **6.6** is a label naming an enumerable *set* while the check reads one
member; **6.7** is a label naming a behaviour whose truth varies along a *continuum* while the check samples
the easy end. It is also the opposite of **6.2**: nothing is masking a correct implementation here — the code
is wrong, and the gate is too kind to say so.

**Do:**
1. **Name the variable the outcome rides on** — speed, rate, order, size, delay — and which end of it breaks.
   If you cannot name it, you do not yet know what the gate proves.
2. **Instruct the extreme, not the action.** The reader cannot supply a severity you did not ask for:
   "add a couple of items and check the order" becomes "add **200**, two of them written in the same
   millisecond"; "call the endpoint" becomes "call it **twice at once**"; "press the button" becomes
   "**mash** it"; "jump on the enemy" becomes "**from a full-height jump**, land on it".
3. **Where the platform guarantees no order, never gate on the lucky one.** Undefined initialization order,
   unordered iteration, concurrent callbacks: a pass is a coincidence of *your* scene, machine or build, and
   the next reader's differs. Say what the platform does **not** promise, and write code that does not need it.
4. **Record the measured limit and where it stops holding** — "holds to 10 000 rows, past which the sort
   spills to disk", "verified up to `20` u/s; above that it is likely, not certain". That is a fact the reader
   can act on; an unstated margin is one nobody can check.

- ❌ "**Done when:** landing on an enemy from above destroys it and bounces you upward." Performed as a gentle
  step-off, it passes; the taught test compares the player's feet to the enemy's *head* within `0.1` units,
  and a trigger callback runs **after** the physics step, so a real jump sinks the feet `0.47` units first and
  costs a life. Only the slow approach ever passed — which is how the gate came to be ticked.
- ✅ "**Done when:** **from a full jump off the ledge above**, landing on the enemy destroys it and bounces you
  upward — and a side contact still costs a life." The test measures against the enemy's **centre**, giving
  `0.4` units of room, verified at impacts of `10.7`, `22.0` and `31.9` u/s.
- ❌ "**Done when:** the items come back newest-first — add a couple and reload." Two rows written a second
  apart always sort correctly; the comparator falls back to insertion order when two timestamps are **equal**,
  which the gentle case never produces.
- ✅ "**Done when:** with **200** items added — two of them written in the same millisecond — the list reads
  newest-first, and those two keep the same relative order across three reloads."

> **The defect this prevents:** a milestone gate ticked green over a core mechanic that does not work at the
> speeds, rates or orders the finished build actually produces. (Observed: a Unity platformer whose stomp gate
> passed only on a slow approach and failed every real jump; alongside a jump gate that tested one press while
> the bug needed mashing, and a HUD gate that passed only because two components happened to initialize in a
> favourable order Unity does not guarantee.)

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
- ❌ (another stack, same defect) "Flash the board and watch the LED blink." — but the cross-compiler was
  never installed and no step said how to find the board's port.
- ✅ "**Before you start:** the toolchain from M1/01 must be on your `PATH` (`<compiler> --version` prints one)
  and the board connected on the port M1/03 had you identify."

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

**And write it domain-neutral.** Every rule here was born in one stack — an engine, a framework, a CLI, a
product's UI — and every rule here is applied to guides in every *other* stack. Those two facts set the shape:

| Part of a rule | Domain-specific? |
|---|---|
| The rule's **title**, **Why** and **Do** | **Never.** State the mechanism in words any domain has — "an order the platform does not promise", "a signal the environment overrides", "a repetition the tool can batch" — not the product that revealed it. |
| The **❌/✅ examples** | Concrete by necessity, but **not all from one ecosystem**. A rule illustrated only in the stack that produced it reads as being *about* that stack, and readers in other domains skip it. At least one pair from somewhere else. |
| The closing **origin note** (`Observed: …`) | **Always.** This is the provenance that keeps the rule from being speculative — name the engine, the version, the exact symptom. |

The test before you commit a rule: **name a second, unrelated domain where it bites.** If you cannot phrase it
without naming the engine or product it came from, you have a troubleshooting note, not a rule — it belongs in
a guide's *If it breaks*, not in this contract. (This is CONTRIBUTING's ground rule 1 applied to the rules
themselves; `report-issue` § 7 carries the same checks at the point where field reports become rules.)

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

`scripts/check-consistency.mjs` (run by `/pre-pr-check` and `npm test`) verifies **rule-id integrity**: no duplicate id
headings, every rule homed under a real `## P#` principle, and every `rule N.N` cited anywhere in the docs
resolving to a heading in this file — so a half-applied re-home fails the check instead of shipping silently.
It also verifies **coverage** in the other direction: the mirrors that state the *whole* contract — the
`plan-guide`, `draft-milestone`, `clarify-step` and `audit-guide` prompts, plus `EXPLAINER.md` — must each
mention every rule id, so a new rule that never reaches one of the paste-twins fails the build. (`README.md`
and the templates cite rules selectively on purpose and are not in that set.) Nothing counts principles: the
docs cite them by id, never by number, precisely so there is no count to drift. Both checks are backstops on
the *ids*; keeping the **wording** in sync is still on you.
