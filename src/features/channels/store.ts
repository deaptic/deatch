import { createEffect, createRoot } from "solid-js";
import type { Focus } from "../../lib/types/index.ts";
import { setEventsubChannels } from "../../platform/twitch/eventsub.ts";
import { lastChannel, selectedChannel } from "../../lib/stores/view.ts";
import { pinnedChannels } from "../../lib/stores/preferences.ts";
import { user } from "../../lib/stores/users.ts";
import { followedLive } from "../../lib/stores/channels.ts";
import * as link from "../link/index.ts";
import { channelFocus, diffFocus } from "./model.ts";
import { type ChannelHooks, createHooks } from "./hooks.ts";

const hooks = createHooks();
let joined = new Map<string, Focus>();

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
  return createRoot((dispose) => {
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
}

export function leaveAll() {
  for (const id of joined.keys()) hooks.run("leave", id);
  joined = new Map();
  syncEventsub();
}
