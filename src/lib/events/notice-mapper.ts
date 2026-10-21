// Pure mapper from channel.chat.notification, live or from history, to the
// feed shape. No side effects, so the backlog service can use it too.

import type { FeedEvent, RawNotification } from "../types/index.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { mapFragment } from "./chat-mapper.ts";
import { noticeMessage } from "./notice-message.ts";

// Most notices ship a complete `system_message` that already starts with the
// chatter name (e.g. resub: "viewer23 subscribed at Tier 1..."). A few
// undocumented types (e.g. modiversary) omit it, sending just the predicate
// ("has been a moderator for 84 months!"), so we prepend the name for those.
const NOTICES_NEEDING_NAME = new Set(["modiversary"]);

/// Null when the notice has no text to show.
export function mapNotice(
  raw: RawNotification,
  timestamp: number,
): FeedEvent | null {
  const name = raw.chatter_user_name;
  let system_message = noticeMessage(raw) ?? raw.system_message;
  if (!system_message?.trim()) return null;
  if (
    name &&
    NOTICES_NEEDING_NAME.has(raw.notice_type) &&
    !system_message.toLowerCase().startsWith(name.toLowerCase())
  ) {
    system_message = `${name} ${system_message}`;
  }
  return feedEvent(raw.notice_type, system_message, timestamp, {
    // Live and history share Twitch's message id, so the feed drops repeats.
    id: raw.message_id,
    chatter_user_id: raw.chatter_is_anonymous ? undefined : raw.chatter_user_id,
    chatter_login: raw.chatter_is_anonymous
      ? undefined
      : raw.chatter_user_login,
    chatter_name: raw.chatter_user_name ?? "anonymous",
    color: raw.color ?? "",
    message: raw.message?.text.trim()
      ? raw.message.fragments.map(mapFragment)
      : undefined,
  });
}
