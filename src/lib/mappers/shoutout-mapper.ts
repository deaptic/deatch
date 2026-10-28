// Pure mappers for shoutouts sent and received, kept apart from the listener
// so they can be tested without Tauri.

import { formatSpan } from "../format/duration.ts";
import { t } from "../i18n/index.ts";
import type {
  FeedEvent,
  RawShoutout,
  RawShoutoutReceive,
} from "../types/index.ts";
import {
  chatterFields,
  feedEvent,
  noticeText,
  person,
} from "../utils/feedEvent.ts";

const SHOUTOUT = "shoutout";

export function mapShoutout(raw: RawShoutout, timestamp: number): FeedEvent {
  return feedEvent(
    SHOUTOUT,
    noticeText(
      t("EVENT_SHOUTOUT", {
        mod: raw.moderator_user_name,
        channel: raw.to_broadcaster_user_name,
        count: raw.viewer_count,
      }),
      t("EVENT_SHOUTOUT_COOLDOWN", {
        next: formatSpan(raw.started_at, raw.cooldown_ends_at),
        channel: raw.to_broadcaster_user_name,
        again: formatSpan(raw.started_at, raw.target_cooldown_ends_at),
      }),
    ),
    timestamp,
    {
      ...chatterFields(
        raw.to_broadcaster_user_id,
        raw.to_broadcaster_user_login,
        raw.to_broadcaster_user_name,
      ),
      people: person(
        raw.moderator_user_id,
        raw.moderator_user_login,
        raw.moderator_user_name,
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
    t("EVENT_SHOUTOUT_RECEIVED", {
      channel: raw.from_broadcaster_user_name,
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
