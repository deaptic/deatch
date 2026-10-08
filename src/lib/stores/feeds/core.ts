import { createStore } from "solid-js/store";
import type { BadgeMap, FeedEntry } from "../../types/feed.ts";
import { user } from "../users.ts";

export type { FeedEntry };

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

export function getEntryId(item: FeedEntry): string {
  return item.kind === "message" ? item.message_id : item.id;
}

export function isSilent(item: FeedEntry): boolean {
  return item.kind === "event" && item.silent === true;
}

export function lastVisible(feed: ChannelFeed): FeedEntry | undefined {
  for (let i = feed.messages.length - 1; i >= 0; i--) {
    if (!isSilent(feed.messages[i])) return feed.messages[i];
  }
  return undefined;
}

export function ensureFeed(id: string) {
  if (!feeds[id]) setFeeds(id, emptyFeed());
}

export function ownMessageText(item: FeedEntry): string | null {
  if (item.kind !== "message") return null;
  const me = user();
  if (!me || me.id !== item.chatter_user_id) return null;
  return item.fragments.map((f) => f.text).join("");
}
