import { events } from "../bindings.ts";
import { seventvGetChannelEmotes } from "../api/external/seventv.ts";
import {
  seventvSubscribeEmoteSet,
  seventvUnsubscribeEmoteSet,
} from "../api/external/seventv_events.ts";
import * as emoteSetUpdate from "./emoteSetUpdate.ts";
import { setSevenTvChannel } from "../stores/emotes.ts";
import { appendItem } from "../stores/feeds.ts";
import type { EmoteEntry, EmoteSetUpdated } from "../types/index.ts";
import type { FeedEvent } from "../types/feed.ts";

type Entry = { broadcasterId: string; setId: string; emotes: EmoteEntry[] };

const byBroadcaster = new Map<string, Entry>();
const bySetId = new Map<string, Entry>();
let activeChannelId: string | null = null;

export function start(): () => void {
  const unlisten = events.emoteSetUpdated.listen((e) => onUpdate(e.payload));
  return () => void unlisten.then((stop) => stop());
}

export async function subscribe(broadcasterId: string): Promise<void> {
  if (byBroadcaster.has(broadcasterId)) return;
  const channel = await seventvGetChannelEmotes({ channelId: broadcasterId }, {
    silent: true,
  }).catch(() => null);
  if (!channel?.emote_set_id) return;
  const entry: Entry = {
    broadcasterId,
    setId: channel.emote_set_id,
    emotes: channel.emotes,
  };
  byBroadcaster.set(broadcasterId, entry);
  bySetId.set(entry.setId, entry);
  pushIfActive(entry);
  void seventvSubscribeEmoteSet({ emoteSetId: entry.setId }, { silent: true })
    .catch(() => {});
}

export function unsubscribe(broadcasterId: string): void {
  const entry = byBroadcaster.get(broadcasterId);
  if (!entry) return;
  byBroadcaster.delete(broadcasterId);
  bySetId.delete(entry.setId);
  if (broadcasterId === activeChannelId) setSevenTvChannel([]);
  void seventvUnsubscribeEmoteSet({ emoteSetId: entry.setId }, {
    silent: true,
  }).catch(() => {});
}

export function setActive(broadcasterId: string | null): void {
  activeChannelId = broadcasterId;
  setSevenTvChannel(
    broadcasterId ? byBroadcaster.get(broadcasterId)?.emotes ?? [] : [],
  );
}

function onUpdate(update: EmoteSetUpdated): void {
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
    appendItem(channelId, feedEvent(timestamp, actor, message));
  }
}

function feedEvent(
  timestamp: number,
  actor: string,
  message: string,
): FeedEvent {
  return {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: "seventv_update",
    system_message: message,
    chatter_name: actor,
    color: "",
    timestamp,
  };
}
