// Pure mapper from channel.chat.notification, live or from history, to the
// feed shape. No side effects, so the backlog service can use it too.

import type {
  AnnouncementColor,
  FeedEvent,
  Person,
  RawNotification,
} from "../types/index.ts";
import { feedEvent, person } from "../utils/feedEvent.ts";
import { wordsOf } from "./chat-mapper.ts";
import { detail, noticeMessage } from "./notice-message.ts";

const ANNOUNCEMENT_COLORS = new Set<string>(
  [
    "primary",
    "blue",
    "green",
    "orange",
    "purple",
  ] satisfies AnnouncementColor[],
);

function announcementColor(
  raw: RawNotification,
): AnnouncementColor | undefined {
  const color = detail(raw, "announcement")?.color.toLowerCase() ?? "";
  return ANNOUNCEMENT_COLORS.has(color)
    ? color as AnnouncementColor
    : undefined;
}

/// The people a notice names besides its chatter.
function namedIn(raw: RawNotification): Person[] {
  const gift = detail(raw, "sub_gift");
  if (gift) {
    return person(
      gift.recipient_user_id,
      gift.recipient_user_login,
      gift.recipient_user_name,
    );
  }
  const gifter = detail(raw, "pay_it_forward") ??
    detail(raw, "gift_paid_upgrade");
  return gifter && !gifter.gifter_is_anonymous
    ? person(
      gifter.gifter_user_id,
      gifter.gifter_user_login,
      gifter.gifter_user_name,
    )
    : [];
}

/// Null when the notice has no text to show.
export function mapNotice(
  raw: RawNotification,
  timestamp: number,
): FeedEvent | null {
  const system_message = noticeMessage(raw) ?? raw.system_message;
  if (!system_message?.trim()) return null;
  return feedEvent(raw.notice_type, system_message, timestamp, {
    // Live and history share Twitch's message id, so the feed drops repeats.
    id: raw.message_id,
    chatter_user_id: raw.chatter_is_anonymous ? undefined : raw.chatter_user_id,
    chatter_login: raw.chatter_is_anonymous
      ? undefined
      : raw.chatter_user_login,
    chatter_name: raw.chatter_user_name ?? "anonymous",
    color: raw.color ?? "",
    message: wordsOf(raw.message),
    announcement_color: announcementColor(raw),
    people: namedIn(raw),
  });
}
