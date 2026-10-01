import type { ChatSettings, RawChatSettingsUpdate } from "../types/index.ts";

export function mapChatSettingsUpdate(
  raw: RawChatSettingsUpdate,
): ChatSettings {
  return {
    slowModeSeconds: raw.slow_mode
      ? raw.slow_mode_wait_time_seconds ?? 0
      : null,
    followerModeMinutes: raw.follower_mode
      ? raw.follower_mode_duration_minutes ?? 0
      : null,
    subscriberMode: raw.subscriber_mode,
    emoteMode: raw.emote_mode,
    uniqueChatMode: raw.unique_chat_mode,
  };
}
