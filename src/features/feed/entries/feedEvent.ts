import { textOf } from "./message.ts";
import { formatList } from "../../../shared/format/list.ts";
import type { FeedEvent, NoticeText, Person } from "../types.ts";

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

export function lineOf(item: FeedEvent): string {
  const lead = `${item.chatter_name} `;
  const text = item.system_message;
  if (!item.chatter_name || !text.startsWith(lead)) return text;
  const rest = text.slice(lead.length);
  return rest.charAt(0).toLocaleUpperCase() + rest.slice(1);
}

export function eventText(item: FeedEvent): string {
  const line = lineOf(item);
  const said = textOf({ fragments: item.message ?? [] });
  const recipients = formatList((item.recipients ?? []).map((p) => p.name));
  const body = [line || said, line && said, item.detail, recipients]
    .filter(Boolean)
    .join(" · ");
  return [item.chatter_name, body].filter(Boolean).join(": ");
}
