import { feeds, getItemId, lastVisible, setFeeds } from "./core.ts";
import { selectedChannel } from "../view.ts";
import { feedEvents, feedUserMuted } from "../preferences.ts";
import { NOTICE_TO_EVENT } from "../../constants.ts";
import type { FeedItem } from "../../types/feed.ts";

export function hasUnread(id: string): boolean {
  const feed = feeds[id];
  if (!feed) return false;
  if (selectedChannel()?.id === id) return false;
  const last = lastVisible(feed);
  if (!last) return false;
  const marker = feed.dividerAtItemId ?? feed.lastSeenItemId;
  if (!marker) return true;
  return getItemId(last) !== marker;
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

export function snapshotDivider(id: string) {
  const feed = feeds[id];
  if (feed?.lastSeenItemId) {
    setFeeds(id, "dividerAtItemId", feed.lastSeenItemId);
  }
}

export function isFeedItemVisible(item: FeedItem): boolean {
  if (item.kind === "event") {
    const k = NOTICE_TO_EVENT[item.notice_type];
    return !k || feedEvents()[k]?.show !== false;
  }
  if (item.automod_hold) {
    return !feedUserMuted().includes(item.chatter_user_id);
  }
  return (
    feedEvents().message?.show !== false &&
    !feedUserMuted().includes(item.chatter_user_id)
  );
}
