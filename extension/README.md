# Deatch Link

Bridges the [Deatch desktop app](https://github.com/Deaptic/deatch) with your
browser's open Twitch tabs — so its **Link** view can follow what you're
watching, you can mute background streams from inside Deatch without
alt-tabbing, and an optional compressor and per-channel volume can even out how
loud each stream plays.

## How it works

The extension keeps a small state machine of your open Twitch tabs (which
channels, which is focused, which are muted) and forwards it to the Deatch
desktop app over
[native messaging](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging)
— no network, no localhost server, no firewall prompts.

Deatch can also send commands back: toggle mute on a tab, set the compressor and
each channel's volume, or pull a fresh state dump when the app starts.

## Permissions

| Permission          | Why                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `nativeMessaging`   | Talk to the Deatch desktop app over a local pipe.                                                                 |
| `storage`           | Keep the compressor and channel volume settings for your Twitch tabs.                                             |
| Access to twitch.tv | See which Twitch channels your tabs show, and route the player's audio through the compressor and channel volume. |

The extension does **not** read chat, change what pages show, send data to any
third party, or talk to the network. On twitch.tv it only processes the player's
audio, and only while you have the compressor or a channel volume turned on in
Deatch. The only data it transmits is your open channel slugs and per-tab mute
state, and only to the locally installed Deatch desktop app.

## Requirements

You need the [Deatch desktop app](https://github.com/Deaptic/deatch) installed
and run at least once. Deatch self-registers as a native messaging host on first
launch.

## Development

See [docs/LINK.md](../docs/LINK.md) for the message protocol, dev-host
registration, and how to load this extension as a temporary add-on.
