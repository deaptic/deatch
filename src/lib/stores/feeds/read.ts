import { feeds, lastVisible, setFeeds } from "./core.ts";
import { getEntryId } from "./ops.ts";
import { selectedChannel } from "../view.ts";
import { feedEvents, feedShowEvents } from "../preferences.ts";
import { NOTICE_TO_EVENT } from "../../constants/events.ts";
import type { FeedEntry } from "../../types/index.ts";

export function hasUnread(broadcasterId: string): boolean {
  const feed = feeds[broadcasterId];
  if (!feed) return false;
  if (selectedChannel()?.id === broadcasterId) return false;
  const last = lastVisible(feed);
  if (!last) return false;
  const marker = feed.dividerAtEntryId ?? feed.lastSeenEntryId;
  if (!marker) return true;
  return getEntryId(last) !== marker;
}

export function markSeen(broadcasterId: string) {
  const feed = feeds[broadcasterId];
  if (!feed) return;
  const last = lastVisible(feed);
  if (!last) return;
  const lastId = getEntryId(last);
  setFeeds(broadcasterId, "lastSeenEntryId", lastId);
  if (feed.dividerAtEntryId === lastId) {
    setFeeds(broadcasterId, "dividerAtEntryId", null);
  }
}

export function clearDivider(broadcasterId: string) {
  if (feeds[broadcasterId]) setFeeds(broadcasterId, "dividerAtEntryId", null);
}

export function snapshotDivider(broadcasterId: string) {
  const feed = feeds[broadcasterId];
  if (feed?.lastSeenEntryId) {
    setFeeds(broadcasterId, "dividerAtEntryId", feed.lastSeenEntryId);
  }
}

export function isFeedEntryVisible(item: FeedEntry): boolean {
  if (item.kind === "event") {
    const k = NOTICE_TO_EVENT[item.notice_type];
    return !k || (feedShowEvents() && feedEvents()[k].show !== false);
  }
  return !!item.automod_hold || feedEvents().message.show !== false;
}
