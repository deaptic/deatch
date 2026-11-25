import { t } from "../../../shared/i18n/index.ts";
import type { FeedEvent } from "../types.ts";
import type { RawFollow } from "../../../platform/twitch/eventsubPayloads.ts";
import { chatterFields, feedEvent } from "./feedEvent.ts";
import { FOLLOW } from "../../../shared/moderateActions.ts";

export function mapFollow(raw: RawFollow, timestamp: number): FeedEvent {
  return feedEvent(
    FOLLOW,
    t("FEED_FOLLOWED_LINE"),
    timestamp,
    chatterFields(raw.user_id, raw.user_login, raw.user_name),
  );
}
