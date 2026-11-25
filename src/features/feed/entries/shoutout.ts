import { formatSpan } from "../../../shared/format/duration.ts";
import { t } from "../../../shared/i18n/index.ts";
import type { FeedEvent } from "../types.ts";
import type {
  RawShoutout,
  RawShoutoutReceive,
} from "../../../platform/twitch/eventsubPayloads.ts";
import { chatterFields, feedEvent, noticeText, person } from "./feedEvent.ts";

const SHOUTOUT = "shoutout";

export function mapShoutout(raw: RawShoutout, timestamp: number): FeedEvent {
  return feedEvent(
    SHOUTOUT,
    noticeText(
      t("FEED_SHOUTOUT_SENT_LINE", {
        channel: raw.to_broadcaster_user_name,
        count: raw.viewer_count,
      }),
      t("FEED_SHOUTOUT_COOLDOWN_LINE", {
        next: formatSpan(raw.started_at, raw.cooldown_ends_at),
        channel: raw.to_broadcaster_user_name,
        again: formatSpan(raw.started_at, raw.target_cooldown_ends_at),
      }),
    ),
    timestamp,
    {
      ...chatterFields(
        raw.moderator_user_id,
        raw.moderator_user_login,
        raw.moderator_user_name,
      ),
      people: person(
        raw.to_broadcaster_user_id,
        raw.to_broadcaster_user_login,
        raw.to_broadcaster_user_name,
      ),
    },
  );
}

export function mapShoutoutReceive(
  raw: RawShoutoutReceive,
  timestamp: number,
): FeedEvent {
  return feedEvent(
    SHOUTOUT,
    t("FEED_SHOUTOUT_RECEIVED_LINE", {
      count: raw.viewer_count,
    }),
    timestamp,
    chatterFields(
      raw.from_broadcaster_user_id,
      raw.from_broadcaster_user_login,
      raw.from_broadcaster_user_name,
    ),
  );
}
