# Backend

`src-tauri/src/` is one folder per feature. Crate-wide pieces (`error.rs`,
`http.rs`, `ws.rs`, `db.rs`, `blocking.rs`, `emit.rs`, `keyring.rs`, `clock.rs`)
sit at the root. `lib.rs` only wires the app: plugins, managed state, setup, and the
tauri-specta command and event lists. Windows only: no `cfg` branches or
dependencies for other platforms.

Inside a feature folder:

- `mod.rs` — the service: params structs and the functions that do the work.
  Services take their dependencies as arguments (`&Authed`, `&Twitch`,
  `&reqwest::Client`, a path), never `app.state()`. An `AppHandle` is passed
  only to emit events.
- `commands.rs` — `#[tauri::command] #[specta::specta]` functions only, one line
  each: pull state, call the service. A command takes a single `params` struct;
  shapes shared across resources live in `twitch/params.rs`.
- `dto.rs` — outgoing shapes and their `From<upstream>` mappings. Upstream types
  never leave this file.
- `events.rs` — `tauri_specta::Event` structs, emitted with `crate::emit::emit`.

Tests are a `#[cfg(test)] mod tests` at the bottom of the file; keep IO out of
the logic under test, and split parsing from fetching when a function mixes them
(`docs/TESTING.md`).

## Conventions

- Every command returns `crate::error::Result<T>`. `Error` is a tagged enum that
  reaches the frontend as `{ kind, message }`. Add a `From` impl rather than
  `map_err(|e| e.to_string())`.
- Every command, params struct, DTO, and event derives `specta::Type` and is
  registered in `lib.rs`. Option fields a caller may omit get
  `#[serde(default)]`; a struct-wide `default` only where every field is
  optional.
- One shared `reqwest::Client` from `http.rs`; never construct another.
  `http::get_json` covers plain JSON GETs.
- WebSockets open through `ws::connect`, which bounds the handshake.
- Data that belongs to the signed-in account lives in its database through
  `db::Databases`, keyed by `twitch.viewer()`. A feature owns its tables as a
  `db::Schema` registered in `lib.rs`; steps are only appended, never edited.
- Every Twitch request, Helix and OAuth alike, goes through `twitch/transport/`,
  which owns retries and rate-limit pacing. Never add retries, sleeps, or pacing
  at call sites.
- `twitch::Twitch` is managed state and cheap to clone. Get a valid token with
  `twitch.authed().await?`, prefer the `HelixClient` helper methods over
  hand-built requests, and use `twitch::pagination::collect` when the caller
  wants every page.
- IDs cross the boundary as the newtypes in `twitch/ids.rs`. Closed sets of
  values are enums, validated when deserialized.
- EventSub payloads pass through as raw JSON, never `twitch_api` types (the
  crate rejects whole messages when Twitch adds fields); their TS types are
  hand-written in `src/lib/types/twitch/eventsub.ts`. The frontend only says
  which channels it wants and which is focused; the backend decides kinds,
  connections, and retries.
