import type { FeedItem, FeedMessage } from "../types/feed.ts";
import { daysBetween } from "./time.ts";

export const GROUP_WINDOW_MS = 5 * 60 * 1000;

const LOCALE = "en-GB";

export type RowLayout = { dayStart: boolean; continued: boolean };

function standsAlone(msg: FeedMessage): boolean {
  return !!(msg.reply || msg.automod_hold || msg.channel_points ||
    msg.first_message);
}

function continues(prev: FeedItem, item: FeedItem): boolean {
  return prev.kind === "message" && item.kind === "message" &&
    prev.chatter_user_id === item.chatter_user_id &&
    !prev.automod_hold && !standsAlone(item) &&
    item.timestamp - prev.timestamp < GROUP_WINDOW_MS;
}

export function layoutFeed(
  items: readonly FeedItem[],
  group: boolean,
): RowLayout[] {
  return items.map((item, i) => {
    const prev = items[i - 1];
    if (!prev) return { dayStart: false, continued: false };
    const dayStart = daysBetween(prev.timestamp, item.timestamp) !== 0;
    return {
      dayStart,
      continued: group && !dayStart && continues(prev, item),
    };
  });
}

export function dayLabel(ts: number, now: number): string {
  const days = daysBetween(ts, now);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const sameYear = new Date(ts).getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: sameYear ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  }).format(ts);
}
