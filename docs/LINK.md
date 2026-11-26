# Link

Link is a browser extension that tells the app which Twitch tabs are open and
lets the app mute, focus or close them and set their volume. The extension owns
its own settings (compressor, channel volumes, bonus points and drops claiming).
The toolbar popup holds the compressor and claiming switches; a channel's volume
is set on its Twitch player bar or from the app.

## How it works

The extension is written in TypeScript in `extension/src/`, grouped by feature,
and bundled by Vite (`scripts/extension-bundle.ts`) into `extension/build/`,
which is what the browser loads. Each entry becomes one self-contained script
(`background.js`, `content.js`, `page.js`):

- `background.ts` wires the background: it keeps the tab registry, talks to the
  app, and runs the app's commands.
- `content.ts` runs in the isolated world on twitch.tv and starts the audio
  features and the rewards bridge.
- `page.ts` runs in the page itself, where Twitch's React tree and GraphQL
  client live, and starts the rewards page script.
- `popup/` is the toolbar settings menu, and `public/` holds the manifest and
  icons, copied as they are.

The features:

- `tabs/`: `registry.ts` tracks which tab shows which channel, which is muted
  and which was focused last; `watch.ts` feeds it from tab and window events
  (Twitch is an SPA, but `tabs.onUpdated` still fires on in-page navigation, so
  tracking tabs needs no content script); `actions.ts` mutes, focuses and closes
  a channel's tabs.
- `link/`: `host.ts` keeps the native messaging connection to the app,
  reconnecting with backoff; `state.ts` builds the state the app sees and skips
  unchanged ones; `commands.ts` checks incoming commands before they run.
- `audio/`: `settings.ts` reads the stored compressor and channel volumes,
  `store.ts` loads and saves them, `sync.ts` hands the settings that apply to
  the page, `compressor.ts` routes the player's audio through them from the
  page itself (and leaves it untouched while neither is in use), and
  `player.ts` adds a compressor switch and volume slider to the player bar. The
  audio chain lives on the page's `window`, so after an extension reload the
  new page script adopts it instead of building a second one; a video's sound
  can be routed into an audio chain only once.
- `rewards/`: `page/` is the in-page side. It finds Twitch's channel points
  data, the bonus chest and the GraphQL client in the React tree (`finder.ts`, with Twitch's shapes in `twitch.ts`; `channel.ts` looks up a
  channel's id when it has no points data), reports balance and custom rewards (`snapshot.ts`), claims the
  bonus after a short random delay while auto-claim is on (`bonus.ts`), redeems
  rewards through Twitch's own client the way FrankerFaceZ sends its requests
  (`redeem.ts`, `graphql.ts`), and while drop claiming is on claims finished
  drops once when the page loads and again whenever Twitch says a drop was
  earned (`drops.ts`). `bridge.ts` relays between the page and the background,
  over the page attributes and events named in `shared/protocol.ts`. `read.ts` checks
  what the page reports (shapes in `types.ts`; pictures only from Twitch's image
  host), and `relay.ts` sends claim and redeem requests to tabs.
- `stats/`: `page.ts` reads Twitch's player stats (latency, buffer, video
  size, frame rate, bitrate, dropped frames, playback speed) in the page,
  once a second while the video plays (it follows the video's `timeupdate`
  events, so a paused player costs nothing), `player-stats.ts` checks and formats
  them, and `readout.ts` shows them as a row of icon
  and value items next to Twitch's uptime (dropped frames only when there are
  some, the catch-up speed only while the player speeds up). `shared/theme.ts`
  holds the Deatch accent these injected styles share.
- `shared/`: `channel.ts` decides which Twitch paths are channel pages,
  `react.ts` walks Twitch's React tree, `protocol.ts` names the page attributes
  and events the page and the extension share,
  `storage.ts` reads and watches settings (each on/off switch with its own
  default), `record.ts` narrows untyped data
  (storage, messages, Twitch's objects), `messages.ts` types the messages
  between the extension's parts, and `log.ts` is the one logging path.

Modules export functions and start nothing on import; the entries call
`start…()`. Pure logic has a `*.test.ts` next to it.

Reloading the extension does not end the scripts already running in open tabs:
the old copies keep going next to the new ones. So `content.ts` and `page.ts`
each claim a `Life` (`shared/life.ts`) and hand it to every feature, which
watches the page only through `life.observe` and listens only through
`life.listen`. When a newer copy claims the page, the older one's watchers and
listeners go quiet. The linter rejects a raw `MutationObserver` or
`addEventListener` anywhere else in `extension/src` (the popup aside).
Whatever a feature leaves behind on the page, such as an element or the audio
chain, needs a fixed id or a fixed slot on `window`, so the new copy replaces
or adopts it instead of adding a second one: a video's sound can be routed
into an audio chain only once, so the compressor adopts the old chain.
`stats/readout.test.ts` starts the stats row twice to prove one row is left.

For development, run `vp run dev:extension`, which rebuilds on every change,
and load `extension/build/` in the browser. Changes to `public/` need a
restart of that command.

Each browser launches its own copy of the app exe as the host
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
messaging spec. The extension sends `state` on any tab, focus, mute or page
change:

```json
{
  "type": "state",
  "channels": [{ "login": "slug", "muted": false }],
  "current": "slug",
  "audio": true,
  "gains": { "slug": 1.5 },
  "compressorOn": false,
  "balances": { "slug": 2630 },
  "bonusReady": ["slug"],
  "subscribed": { "slug": true },
  "rewards": {
    "slug": [{ "id": "…", "title": "…", "cost": 1000, "status": "available" }]
  },
  "drops": {
    "slug": {
      "game": "…",
      "watched": 21,
      "required": 60,
      "reward": "…",
      "image": "…"
    }
  },
  "earnedAt": { "24138907": "2026-11-26T19:13:04Z" }
}
```

- `channels` and `current`: the open Twitch channels and whether each is muted
  (only when all of its tabs are); `current` is the active Twitch tab, else the
  most recently used one, else `null`.
- `audio`: this extension can control tab audio. An older name kept for
  released apps; it is always `true` from current extensions.
- `gains`: the volume factor per channel login (1 is unchanged, 2 the most),
  left out while the extension's Gain control is off. Without it the app hides
  its volume control; extensions too old to send it get an update hint.
- `compressorOn`: whether the compressor is on, left out while the extension's
  Audio compressor feature is off, so the app shows its toggle only then.
- `balances`: the channel points balance per open channel that has points.
- `bonusReady`: open channels with a bonus chest waiting; empty while
  auto-claim is on.
- `subscribed`: per open channel whether you are subscribed, left out while
  unknown.
- `rewards`: each open channel's enabled custom rewards with their prompt,
  colour, image (only from Twitch's image host), `status` (`available`,
  `paused` or `sold_out`), cooldown, `perUserLimit` (how many times one viewer
  may redeem it per stream), `redeemedThisStream` (how many times you have, from
  Twitch) and `subOnly`. A reward is blocked once Twitch's count reaches its
  limit; sub-only rewards are blocked only for viewers known not to be
  subscribed.
- `drops`: per open channel, the drop you are earning there: game, minutes
  watched and required, and the reward's name and picture (looked up once per
  drop in your inventory, then kept current by Twitch's `drop-progress`
  messages).
