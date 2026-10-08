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
reconnect-in-`onDisconnect` design holds there too. The `key` fixes the Chrome
extension id (`dmoblcekdcegdpjbbkhblfnjjefkagpd`), which the host manifest
whitelists; never change it or every install loses the host.

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
2. Confirm the id reads `dmoblcekdcegdpjbbkhblfnjjefkagpd`. Thanks to the
   manifest `key`, unpacked and store installs share it.
3. **Service worker** link on the card opens the background console.

## Releasing

One zip serves both stores:

```pwsh
# From the extension/ folder:
Compress-Archive -Path manifest.json,background.js,icons -DestinationPath deatch-link.zip -Force
```

### Firefox

The add-on is unlisted on AMO: Mozilla signs it, but Firefox gets updates from
the `update_url` in `manifest.json`, which serves `updates.json` from `main`.

1. Bump `version` in `manifest.json` and build the zip.
2. Upload it on the [AMO Developer Hub](https://addons.mozilla.org/developers/)
   as a new version of Deatch Link, distributed **On your own**.
3. Once signed, download the `.xpi` and attach it to the app's current GitHub
   release. Never create a separate release for it: the app updater reads
   `releases/latest`, and a newer extension-only release would break it.
   ```pwsh
   gh release upload v0.4.0 deatch_link-0.3.0.xpi
   ```
4. Add an entry to `updates.json` and push it to `main`:
   ```json
   {
     "version": "0.3.0",
     "update_link": "https://github.com/deaptic/deatch/releases/download/v0.4.0/deatch_link-0.3.0.xpi"
   }
   ```

Firefox checks `update_url` about once a day; `about:addons` → gear → **Check
for Updates** forces it. Copies installed before `update_url` existed (0.1.0)
never check, so they need one manual install of the `.xpi`.

### Chrome / Edge

Chrome on Windows installs extensions only from the Chrome Web Store, so
self-hosting is not an option. Upload the same zip to the
[Web Store developer dashboard](https://chrome.google.com/webstore/devconsole)
as an **unlisted** item; the store keeps the id from the manifest `key` and
pushes updates to installed copies itself. Edge installs from the Chrome Web
Store too. Review takes a few days per version, so the Firefox release may land
first; mixed versions are fine, the host speaks to both.
