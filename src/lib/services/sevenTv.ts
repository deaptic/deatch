import { seventvGetChannelEmotes } from "../api/external/seventv.ts";
import {
  seventvSubscribeEmoteSet,
  seventvUnsubscribeEmoteSet,
} from "../api/external/seventv_events.ts";
import * as emoteSetUpdate from "./emoteSetUpdate.ts";
import { setSevenTvChannel } from "../stores/emotes.ts";
import { appendItem } from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import type { EmoteEntry, EmoteSetUpdated } from "../types/index.ts";

type Entry = { broadcasterId: string; setId: string; emotes: EmoteEntry[] };

/// Each wanted channel's latest request; a lookup that lands after its
/// channel was left, or re-requested, is dropped.
const requests = new Map<string, symbol>();
const byBroadcaster = new Map<string, Entry>();
const bySetId = new Map<string, Entry>();
let activeChannelId: string | null = null;

export async function subscribe(broadcasterId: string): Promise<void> {
  if (requests.has(broadcasterId)) return;
  const request = Symbol(broadcasterId);
  requests.set(broadcasterId, request);
  const channel = await seventvGetChannelEmotes(
    { channelId: broadcasterId },
    {
      silent: true,
    },
  ).catch(() => null);
  if (requests.get(broadcasterId) !== request || !channel?.emote_set_id) return;
  const entry: Entry = {
    broadcasterId,
    setId: channel.emote_set_id,
    emotes: channel.emotes,
  };
  byBroadcaster.set(broadcasterId, entry);
  bySetId.set(entry.setId, entry);
  pushIfActive(entry);
  seventvSubscribeEmoteSet({ emoteSetId: entry.setId }, { silent: true }).catch(
    () => {},
  );
}

export function unsubscribe(broadcasterId: string): void {
  requests.delete(broadcasterId);
  const entry = byBroadcaster.get(broadcasterId);
  if (!entry) return;
  byBroadcaster.delete(broadcasterId);
  bySetId.delete(entry.setId);
  if (broadcasterId === activeChannelId) setSevenTvChannel([]);
  seventvUnsubscribeEmoteSet(
    { emoteSetId: entry.setId },
    {
      silent: true,
    },
  ).catch(() => {});
}

export function setActive(broadcasterId: string | null): void {
  activeChannelId = broadcasterId;
  setSevenTvChannel(
    broadcasterId ? (byBroadcaster.get(broadcasterId)?.emotes ?? []) : [],
  );
}

export function applyUpdate(update: EmoteSetUpdated): void {
  const entry = bySetId.get(update.id);
  if (!entry) return;
  entry.emotes = emoteSetUpdate.apply(entry.emotes, update);
  pushIfActive(entry);
  announce(entry.broadcasterId, update);
}

function pushIfActive(entry: Entry): void {
  if (entry.broadcasterId === activeChannelId) setSevenTvChannel(entry.emotes);
}

function announce(channelId: string, update: EmoteSetUpdated): void {
  const actor = emoteSetUpdate.actor(update);
  const timestamp = Date.now();
  for (const message of emoteSetUpdate.describe(update)) {
    appendItem(
      channelId,
      feedEvent("seventv_update", message, timestamp, { chatter_name: actor }),
    );
  }
}
