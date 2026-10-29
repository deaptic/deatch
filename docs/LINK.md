# Link

Link is a browser extension that tells the app which Twitch tabs are open, and
lets the app mute, focus, or close them and process their audio.

## How it works

`extension/background.js` watches tab and focus events and talks to a native
host over stdio. Twitch is an SPA, but `tabs.onUpdated` still fires on in-page
navigation, so tracking tabs needs no content script. The one content script,
`extension/compressor.js`, runs on twitch.tv only to route the player's audio
through the compressor and the channel's volume, and leaves it untouched while
neither is in use. Each browser launches its own copy of the app exe as the host
(`main.rs` routes it to host mode), and every host forwards lines to the running
GUI over the `\\.\pipe\deatch-bridge` pipe. The GUI (`link/ipc.rs`) merges all
browsers into one state: channels are the union, a channel is muted only if it
is muted everywhere, and the browser that reported last decides the current
channel. Commands fan out to every browser.

One codebase serves Firefox and Chromium. `manifest.json` lists `background.js`
as both an event page and a service worker, and each browser ignores the other's
keys. The `key` in the manifest pins the Chrome id, which `bridge.rs`
whitelists, so the two must agree.

## Protocol

Messages are JSON with a 4-byte little-endian length prefix, per the native
messaging spec. The extension sends one message, `state`, on any tab, focus, or
mute change:

```json
{
  "type": "state",
  "channels": [{ "login": "slug", "muted": false }],
  "current": "slug",
  "audio": true
}
```

`current` is the active Twitch tab, else the most recently used one, else
`null`. `audio` says the extension handles `set_audio`; older ones leave it out,
and the app hides its audio controls. The host sends `get_state` to ask for a
fresh state (it does so on every reconnect to the GUI), `set_muted` with
`channel` and `muted` to mute every tab on a channel, `focus` with `channel` to
activate its most recent tab without raising the window, and `close` with
`channel` to close all of its tabs.

`set_audio` carries `enabled` for the compressor, `compressor` with its
`threshold` and `gain` in dB, `ratio` as N:1, and `attack` and `release` in
milliseconds, and `gains`, a gain factor per channel login (1 is unchanged, 2
the most). The background script stores it, and each Twitch tab's content script
picks it up from there. Audio settings outlive connections, so the GUI keeps the
last one and sends it to every browser as it connects.

## Developing

Host changes need a release build, because debug builds never register
themselves (Firefox would hold `target\debug\deatch.exe` open and block
relinking):

```powershell
pnpm tauri build --no-bundle
```

Then run `release\deatch.exe` from the Cargo target directory (`src-tauri\target`
unless redirected). A plain `cargo build --release` would load the dev server
URL and show a blank window. Running it writes the host manifests to `%LOCALAPPDATA%\Deatch\` and the `HKCU`
registry keys for Firefox, Chrome, and Edge. Whichever release build ran last
owns the host path. Reload the extension afterwards so the browser spawns a
fresh host.

In Firefox, open `about:debugging#/runtime/this-firefox`, load
`extension/manifest.json` as a temporary add-on, and use Inspect for the
console. In Chrome or Edge, open `chrome://extensions`, enable developer mode,
load `extension/` unpacked, and check that the id matches `CHROME_EXTENSION_ID`
in `link/bridge.rs`.

Every host logs its frames to `%TEMP%\deatch-host.log`, each line tagged with
its process id so browsers can be told apart
(`Get-Content $env:TEMP\deatch-host.log -Wait -Tail 20`). It retries the GUI
pipe every 1.5 s and exits only when the browser closes stdin.

Releasing is in [RELEASING.md](./RELEASING.md#extension).
