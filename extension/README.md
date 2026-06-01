# Deatch Link

Bridges the [Deatch desktop app](https://github.com/Deaptic/deatch) with your
browser's open Twitch tabs — so its **Watch** view can follow what you're
watching, and you can mute background streams from inside Deatch without
alt-tabbing.

## How it works

The extension keeps a small state machine of your open Twitch tabs (which
channels, which is focused, which are muted) and forwards it to the Deatch
desktop app over
[native messaging](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging)
— no network, no localhost server, no firewall prompts.

Deatch can also send commands back: toggle mute on a tab, or pull a fresh state
dump when the app starts.

## Permissions

| Permission              | Why                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `tabs`                  | Detect which Twitch tab is focused, react to tabs closing, mute/unmute on request. |
| `nativeMessaging`       | Talk to the Deatch desktop app over a local pipe.                                  |
| `twitch.tv` host access | Inject a small content script that reads the current channel slug from the URL.    |

The extension does **not** read chat, modify pages, send data to any third
party, or talk to the network. The only data it transmits is your open channel
slugs and per-tab mute state, and only to the locally installed Deatch desktop
app.

## Requirements

You need the [Deatch desktop app](https://github.com/Deaptic/deatch) installed
and run at least once. Deatch self-registers as a native messaging host on first
launch.

## Development

See [DEVELOPING.md](./DEVELOPING.md) for the message protocol, dev-host
registration, and how to load this extension as a temporary add-on.
