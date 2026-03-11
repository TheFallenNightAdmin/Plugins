# 🟢 FriendActivityTimeline

> A BetterDiscord plugin that adds a live floating feed of everything your friends do — games, status changes, voice channels, and streams — all in one sleek draggable overlay.

**by pagoni meow** • v1.0.0 • No dependencies required

---

## What Is It?

FriendActivityTimeline watches your Discord friends list in the background and logs every activity change into a beautiful, scrollable timeline panel that floats on top of your Discord client. The moment a friend launches a game, hops into voice, goes online, or starts streaming — it shows up instantly.

Think of it like a social activity feed, but built directly into Discord. No bots. No external servers. No extra installs. Everything runs locally inside your client.

---

## Features

### 📋 Live Activity Feed
Polls every 5 seconds and prepends new events to the top of the feed. Each entry shows the friend's avatar, display name, what they did, and how long ago it happened (auto-updating — "2m ago", "1h ago", etc.).

### 🎯 Tracked Events

| Icon | Event | Description |
|------|-------|-------------|
| 🎮 | Game Started | Friend launched a game tracked by Discord |
| 🎮 | Game Stopped | Friend closed the game they were playing |
| 🟢 | Came Online | Friend switched to online status |
| 🔴 | Set DND | Friend enabled Do Not Disturb |
| 🌙 | Went Idle | Friend went away from keyboard |
| ⚫ | Went Offline | Friend disconnected or went invisible |
| 🔊 | Joined Voice | Friend connected to a voice channel |
| 🔇 | Left Voice | Friend disconnected from voice |
| 📡 | Stream Started | Friend started streaming or screen sharing |
| 📡 | Stream Stopped | Friend ended their stream |

### 🪟 Floating Draggable Overlay
A sleek frosted-glass panel that sits on top of Discord without blocking anything. Drag it anywhere by the header — position saves automatically and persists across restarts.

### 🔘 Collapse & Clear
- **✕** — clears the entire feed
- **−** — collapses the panel to just the title bar; click again to expand

### 🔁 Sidebar Toggle
A small icon button injected into Discord's left toolbar lets you show/hide the overlay at any time without disabling the plugin.

### 🧠 Smart Deduplication
Caches each friend's last known state. Only actual changes get logged — no duplicate events, no spam if Discord re-sends the same presence data.

### 🎚️ Adjustable Opacity
Slider in settings lets you dial the panel from 20% (nearly invisible) to 100% (fully opaque).

---

## Installation

1. Install [BetterDiscord](https://betterdiscord.app) if you haven't already
2. Download [`FriendActivityTimeline.plugin.js`](./FriendActivityTimeline.plugin.js)
3. Drop it into your BetterDiscord plugins folder:

| OS | Path |
|----|------|
| Windows | `%AppData%\BetterDiscord\plugins\` |
| macOS | `~/Library/Application Support/BetterDiscord/plugins/` |
| Linux | `~/.config/BetterDiscord/plugins/` |

4. Open Discord → Settings → Plugins → enable **FriendActivityTimeline**
5. The timeline panel appears in the bottom-right corner immediately

---

## Usage

| Action | How |
|--------|-----|
| Move the panel | Click and drag the header |
| Collapse | Click **−** in the header |
| Clear feed | Click **✕** in the header |
| Hide/show | Click the person icon in the left sidebar |
| Reset position | Settings → Reset Position button |

---

## Settings

Open Discord Settings → Plugins → FriendActivityTimeline → ⚙️

| Setting | Default | Description |
|---------|---------|-------------|
| Show Games | ON | Track game start/stop events |
| Show Status Changes | ON | Track online/offline/idle/DND |
| Show Voice Activity | ON | Track voice channel joins and leaves |
| Show Streams | ON | Track stream start/stop events |
| Opacity | 90% | Panel transparency (20–100%) |
| Reset Position | Button | Snaps panel back to default position |

---

## How It Works

Every 5 seconds the plugin reads from Discord's internal data stores — the same ones Discord uses to show presence in the member list:

1. Fetches your friends list from `RelationshipStore`
2. Reads each friend's status and activities from `PresenceStore`
3. Checks voice channel state from `VoiceStateStore`
4. Diffs current state against a locally cached snapshot
5. If anything changed → new event is prepended to the feed

No data ever leaves your machine. No API calls. No accounts. Just Discord's own presence data that it already shows you.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Panel doesn't appear | Make sure the plugin is enabled; try the sidebar toggle button |
| No events in the feed | The feed only logs *changes* — wait for a friend to do something |
| Panel went off-screen | Settings → Reset Position |
| Plugin fails to start | Make sure BetterDiscord is up to date |
| Avatars not loading | Discord CDN issue — fallback avatar is used automatically |

---

## Technical Notes

- Uses `BdApi.findModuleByProps` to access Discord's internal Webpack modules — no `require()` calls, no external libraries
- Activity type `0` = Playing, type `1` = Streaming
- Events are stored in memory only (capped at 100) — feed clears on Discord restart
- If Discord updates and breaks module lookups, the plugin may need a store name update

---

## Disclaimer

This plugin only reads presence data that Discord already displays to you. It does not intercept messages, modify traffic, or transmit any data externally. As with all BetterDiscord plugins, use at your own discretion.

---

*FriendActivityTimeline v1.0.0 — by pagoni meow*
