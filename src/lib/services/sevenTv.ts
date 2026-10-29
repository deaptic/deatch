import { seventvGetChannelEmotes } from "../api/external/seventv.ts";
import {
  seventvSubscribeEmoteSet,
  seventvUnsubscribeEmoteSet,
} from "../api/external/seventvEvents.ts";
import * as emoteSetUpdate from "./emoteSetUpdate.ts";
import { setSevenTvChannel } from "../stores/emotes.ts";
import { appendItem } from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { SEVENTV_UPDATE } from "../constants/events.ts";
import type { EmoteEntry, EmoteSetUpdated } from "../types/index.ts";

type Entry = { broadcasterId: string; setId: string; emotes: EmoteEntry[] };

/// Each wanted channel's latest request; a lookup that lands after its
/// channel was left, or re-requested, is dropped.
const requests = new Map<string, symbol>();
const retries = new Map<string, ReturnType<typeof setTimeout>>();
const RETRY_MS = 60_000;
const byBroadcaster = new Map<string, Entry>();
const bySetId = new Map<string, Entry>();
let activeBroadcasterId: string | null = null;

export async function subscribe(broadcasterId: string): Promise<void> {
  if (requests.has(broadcasterId)) return;
  const request = Symbol(broadcasterId);
  requests.set(broadcasterId, request);
  const channel = await seventvGetChannelEmotes(
    { broadcasterId },
    {
      silent: true,
    },
  ).catch(() => undefined);
  if (requests.get(broadcasterId) !== request) return;
  if (channel === undefined) {
    requests.delete(broadcasterId);
    retries.set(
      broadcasterId,
      setTimeout(() => {
        retries.delete(broadcasterId);
        void subscribe(broadcasterId);
      }, RETRY_MS),
    );
    return;
  }
  if (!channel.emoteSetId) return;
  const entry: Entry = {
    broadcasterId,
    setId: channel.emoteSetId,
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
  clearTimeout(retries.get(broadcasterId));
  retries.delete(broadcasterId);
  const entry = byBroadcaster.get(broadcasterId);
  if (!entry) return;
  byBroadcaster.delete(broadcasterId);
  bySetId.delete(entry.setId);
  if (broadcasterId === activeBroadcasterId) setSevenTvChannel([]);
  seventvUnsubscribeEmoteSet(
    { emoteSetId: entry.setId },
    {
      silent: true,
    },
  ).catch(() => {});
}

export function setActive(broadcasterId: string | null): void {
  activeBroadcasterId = broadcasterId;
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
  if (entry.broadcasterId === activeBroadcasterId)
    setSevenTvChannel(entry.emotes);
}

function announce(broadcasterId: string, update: EmoteSetUpdated): void {
  const actor = emoteSetUpdate.actor(update);
  const timestamp = Date.now();
  for (const message of emoteSetUpdate.describe(update)) {
    appendItem(
      broadcasterId,
      feedEvent(SEVENTV_UPDATE, message, timestamp, { chatter_name: actor }),
    );
  }
}
