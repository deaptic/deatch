import { type MessageKey, t } from "../../shared/i18n/index.ts";
import type { DropReason } from "../../shared/types/index.ts";

type KnownCode = Exclude<DropReason["code"], "unknown">;

const MESSAGES: Record<KnownCode, MessageKey> = {
  held: "COMPOSER_HELD_STATUS",
  rejected: "COMPOSER_REJECTED_ERROR",
  banned: "COMPOSER_BANNED_ERROR",
  timedOut: "COMPOSER_TIMED_OUT_ERROR",
  suspended: "COMPOSER_SUSPENDED_ERROR",
  channelBlocked: "COMPOSER_CHANNEL_BLOCKED_ERROR",
  channelSuspended: "COMPOSER_CHANNEL_SUSPENDED_ERROR",
  badCharacters: "COMPOSER_BAD_CHARACTERS_ERROR",
  duplicate: "COMPOSER_DUPLICATE_ERROR",
  uniqueChat: "COMPOSER_UNIQUE_CHAT_ERROR",
  rateLimit: "COMPOSER_RATE_LIMIT_ERROR",
  slowMode: "COMPOSER_SLOW_MODE_ERROR",
  emoteOnly: "COMPOSER_EMOTE_ONLY_ERROR",
  followersOnly: "COMPOSER_FOLLOWERS_ONLY_ERROR",
  subscribersOnly: "COMPOSER_SUBSCRIBERS_ONLY_ERROR",
  phoneRequired: "COMPOSER_PHONE_REQUIRED_ERROR",
  emailRequired: "COMPOSER_EMAIL_REQUIRED_ERROR",
};

export function dropMessage(reason: DropReason | null): string {
  if (!reason) return t("COMPOSER_DROPPED_ERROR");
  return reason.code === "unknown" ? reason.message : t(MESSAGES[reason.code]);
}
