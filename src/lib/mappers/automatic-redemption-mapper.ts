// Pure mapper for Twitch's built-in channel points rewards.

import { t } from "../i18n/index.ts";
import type { FeedEvent, RawAutomaticRedemption } from "../types/index.ts";
import { chatterFields, feedEvent } from "../utils/feedEvent.ts";
import { CHANNEL_POINTS_REDEMPTION } from "../constants/events.ts";

// These arrive as a chat message of their own, which already shows them. The
// last two are v1 names Twitch documents only there, kept in case v2 sends them.
const MESSAGE_REWARDS = new Set([
  "send_highlighted_message",
  "single_message_bypass_sub_mode",
  "message_effect",
  "gigantify_an_emote",
]);

/// Null for rewards the chat message already shows.
export function mapAutomaticRedemption(
  raw: RawAutomaticRedemption,
  timestamp: number,
): FeedEvent | null {
  if (MESSAGE_REWARDS.has(raw.reward.type)) return null;
  const emote = raw.reward.emote;
  return feedEvent(
    CHANNEL_POINTS_REDEMPTION,
    t("EVENT_AUTOMATIC_REDEMPTION", {
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
