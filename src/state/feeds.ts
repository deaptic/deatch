import { createStore, produce } from "solid-js/store";
import type { FeedItem, BadgeMap } from "../types";
import { NOTICE_TO_EVENT } from "../constants";
import { selectedChannel } from "./channels";
import { recordChatter, user } from "./users";
import { feedEvents, feedUserMuted } from "./preferences";
import { pushSentHistory, appendSentHistoryOlder } from "./chatHistory";

function ownMessageText(item: FeedItem): string | null {
  if (item.kind !== "message") return null;
  const me = user();
  if (!me || me.id !== item.chatter_user_id) return null;
  return item.fragments.map((f) => f.text).join("");
}

export type { FeedItem };

export type ChannelFeed = {
  messages: FeedItem[];
  badges: BadgeMap;
  paused: boolean;
  lastSeenItemId: string | null;
  dividerAtItemId: string | null;
  backfilled: boolean;
};

// Per-category caps. Items are categorized by `categoryOf` — chat messages
// share one bucket, each event `notice_type` is its own bucket, and anything
// not listed here falls back to `DEFAULT_CAP`.
const CATEGORY_CAPS: Record<string, number> = {
  message: 400,
};
const DEFAULT_CAP = 50;

function categoryOf(item: FeedItem): string {
  return item.kind === "message" ? "message" : item.notice_type;
}

function capFor(category: string): number {
  return CATEGORY_CAPS[category] ?? DEFAULT_CAP;
}

function enforceCaps(messages: FeedItem[]) {
  const counts: Record<string, number> = {};
  const removeIdxs: number[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const cat = categoryOf(messages[i]);
    counts[cat] = (counts[cat] ?? 0) + 1;
    if (counts[cat] > capFor(cat)) removeIdxs.push(i);
  }
  for (const i of removeIdxs) messages.splice(i, 1);
}

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

function isSilent(item: FeedItem): boolean {
  return item.kind === "event" && item.silent === true;
}

function lastVisible(feed: ChannelFeed): FeedItem | undefined {
  for (let i = feed.messages.length - 1; i >= 0; i--) {
    if (!isSilent(feed.messages[i])) return feed.messages[i];
  }
  return undefined;
}

export function hasUnread(id: string): boolean {
  const feed = feeds[id];
  if (!feed) return false;
  if (selectedChannel()?.user_id === id) return false;
  if (feed.dividerAtItemId) {
    const last = lastVisible(feed);
    return last !== undefined && getItemId(last) !== feed.dividerAtItemId;
  }
  if (feed.lastSeenItemId) return false;
  return lastVisible(feed) !== undefined;
}

export function markSeen(id: string) {
  const feed = feeds[id];
  if (!feed) return;
  const last = lastVisible(feed);
  if (!last) return;
  const lastId = getItemId(last);
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
  let added = false;
  setFeeds(
    id,
    produce((f) => {
      // Dedupe: a backlog fetch may overlap with the first EventSub events.
      if (f.messages.some((m) => getItemId(m) === itemId)) return;
      added = true;
      f.messages.push(item);
      if (!f.paused) enforceCaps(f.messages);
      if (isActive && !f.paused && !isSilent(item)) {
        f.lastSeenItemId = itemId;
      }
    }),
  );
  if (added) {
    const text = ownMessageText(item);
    if (text) pushSentHistory(id, text);
  }
}

/// Inject a client-only system message that only this user sees.
/// Never sent over IRC/Helix.
export function appendLocalNotice(id: string, text: string) {
  appendItem(id, {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: "local",
    system_message: text,
    chatter_name: "",
    color: "",
    timestamp: Date.now(),
    silent: true,
  });
}

/// Inserts older items at the front of the feed. Used for the one-time
/// backlog hydration from robotty when a channel is first joined. Items
/// already present (by id) are skipped, and the input is sorted oldest →
/// newest before being prepended so the order matches the live stream.
export function prependItems(id: string, items: FeedItem[]) {
  ensureFeed(id);
  for (const it of items) {
    if (it.kind === "message") {
      recordChatter(id, {
        id: it.chatter_user_id,
        login: it.chatter_login,
        displayName: it.chatter_name,
        color: it.color,
        lastSeen: it.timestamp,
      });
    }
  }
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
          enforceCaps(f.messages);
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
  // Feed the input-recall history with our own backlog messages. Iterate
  // newest → oldest so that the newest backlog entry ends up just behind
  // any live entries already captured.
  if (items.length > 0 && user()) {
    const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
    for (const it of sorted) {
      const text = ownMessageText(it);
      if (text) appendSentHistoryOlder(id, text);
    }
  }
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
      enforceCaps(f.messages);
      f.paused = false;
    }),
  );
}

export function dropFeed(id: string) {
  setFeeds(id, undefined as unknown as ChannelFeed);
}

/// Whether an item should render in the feed given the user's event-filter,
/// muted-user, and notice-category preferences. Reads preference signals
/// directly so it stays reactive when called inside a Solid effect or memo.
export function isFeedItemVisible(item: FeedItem): boolean {
  if (item.kind === "event") {
    const k = NOTICE_TO_EVENT[item.notice_type];
    return !k || feedEvents()[k]?.show !== false;
  }
  return (
    feedEvents().message?.show !== false &&
    !feedUserMuted().includes(item.chatter_user_id)
  );
}

export { feeds };
