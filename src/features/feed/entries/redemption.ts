import type { RawChannelPointsRedemption } from "../../../platform/twitch/eventsubPayloads.ts";
import type { Redemption } from "../types.ts";

export function mapRedemption(raw: RawChannelPointsRedemption): Redemption {
  const input = raw.user_input.trim();
  return {
    reward: {
      id: raw.reward.id,
      title: raw.reward.title,
      prompt: raw.reward.prompt.trim(),
      cost: raw.reward.cost,
    },
    input: input || undefined,
  };
}
