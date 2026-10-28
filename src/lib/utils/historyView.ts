import type { FeedEntry, HistoryView } from "../types/index.ts";
import { getEntryId } from "./entryId.ts";

function unique(entries: FeedEntry[]): FeedEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const id = getEntryId(e);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/// `page` laid before the view; past `max`, the newest end is let go.
export function withOlder(
  view: HistoryView,
  page: FeedEntry[],
  max: number,
): HistoryView {
  const entries = unique([...page, ...view.entries]);
  const trimmed = entries.length > max;
  return {
    entries: trimmed ? entries.slice(0, max) : entries,
    atOldest: page.length === 0,
    atLive: view.atLive && !trimmed,
  };
}

/// `page` laid after the view. A page shorter than `limit` means the log has
/// nothing newer, so the live entries carry on from it. Past `max`, the
/// oldest end is let go.
export function withNewer(
  view: HistoryView,
  page: FeedEntry[],
  live: FeedEntry[],
  limit: number,
  max: number,
): HistoryView {
  const reachedLive = page.length < limit;
  const last = (page.at(-1) ?? view.entries.at(-1))?.timestamp ?? 0;
  const tail = reachedLive ? live.filter((e) => e.timestamp >= last) : [];
  const entries = unique([...view.entries, ...page, ...tail]);
  const trimmed = entries.length > max;
  return {
    entries: trimmed ? entries.slice(-max) : entries,
    atOldest: view.atOldest && !trimmed,
    atLive: reachedLive,
  };
}
