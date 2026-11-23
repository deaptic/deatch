import { createStore, produce } from "solid-js/store";
import type { BadgeMap, FeedEntry } from "../../../shared/types/index.ts";
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

export function takeUnlogged(): Map<string, FeedEntry[]> {
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

export function updateFeed(
  broadcasterId: string,
  change: (feed: ChannelFeed) => void,
): boolean {
  if (!feeds[broadcasterId]) return false;
  setFeeds(
    broadcasterId,
    produce((feed) => {
      if (feed) change(feed);
    }),
  );
  return true;
}

export function isSilent(item: FeedEntry): boolean {
  return item.kind === "event" && item.silent === true;
}

export function lastVisible(feed: ChannelFeed): FeedEntry | undefined {
  return feed.messages.findLast((item) => !isSilent(item));
}

export function ensureFeed(broadcasterId: string) {
  if (!feeds[broadcasterId]) setFeeds(broadcasterId, emptyFeed());
}
