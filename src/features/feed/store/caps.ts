import type { FeedEntry } from "../../../lib/types/index.ts";

export const FEED_CAP = 400;
const PAUSED_FACTOR = 5;

export function enforceCaps(entries: FeedEntry[], paused = false) {
  const limit = FEED_CAP * (paused ? PAUSED_FACTOR : 1);
  entries.splice(0, Math.max(0, entries.length - limit));
}
