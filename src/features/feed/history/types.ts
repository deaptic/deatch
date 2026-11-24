import type { FeedEntry } from "../types.ts";

export type HistoryView = {
  entries: FeedEntry[];
  atOldest: boolean;
  atLive: boolean;
};
