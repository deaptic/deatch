# Deatch Link

Bridges the [Deatch desktop app](https://github.com/Deaptic/deatch) with your
browser's open Twitch tabs, so its **Link** view can follow what you're
watching and you can mute or set the volume of streams from inside Deatch
without alt-tabbing.

It also has its own settings, in the toolbar menu and on the Twitch player:

- **Audio compressor** evens out how loud each stream plays. Switched on as a
  feature in the toolbar menu, then turned on and off from its player button.
- **Gain control** turns a single channel up or down, up to 200%, from the
  slider on its player or from Deatch.
- **Stream stats** (off by default) show latency, buffer, video quality and
  bitrate next to the stream's uptime.
- **Auto-claim bonus points** claims the channel points bonus chest when it
  appears.
- **Auto-claim drops** claims Twitch Drops you have finished watching for.

## How it works

The extension keeps a small state machine of your open Twitch tabs (which
channels, which is focused, which are muted) and forwards it to the Deatch
desktop app over
[native messaging](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging):
no network, no localhost server, no firewall prompts.

Deatch can send commands back: mute, focus or close a tab, set a channel's
volume, or ask for a fresh state when the app starts.

## Permissions

| Permission          | Why                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `nativeMessaging`   | Talk to the Deatch desktop app over a local pipe.                                                                                  |
| `storage`           | Keep the compressor, channel volume and auto-claim settings.                                                                       |
| Access to twitch.tv | See which Twitch channels your tabs show, process the player's audio, add its controls, claim points and drops, and redeem points. |

The extension does **not** read chat, send data to any third party, or talk to
the network. On twitch.tv it processes the player's audio only while the
compressor or a channel volume is on, adds a compressor switch and volume
slider to the player's control bar, and clicks the bonus points chest only
while auto-claim is on, and claims finished drops only while drop claiming is
on. It spends channel points only when you redeem a reward
in Deatch. The only data it transmits is your open channel names, their mute
state, channel volumes, channel points balances and the channels' custom
rewards, and only to the locally installed Deatch
desktop app.

## Requirements

You need the [Deatch desktop app](https://github.com/Deaptic/deatch) installed
and run at least once. Deatch registers itself as a native messaging host on
first launch.
