import { createStore } from "solid-js/store";
import type { BadgeMap, FeedEntry } from "../../types/index.ts";

export type ChannelFeed = {
  messages: FeedEntry[];
  badges: BadgeMap;
  paused: boolean;
  lastSeenEntryId: string | null;
  dividerAtEntryId: string | null;
  backfilled: boolean;
};

export const [feeds, setFeeds] = createStore<Record<string, ChannelFeed>>({});

const emptyFeed = (): ChannelFeed => ({
  messages: [],
  badges: {},
  paused: false,
  lastSeenEntryId: null,
  dividerAtEntryId: null,
  backfilled: false,
});

export function isSilent(item: FeedEntry): boolean {
  return item.kind === "event" && item.silent === true;
}

export function lastVisible(feed: ChannelFeed): FeedEntry | undefined {
  return feed.messages.findLast((item) => !isSilent(item));
}

export function ensureFeed(id: string) {
  if (!feeds[id]) setFeeds(id, emptyFeed());
}
