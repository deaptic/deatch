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
  backfilled: boolean;
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
  backfilled: false,
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

export function markMessageDeleted(id: string, messageId: string) {
  if (!feeds[id]) return;
  setFeeds(
    id,
    produce((f) => {
      const m = f.messages.find((m) => m.kind === "message" && m.message_id === messageId);
      if (m && m.kind === "message") m.deleted = true;
    }),
  );
}

export function markUserMessagesDeleted(id: string, userId: string) {
  if (!feeds[id]) return;
  setFeeds(
    id,
    produce((f) => {
      for (const m of f.messages) {
        if (m.kind === "message" && m.chatter_user_id === userId) m.deleted = true;
      }
    }),
  );
}

export function markAllMessagesDeleted(id: string) {
  if (!feeds[id]) return;
  setFeeds(
    id,
    produce((f) => {
      for (const m of f.messages) {
        if (m.kind === "message") m.deleted = true;
      }
    }),
  );
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
  const itemId = getItemId(item);
  setFeeds(
    id,
    produce((f) => {
      // Dedupe: a backlog fetch may overlap with the first EventSub events.
      if (f.messages.some((m) => getItemId(m) === itemId)) return;
      if (!f.paused && f.messages.length >= MAX_MESSAGES) {
        f.messages.splice(0, f.messages.length - TRIM_TO);
      }
      f.messages.push(item);
      if (isActive && !f.paused) {
        f.lastSeenItemId = itemId;
      }
    }),
  );
}

/// Inserts older items at the front of the feed. Used for the one-time
/// backlog hydration from robotty when a channel is first joined. Items
/// already present (by id) are skipped, and the input is sorted oldest →
/// newest before being prepended so the order matches the live stream.
export function prependItems(id: string, items: FeedItem[]) {
  ensureFeed(id);
  setFeeds(
    id,
    produce((f) => {
      f.backfilled = true;
      if (items.length > 0) {
        const existing = new Set(f.messages.map(getItemId));
        const fresh = items.filter((it) => !existing.has(getItemId(it)));
        if (fresh.length > 0) {
          fresh.sort((a, b) => a.timestamp - b.timestamp);
          f.messages.unshift(...fresh);
          if (f.messages.length > MAX_MESSAGES) {
            f.messages.splice(MAX_MESSAGES);
          }
        }
      }
      // Backlog is history, not new chat. Mark it as already-seen so that
      // switching away from this channel doesn't carry it into the menu
      // unread badge (snapshotDivider only sets a divider when something
      // has been seen).
      if (!f.lastSeenItemId && f.messages.length > 0) {
        f.lastSeenItemId = getItemId(f.messages[f.messages.length - 1]);
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
