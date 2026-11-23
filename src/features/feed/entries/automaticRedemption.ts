import { t } from "../../../shared/i18n/index.ts";
import type {
  FeedEvent,
  RawAutomaticRedemption,
} from "../../../shared/types/index.ts";
import { chatterFields, feedEvent } from "./feedEvent.ts";
import { CHANNEL_POINTS_REDEMPTION } from "../../../shared/moderateActions.ts";

const MESSAGE_REWARDS = new Set([
  "send_highlighted_message",
  "single_message_bypass_sub_mode",
  "message_effect",
  "gigantify_an_emote",
]);

export function mapAutomaticRedemption(
  raw: RawAutomaticRedemption,
  timestamp: number,
): FeedEvent | null {
  if (MESSAGE_REWARDS.has(raw.reward.type)) return null;
  const emote = raw.reward.emote;
  return feedEvent(
    CHANNEL_POINTS_REDEMPTION,
    t("FEED_AUTOMATIC_REDEMPTION_LINE", {
      user: raw.user_name,
      type: raw.reward.type,
      cost: raw.reward.channel_points,
    }),
    timestamp,
    {
      id: raw.id,
      ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
      message: emote
        ? [{ type: "emote", text: emote.name, id: emote.id }]
        : undefined,
    },
  );
}
