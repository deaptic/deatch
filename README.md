# Deatch

Twitch chat, done right. Multi-channel, native desktop, no browser tab tax.

A native Twitch chat client built with Tauri.

## Features

- Multi-channel chat with a mentions inbox across all followed channels
- Full 7TV, BetterTTV, and FrankerFaceZ emote support (channel and global)
- Mod actions (ban, timeout, VIP, nickname) and per-user message history
- Discord Rich Presence showing the streamer you're watching
- Optional Firefox extension that links the app to your browser's active Twitch
  tab
- Signed auto-updates

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
```

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