- `earnedAt`: per channel id, the time of the latest watch-time payout
  (`points-earned` with reason `WATCH`); the app shows a channel as earning for
  six minutes after one, since Twitch pays every five.

The app sends:

- `get_state`: send a fresh `state` (the host asks on every reconnect to the
  app, and the app also replays the last state it kept when its window starts).
- `set_muted` with `channel` and `muted`: mute or unmute every tab of a channel.
- `focus` with `channel`: activate its most recent tab without raising the
  window.
- `close` with `channel`: close all of its tabs.
- `set_gain` with `channel` and `gain`: set one channel's volume factor; the
  extension stores it and reports it back in `state`.
- `set_compressor` with `on`: switch the compressor on or off.
- `claim_bonus` with `channel`: claim the waiting bonus chest in its tabs.
- `redeem` with `channel`, `reward`, `cost`, `text` and `request`: redeem a
  custom reward in the channel's most recent tab, refused with `COST_CHANGED`
  when the price no longer matches what the app showed. Answered with
  `{ "type": "redeemed", "request", "error" }`.
- `claim_drops` with `channel` and `request`: claim every finished drop through
  the channel's most recent tab. Answered with
  `{ "type": "drops_claimed", "request", "error" }`.
- `set_audio` with `gains` (released apps only): the extension takes the gains
  and ignores the rest, so an old app cannot overwrite settings it owns.

`error` is `null` on success, else Twitch's error code. The app receives both
answers as one `LinkAnswer` event and matches them by `request`.

### Keeping versions compatible

The extension and the app update separately, so any extension must work with
any app. When changing the protocol:

- Only add. A new `state` field is optional and an older app ignores it; a new
  command must be safe for an older extension to ignore, and the app shows the
  matching control only once the extension reports the data for it.
- Never rename or remove a field, message or command that has been released,
  and never change what one means. Give the new meaning a new name.
- A new value in a fixed set (like a reward `status`) needs tolerant reading on
  the other side first. The app skips a reward whose `status` it does not know
  instead of rejecting the whole `state`.
- An unknown message is logged and dropped; it never closes the connection.

## Developing

Host changes need a release build, because debug builds never register
themselves (Firefox would hold `target\debug\deatch.exe` open and block
relinking):

```powershell
vp exec tauri build --no-bundle
```

Then run `release\deatch.exe` from the Cargo target directory (`src-tauri\target`
unless redirected). A plain `cargo build --release` would load the dev server
URL and show a blank window. Running it writes the host manifests to `%LOCALAPPDATA%\Deatch\` and the `HKCU`
registry keys for Firefox, Chrome, and Edge. Whichever release build ran last
owns the host path. Reload the extension afterwards so the browser spawns a
fresh host.

In Firefox, open `about:debugging#/runtime/this-firefox`, load
`extension/build/manifest.json` as a temporary add-on, and use Inspect for the
console. Firefox does not grant MV3 add-ons site access on install, and
without it the extension sees no tabs and its scripts do not run on Twitch.
Until twitch.tv is allowed, the toolbar icon shows `!` and clicking it asks for
access instead of opening the popup. In Chrome or Edge, open `chrome://extensions`, enable developer mode,
load `extension/build/` unpacked, and check that the id matches `CHROME_EXTENSION_ID`
in `link/bridge.rs`.

Every host logs its frames to `%TEMP%\deatch-host.log`, each line tagged with
its process id so browsers can be told apart
(`Get-Content $env:TEMP\deatch-host.log -Wait -Tail 20`). It retries the GUI
pipe every 1.5 s and exits only when the browser closes stdin.
