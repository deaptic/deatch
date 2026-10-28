import type { FeedEntry } from "./feed.ts";

/// A stretch of a channel's past, read back from the feed log, shown in place
/// of its live feed while the user reads further back than memory holds.
export type HistoryView = {
  entries: FeedEntry[];
  /// Nothing older is logged.
  atOldest: boolean;
  /// The view runs up to the live feed.
  atLive: boolean;
};
