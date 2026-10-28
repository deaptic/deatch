import { createStore, produce } from "solid-js/store";
import type { BadgeMap, FeedEntry } from "../../types/index.ts";
import { getEntryId } from "../../utils/entryId.ts";

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

/// Entries added or changed since the feed log last took them, per channel,
/// one per id: what is taken is each entry's latest state.
const unlogged = new Map<string, Map<string, FeedEntry>>();

export function toLog(broadcasterId: string, entries: Iterable<FeedEntry>) {
  let channel = unlogged.get(broadcasterId);
  for (const entry of entries) {
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

/// Changes the channel's feed in place; false when it has none.
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
