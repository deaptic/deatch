import type { FeedEntry } from "../../types/index.ts";
import { enforceCaps } from "./caps.ts";
import { getEntryId } from "../../utils/entryId.ts";

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

function missing(messages: FeedEntry[], items: FeedEntry[]): FeedEntry[] {
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
  const added = missing(messages, items);
  for (const it of added) {
    const after = messages.findLastIndex((m) => m.timestamp <= it.timestamp);
    messages.splice(after + 1, 0, it);
  }
  if (added.length > 0) enforceCaps(messages, paused);
  return added;
}

export function prepend(
  messages: FeedEntry[],
  items: FeedEntry[],
  paused: boolean,
): FeedEntry[] {
  const added = missing(messages, items);
  if (added.length > 0) {
    messages.unshift(...added);
    enforceCaps(messages, paused);
  }
  return added;
}
