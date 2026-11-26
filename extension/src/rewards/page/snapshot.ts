import type {
  DropProgress,
  ChannelReport,
  Reward,
  RewardStatus,
} from "../types.ts";
import type { TwitchPoints, TwitchReward } from "./twitch.ts";

function statusOf(reward: TwitchReward): RewardStatus {
  if (reward.isPaused === true) return "paused";
  if (reward.isInStock === false) return "sold_out";
  return "available";
}

function perUserLimit(reward: TwitchReward): number | null {
  const setting = reward.maxPerUserPerStreamSetting;
  const limit = setting?.maxPerUserPerStream;
  return setting?.isEnabled === true && limit !== undefined && limit > 0
    ? limit
    : null;
}

function redeemedCounts(points: TwitchPoints): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of points.userRedemptions ?? []) {
    const id = entry.reward?.id;
    const count = entry.userRedemptionsCurrentStream;
    if (id && Number.isSafeInteger(count)) counts.set(id, count as number);
  }
  return counts;
}

function rewardOf(reward: TwitchReward, redeemed: number | null): Reward {
  return {
    id: reward.id,
    title: reward.title,
    prompt: reward.prompt ?? null,
    cost: reward.cost,
    color: reward.backgroundColor ?? null,
    image: reward.image?.url2x ?? reward.defaultImage?.url2x ?? null,
    input: reward.isUserInputRequired === true,
    status: statusOf(reward),
    cooldownEndsAt: reward.cooldownExpiresAt ?? null,
    perUserLimit: perUserLimit(reward),
    redeemedThisStream: redeemed,
    subOnly: reward.isSubOnly === true,
  };
}

const redeemable = (reward: TwitchReward) =>
  reward.isEnabled === true &&
  reward.pricingType === "POINTS" &&
  Number.isFinite(reward.cost);

type Viewing = {
  bonusReady: boolean;
  subscribed: boolean | null;
  drop: DropProgress | null;
  earnedAt: Record<string, string>;
};

export function snapshot(
  channel: string,
  points: TwitchPoints | null,
  viewing: Viewing,
): ChannelReport {
  if (!points) return { ...viewing, channel, balance: null, rewards: [] };
  const counts = redeemedCounts(points);
  return {
    ...viewing,
    channel,
    balance: points.balance,
    rewards: points.customRewards
      .filter(redeemable)
      .map((reward) => rewardOf(reward, counts.get(reward.id) ?? null)),
  };
}
