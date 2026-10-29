import { isSilent, toLog, updateFeed } from "./core.ts";
import { getEntryId } from "../../utils/entryId.ts";
import { append, insert, prepend } from "./ops.ts";
import type { FeedEntry, NoticeText } from "../../types/index.ts";
import { feedEvent } from "../../utils/feedEvent.ts";
import { LOCAL } from "../../constants/events.ts";
import { selectedChannel } from "../view.ts";

export function appendItem(broadcasterId: string, item: FeedEntry): boolean {
  const isActive = selectedChannel()?.id === broadcasterId;
  let added = false;
  updateFeed(broadcasterId, (f) => {
    added = append(f.messages, item, f.paused);
    if (!added) return;
    toLog(broadcasterId, [item]);
    if (isActive && !f.paused && !isSilent(item)) {
      f.lastSeenEntryId = getEntryId(item);
    }
  });
  return added;
}

export function appendLocalNotice(
  broadcasterId: string,
  notice: string | NoticeText,
  noticeType = LOCAL,
) {
  appendItem(
    broadcasterId,
    feedEvent(noticeType, notice, Date.now(), { silent: true }),
  );
}

/// Fills a gap after a dropped connection; returns the entries that were new.
export function insertEntries(
  broadcasterId: string,
  items: FeedEntry[],
): FeedEntry[] {
  let added: FeedEntry[] = [];
  updateFeed(broadcasterId, (f) => {
    added = insert(f.messages, items, f.paused);
    toLog(broadcasterId, added);
  });
  return added;
}

/// Hydrates a feed with history; returns the entries that were new.
export function prependEntries(
  broadcasterId: string,
  items: FeedEntry[],
): FeedEntry[] {
  let added: FeedEntry[] = [];
  updateFeed(broadcasterId, (f) => {
    f.backfilled = true;
    added = prepend(f.messages, items, f.paused);
    toLog(broadcasterId, added);
    // Backlog is already-seen; it must not count as unread.
    const last = f.messages.at(-1);
    if (!f.lastSeenEntryId && last) f.lastSeenEntryId = getEntryId(last);
  });
  return added;
}
