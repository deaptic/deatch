# Deatch

A native Twitch chat client for Windows.

Deatch runs your Twitch chat outside the browser. Follow many channels at once,
watch mentions across all of them from a single inbox, and moderate your own
channel without a stack of open tabs. It renders the emotes chat actually uses —
7TV, BetterTTV, and FrankerFaceZ, both global and per-channel — and stays out of
the way while you watch, with Discord presence and an optional browser link for
the Twitch tab you already have open.

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
