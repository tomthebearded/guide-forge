# Milestone 0 · Step 01 of 05 — Install Unity Hub and the Unity 6.5 Editor
> Nav: — · [Overview](00_overview.md) · [Create the 2D project →](02_create-project.md)

## Why / design
Unity ships in two pieces: **Unity Hub** (a small launcher that installs Editor versions and manages projects)
and the **Unity Editor** itself (the big application you build the game in). You install the Hub once, then use
it to install one or more Editor versions side by side. We pin **Unity 6.5** — see
[stack.md](../foundation/stack.md).

> ⚠️ **6.5 is a tech-stream release, not LTS.** It's deliberately the newest build (your choice), but it gets a
> shorter support window than 6.3 LTS. If a menu path below looks different because you installed a later 6.x,
> trust what's on your screen and note the drift — see [decision D1](../foundation/decision-log.md#d1--pin-unity-65-tech-stream-not-63-lts).

## Do this
1. In a browser, go to **https://unity.com/unity-hub** and download **Unity Hub** for Windows. Run the
   installer and accept the defaults. *(Why: the Hub is the front door for everything else.)*
2. Open **Unity Hub**. If it asks you to **sign in / create a Unity account**, do so (a free personal account is
   fine) and, when prompted, get a **free Personal license**. *(Why: the Editor won't run without a license;
   Personal is free for individuals.)*
3. In the Hub's left sidebar, click **Installs**, then the **Install Editor** button (top-right).
4. In the version list, find the newest **Unity 6.5** build — its version string starts with **`6000.5`** (for
   example `6000.5.3f1`). Select it. *(Why: `6000.5.x` **is** "Unity 6.5" — Unity's internal version numbers
   use the `6000` prefix. If you only see 6.3 or 6.4, click the **Archive**/"other versions" link and pick the
   latest `6000.5`.)*
5. On the **Add modules** screen, leave **Windows Build Support (IL2CPP)** checked (it's on by default) and
   leave everything else at its default. Click **Continue**, accept the terms, and let it download and install.
   *(**IL2CPP** = Unity's ahead-of-time compiler that turns your C# into native code for standalone builds; you
   never touch it directly here — just leave it on.)*
   *(Why: the default modules are all we need; extra platforms just cost disk space.)*

MANDATORY: the pinned version is **`6000.5.x` (Unity 6.5)**. ILLUSTRATIVE: the exact patch (`.3f1` vs a newer
`.x`) doesn't matter — take the newest 6.5 patch offered.

## Done when (this step)
- [ ] Unity Hub is installed and you're signed in with a valid (Personal) license.
- [ ] Under **Installs**, a **Unity `6000.5.x`** editor is listed with no error badge — the exact observable is
      a row reading something like **"6000.5.3f1"** with the Unity logo and no red warning icon.

## If it breaks
- **No `6000.5` version in the list** → click **Archive** (or "Need a specific version?") and choose the newest
  `6000.5`. If truly none exists yet in your region's list, install the newest **6.x** shown and note it as
  drift — the guide's APIs (`linearVelocity`, `Physics2D.gravity`, uGUI) are stable across 6.x.
- **"License not found" when you later open a project** → in the Hub, go to the **gear/Preferences → Licenses**
  and add a free **Personal** license.

---
> Nav: — · [Overview](00_overview.md) · [Create the 2D project →](02_create-project.md)
