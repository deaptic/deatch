import { type ChannelFeed, feeds, isSilent, setFeeds } from "./core.ts";
import { getEntryId } from "./entryId.ts";
import { selectedChannel } from "../../navigation/index.ts";
import { feedEvents, feedShowEvents } from "../../preferences/index.ts";
import { NOTICE_TO_EVENT } from "../../../shared/moderateActions.ts";
import type { FeedEntry } from "../types.ts";
import { historyViews } from "../history/views.ts";
import { withLive } from "../history/view.ts";
import { isBlocked } from "../../blocks/index.ts";

export function channelEntries(broadcasterId: string): FeedEntry[] {
  const live = feeds[broadcasterId]?.messages ?? [];
  const view = historyViews[broadcasterId];
  return view ? withLive(view, live) : live;
}

export function hasUnread(broadcasterId: string): boolean {
  const feed = feeds[broadcasterId];
  if (!feed) return false;
  if (selectedChannel()?.id === broadcasterId) return false;
  const last = lastVisible(feed);
  if (!last) return false;
  const marker = feed.lastSeenEntryId;
  if (!marker) return true;
  return getEntryId(last) !== marker;
}

export function unseenCount(broadcasterId: string): number {
  const feed = feeds[broadcasterId];
  const seen = feed?.lastSeenEntryId;
  if (!feed || !seen) return 0;
  const from = feed.messages.findLastIndex((e) => getEntryId(e) === seen);
  return feed.messages.slice(from + 1).filter(countsAsNew).length;
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

function countsAsNew(item: FeedEntry): boolean {
  return !isSilent(item) && isFeedEntryVisible(item);
}

function lastVisible(feed: ChannelFeed): FeedEntry | undefined {
  return feed.messages.findLast(countsAsNew);
}

export function isFeedEntryVisible(item: FeedEntry): boolean {
  if (item.kind === "event") {
    const k = NOTICE_TO_EVENT[item.notice_type];
    return !k || (feedShowEvents() && feedEvents()[k].show !== false);
  }
  if (isBlocked(item.chatter_user_id)) return false;
  return !!item.automod_hold || feedEvents().message.show !== false;
}
