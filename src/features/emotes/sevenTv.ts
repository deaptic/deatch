import { seventvGetChannelEmotes } from "../../platform/emotes/seventv.ts";
import {
  seventvSubscribeEmoteSet,
  seventvUnsubscribeEmoteSet,
} from "../../platform/emotes/seventvEvents.ts";
import * as emoteSetUpdate from "./setUpdate.ts";
import { setSevenTvChannel } from "./store.ts";
import { appendItem, feedEvent } from "../feed/index.ts";
import { SEVENTV_UPDATE } from "../../shared/moderateActions.ts";
import type { EmoteEntry, EmoteSetUpdated } from "../../shared/types/index.ts";

type Entry = { broadcasterId: string; setId: string; emotes: EmoteEntry[] };

const requests = new Map<string, symbol>();
const retries = new Map<string, ReturnType<typeof setTimeout>>();
const RETRY_MS = 60_000;
const byBroadcaster = new Map<string, Entry>();
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
  const shared = usingSet(entry.setId).length > 0;
  byBroadcaster.set(broadcasterId, entry);
  pushIfActive(entry);
  if (shared) return;
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
  if (broadcasterId === activeBroadcasterId) setSevenTvChannel([]);
  if (usingSet(entry.setId).length > 0) return;
  seventvUnsubscribeEmoteSet(
    { emoteSetId: entry.setId },
    {
      silent: true,
    },
  ).catch(() => {});
}

export function emotesOf(broadcasterId: string): EmoteEntry[] {
  return byBroadcaster.get(broadcasterId)?.emotes ?? [];
}

export function setActive(broadcasterId: string | null): void {
  activeBroadcasterId = broadcasterId;
  setSevenTvChannel(
    broadcasterId ? (byBroadcaster.get(broadcasterId)?.emotes ?? []) : [],
  );
}

export function applyUpdate(update: EmoteSetUpdated): void {
  for (const entry of usingSet(update.id)) {
    entry.emotes = emoteSetUpdate.apply(entry.emotes, update);
    pushIfActive(entry);
    announce(entry.broadcasterId, update);
  }
}

function usingSet(setId: string): Entry[] {
  return [...byBroadcaster.values()].filter((e) => e.setId === setId);
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
