# Backend

Rust tests live in a `#[cfg(test)] mod tests` at the bottom of the file they
cover. Test the pure core: parsers, mappings, and params validation, asserting
wire shapes via `serde_json::to_value`. Keep IO out of the logic under test; if
a function mixes fetching and parsing, split out the parsing.
`committed_bindings_are_current` fails when `bindings.ts` is stale. The app
manifest is embedded by the linker in `build.rs` so test binaries can start on
Windows; don't switch back to tauri-build's default manifest.

## Layout

`src-tauri/src/` is one folder per feature (`twitch/<resource>/`, `emotes/`,
`history/`, `link/`, `discord/`, `notifications/`). Crate-wide pieces sit at the
root: `error.rs`, `http.rs`, `emit.rs`, `keyring.rs`, `clock.rs`. `lib.rs` only
wires the app: plugins, managed state, setup, and the tauri-specta command/event
lists. The app is Windows-only: no `cfg` branches or dependencies for other
platforms.

Inside a feature folder:

- `mod.rs` — the service: params structs (`Deserialize`) and the functions that
  do the work. Services take their dependencies as arguments (`&Authed`,
  `&Twitch`, `&reqwest::Client`, a path) — never `app.state()`. An `AppHandle`
  is passed only to emit events.
- `commands.rs` — `#[tauri::command] #[specta::specta]` functions only. One line
  each: pull state, call the service. Commands take a single `params` struct;
  shapes shared across resources (`BroadcasterParams`, `BroadcasterUserParams`,
  `BroadcasterPairParams`) live in `twitch/params.rs`.
- `dto.rs` — outgoing shapes and their `From<upstream>` mappings. Upstream types
  never leave this file.
- `events.rs` — `tauri_specta::Event` structs, emitted with `crate::emit::emit`.

## Conventions

- Every command returns `crate::error::Result<T>`. `Error` is a tagged enum that
  reaches the frontend as `{ kind, message }` (`AppError` in TS). Add a `From`
  impl rather than `map_err(|e| e.to_string())`.
- One shared `reqwest::Client` (timeouts, user agent) from `http.rs`; never
  construct another. `http::get_json` covers plain JSON GETs.
- Every Twitch request, Helix and OAuth alike, goes through `twitch/transport/`
  (`HelixTransport`); OAuth calls take `&twitch.helix` as their client. It
  retries 429s once the rate-limit bucket resets, and retries 5xx only for
  idempotent methods, never POST. It also pauses all requests while the
  rate-limit bucket is empty. Don't add retries, sleeps, or pacing at call
  sites.
- `twitch::Twitch` is managed state and cheap to clone. Get a valid,
  auto-refreshed token with `twitch.authed().await?`, and prefer the
  `HelixClient` helper methods over hand-built requests. Use
  `twitch::pagination::collect` when the caller wants every page.
- IDs cross the boundary as the newtypes in `twitch/ids.rs`. Closed sets of
  values are enums, validated when deserialized.
- Every command, params struct, DTO, and event derives `specta::Type` and is
  registered in `lib.rs`. Option fields a caller may omit get
  `#[serde(default)]`. Put a struct-wide `default` only on structs where every
  field is optional.
- EventSub notification payloads pass through as raw JSON, never `twitch_api`
  types (the crate rejects whole messages when Twitch adds fields); their TS
  types are hand-written in `src/lib/types/twitch/eventsub.ts`. Their event
  names come from `EventKind::event_name()`, exported as `EVENTSUB_EVENT_NAMES`.
  Listen with `listenEventSub`. The frontend only says which channels it wants
  and whether each is focused (`set_eventsub_channels`); the backend decides
  kinds, connections (up to Twitch's 3 × 300), and retries.
