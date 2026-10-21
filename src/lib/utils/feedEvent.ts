import { t } from "../i18n/index.ts";
import type { FeedEvent } from "../types/feed.ts";

export function withDetail(text: string, detail?: string | null): string {
  return detail ? t("EVENT_WITH_DETAIL", { text, detail }) : text;
}

type Extras = Partial<
  Omit<FeedEvent, "kind" | "notice_type" | "system_message" | "timestamp">
>;

export function feedEvent(
  notice_type: string,
  system_message: string,
  timestamp: number,
  extras: Extras = {},
): FeedEvent {
  return {
    kind: "event",
    id: crypto.randomUUID(),
    chatter_name: "",
    color: "",
    notice_type,
    system_message,
    timestamp,
    ...extras,
  };
}
