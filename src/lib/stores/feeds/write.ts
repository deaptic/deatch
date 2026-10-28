import { produce } from "solid-js/store";
import { feeds, isSilent, setFeeds } from "./core.ts";
import { getEntryId } from "./ops.ts";
import { append, insert, prepend } from "./ops.ts";
import type { FeedEntry, NoticeText } from "../../types/index.ts";
import { feedEvent } from "../../utils/feedEvent.ts";
import { selectedChannel } from "../view.ts";

export function appendItem(id: string, item: FeedEntry): boolean {
  if (!feeds[id]) return false;
  const isActive = selectedChannel()?.id === id;
  let added = false;
  setFeeds(
    id,
    produce((f) => {
      added = append(f.messages, item, f.paused);
      if (added && isActive && !f.paused && !isSilent(item)) {
        f.lastSeenEntryId = getEntryId(item);
      }
    }),
  );
  return added;
}

export function appendLocalNotice(
  id: string,
  notice: string | NoticeText,
  noticeType = "local",
) {
  appendItem(id, feedEvent(noticeType, notice, Date.now(), { silent: true }));
}

/// Fills a gap after a dropped connection; returns the entries that were new.
export function insertEntries(id: string, items: FeedEntry[]): FeedEntry[] {
  if (!feeds[id]) return [];
  let added: FeedEntry[] = [];
  setFeeds(
    id,
    produce((f) => {
      added = insert(f.messages, items, f.paused);
    }),
  );
  return added;
}

/// Hydrates a feed with history; returns the entries that were new.
export function prependEntries(id: string, items: FeedEntry[]): FeedEntry[] {
  if (!feeds[id]) return [];
  let added: FeedEntry[] = [];
  setFeeds(
    id,
    produce((f) => {
      f.backfilled = true;
      added = prepend(f.messages, items, f.paused);
      // Backlog is already-seen; it must not count as unread.
      const last = f.messages.at(-1);
      if (!f.lastSeenEntryId && last) f.lastSeenEntryId = getEntryId(last);
    }),
  );
  return added;
}
