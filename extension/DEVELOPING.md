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

Twitch is an SPA, but Firefox still fires `tabs.onUpdated` with the new `url` on
in-page navigation, so no content script is needed. `channel.js` turns a URL
into a channel login (or `null` for non-channel pages).

`deatch.exe` is launched with `--browser-host` (it routes to host mode before
Tauri init). The host forwards NDJSON lines to the running GUI over a local
socket (`\\.\pipe\deatch-bridge` on Windows). The bridge is fully bidirectional
— extension → GUI for state, GUI → extension for commands.

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

## Loading in Chrome / Edge

Not yet wired up. To support it, swap `background.scripts` for `service_worker`
in `manifest.json`, drop `browser_specific_settings`, and add a Chrome-style
native messaging manifest path in `src-tauri/src/watch/bridge.rs`.

## Packaging for distribution

```pwsh
# From the extension/ folder:
Compress-Archive -Path manifest.json,channel.js,background.js,icons -DestinationPath deatch.zip -Force
```

Submit `deatch.zip` to [addons.mozilla.org](https://addons.mozilla.org) for
signing.
