# Deatch

A native Twitch chat client for Windows.

Deatch runs your Twitch chat outside the browser. Keep every channel you care
about one keystroke away, catch mentions from all of them in a single inbox, and
moderate without a stack of open tabs.

## Features

- **Channel rail.** Pinned channels, live follows, and whatever you're currently
  viewing, as avatars with presence dots. `Ctrl+B` expands it into a full
  roster. `Ctrl+K` fuzzy-switches between channels.
- **Inbox.** Mentions and keyword hits from every channel in one list. Click one
  to jump to the message in its channel.
- **Moderation.** Ban, timeout, warn, purge, delete, VIP, chat modes, and
  AutoMod approve/deny from the user card, the message context menu, or slash
  commands with autocomplete. Held messages are marked in the feed.
- **Chat.** Replies, reply-by-`Tab` to recent mentions, username and emote
  completion, message history recall, keyboard message selection, clip and
  marker creation, raids and shoutouts.
- **Watch.** Pair with the
  [Deatch Link](https://github.com/Deaptic/deatch/tree/main/extension) Firefox
  extension and the app follows the Twitch tab you have open, with per-tab mute
  from inside Deatch.
- **Explore.** Live followed channels and search, without leaving the app.
- **Appearance.** Dark and light themes, one accent colour of your choosing,
  adjustable chat size. Flat, warm, no clutter.
- **Extras.** Discord rich presence, always-on-top, autostart, silent updates.

## Install

Grab the latest installer from
[Releases](https://github.com/deaptic/deatch/releases/latest). The app checks
for updates on startup and applies them silently.

Windows-only. No macOS or Linux builds.

## Development

Requires [Rust](https://rustup.rs/), [Deno](https://deno.com/) 2.x, and the
Tauri prerequisites for your platform.

```powershell
deno install            # frontend deps
deno task tauri dev     # run the app in dev mode
deno task build         # vite build
deno fmt                # format src/
deno lint               # lint src/
deno task lint:ui       # design-system lint (@shadcn/lint via oxlint)
```

`docs/design-system.md` is the source of truth for how the UI looks and behaves.
`CLAUDE.md` describes how the code is structured.

### Releasing

```powershell
deno task release           # patch bump (default)
deno task release minor
deno task release major
deno task release 1.2.3     # explicit version
```

Bumps `package.json`, `tauri.conf.json`, `Cargo.toml`, and `Cargo.lock`
together, then commits, tags, and pushes. The release workflow builds and
publishes from the tag. Refused if the working tree has uncommitted changes.

## Stack

- [Tauri 2](https://tauri.app/) — Rust backend, system WebView frontend
- [Solid.js](https://www.solidjs.com/) + [Vite](https://vite.dev/) — UI
- [Tailwind CSS 4](https://tailwindcss.com/) — styling
- [twitch_api](https://github.com/twitch-rs/twitch_api) — Helix + EventSub
  client

## License

MIT
