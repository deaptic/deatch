import { createEffect, on } from "solid-js";
import type { Focus } from "../types/index.ts";
import { channelFocus, diffFocus } from "../utils/channelFocus.ts";
import { lastChannel, selectedChannel } from "../stores/view.ts";
import { pinnedChannels } from "../stores/preferences.ts";
import { clearChatters, user } from "../stores/users.ts";
import { linkWarmedChannels } from "../stores/link.ts";
import { setEventsubChannels } from "../api/twitch/eventsub.ts";
import * as sevenTv from "../services/sevenTv.ts";
import * as chatActivity from "../services/chatActivity.ts";
import * as chatSettings from "../services/chatSettings.ts";
import * as cheermotes from "../services/cheermotes.ts";
import * as badges from "../services/badges.ts";
import * as emotes from "../services/emotes.ts";
import * as channelInfo from "../services/channelInfo.ts";
import { clearChatSettings } from "../stores/chatSettings.ts";
import { clearCheermotes } from "../stores/cheermotes.ts";
import { clearDraft } from "../stores/drafts.ts";
import { clearSentMessages } from "../stores/sentMessages.ts";
import { followedLive } from "../stores/channels.ts";
import { dropFeed, ensureFeed, snapshotDivider } from "../stores/feeds.ts";

type ChannelSubscriptions = {
  leaveAll: () => void;
};

export function createChannelSubscriptions(): ChannelSubscriptions {
  let joined = new Map<string, Focus>();

  function syncEventsub() {
    const channels = [...joined].map(([broadcasterId, focus]) => ({
      broadcasterId,
      focus,
    }));
    setEventsubChannels({ channels }, { silent: true }).catch(() => {});
  }

  function leaveChannel(broadcasterId: string) {
    sevenTv.unsubscribe(broadcasterId);
    dropFeed(broadcasterId);
    clearChatters(broadcasterId);
    clearChatSettings(broadcasterId);
    clearCheermotes(broadcasterId);
    chatActivity.clear(broadcasterId);
    badges.forgetChannel(broadcasterId);
    emotes.forgetChannelThirdParty(broadcasterId);
    channelInfo.forget(broadcasterId);
    clearDraft(broadcasterId);
    clearSentMessages(broadcasterId);
  }

  createEffect(
    on(
      selectedChannel,
      (curr, prev) => {
        if (prev && prev.id !== curr?.id) snapshotDivider(prev.id);
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    const u = user();
    if (!u) return;
    const live = followedLive();
    if (live === null) return;
    const next = channelFocus({
      ownId: u.id,
      pinnedIds: pinnedChannels(),
      warmedIds: linkWarmedChannels().map((ch) => ch.id),
      selectedId: (selectedChannel() ?? lastChannel())?.id,
      liveIds: live.map((ch) => ch.id),
    });
    const diff = diffFocus(joined, next);
    joined = next;

    for (const id of diff.added) {
      ensureFeed(id);
      void sevenTv.subscribe(id);
      void chatSettings.load(id);
      void cheermotes.load(id);
    }
    for (const id of diff.promoted) void chatSettings.load(id);
    for (const id of diff.removed) leaveChannel(id);
    if (diff.changed) syncEventsub();
  });

  function leaveAll() {
    for (const id of joined.keys()) leaveChannel(id);
    joined = new Map();
    syncEventsub();
  }

  return { leaveAll };
}
