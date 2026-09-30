import { produce } from "solid-js/store";
import {
  enforceCaps,
  ensureFeed,
  getItemId,
  isSilent,
  ownMessageText,
  setFeeds,
} from "./core.ts";
import type { FeedItem } from "../../types/feed.ts";
import { recordChatter, user } from "../users.ts";
import { recordChatMessage } from "../chatActivity.ts";
import { selectedChannel } from "../view.ts";
import { appendSentHistoryOlder, pushSentHistory } from "../chatHistory.ts";

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
  const isActive = selectedChannel()?.id === id;
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
    if (item.kind === "message") recordChatMessage(id, Date.now());
    const text = ownMessageText(item);
    if (text) pushSentHistory(id, text);
  }
}

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

/// Merges items into the feed by timestamp, skipping ones already present.
/// Used to fill a gap after a dropped connection, where live messages may
/// already have arrived after the missing ones.
export function insertItems(id: string, items: FeedItem[]) {
  ensureFeed(id);
  setFeeds(
    id,
    produce((f) => {
      const existing = new Set(f.messages.map(getItemId));
      const fresh = items
        .filter((it) => !existing.has(getItemId(it)))
        .sort((a, b) => a.timestamp - b.timestamp);
      for (const it of fresh) {
        let at = f.messages.length;
        while (at > 0 && f.messages[at - 1].timestamp > it.timestamp) at--;
        f.messages.splice(at, 0, it);
      }
      if (fresh.length > 0 && !f.paused) enforceCaps(f.messages);
    }),
  );
}

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
      // Mark backlog as already-seen so it doesn't count as unread.
      if (!f.lastSeenItemId && f.messages.length > 0) {
        f.lastSeenItemId = getItemId(f.messages[f.messages.length - 1]);
      }
    }),
  );
  // Iterate newest → oldest so the newest backlog entry lands just behind
  // any live entries already in the sent-history.
  if (items.length > 0 && user()) {
    const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
    for (const it of sorted) {
      const text = ownMessageText(it);
      if (text) appendSentHistoryOlder(id, text);
    }
  }
}
