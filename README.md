# MenuDuo
**by pagoni meow**

A BetterDiscord plugin that puts a music player and a theme switcher into Discord without getting in the way. Two things most people end up wanting separate plugins for — this does both, and they actually work together without breaking each other.

---

## What it does

### Music Player (MusicMenu)
A floating panel you can drag anywhere on screen. Supports YouTube and SoundCloud. You can search by name or paste a direct URL for either — it'll figure out which one you mean. Tracks get added to a queue so you can line up multiple things and skip through them. Volume is saved between sessions so you're not adjusting it every time you open Discord.

The panel adapts its colors to whatever Discord theme you currently have active, so it never looks out of place.

### Theme Switcher
A fullscreen overlay that lists every theme you have installed in BetterDiscord. Click one to apply it, click the active one again to turn it off. Has a search bar so you can filter if you've got a lot installed. Your last used theme is remembered and restored when you restart Discord.

There's also a small pill indicator in the bottom-left corner that shows you which theme is currently active at a glance.

---

## Keybinds

| Key | What it does |
|-----|-------------|
| `Alt + M` | Toggle the music panel open/closed |
| `Esc` | Open/close the theme switcher |

The `Alt+M` combo was chosen specifically because it doesn't interfere with typing. You can hit it while focused in the message box and it won't do anything weird to your message.

`Esc` to open the theme switcher only fires if there's no modal, popout, or layer already open — so it won't fight with Discord's own Esc behavior when you're closing something else.

---

## Installation

1. Make sure you have [BetterDiscord](https://betterdiscord.app/) installed
2. Download `MenuDuo_plugin.js`
3. Open BetterDiscord Settings → Plugins → click the folder icon to open your plugins folder
4. Drop the file in there
5. Flip the toggle to enable it

That's it. No dependencies, no extra setup.

---

## Music Player — Details

**Supported sources:**
- YouTube (search by name, or paste a `youtube.com/watch?v=`, `youtu.be/`, or embed URL)
- SoundCloud (search by name, or paste a full `soundcloud.com/` track URL)

**Controls:**
- `⏮` — previous track in queue
- `▶ / ⏸` — play/pause (YouTube only — SoundCloud uses its own embedded player controls)
- `⏭` — next track in queue
- Volume slider — adjusts YouTube playback volume, saved automatically

**Queue:**
Anything you search gets added to the bottom of the queue. Click any item in the queue to jump to it. Click the `✕` on a queue item to remove it. The currently playing track is highlighted.

**Panel controls:**
- `−` button — collapses the panel to just the title bar so it takes up less space
- `✕` button — hides the panel (bring it back with `Alt+M`)
- Drag the title bar to reposition the panel anywhere — position is saved between sessions
- "Reset Music Panel Position" in plugin settings snaps it back to the default position if it ends up offscreen

---

## Theme Switcher — Details

Opens as a fullscreen overlay with a blurred backdrop. Lists every theme BetterDiscord knows about, whether it's enabled or not.

- Click a theme to enable it (all others are disabled automatically)
- Click the currently active theme to disable it entirely (resets to default Discord appearance)
- Search bar filters the list in real time
- The active theme's name shows in the status bar at the top of the panel and in the pill in the bottom-left corner
- Hit `Esc` or click outside the panel to close it without changing anything

Your chosen theme is saved and re-applied next time you start Discord. If a previously saved theme gets deleted/removed from your BD themes folder, it gracefully clears the saved choice instead of erroring.

---

## Plugin Settings

Found in BetterDiscord Settings → Plugins → MenuDuo → the gear icon.

Only one option in there right now: **Reset Music Panel Position** — useful if you've dragged the panel somewhere and lost track of it, or if you changed monitor resolution and it ended up offscreen.

---

## Known limitations

- Play/pause button only works for YouTube. SoundCloud embeds handle their own playback through the iframe, so the button does nothing when SoundCloud is active — use the controls inside the SoundCloud player itself.
- YouTube search scrapes the results page directly, so if YouTube changes their page structure it may stop finding results. Pasting a direct URL always works as a fallback.
- SoundCloud search works the same way. Direct URL paste is the reliable option there too.
- The music panel colors pull from Discord's CSS variables, so if a theme does something very non-standard with its variable names the panel might fall back to default dark colors. It still works, just might not match perfectly.

---

## Compatibility

Requires BetterDiscord. Tested on desktop (Windows). Should work fine on Mac and Linux since it's just JS running in Electron — nothing platform-specific going on under the hood.

Does not conflict with other BD plugins unless something else is also intercepting `Esc` keydown events at the capture phase, which would be unusual.

---

*v1.0.4 — pagoni meow*
