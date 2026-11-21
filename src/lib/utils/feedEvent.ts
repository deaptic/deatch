import type { FeedEvent, NoticeText, Person } from "../types/index.ts";

export function noticeText(text: string, detail?: string | null): NoticeText {
  return detail ? { text, detail } : { text };
}

export function chatterFields(id: string, login: string, name: string) {
  return { chatter_user_id: id, chatter_login: login, chatter_name: name };
}

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
