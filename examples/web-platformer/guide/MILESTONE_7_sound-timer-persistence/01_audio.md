# Milestone 7 · Step 01 of 4 — Create `audio.js`: start on a gesture, beep on jump & coin
> Nav: — · [Overview](00_overview.md) · [Timer & best time →](02_timer-and-best.md)

> **This step touches 4 files, edited together:** `js/audio.js` (new), `index.html` (script tag), `js/input.js` (start audio), `js/physics.js` (jump & coin beeps).

## Glossary for this step
- **AudioContext** — the Web Audio object that owns the sound system; you build sounds by connecting nodes inside it. It must be **started from a user gesture**. See [MDN: AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext).
- **OscillatorNode** — a source that emits a pure tone at a frequency; we route it through a **gain** (volume) node to the speakers. See [MDN: OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode).
- **gain node** — a volume control; we fade it out quickly so each beep doesn't click. See [MDN: GainNode](https://developer.mozilla.org/en-US/docs/Web/API/GainNode).
- **`window.AudioContext || window.webkitAudioContext`** — the `||` picks the first name that exists; older Safari exposed the API under the `webkit` prefix, so this line works on both. See [MDN: AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext).
- **`osc.type = 'square'`** — the oscillator's waveform; `'square'` gives a retro "beep" tone (other options: `'sine'`, `'triangle'`, `'sawtooth'`). See [MDN: OscillatorNode.type](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type).
- **`ac.currentTime` + `start`/`stop`** — Web Audio schedules by a clock; `currentTime` is "now" in seconds, and `start(t)`/`stop(t)` turn the tone on and off at absolute times. See [MDN: AudioContext.currentTime](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime).
- **`gain.setValueAtTime` / `exponentialRampToValueAtTime`** — schedule a volume envelope on the gain node: set it to `0.06` at the start, then glide it down to near-zero by the end so the beep fades out instead of clicking. See [MDN: setValueAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setValueAtTime) and [exponentialRampToValueAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime).

## Why / design
No audio files — we **synthesize** beeps: an oscillator → gain → speakers, played for a few dozen milliseconds.
The one real trap is the **autoplay policy**: a browser won't let sound start until the user interacts. So we
create the `AudioContext` on the **first keypress** and beep from there.

> **New concept — audio must start on a gesture.** If you create an `AudioContext` when the page loads, the
> browser suspends it and nothing plays. Creating (or `resume()`-ing) it inside a `keydown` handler satisfies
> the gesture requirement. Our `Game.beep` also no-ops safely if the context isn't up yet, so nothing ever
> crashes. See [stack.md](../foundation/stack.md).

## Do this
1. **Create `js/audio.js`** with the Code block. `Game.startAudio()` creates/resumes the context;
   `Game.beep(freq, ms, delay?)` plays one tone.
2. **Open `index.html`** and add **just the `audio.js`** script tag, **after `input.js` and before
   `physics.js`**. Don't add a `storage.js` tag yet — that file doesn't exist until the next step, and a tag
   pointing at a missing file logs a harmless 404. (The final order, once step 02 adds `storage.js`, is
   `config, state, input, audio, storage, physics, level, render, main`.) The Code block shows the tag list for now.
3. **Open `js/input.js`** and at the very top of the `keydown` handler, start audio once. Add a module-level
   `let audioStarted = false;` and the guard shown in the Code block.
4. **Open `js/physics.js`** and add beeps:
   - In `updatePlayer`, inside the jump block, after `p.grounded = false;`, add `Game.beep(520, 80);`.
   - In `collectCoins`, after `s.score += 1;`, add `Game.beep(880, 60);`.
5. **Save and open `index.html`.** Press a key (starts audio), then jump → a low beep; collect a coin → a higher beep.

## Code
```js
// js/audio.js — tiny synth: start on a gesture, then play short beeps.
Game.audioCtx = null;

// Call from a user gesture (a keypress). Browsers block audio before that.
Game.startAudio = function () {
  if (Game.audioCtx) {
    Game.audioCtx.resume();
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  Game.audioCtx = new Ctx();
};

// Play a short tone: frequency (Hz), length (ms), optional delay (seconds).
Game.beep = function (freq, ms, delay) {
  const ac = Game.audioCtx;
  if (!ac) return; // no gesture yet — stay silent, don't crash
  delay = delay || 0;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ac.destination);

  const start = ac.currentTime + delay;
  const end = start + ms / 1000;
  gain.gain.setValueAtTime(0.06, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, end); // quick fade = no click
  osc.start(start);
  osc.stop(end);
};
```

```html
<!-- index.html — add the audio.js tag now (storage.js comes in step 02). -->
  <script src="js/config.js"></script>
  <script src="js/state.js"></script>
  <script src="js/input.js"></script>
  <script src="js/audio.js"></script>
  <script src="js/physics.js"></script>
  <script src="js/level.js"></script>
  <script src="js/render.js"></script>
  <script src="js/main.js"></script>
```

```js
// js/input.js — ADD at the top of the file and the start of keydown.
let audioStarted = false;
// ... existing Game.input, setKey ...

// Inside the keydown listener, as its FIRST lines:
  if (!audioStarted) {
    Game.startAudio();
    audioStarted = true;
  }
```

```js
// js/physics.js — the two beep lines to ADD.

// In updatePlayer, inside the jump block:
  if (input.jumpQueued && p.grounded) {
    p.vy = -cfg.jumpSpeed * s.gravitySign;
    p.grounded = false;
    Game.beep(520, 80);        // <-- add
  }

// In collectCoins, inside the overlap branch:
      s.coins.splice(i, 1);
      s.score += 1;
      Game.beep(880, 60);      // <-- add
```

## Done when (this step)
- [ ] After pressing any key, jumping plays a low beep and collecting a coin plays a higher beep.
- [ ] No error if you somehow act before the first keypress (beeps just stay silent).
- [ ] `index.html` loads `audio.js` (and, once added, `storage.js`) before `physics.js`.

## If it breaks
- **No sound at all** — the context didn't start on a gesture. Confirm the `Game.startAudio()` guard runs at
  the top of `keydown`, and that your system volume/tab isn't muted.
- **`Game.beep is not a function`** — `audio.js` loads *after* `physics.js`. It must come before it.
- **A click/pop on each beep** — the gain fade is missing; keep the `exponentialRampToValueAtTime(...)` line.
- **`Cannot read properties of null`** — you removed the `if (!ac) return;` guard in `beep`; keep it.

---
> Nav: — · [Overview](00_overview.md) · [Timer & best time →](02_timer-and-best.md)
