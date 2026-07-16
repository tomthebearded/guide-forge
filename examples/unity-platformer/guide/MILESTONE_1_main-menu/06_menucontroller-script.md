# Milestone 1 · Step 06 of 08 — Write `MenuController.cs`
> Nav: [← Build Settings](05_build-settings.md) · [Overview](00_overview.md) · [Wire the buttons →](07_wire-buttons.md)

## Glossary for this step
- **`SceneManager.LoadScene`** — the call that swaps the running scene by name. See [glossary](../foundation/glossary.md).
- **`MonoBehaviour`** — the base class every Unity script inherits from; inheriting it is what lets a class be
  attached to a GameObject. See [glossary: MonoBehaviour](../foundation/glossary.md).

## Why / design
Your first script. It holds two **public methods** — `PlayGame` and `QuitGame` — that the buttons will call.
They're `public` because the Button's OnClick event can only call public methods. `PlayGame` loads the `Game`
scene; `QuitGame` logs and quits.

> **New concept — a Unity script is a `MonoBehaviour`.** A C# class that inherits `MonoBehaviour` can be
> **attached to a GameObject as a component** and can receive Unity's callbacks. Your menu logic lives in such a
> class. Docs: https://docs.unity3d.com/6000.5/Documentation/ScriptReference/MonoBehaviour.html
>
> **New concept — `Application.Quit()` does nothing in the Editor.** It closes a *built* game, but inside the
> Editor it's a no-op. That's why `QuitGame` also calls `Debug.Log("Quit")` — so you can *see* the button fired
> while testing. Docs: https://docs.unity3d.com/6000.5/Documentation/ScriptReference/Application.Quit.html

## Do this
1. In the **Project** window, right-click **`Assets`** → **Create → Folder** → name it **`Scripts`** (if it
   doesn't exist yet). *(Keeps scripts tidy — **cosmetic** location.)*
2. Right-click the **`Scripts`** folder → **Create → Scripting → MonoBehaviour Script** (in Unity 6.5 script
   types live under the **Scripting** submenu; older builds list **C# Script** directly under Create). Name it
   exactly **`MenuController`**. *(**Load-bearing:** the filename must match the
   class name — Unity requires it. So `MenuController.cs` holds `class MenuController`.)*
3. Double-click **`MenuController`** to open it in your code editor (Visual Studio / VS Code / Rider).
4. Replace the entire file with the code below and **save** it.
5. Return to Unity and wait a moment — the bottom-right shows a brief **compiling** spinner. Confirm the
   **Console** has **no red errors**. *(Unity recompiles every time you save a script.)*

## Code
`Assets/Scripts/MenuController.cs` — the complete file:
```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public class MenuController : MonoBehaviour
{
    // Wired to the Play button's OnClick in the Inspector.
    public void PlayGame()
    {
        SceneManager.LoadScene("Game");
    }

    // Wired to the Quit button's OnClick in the Inspector.
    public void QuitGame()
    {
        Debug.Log("Quit");   // visible proof the button fired (Application.Quit is a no-op in the Editor)
        Application.Quit();
    }
}
```

## Done when (this step)
- [ ] `Assets/Scripts/MenuController.cs` exists with the code above.
- [ ] Back in Unity, the **Console** shows **no compile errors** after the save — the exact observable that the
      script is valid and Unity accepted it.

## If it breaks
- **Console error: "The class defined in the script ... does not match the file name"** → the class name and
  filename differ. Both must be `MenuController`.
- **Error on `SceneManager`** → you're missing `using UnityEngine.SceneManagement;` at the top. It's in the code
  above — make sure you copied the whole file.
- **Nothing recompiles** → click back into the Unity window; it recompiles when it regains focus.

---
> Nav: [← Build Settings](05_build-settings.md) · [Overview](00_overview.md) · [Wire the buttons →](07_wire-buttons.md)
