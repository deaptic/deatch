import { createEffect, on, onCleanup } from "solid-js";
import { selectedChannel } from "../stores/view.ts";
import { clearChatters } from "../stores/users.ts";
import * as channels from "../../features/channels/index.ts";
import * as sevenTv from "../services/sevenTv.ts";
import * as cheermotes from "../services/cheermotes.ts";
import * as badges from "../services/badges.ts";
import * as emotes from "../services/emotes.ts";
import * as channelInfo from "../services/channelInfo.ts";
import { clearCheermotes } from "../stores/cheermotes.ts";
import { clearDraft } from "../stores/drafts.ts";
import { clearSentMessages } from "../stores/sentMessages.ts";
import { dropFeed, ensureFeed, snapshotDivider } from "../stores/feeds.ts";

export function createChannelHooks(): void {
  const stops = [
    channels.onChannel({
      join: ensureFeed,
      leave: (id) => {
        dropFeed(id);
        clearDraft(id);
        clearSentMessages(id);
      },
    }),
    channels.onChannel({
      join: (id) => void sevenTv.subscribe(id),
      leave: sevenTv.unsubscribe,
    }),
    channels.onChannel({
      join: (id) => void cheermotes.load(id),
      leave: clearCheermotes,
    }),
    channels.onChannel({
      leave: (id) => {
        clearChatters(id);
        badges.forgetChannel(id);
        emotes.forgetChannel(id);
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
