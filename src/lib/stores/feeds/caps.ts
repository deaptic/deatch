import type { FeedEntry } from "../../types/index.ts";

/// Entries a feed holds in memory, messages and events alike; the feed log
/// has every one, so older ones are simply let go.
export const FEED_CAP = 400;
// A paused feed keeps scrollback, but still needs a ceiling or a busy
// channel left scrolled up grows without bound.
const PAUSED_FACTOR = 5;

/// Drops the oldest entries past the cap, in place.
export function enforceCaps(entries: FeedEntry[], paused = false) {
  const limit = FEED_CAP * (paused ? PAUSED_FACTOR : 1);
  entries.splice(0, Math.max(0, entries.length - limit));
}
