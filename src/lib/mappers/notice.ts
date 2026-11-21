import { t } from "../i18n/index.ts";

import type {
  AnnouncementColor,
  FeedEvent,
  Person,
  RawNotification,
} from "../types/index.ts";
import { feedEvent, person } from "../utils/feedEvent.ts";
import { isAnnouncementColor } from "../constants/twitch.ts";
import { wordsOf } from "./chat.ts";
import { detail, noticeMessage } from "./noticeMessage.ts";

function announcementColor(
  raw: RawNotification,
): AnnouncementColor | undefined {
  const color = detail(raw, "announcement")?.color.toLowerCase() ?? "";
  return isAnnouncementColor(color) ? color : undefined;
}

function namedIn(raw: RawNotification): Person[] {
  const gift = detail(raw, "sub_gift");
  if (gift) {
    return person(
      gift.recipient_user_id,
      gift.recipient_user_login,
      gift.recipient_user_name,
    );
  }
  const gifter =
    detail(raw, "pay_it_forward") ?? detail(raw, "gift_paid_upgrade");
  return gifter && !gifter.gifter_is_anonymous
    ? person(
        gifter.gifter_user_id,
        gifter.gifter_user_login,
        gifter.gifter_user_name,
      )
    : [];
}

export function mapNotice(
  raw: RawNotification,
  timestamp: number,
): FeedEvent | null {
  const system_message = noticeMessage(raw) ?? raw.system_message;
  if (!system_message.trim()) return null;
  return feedEvent(raw.notice_type, system_message, timestamp, {
    id: raw.message_id,
    chatter_user_id: raw.chatter_is_anonymous ? undefined : raw.chatter_user_id,
    chatter_login: raw.chatter_is_anonymous
      ? undefined
      : raw.chatter_user_login,
    chatter_name: raw.chatter_user_name ?? t("EVENT_ANONYMOUS"),
    color: raw.color ?? "",
    message: wordsOf(raw.message),
    announcement_color: announcementColor(raw),
    people: namedIn(raw),
  });
}
