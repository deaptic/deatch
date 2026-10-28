import { createStore, produce } from "solid-js/store";
import type { BadgeMap, FeedEntry } from "../../types/index.ts";

export type ChannelFeed = {
  messages: FeedEntry[];
  badges: BadgeMap;
  paused: boolean;
  lastSeenEntryId: string | null;
  dividerAtEntryId: string | null;
  backfilled: boolean;
};

/// A channel left is removed, so its entry can be missing.
export const [feeds, setFeeds] = createStore<
  Record<string, ChannelFeed | undefined>
>({});

const emptyFeed = (): ChannelFeed => ({
  messages: [],
  badges: {},
  paused: false,
  lastSeenEntryId: null,
  dividerAtEntryId: null,
  backfilled: false,
});

/// Changes the channel's feed in place; false when it has none.
export function updateFeed(
  id: string,
  change: (feed: ChannelFeed) => void,
): boolean {
  if (!feeds[id]) return false;
  setFeeds(
    id,
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

export function ensureFeed(id: string) {
  if (!feeds[id]) setFeeds(id, emptyFeed());
}
