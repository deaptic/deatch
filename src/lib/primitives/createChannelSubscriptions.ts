import { createEffect, createSignal, on } from "solid-js";
import type { User } from "../types/twitch/user.ts";
import { selectedChannel } from "../stores/view.ts";
import { menuChannelPinned } from "../stores/preferences.ts";
import { clearChatters, isModOfChannel, user } from "../stores/users.ts";
import { watchWarmedChannels } from "../stores/watch.ts";
import { eventSubManager } from "../managers/EventSubManager.ts";
import { sevenTvManager } from "../managers/SevenTvManager.ts";
import {
  ALL_KINDS,
  CHAT_KINDS,
  MOD_KINDS,
  OWN_KINDS,
} from "../types/twitch/eventsub.ts";
import { dropFeed, ensureFeed, snapshotDivider } from "../stores/feeds.ts";

export type ChannelSubscriptions = {
  setLiveStreams: (streams: User[]) => void;
  setLiveLoaded: (loaded: boolean) => void;
  leaveAll(): void;
};

export function createChannelSubscriptions(): ChannelSubscriptions {
  const [liveStreams, setLiveStreams] = createSignal<User[]>([]);
  const [liveLoaded, setLiveLoaded] = createSignal(false);
  const joinedIds = new Set<string>();

  function leaveChannel(broadcasterId: string) {
    if (!joinedIds.has(broadcasterId)) return;
    joinedIds.delete(broadcasterId);
    for (const k of ALL_KINDS) {
      void eventSubManager.unsubscribe(broadcasterId, k);
    }
    void sevenTvManager.unsubscribe(broadcasterId);
    dropFeed(broadcasterId);
    clearChatters(broadcasterId);
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
    const desired = new Set<string>();
    desired.add(u.id);
    for (const id of menuChannelPinned()) desired.add(id);
    for (const ch of liveStreams()) desired.add(ch.id);
    for (const ch of watchWarmedChannels()) desired.add(ch.id);
    const sel = selectedChannel();
    if (sel) desired.add(sel.id);

    const newIds: string[] = [];
    for (const id of desired) {
      if (joinedIds.has(id)) continue;
      joinedIds.add(id);
      ensureFeed(id);
      newIds.push(id);
    }
    for (const id of newIds) {
      for (const k of CHAT_KINDS) void eventSubManager.subscribe(id, k);
      if (isModOfChannel(id)) {
        for (const k of MOD_KINDS) void eventSubManager.subscribe(id, k);
      }
      if (id === u.id) {
        for (const k of OWN_KINDS) void eventSubManager.subscribe(id, k);
      }
      void sevenTvManager.subscribe(id);
    }
    for (const id of [...joinedIds]) {
      if (!desired.has(id)) leaveChannel(id);
    }
  });

  function leaveAll() {
    for (const id of [...joinedIds]) leaveChannel(id);
  }

  return { setLiveStreams, setLiveLoaded, leaveAll };
}
