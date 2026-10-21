// Pure mapping for suspicious user events, kept apart from the listener so it
// can be tested without Tauri.

import { t } from "../i18n/index.ts";
import type { FeedMessage, SuspiciousInfo } from "../types/feed.ts";
import type {
  RawSuspiciousUserMessage,
  RawSuspiciousUserUpdate,
} from "../types/twitch/eventsub.ts";
import { mapFragment } from "./chat-mapper.ts";

/// Null once Twitch no longer treats the chatter as suspicious.
export function suspiciousInfo(
  raw: RawSuspiciousUserMessage,
): SuspiciousInfo | null {
  if (raw.low_trust_status === "none") return null;
  return {
    status: raw.low_trust_status,
    evasion: raw.ban_evasion_evaluation,
    bannedElsewhere: raw.types.includes("banned_in_shared_channel"),
  };
}

/// The whole message, for when no chat copy of it arrives.
export function suspiciousMessage(
  raw: RawSuspiciousUserMessage,
  info: SuspiciousInfo,
  timestamp: number,
): FeedMessage {
  return {
    kind: "message",
    message_id: raw.message.message_id,
    chatter_user_id: raw.user_id,
    chatter_login: raw.user_login,
    chatter_name: raw.user_name,
    color: "",
    fragments: raw.message.fragments.map(mapFragment),
    badges: [],
    timestamp,
    suspicious: info,
  };
}

export function suspiciousUpdate(raw: RawSuspiciousUserUpdate): string {
  return t("MODERATION_SUSPICIOUS_UPDATE", {
    mod: raw.moderator_user_name,
    user: raw.user_name,
    status: raw.low_trust_status,
  });
}
