import type { Redemption } from "../types/feed.ts";
import type { RawChannelPointsRedemption } from "../types/twitch/eventsub.ts";

export function mapRedemption(raw: RawChannelPointsRedemption): Redemption {
  const input = raw.user_input.trim();
  return {
    reward: {
      id: raw.reward.id,
      title: raw.reward.title,
      prompt: raw.reward.prompt.trim(),
    },
    input: input || undefined,
  };
}
