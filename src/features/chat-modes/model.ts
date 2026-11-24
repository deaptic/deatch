import type { ChatSettings } from "../../shared/types/index.ts";
import type { RawChatSettingsUpdate } from "../../platform/twitch/eventsubPayloads.ts";

export function mapChatSettingsUpdate(
  raw: RawChatSettingsUpdate,
): ChatSettings {
  return {
    slowModeSeconds: raw.slow_mode
      ? (raw.slow_mode_wait_time_seconds ?? 0)
      : null,
    followerModeMinutes: raw.follower_mode
      ? (raw.follower_mode_duration_minutes ?? 0)
      : null,
    subscriberMode: raw.subscriber_mode,
    emoteMode: raw.emote_mode,
    uniqueChatMode: raw.unique_chat_mode,
  };
}
