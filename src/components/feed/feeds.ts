import { createStore, produce } from "solid-js/store";
import type { FeedItem, BadgeMap } from "./types";
import { selectedChannel } from "../../state/channels";
import { recordChatter } from "../../state/users";

export type { FeedItem };

export type ChannelFeed = {
  messages: FeedItem[];
  badges: BadgeMap;
  paused: boolean;
  lastSeenItemId: string | null;
  dividerAtItemId: string | null;
};

const MAX_MESSAGES = 500;
const TRIM_TO = 499;

const [feeds, setFeeds] = createStore<Record<string, ChannelFeed>>({});

const emptyFeed = (): ChannelFeed => ({
  messages: [],
  badges: {},
  paused: false,
  lastSeenItemId: null,
  dividerAtItemId: null,
});

export function getItemId(item: FeedItem): string {
  return item.kind === "message" ? item.message_id : item.id;
}

export function unreadCount(id: string): number {
  const feed = feeds[id];
  if (!feed) return 0;
  if (selectedChannel()?.user_id === id) return 0;
  if (feed.dividerAtItemId) {
    const idx = feed.messages.findIndex((m) => getItemId(m) === feed.dividerAtItemId);
    if (idx === -1) return feed.messages.length;
    return feed.messages.length - 1 - idx;
  }
  if (feed.lastSeenItemId) return 0;
  return feed.messages.length;
}

export function markSeen(id: string) {
  const feed = feeds[id];
  if (!feed || feed.messages.length === 0) return;
  const lastId = getItemId(feed.messages[feed.messages.length - 1]);
  setFeeds(id, "lastSeenItemId", lastId);
  if (feed.dividerAtItemId === lastId) {
    setFeeds(id, "dividerAtItemId", null);
  }
}

export function clearDivider(id: string) {
  if (feeds[id]) setFeeds(id, "dividerAtItemId", null);
}

export function getFeed(id: string): ChannelFeed | undefined {
  return feeds[id];
}

export function ensureFeed(id: string) {
  if (!feeds[id]) setFeeds(id, emptyFeed());
}

export function appendItem(id: string, item: FeedItem) {
  ensureFeed(id);
  if (item.kind === "message") {
    recordChatter(id, {
      id: item.chatter_user_id,
      login: item.chatter_login,
      displayName: item.chatter_name,
      color: item.color,
      lastSeen: item.timestamp,
    });
  }
  const isActive = selectedChannel()?.user_id === id;
  setFeeds(
    id,
    produce((f) => {
      if (!f.paused && f.messages.length >= MAX_MESSAGES) {
        f.messages.splice(0, f.messages.length - TRIM_TO);
      }
      f.messages.push(item);
      if (isActive && !f.paused) {
        f.lastSeenItemId = getItemId(item);
      }
    }),
  );
}

export function snapshotDivider(id: string) {
  const feed = feeds[id];
  if (feed?.lastSeenItemId) {
    setFeeds(id, "dividerAtItemId", feed.lastSeenItemId);
  }
}

export function setPaused(id: string, paused: boolean) {
  ensureFeed(id);
  setFeeds(id, "paused", paused);
}

export function setBadges(id: string, badges: BadgeMap) {
  ensureFeed(id);
  setFeeds(id, "badges", badges);
}

export function trimToLatest(id: string) {
  ensureFeed(id);
  setFeeds(
    id,
    produce((f) => {
      if (f.messages.length > MAX_MESSAGES) {
        f.messages.splice(0, f.messages.length - MAX_MESSAGES);
      }
      f.paused = false;
    }),
  );
}

export function dropFeed(id: string) {
  setFeeds(id, undefined as unknown as ChannelFeed);
}

export { feeds };
