import { createEffect, on, onCleanup } from "solid-js";
import { selectedChannel } from "../stores/view.ts";
import { clearChatters } from "../stores/users.ts";
import * as channels from "../../features/channels/index.ts";
import * as channelInfo from "../services/channelInfo.ts";
import { dropFeed, ensureFeed, snapshotDivider } from "../stores/feeds.ts";

export function createChannelHooks(): void {
  const stops = [
    channels.onChannel({
      join: ensureFeed,
      leave: (id) => {
        dropFeed(id);
      },
    }),
    channels.onChannel({
      leave: (id) => {
        clearChatters(id);
        channelInfo.forget(id);
      },
    }),
  ];
  onCleanup(() => {
    for (const stop of stops) stop();
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
}
