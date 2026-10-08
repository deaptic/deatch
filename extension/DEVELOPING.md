# Developing Deatch Link

## Architecture

```
Twitch tabs          Extension                   Native host process
  tabs.onUpdated ──► background.js ◄───────────► ┌──────────────────┐
  tabs.onActivated     state machine:            │ stdin ⇄ stdout   │
  windows.onFocus      tabs + current,           │ (4-byte LE       │
                       mute, reconnect           │  length prefix)  │
                       w/ backoff                │                  │
                                                 │ bidirectional    │
                                                 │ pipe to running  │
                                                 │ Deatch GUI       │
                                                 └──────────────────┘
```

Twitch is an SPA, but browsers still fire `tabs.onUpdated` with the new `url` on
in-page navigation, so no content script is needed.

One codebase serves Firefox and Chromium. `manifest.json` lists `background.js`
as both an event-page script (Firefox) and a service worker (Chrome, Edge); each
browser warns about the other's keys and moves on. Chrome keeps a service worker
alive while a native-messaging port is open (Chrome 105+), so the
reconnect-in-`onDisconnect` design holds there too. The Chrome Web Store assigns
the extension id; the `key` in `manifest.json` is the store item's public key,
so unpacked loads get the same id. `bridge.rs` whitelists that id in the host
manifest, so the two must always agree.

Each browser launches its own `deatch.exe` host (Firefox passes the manifest
path, Chromium the extension origin; `main.rs` routes both to host mode before
Tauri init). Every host forwards NDJSON lines to the running GUI over the same
local socket (`\\.\pipe\deatch-bridge`). The GUI merges all connected browsers
into one state (`ipc.rs`): channels are the union, a channel is muted only if
muted everywhere, and the browser that reported last decides `current`. Commands
fan out to every browser; the extension ignores channels it has no tab for.

## Message protocol

JSON, length-prefixed (4-byte little-endian) per the
[native messaging spec](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging).

### Extension → host

| Message                                                                                                     | When                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `{ "type": "state", "channels": [{"login": "<slug>", "muted": <bool>}, ...], "current": "<slug>" \| null }` | On any state change: tab open/close/url, focus change, mute change. Deduped by content. |

`current` resolves to: active Twitch tab → most recently used Twitch tab (seeded
from `tab.lastAccessed`, so it survives add-on reloads) → `null`.

### Host → extension

| Message                                                         | Effect                                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `{ "type": "get_state" }`                                       | Force re-emit of current `state`. Auto-sent by host on every (re)connect to GUI. |
| `{ "type": "set_muted", "channel": "<slug>", "muted": <bool> }` | Apply mute/unmute via `chrome.tabs.update` to every tab on that channel.         |
| `{ "type": "focus", "channel": "<slug>" }`                      | Activate that channel's most recently used tab, without raising the window.      |
| `{ "type": "close", "channel": "<slug>" }`                      | Close every tab on that channel.                                                 |

## Loading as a temporary add-on (Firefox)

1. Build a release Deatch and run it once so it self-registers the native host:
   ```pwsh
   deno task build
   cd src-tauri
   cargo build --release
   .\target\release\deatch.exe
   ```
   This writes `%LOCALAPPDATA%\Deatch\deatch-host.json` and the registry key
   under `HKCU\Software\Mozilla\NativeMessagingHosts\com.deaptic.deatch`. Debug
   builds never register (Firefox would hold `target\debug\deatch.exe` open and
   block relinking), so `deno task tauri dev` alone is not enough to test host
   changes. Whichever release Deatch ran last, built or installed, owns the host
   path. After re-registering, reload the add-on so Firefox spawns a fresh host
   process.

2. In Firefox: `about:debugging#/runtime/this-firefox`.

3. **Load Temporary Add-on…** → pick `D:\deatch\extension\manifest.json`.

4. Click **Inspect** next to "Deatch Link" to open the background console.

## Debug logging

The host never exits on its own: it retries the GUI pipe every 1.5 s and quits
only when Firefox closes its stdin. The extension's reconnect backoff therefore
only runs when `deatch.exe` itself cannot be launched.

Host-side log (all in/out frames):

```pwsh
Get-Content $env:TEMP\deatch-host.log -Wait -Tail 20
```

## Loading unpacked (Chrome / Edge)

The release Deatch also registers
`%LOCALAPPDATA%\Deatch\deatch-host-chromium.json` under
`HKCU\Software\Google\Chrome\NativeMessagingHosts` and the Edge equivalent, so
step 1 above covers Chromium too.

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → pick
   `D:\deatch\extension`.
2. Confirm the id matches `CHROME_EXTENSION_ID` in
   `src-tauri/src/watch/bridge.rs`. Thanks to the manifest `key`, unpacked and
   store installs share it.
3. **Service worker** link on the card opens the background console.

## Releasing

`manifest.json` carries the keys for both browsers, which is fine for loading
unpacked but makes each store warn about the other's keys. For uploads, build a
zip per browser with a manifest stripped to what that browser knows:

```pwsh
deno task pack:extension minor   # or: patch | major | 1.2.3; omit to keep the version
# → extension/dist/deatch-link-firefox-<v>.zip
#   extension/dist/deatch-link-chrome-<v>.zip
```

Both stores are public listings and push updates to installed copies themselves.
Build the zips with a version bump, then:

- **Firefox**: upload the firefox zip on the
  [AMO Developer Hub](https://addons.mozilla.org/developers/) as a new version
  of Deatch Link, distributed **On this site**. AMO rejects listed manifests
  that carry `update_url`, so never add one.
- **Chrome / Edge**: upload the chrome zip on the
  [Web Store developer dashboard](https://chrome.google.com/webstore/devconsole).
  The zip carries no `key` (the store rejects it); the store keeps the id it
  assigned on first upload. Edge installs from the Chrome Web Store too.

  If the store item is ever recreated: upload, then copy its public key (item →
  **Package** → **View public key**) into `manifest.json` `key` and its id into
  `bridge.rs`, and ship an app release.

Both reviews take a few days per version and may land at different times; mixed
versions are fine, the host speaks to both. Copies installed by hand (unpacked,
temporary, or a self-distributed `.xpi`) never update; replace them with a store
install once.
