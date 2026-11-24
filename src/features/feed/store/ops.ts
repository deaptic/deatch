import type { FeedEntry } from "../types.ts";
import { enforceCap } from "./caps.ts";
import { getEntryId } from "./entryId.ts";

export function append(
  messages: FeedEntry[],
  item: FeedEntry,
  limit: number,
): boolean {
  const id = getEntryId(item);
  if (messages.some((m) => getEntryId(m) === id)) return false;
  messages.push(item);
  enforceCap(messages, limit);
  return true;
}

function missing(messages: FeedEntry[], items: FeedEntry[]): FeedEntry[] {
  const existing = new Set(messages.map(getEntryId));
  return items
    .filter((it) => !existing.has(getEntryId(it)))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function insert(
  messages: FeedEntry[],
  items: FeedEntry[],
  limit: number,
): FeedEntry[] {
  const added = missing(messages, items);
  for (const it of added) {
    const after = messages.findLastIndex((m) => m.timestamp <= it.timestamp);
    messages.splice(after + 1, 0, it);
  }
  if (added.length > 0) enforceCap(messages, limit);
  return added;
}

export function prepend(
  messages: FeedEntry[],
  items: FeedEntry[],
  limit: number,
): FeedEntry[] {
  const added = missing(messages, items);
  if (added.length > 0) {
    messages.unshift(...added);
    enforceCap(messages, limit);
  }
  return added;
}
