# Deatch Link

Tells the [Deatch desktop app](https://github.com/Deaptic/deatch) which Twitch
channel you're currently watching, so its **Watch** tab can follow along while
your other pinned channels stay where they are.

## How it works

The extension watches your focused tab. When it's on a Twitch channel page
(e.g. `twitch.tv/xqc`), the channel name is forwarded to the Deatch app via
[native messaging](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Native_messaging)
— no network, no localhost server, no firewall prompts.

The full list of your open Twitch tabs is also reported so Deatch can pre-join
those channels in the background; switching between them is instant.

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Detect which Twitch tab is focused, react to tabs closing. |
| `nativeMessaging` | Talk to the Deatch desktop app over a local pipe. |
| `twitch.tv` host access | Inject a small content script that reads the current channel slug from the URL. |

The extension does **not** read chat, modify pages, send data to any third
party, or talk to the network. The only thing it transmits is the channel
slug (e.g. `"xqc"`) and the list of open Twitch tabs, and only to the locally
installed Deatch desktop app.

## Requirements

You need the [Deatch desktop app](https://github.com/Deaptic/deatch) installed
and run at least once. Deatch self-registers as a native messaging host on
first launch.

## Development

See [DEVELOPING.md](./DEVELOPING.md) for the message protocol, dev-host
registration, and how to load this extension as a temporary add-on.
