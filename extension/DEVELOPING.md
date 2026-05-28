# Developing Deatch Link

## Architecture

```
Twitch tab           Extension                   Native host process
  URL change ──► content.js                       ┌──────────────────┐
                    │                             │ stdin ⇄ stdout   │
                    └─► background.js ◄─────────► │ (4-byte LE       │
                          state machine:          │  length prefix)  │
                          tabs + current,         │                  │
                          mute, reconnect         │ bidirectional    │
                          w/ backoff              │ pipe to running  │
                                                  │ Deatch GUI       │
                                                  └──────────────────┘
```

`deatch.exe` is launched with `--browser-host` (it routes to host mode
before Tauri init). The host forwards NDJSON lines to the running GUI over
a local socket (`\\.\pipe\deatch-bridge` on Windows). The bridge is fully
bidirectional — extension → GUI for state, GUI → extension for commands.

## Message protocol

JSON, length-prefixed (4-byte little-endian) per the
[native messaging spec](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging).

### Extension → host

| Message | When |
|---|---|
| `{ "type": "state", "channels": [{"login": "<slug>", "muted": <bool>}, ...], "current": "<slug>" \| null }` | On any state change: tab open/close/url, focus change, mute change. Deduped by content. |

`current` resolves to: focused Twitch tab → last-focused Twitch tab → `null`.

### Host → extension

| Message | Effect |
|---|---|
| `{ "type": "get_state" }` | Force re-emit of current `state`. Auto-sent by host on every (re)connect to GUI. |
| `{ "type": "set_muted", "channel": "<slug>", "muted": <bool> }` | Apply mute/unmute via `chrome.tabs.update` to every tab on that channel. |

## Loading as a temporary add-on (Firefox)

1. Build and run Deatch at least once so it self-registers the native host:
   ```pwsh
   cd D:\deatch\src-tauri
   cargo run
   ```
   This writes `%LOCALAPPDATA%\Deatch\deatch-host.json` and the registry key
   under `HKCU\Software\Mozilla\NativeMessagingHosts\com.deaptic.deatch`.

2. In Firefox: `about:debugging#/runtime/this-firefox`.

3. **Load Temporary Add-on…** → pick `D:\deatch\extension\manifest.json`.

4. Click **Inspect** next to "Deatch Link" to open the background console.

## Debug logging

`background.js` and `content.js` each have `const DEBUG = false;` at the
top. Flip to `true` and reload to see `[deatch]` lines.

Host-side log (all in/out frames):

```pwsh
Get-Content $env:TEMP\deatch-host.log -Wait -Tail 20
```

## Loading in Chrome / Edge

Not yet wired up. To support it, swap `background.scripts` for
`service_worker` in `manifest.json`, drop `browser_specific_settings`, and
add a Chrome-style native messaging manifest path in
`src-tauri/src/bridge.rs`.

## Packaging for distribution

```pwsh
# From the extension/ folder:
Compress-Archive -Path manifest.json,background.js,content.js,icons -DestinationPath deatch.zip -Force
```

Submit `deatch.zip` to [addons.mozilla.org](https://addons.mozilla.org) for
signing.
