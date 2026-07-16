# Milestone 1 · Step 08 of 08 — Verify Milestone 1
> Nav: [← Wire the buttons](07_wire-buttons.md) · [Overview](00_overview.md) · [M2 — The world & free physics →](../MILESTONE_2_world-and-free-physics/00_overview.md)

## Milestone Done-when gate
With the **MainMenu** scene open, press **Play** (the ▶ at top-center) and check each:
- [ ] **Menu renders** — the Game view shows **SHAPE JUMPER** with **Play** and **Quit** buttons.
- [ ] **Play loads the game** — click **Play** → the Game view switches to the **`Game`** scene's background
      color (the dark green from M1/04). That color change *is* the proof the scene loaded.
- [ ] **Quit fires** — stop Play, run again, click **Quit** → the **Console** prints **`Quit`**. (The app
      doesn't close — that's expected in the Editor.)
- [ ] **Build Settings** — `MainMenu` is index **0**, `Game` is index **1**.

Press **Play** again to stop.

## The JS-vs-Unity contrast (milestone recap)
The sibling's "menu" was a `title` value in one big state machine, drawn on the same canvas. Unity splits screens
into **separate scenes** and moves between them with `SceneManager.LoadScene` — and you built the entire menu by
**placing components** (Canvas, Buttons, Text) and wiring OnClick in the Inspector, with only a five-line script.
That "configure in the Editor, tiny bit of glue code" pattern is the whole engine philosophy in miniature.

## Files after this milestone
Only one script exists so far. `Assets/Scripts/MenuController.cs` — complete current contents:
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
Scenes on disk: `Assets/Scenes/MainMenu.unity` (index 0), `Assets/Scenes/Game.unity` (index 1).

## Troubleshooting
- **Clicking Play (the button) does nothing** → the OnClick isn't wired (M1/07), or the scene isn't in Build
  Settings (M1/05). Check both. A common Console error is *"Scene 'Game' couldn't be loaded because it is not
  added to the build settings"* — that pinpoints the Build Settings miss.
- **Buttons don't respond to the mouse at all** → your scene is missing the **EventSystem** object. It's created
  automatically with the first UI element; if you deleted it, right-click Hierarchy → **UI → Event System**.
- **The `Quit` log doesn't appear** → the Console filter may hide logs; make sure the Console's message-type
  toggles (top-right of the Console) are all on.

## Next
[M2 — The world & free physics](../MILESTONE_2_world-and-free-physics/00_overview.md): open the empty `Game`
scene and fill it with shapes — then add two components and watch the player **fall and land with no code**.

---
> Nav: [← Wire the buttons](07_wire-buttons.md) · [Overview](00_overview.md) · [M2 — The world & free physics →](../MILESTONE_2_world-and-free-physics/00_overview.md)
