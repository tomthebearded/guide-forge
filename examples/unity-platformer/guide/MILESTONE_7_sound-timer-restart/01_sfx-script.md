# Milestone 7 · Step 01 of 07 — Write `Sfx.cs` (synthesized beeps)
> Nav: — · [Overview](00_overview.md) · [Audio object →](02_audio-object.md)

## Glossary for this step
- **[`AudioSource` / `AudioListener`](../foundation/glossary.md#audiosource--audiolistener)** — the component that *plays* a clip (`AudioSource`) and the component (on
  the camera) that *hears* it (`AudioListener`).

## Why / design
Rather than import `.wav` files, we **generate** three short beeps in code (jump, coin, win) — the engine analogue
of the sibling's Web Audio oscillator. `Sfx` builds each beep once in `Awake` and exposes `PlayJump`/`PlayCoin`/
`PlayWin` for `GameManager` and the player to call.

> **New concept — synthesize a tone by filling samples.** A sound is just numbers: an amplitude per sample. A
> pure tone is a **sine wave** — `sin(2π · frequency · time)`. We compute one float per sample, taper the end so
> it doesn't click, and hand the array to `AudioClip.Create` + `SetData`. You don't need to follow the math to
> use it — treat `MakeBeep` as a black box if you like. Docs:
> https://docs.unity3d.com/6000.5/Documentation/ScriptReference/AudioClip.Create.html
>
> **New concept — `PlayOneShot`.** Plays a clip once without interrupting others — good for overlapping SFX.
> **Note:** audio ignores `Time.timeScale`, so the **win** beep still plays even though the win freezes the game.
>
> **Fallback (if synthesis feels like too much):** you can instead drop three short `.wav` files into
> `Assets/Audio/`, expose three `[SerializeField] AudioClip` fields, and skip `MakeBeep`. The synthesized route
> keeps the project asset-free, matching the shapes-only spirit.

## Do this
1. In **Project → `Assets/Scripts`** right-click → **Create → Scripting → MonoBehaviour Script** (older builds:
   **Create → C# Script**), name it exactly **`Sfx`**.
2. Open it, replace the whole file with the code below, and **save**.
3. Confirm a clean compile (no Console errors). *(We create the object that carries it in the next step.)*

## Code
`Assets/Scripts/Sfx.cs` — the complete file:
```csharp
using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class Sfx : MonoBehaviour
{
    [SerializeField] private float jumpFrequency = 440f;   // A4
    [SerializeField] private float coinFrequency = 880f;   // A5
    [SerializeField] private float winFrequency  = 660f;   // E5

    private AudioSource source;
    private AudioClip jumpClip;
    private AudioClip coinClip;
    private AudioClip winClip;

    private void Awake()
    {
        source = GetComponent<AudioSource>();
        jumpClip = MakeBeep(jumpFrequency, 0.10f);
        coinClip = MakeBeep(coinFrequency, 0.08f);
        winClip  = MakeBeep(winFrequency, 0.35f);
    }

    public void PlayJump() { source.PlayOneShot(jumpClip); }
    public void PlayCoin() { source.PlayOneShot(coinClip); }
    public void PlayWin()  { source.PlayOneShot(winClip); }

    // Build a short sine-wave beep in memory — no audio files needed.
    private AudioClip MakeBeep(float frequency, float durationSeconds)
    {
        int sampleRate = 44100;
        int sampleCount = Mathf.RoundToInt(sampleRate * durationSeconds);
        float[] samples = new float[sampleCount];
        for (int i = 0; i < sampleCount; i++)
        {
            float t = (float)i / sampleRate;
            float fade = 1f - (float)i / sampleCount;                 // taper to avoid an end click
            samples[i] = Mathf.Sin(2f * Mathf.PI * frequency * t) * 0.3f * fade;
        }
        AudioClip clip = AudioClip.Create("beep", sampleCount, 1, sampleRate, false);   // Create(name, samples, channels, rate, stream) → an empty clip we fill below
        clip.SetData(samples, 0);
        return clip;
    }
}
```

## Done when (this step)
- [ ] `Assets/Scripts/Sfx.cs` exists with the code above and **compiles with no errors** — the exact observable.

## If it breaks
- **`SetData` / `Create` errors** → check the argument order: `AudioClip.Create(name, sampleCount, channels=1,
  sampleRate, stream=false)`, then `clip.SetData(samples, 0)`.
- **Compiles but you worry it's silent** → you can't hear it yet; the object + wiring come in steps 02–03.

---
> Nav: — · [Overview](00_overview.md) · [Audio object →](02_audio-object.md)
