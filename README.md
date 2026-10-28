# Deatch

Deatch is a native Twitch chat client for Windows. It keeps several channels
open at once, collects mentions from all of them into one inbox, and puts
moderation tools in reach without the browser. An optional browser extension
lets it follow the Twitch tab you are watching.

## Download

Latest installer on the
[releases page](https://github.com/deaptic/deatch/releases/latest). Updates
install themselves.

## Building

Requires [Rust](https://rustup.rs/), [Node](https://nodejs.org/) 26+,
[pnpm](https://pnpm.io/), and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/).

```powershell
pnpm install
pnpm tauri dev
```

Docs in [docs/](docs/): [architecture](docs/ARCHITECTURE.md),
[design](docs/DESIGN.md), [browser extension](docs/LINK.md),
[testing](docs/TESTING.md), [releasing](docs/RELEASING.md). Code conventions in
`CLAUDE.md`.

## License

MIT
