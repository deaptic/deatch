import { createEffect, createRoot, on } from "solid-js";
import { selectedChannel } from "../navigation/index.ts";
import * as channels from "../channels/index.ts";
import * as channelPoints from "./channelPoints.ts";
import * as channel from "./events/channel.ts";
import * as chat from "./events/chat.ts";
import * as engagement from "./events/engagement.ts";
import * as hypeTrain from "./events/hypeTrain.ts";
import * as moderation from "./events/moderation.ts";
import * as notifications from "./events/notifications.ts";
import * as feedLog from "./history/feedLog.ts";
import { dropFeed, ensureFeed, snapshotDivider } from "./store/index.ts";

function markDividerOnLeave(): () => void {
  return createRoot((dispose) => {
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
    markDividerOnLeave(),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
