import type { FeedEntry } from "./feed.ts";

export type HistoryView = {
  entries: FeedEntry[];
  atOldest: boolean;
  atLive: boolean;
};
