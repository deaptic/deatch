import { t } from "../i18n/index.ts";
import type {
  FeedMessage,
  NoticeText,
  RawSuspiciousUserMessage,
  RawSuspiciousUserUpdate,
  SuspiciousInfo,
} from "../types/index.ts";
import { chatterFields, person } from "../utils/feedEvent.ts";
import { mapFragment } from "./chat.ts";

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

export function suspiciousMessage(
  raw: RawSuspiciousUserMessage,
  info: SuspiciousInfo,
  timestamp: number,
): FeedMessage {
  return {
    kind: "message",
    message_id: raw.message.message_id,
    ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
    color: "",
    fragments: raw.message.fragments.map(mapFragment),
    badges: [],
    timestamp,
    suspicious: info,
  };
}

export function suspiciousUpdate(raw: RawSuspiciousUserUpdate): NoticeText {
  return {
    text: t("FEED_SUSPICIOUS_UPDATED_LINE", {
      mod: raw.moderator_user_name,
      user: raw.user_name,
      status: raw.low_trust_status,
    }),
    people: [
      ...person(
        raw.moderator_user_id,
        raw.moderator_user_login,
        raw.moderator_user_name,
      ),
      ...person(raw.user_id, raw.user_login, raw.user_name),
    ],
  };
}
