import { createEffect, createSignal, on } from "solid-js";
import type { Focus, User } from "../types/index.ts";
import { channelFocus, diffFocus } from "../utils/channelFocus.ts";
import { selectedChannel } from "../stores/view.ts";
import { pinnedChannels } from "../stores/preferences.ts";
import { clearChatters, user } from "../stores/users.ts";
import { watchWarmedChannels } from "../stores/watch.ts";
import { setEventsubChannels } from "../api/twitch/eventsub.ts";
import * as sevenTv from "../services/sevenTv.ts";
import * as chatActivity from "../services/chatActivity.ts";
import * as chatSettings from "../services/chatSettings.ts";
import * as cheermotes from "../services/cheermotes.ts";
import { clearChatSettings } from "../stores/chatSettings.ts";
import { clearCheermotes } from "../stores/cheermotes.ts";
import { dropFeed, ensureFeed, snapshotDivider } from "../stores/feeds.ts";

export type ChannelSubscriptions = {
  setLiveStreams: (streams: User[]) => void;
  setLiveLoaded: (loaded: boolean) => void;
  leaveAll(): void;
};

export function createChannelSubscriptions(): ChannelSubscriptions {
  const [liveStreams, setLiveStreams] = createSignal<User[]>([]);
  const [liveLoaded, setLiveLoaded] = createSignal(false);
  let joined = new Map<string, Focus>();

  function syncEventsub() {
    const channels = [...joined].map(([broadcasterId, focus]) => ({
      broadcasterId,
      focus,
    }));
    void setEventsubChannels({ channels }, { silent: true }).catch((e) =>
      console.warn("eventsub channel update failed", e)
    );
  }

  function leaveChannel(broadcasterId: string) {
    void sevenTv.unsubscribe(broadcasterId);
    dropFeed(broadcasterId);
    clearChatters(broadcasterId);
    clearChatSettings(broadcasterId);
    clearCheermotes(broadcasterId);
    chatActivity.clear(broadcasterId);
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
    if (!liveLoaded()) return;
    const next = channelFocus({
      ownId: u.id,
      pinnedIds: pinnedChannels(),
      warmedIds: watchWarmedChannels().map((ch) => ch.id),
      selectedId: selectedChannel()?.id,
      liveIds: liveStreams().map((ch) => ch.id),
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

  return { setLiveStreams, setLiveLoaded, leaveAll };
}
