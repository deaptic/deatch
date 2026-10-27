import type { FeedEvent, NoticeText, Person } from "../types/feed.ts";

/// A headline, with the detail line only when there is something to say.
export function noticeText(text: string, detail?: string | null): NoticeText {
  return detail ? { text, detail } : { text };
}

/// Who a feed row is about, as the row stores it.
export function chatterFields(id: string, login: string, name: string) {
  return { chatter_user_id: id, chatter_login: login, chatter_name: name };
}

/// Someone a notice names, or nobody when Twitch didn't say who.
export function person(
  id: string | null | undefined,
  login: string | null | undefined,
  name: string | null | undefined,
): Person[] {
  return login && name ? [{ id: id ?? undefined, login, name }] : [];
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
  const { text, detail, people } =
    typeof notice === "string" ? { text: notice } : notice;
  return {
    kind: "event",
    id: crypto.randomUUID(),
    chatter_name: "",
    color: "",
    notice_type,
    system_message: text,
    detail,
    people,
    timestamp,
    ...extras,
  };
}
