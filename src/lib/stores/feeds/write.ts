import { produce } from "solid-js/store";
import { ensureFeed, getEntryId, isSilent, setFeeds } from "./core.ts";
import { append, insert, prepend } from "./ops.ts";
import type { FeedEntry } from "../../types/feed.ts";
import { selectedChannel } from "../view.ts";

export function appendItem(id: string, item: FeedEntry): boolean {
  ensureFeed(id);
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
  text: string,
  noticeType = "local",
) {
  appendItem(id, {
    kind: "event",
    id: crypto.randomUUID(),
    notice_type: noticeType,
    system_message: text,
    chatter_name: "",
    color: "",
    timestamp: Date.now(),
    silent: true,
  });
}

/// Fills a gap after a dropped connection; returns the entries that were new.
export function insertEntries(id: string, items: FeedEntry[]): FeedEntry[] {
  ensureFeed(id);
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
  ensureFeed(id);
  let added: FeedEntry[] = [];
  setFeeds(
    id,
    produce((f) => {
      f.backfilled = true;
      added = prepend(f.messages, items, f.paused);
      // Backlog is already-seen; it must not count as unread.
      if (!f.lastSeenEntryId && f.messages.length > 0) {
        f.lastSeenEntryId = getEntryId(f.messages[f.messages.length - 1]);
      }
    }),
  );
  return added;
}
