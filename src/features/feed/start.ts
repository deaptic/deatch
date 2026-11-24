import { createEffect, createRoot, on, untrack } from "solid-js";
import { selectedChannel } from "../navigation/index.ts";
import * as channels from "../channels/index.ts";
import * as channelPoints from "./channelPoints.ts";
import * as channel from "./events/channel.ts";
import * as chat from "./events/chat.ts";
import * as engagement from "./events/engagement.ts";
import * as hypeTrain from "./events/hypeTrain.ts";
import * as moderation from "./events/moderation.ts";
import * as notifications from "./events/notifications.ts";
import * as backlog from "./history/backlog.ts";
import * as feedLog from "./history/feedLog.ts";
import { dropFeed, ensureFeed, snapshotDivider } from "./store/index.ts";

function followSelectedChannel(): () => void {
  return createRoot((dispose) => {
    createEffect(() => {
      const channel = selectedChannel();
      if (channel) untrack(() => backlog.load(channel.id, channel.login));
    });
    createEffect(
      on(
        selectedChannel,
        (curr, prev) => {
          if (prev && prev.id !== curr?.id) snapshotDivider(prev.id);
        },
        { defer: true },
      ),
    );
    return dispose;
  });
}

export function start(): () => void {
  const stops = [
    channels.onChannel({ join: ensureFeed, leave: dropFeed }),
    channelPoints.start(),
    channel.start(),
    chat.start(),
    engagement.start(),
    hypeTrain.start(),
    moderation.start(),
    notifications.start(),
    feedLog.start(),
    followSelectedChannel(),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
