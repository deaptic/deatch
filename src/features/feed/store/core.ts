import { batch } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { BadgeMap, FeedEntry } from "../types.ts";
import { getEntryId } from "./entryId.ts";
import { isLogged } from "../history/feedLogPages.ts";

export type ChannelFeed = {
  messages: FeedEntry[];
  badges: BadgeMap;
  paused: boolean;
  lastSeenEntryId: string | null;
  dividerAtEntryId: string | null;
  backfilled: boolean;
};

export const [feeds, setFeeds] = createStore<
  Record<string, ChannelFeed | undefined>
>({});

const unlogged = new Map<string, Map<string, FeedEntry>>();

export function toLog(broadcasterId: string, entries: Iterable<FeedEntry>) {
  let channel = unlogged.get(broadcasterId);
  for (const entry of entries) {
    if (!isLogged(entry)) continue;
    if (!channel) {
      channel = new Map();
      unlogged.set(broadcasterId, channel);
    }
    channel.set(getEntryId(entry), entry);
  }
}

const REQUEUE_MAX = 2_000;

export function requeueUnlogged(broadcasterId: string, entries: FeedEntry[]) {
  const channel = new Map<string, FeedEntry>();
  for (const entry of entries.slice(-REQUEUE_MAX)) {
    channel.set(getEntryId(entry), entry);
  }
  for (const [id, entry] of unlogged.get(broadcasterId) ?? []) {
    channel.set(id, entry);
  }
  unlogged.set(broadcasterId, channel);
}

export function takeUnlogged(): Map<string, FeedEntry[]> {
  flushQueued();
  const taken = new Map(
    [...unlogged].map(([id, entries]) => [id, [...entries.values()]]),
  );
  unlogged.clear();
  return taken;
}

const emptyFeed = (): ChannelFeed => ({
  messages: [],
  badges: {},
  paused: false,
  lastSeenEntryId: null,
  dividerAtEntryId: null,
  backfilled: false,
});

type Change = (feed: ChannelFeed) => void;

const QUEUE_MS = 16;
const queued = new Map<string, Change[]>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

export function queueUpdate(broadcasterId: string, change: Change) {
  const changes = queued.get(broadcasterId);
  if (changes) changes.push(change);
  else queued.set(broadcasterId, [change]);
  flushTimer ??= setTimeout(flushQueued, QUEUE_MS);
}

export function flushQueued() {
  clearTimeout(flushTimer);
  flushTimer = undefined;
  batch(() => {
    for (const broadcasterId of queued.keys()) {
      updateFeed(broadcasterId, () => {});
    }
  });
}

export function updateFeed(broadcasterId: string, change: Change): boolean {
  const pending = queued.get(broadcasterId) ?? [];
  queued.delete(broadcasterId);
  if (!feeds[broadcasterId]) return false;
  setFeeds(
    broadcasterId,
    produce((feed) => {
      if (!feed) return;
      for (const queuedChange of pending) queuedChange(feed);
      change(feed);
    }),
  );
  return true;
}

export function isSilent(item: FeedEntry): boolean {
  return item.kind === "event" && item.silent === true;
}

export function ensureFeed(broadcasterId: string) {
  if (!feeds[broadcasterId]) setFeeds(broadcasterId, emptyFeed());
}
