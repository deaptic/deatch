import type { FeedEntry, FeedMessage } from "../types/feed.ts";
import { formatLocale, t } from "../i18n/index.ts";
import { daysBetween } from "./time.ts";

export const GROUP_WINDOW_MS = 7 * 60 * 1000;

export type RowLayout = { dayStart: boolean; continued: boolean };

function standsAlone(msg: FeedMessage): boolean {
  return !!(msg.reply || msg.automod_hold || msg.channel_points ||
    msg.cheer || msg.power_up || msg.first_message);
}

function continues(
  prev: FeedEntry,
  item: FeedEntry,
  groupStart: number,
): boolean {
  return prev.kind === "message" && item.kind === "message" &&
    prev.chatter_user_id === item.chatter_user_id &&
    prev.source?.id === item.source?.id &&
    !prev.automod_hold && !standsAlone(item) &&
    item.timestamp - groupStart < GROUP_WINDOW_MS;
}

export function layoutFeed(
  items: readonly FeedEntry[],
  group: boolean,
): RowLayout[] {
  let groupStart = 0;
  return items.map((item, i) => {
    const prev = items[i - 1];
    const dayStart = !!prev &&
      daysBetween(prev.timestamp, item.timestamp) !== 0;
    const continued = group && !!prev && !dayStart &&
      continues(prev, item, groupStart);
    if (!continued) groupStart = item.timestamp;
    return { dayStart, continued };
  });
}

export function dayLabel(ts: number, now: number): string {
  const days = daysBetween(ts, now);
  if (days === 0) return t("FEED_DAY_TODAY");
  if (days === 1) return t("FEED_DAY_YESTERDAY");
  const sameYear = new Date(ts).getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(formatLocale(), {
    weekday: sameYear ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  }).format(ts);
}
