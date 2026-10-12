# Deatch

A native Twitch chat client for Windows, and the pieces that work with it.

| Package                            | What it is                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`apps/desktop`](apps/desktop)     | The desktop app — Tauri 2 + Solid.js. Installers on [Releases](https://github.com/deaptic/deatch/releases/latest). |
| [`apps/api`](apps/api)             | Backend API — Hono on Cloudflare Workers, D1, Durable Objects. Accounts and presence for the app.                  |
| [`apps/extension`](apps/extension) | Deatch Link — browser extension that lets the app follow the Twitch tab you have open.                             |

## Development

Requires [Rust](https://rustup.rs/), [Deno](https://deno.com/) 2.x, and the
Tauri prerequisites. The repo is a Deno workspace; run everything from the root:

```powershell
deno install              # deps for every workspace member
deno task dev:desktop     # run the desktop app in dev mode
deno task release:desktop    # bump desktop version files
deno task release:extension  # bump and build store zips for the extension
```

Each app is self-contained: `cd` into it and run its own tasks.

Each package's README covers its own details. `CLAUDE.md` describes how the code
is structured.

## License

MIT
