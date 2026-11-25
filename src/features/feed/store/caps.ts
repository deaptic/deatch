import type { FeedEntry } from "../types.ts";

export const FEED_CAP = 400;
export const BACKGROUND_CAP = 50;
const PAUSED_FACTOR = 5;

export function limitFor(paused: boolean, background: boolean): number {
  if (background) return BACKGROUND_CAP;
  return paused ? FEED_CAP * PAUSED_FACTOR : FEED_CAP;
}

export function enforceCap(entries: FeedEntry[], limit: number) {
  entries.splice(0, Math.max(0, entries.length - limit));
}

export function enforceCapLoosely(entries: FeedEntry[], limit: number) {
  if (entries.length > limit + Math.ceil(limit / 8)) enforceCap(entries, limit);
}
