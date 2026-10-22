import type { FeedEvent, NoticeText } from "../types/feed.ts";

/// A headline, with the detail line only when there is something to say.
export function noticeText(text: string, detail?: string | null): NoticeText {
  return detail ? { text, detail } : { text };
}

type Extras = Partial<
  Omit<FeedEvent, "kind" | "notice_type" | "system_message" | "timestamp">
>;

export function feedEvent(
  notice_type: string,
  notice: string | NoticeText,
  timestamp: number,
  extras: Extras = {},
): FeedEvent {
  const { text, detail } = typeof notice === "string"
    ? { text: notice, detail: undefined }
    : notice;
  return {
    kind: "event",
    id: crypto.randomUUID(),
    chatter_name: "",
    color: "",
    notice_type,
    system_message: text,
    detail,
    timestamp,
    ...extras,
  };
}
