# Architecture

The app is Tauri 2: a Rust backend in `src-tauri/src` owns every connection to
the outside world, and a Solid.js frontend in `src` renders. Windows only.

## Processes

`main.rs` picks a mode from argv. By default it runs the GUI (`lib.rs::run`),
which starts the EventSub runner, the 7TV socket, the Link pipe server, and in
release builds registers itself as the browser's native-messaging host. When a
browser launches the exe for the Link extension it runs as a host instead: no
Tauri, it only relays frames between browser stdio and the GUI pipe (see
[LINK.md](./LINK.md)). `--export-bindings` writes `src/lib/bindings.ts` and
exits.

## Backend and frontend

The two sides meet only through tauri-specta. `lib.rs::bindings()` lists every
command, event, and shared type, and `bindings.ts` is generated from it
(`pnpm bindings`, or automatically on every debug launch). A test fails
when the committed file is stale.

Commands go frontend to backend: one `#[tauri::command]` per operation, taking a
single `params` struct and returning `crate::error::Result<T>`. The frontend
calls them only from `src/lib/api/`. Events go the other way: typed ones live in
each feature's `events.rs` and are emitted with `crate::emit::emit`; EventSub
notifications pass through as raw JSON, one Tauri event per `EventKind`, with
hand-written TS types in `src/lib/types/twitch/eventsub.ts`.

## Backend

Each feature is a folder with `mod.rs` for the service, `commands.rs`, `dto.rs`
for outgoing shapes, and `events.rs`. Upstream crate types never leave `dto.rs`.
Crate-wide pieces sit at the root: `error.rs`, `http.rs` (the one
`reqwest::Client`), `ws.rs` (WebSocket connects), `emit.rs`, `keyring.rs`,
`clock.rs`.

`twitch/` is the bulk of it. `Twitch` is cloneable managed state holding the
Helix client, the session, and the EventSub handle. Sign-in is OAuth device
code; tokens sit in `Session` behind one mutex, `twitch.authed().await?` hands
out a fresh one, and credentials persist in the Windows credential store via
`keyring.rs`. Every request goes through `transport/HelixTransport`, which
retries 429s and idempotent 5xxs and pauses while rate-limited, so call sites
never retry themselves. For EventSub the frontend only says which channels it
wants and which is focused (`set_eventsub_channels`); the runner picks
subscription kinds, spreads them over connections under Twitch's 3 × 300 cap,
and reconnects.

The rest is smaller. `emotes/` talks to BTTV, FFZ, and 7TV, plus a 7TV WebSocket
for live set updates. `history/` fetches backlog from recent-messages.robotty.de
and maps it to the EventSub chat message shape so the feed has one code path.
`link/` registers the host manifests (`bridge.rs`), merges every connected
browser into one state (`ipc.rs`), and is the host process (`host.rs`).
`discord/`, `notifications/`, and `diagnostics/` do rich presence, the taskbar
badge, and stats.

## Frontend

Everything outside components lives in `src/lib/`, in layers that only import
downward. `events/` maps backend events into stores, one file per family.
`services/` holds one module per feature with its logic, state, and lifecycle.
`api/` is a thin typed wrapper per command and the only caller of `bindings.ts`.
`stores/` is signals and state and never calls the backend. `primitives/` wires
app lifecycle: `App.tsx` → `createAppController` → `createServices`, which calls
every `start()` once and runs the cleanups on unmount. Nothing runs on import.

A chat message arrives as an EventSub notification, becomes a Tauri event, is
mapped in `events/chat.ts` (where AutoMod and redemptions are correlated,
mentions recorded into the inbox, and triggers run), lands in `stores/feeds/` as
a capped per-channel buffer, and renders through `FeedItem`. Backlog from
`history/` takes the same path.

## Where things live

Twitch tokens are in the Windows credential store under `deatch` / `auth`.
Preferences, the inbox, and caches are in the WebView's `localStorage`. App logs
go to `%LOCALAPPDATA%\com.deaptic.deatch\logs`, the host's to
`%TEMP%\deatch-host.log`. Native-host manifests sit in `%LOCALAPPDATA%\Deatch\`
with their `HKCU` registry keys.
