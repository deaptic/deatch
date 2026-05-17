# Developing Deatch Link

## Architecture

```
Twitch tab           Extension                   Native host process
  URL change ──► content.js                       ┌──────────────────┐
                    │                             │ reads JSON from  │
                    └─► background.js ────────────► stdin (4-byte    │
                          (focused-tab            │ length prefix)   │
                           tracking)              │                  │
                                                  │ forwards to      │
                                                  │ running Deatch   │
                                                  │ via local pipe   │
                                                  └──────────────────┘
```

The "native host process" is `deatch.exe` itself, launched with `--browser-host`
mode (Deatch detects argv on startup and short-circuits to host mode before
Tauri init). The host process forwards each JSON line to the running Deatch
GUI via a local socket (`\\.\pipe\deatch-bridge` on Windows).

## Message protocol

JSON, length-prefixed (4-byte little-endian) per the
[native messaging spec](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging).

| Direction | Message | When |
|---|---|---|
| → host | `{ "type": "hello", "client": "deatch-ext", "version": "x.y.z" }` | On connect. |
| → host | `{ "type": "channel_switched", "channel": "<slug>", "ts": <unix-ms> }` | Focused Twitch tab's channel changed. |
| → host | `{ "type": "sync", "channels": ["<slug>", ...] }` | Set of open Twitch tabs changed. Deduped against last sent set in `background.js`. |

The extension only emits `channel_switched` when the focused tab is a Twitch
channel page. Non-channel paths (`/directory`, `/settings`, `/popout`, etc.)
are filtered in `content.js`.

## Loading as a temporary add-on (Firefox)

1. Build and run Deatch at least once so it self-registers the native host:
   ```pwsh
   cd D:\deatch\src-tauri
   cargo run
   ```
   (Or `deno task tauri dev` from the repo root.) This writes
   `%LOCALAPPDATA%\Deatch\deatch-host.json` and the registry key under
   `HKCU\Software\Mozilla\NativeMessagingHosts\com.deaptic.deatch`.

2. In Firefox, paste this in the address bar:
   ```
   about:debugging#/runtime/this-firefox
   ```

3. Click **Load Temporary Add-on…** → pick `D:\deatch\extension\manifest.json`.

4. Click **Inspect** next to "Deatch Link" to open the background script's console.

## Debug logging

`background.js` and `content.js` each have a `const DEBUG = false;` at the
top. Flip to `true` and reload the add-on to see all `[deatch]` log lines in
the background console.

The host process logs every received message to `%TEMP%\deatch-host.log`:

```pwsh
Get-Content $env:TEMP\deatch-host.log -Wait -Tail 20
```

## Loading in Chrome / Edge

Not yet wired up. To support it, swap `background.scripts` for
`service_worker` in `manifest.json`, drop the `browser_specific_settings`
block, and add a Chrome-style native messaging manifest path in
`src-tauri/src/bridge.rs`.

## Packaging for distribution

```pwsh
# From the extension/ folder:
Compress-Archive -Path manifest.json,background.js,content.js,icons -DestinationPath deatch.zip -Force
```

Then submit `deatch.zip` to [addons.mozilla.org](https://addons.mozilla.org)
for signing + listing. Mozilla's automated signing produces an `.xpi` you can
self-host if you choose "Unlisted" instead of "Listed."
