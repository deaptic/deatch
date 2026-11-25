import { t } from "../../../shared/i18n/index.ts";

import type { AnnouncementColor } from "../../../shared/types/index.ts";
import type { FeedEvent, Person } from "../types.ts";
import type { RawNotification } from "../../../platform/twitch/eventsubPayloads.ts";
import { feedEvent, person } from "./feedEvent.ts";
import { isAnnouncementColor } from "../../../shared/twitch.ts";
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
  const text = noticeMessage(raw) ?? raw.system_message;
  const message = wordsOf(raw.message);
  if (!text.trim() && !message) return null;
  const anonymous = raw.chatter_is_anonymous || !raw.chatter_user_name;
  return feedEvent(raw.notice_type, text, timestamp, {
    id: raw.message_id,
    chatter_user_id: anonymous ? undefined : raw.chatter_user_id,
    chatter_login: anonymous ? undefined : raw.chatter_user_login,
    chatter_name: anonymous
      ? t("FEED_ANONYMOUS_GIFTER_VALUE")
      : (raw.chatter_user_name ?? ""),
    color: raw.color ?? "",
    message,
    announcement_color: announcementColor(raw),
    people: namedIn(raw),
  });
}
