import { type MessageKey, t } from "../i18n/index.ts";
import type { DropReason } from "../types/index.ts";

type KnownCode = Exclude<DropReason["code"], "unknown">;

const MESSAGES: Record<KnownCode, MessageKey> = {
  held: "CHAT_MESSAGE_HELD",
  rejected: "CHAT_DROP_REJECTED",
  banned: "CHAT_DROP_BANNED",
  timedOut: "CHAT_DROP_TIMED_OUT",
  suspended: "CHAT_DROP_SUSPENDED",
  channelBlocked: "CHAT_DROP_CHANNEL_BLOCKED",
  channelSuspended: "CHAT_DROP_CHANNEL_SUSPENDED",
  badCharacters: "CHAT_DROP_BAD_CHARACTERS",
  duplicate: "CHAT_DROP_DUPLICATE",
  uniqueChat: "CHAT_DROP_UNIQUE_CHAT",
  rateLimit: "CHAT_DROP_RATE_LIMIT",
  slowMode: "CHAT_DROP_SLOW_MODE",
  emoteOnly: "CHAT_DROP_EMOTE_ONLY",
  followersOnly: "CHAT_DROP_FOLLOWERS_ONLY",
  subscribersOnly: "CHAT_DROP_SUBSCRIBERS_ONLY",
  phoneRequired: "CHAT_DROP_PHONE_REQUIRED",
  emailRequired: "CHAT_DROP_EMAIL_REQUIRED",
};

/** Unknown codes keep Twitch's own explanation. */
export function dropMessage(reason: DropReason | null): string {
  if (!reason) return t("CHAT_MESSAGE_DROPPED");
  return reason.code === "unknown" ? reason.message : t(MESSAGES[reason.code]);
}
