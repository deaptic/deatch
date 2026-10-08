import type { FeedEntry } from "../../types/feed.ts";
import { enforceCaps } from "./caps.ts";

export function getEntryId(item: FeedEntry): string {
  return item.kind === "message" ? item.message_id : item.id;
}

export function append(
  messages: FeedEntry[],
  item: FeedEntry,
  paused: boolean,
): boolean {
  const id = getEntryId(item);
  // A backlog fetch may overlap with the first EventSub events.
  if (messages.some((m) => getEntryId(m) === id)) return false;
  messages.push(item);
  enforceCaps(messages, paused);
  return true;
}

function fresh(messages: FeedEntry[], items: FeedEntry[]): FeedEntry[] {
  const existing = new Set(messages.map(getEntryId));
  return items
    .filter((it) => !existing.has(getEntryId(it)))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/// Merges by timestamp: live entries may already sit after a gap being filled.
export function insert(
  messages: FeedEntry[],
  items: FeedEntry[],
  paused: boolean,
): FeedEntry[] {
  const added = fresh(messages, items);
  for (const it of added) {
    let at = messages.length;
    while (at > 0 && messages[at - 1].timestamp > it.timestamp) at--;
    messages.splice(at, 0, it);
  }
  if (added.length > 0) enforceCaps(messages, paused);
  return added;
}

export function prepend(
  messages: FeedEntry[],
  items: FeedEntry[],
  paused: boolean,
): FeedEntry[] {
  const added = fresh(messages, items);
  if (added.length > 0) {
    messages.unshift(...added);
    enforceCaps(messages, paused);
  }
  return added;
}
