import { feeds, getEntryId, lastVisible, setFeeds } from "./core.ts";
import { selectedChannel } from "../view.ts";
import { feedEvents } from "../preferences.ts";
import { NOTICE_TO_EVENT } from "../../constants.ts";
import type { FeedEntry } from "../../types/feed.ts";

export function hasUnread(id: string): boolean {
  const feed = feeds[id];
  if (!feed) return false;
  if (selectedChannel()?.id === id) return false;
  const last = lastVisible(feed);
  if (!last) return false;
  const marker = feed.dividerAtEntryId ?? feed.lastSeenEntryId;
  if (!marker) return true;
  return getEntryId(last) !== marker;
}

export function markSeen(id: string) {
  const feed = feeds[id];
  if (!feed) return;
  const last = lastVisible(feed);
  if (!last) return;
  const lastId = getEntryId(last);
  setFeeds(id, "lastSeenEntryId", lastId);
  if (feed.dividerAtEntryId === lastId) {
    setFeeds(id, "dividerAtEntryId", null);
  }
}

export function clearDivider(id: string) {
  if (feeds[id]) setFeeds(id, "dividerAtEntryId", null);
}

export function snapshotDivider(id: string) {
  const feed = feeds[id];
  if (feed?.lastSeenEntryId) {
    setFeeds(id, "dividerAtEntryId", feed.lastSeenEntryId);
  }
}

export function isFeedEntryVisible(item: FeedEntry): boolean {
  if (item.kind === "event") {
    const k = NOTICE_TO_EVENT[item.notice_type];
    return !k || feedEvents()[k]?.show !== false;
  }
  return !!item.automod_hold || feedEvents().message?.show !== false;
}
