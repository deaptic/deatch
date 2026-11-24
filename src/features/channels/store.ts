import { createEffect, createRoot } from "solid-js";
import type { Focus } from "../../shared/types/index.ts";
import { setEventsubChannels } from "../../platform/twitch/eventsub.ts";
import { lastChannel, selectedChannel } from "../navigation/index.ts";
import { pinnedChannels } from "../preferences/index.ts";
import { user } from "../users/index.ts";
import { followedLive } from "./streams.ts";
import * as link from "../link/index.ts";
import { channelFocus, diffFocus } from "./model.ts";
import * as info from "./info.ts";
import * as livePolling from "./livePolling.ts";
import { type ChannelHooks, createHooks } from "./hooks.ts";

const hooks = createHooks();
let joined = new Map<string, Focus>();

export function isBackground(broadcasterId: string): boolean {
  return joined.get(broadcasterId) === "background";
}

export function onChannel(channelHooks: ChannelHooks): () => void {
  return hooks.add(channelHooks, joined.keys());
}

function syncEventsub() {
  const channels = [...joined].map(([broadcasterId, focus]) => ({
    broadcasterId,
    focus,
  }));
  setEventsubChannels({ channels }, { silent: true }).catch(() => {});
}

export function start(): () => void {
  const stopPolling = livePolling.start();
  const stopInfo = onChannel({ leave: info.forget });
  const stopJoining = createRoot((dispose) => {
    createEffect(() => {
      const u = user();
      if (!u) return;
      const live = followedLive();
      if (live === null) return;
      const next = channelFocus({
        ownId: u.id,
        pinnedIds: pinnedChannels(),
        tabIds: link.tabs().map((ch) => ch.id),
        selectedId: (selectedChannel() ?? lastChannel())?.id,
        liveIds: live.map((ch) => ch.id),
      });
      const diff = diffFocus(joined, next);
      joined = next;
      for (const id of diff.added) hooks.run("join", id);
      for (const id of diff.promoted) hooks.run("focus", id);
      for (const id of diff.removed) hooks.run("leave", id);
      if (diff.changed) syncEventsub();
    });
    return dispose;
  });
  return () => {
    stopJoining();
    stopInfo();
    stopPolling();
  };
}

export function leaveAll() {
  for (const id of joined.keys()) hooks.run("leave", id);
  joined = new Map();
  syncEventsub();
}
