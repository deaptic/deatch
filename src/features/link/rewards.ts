import type { LinkReward, LinkRewardStatus } from "../../shared/types/index.ts";

export type RewardBlock =
  | { kind: "status"; status: Exclude<LinkRewardStatus, "available"> }
  | { kind: "subOnly" }
  | { kind: "limit" }
  | { kind: "cooldown"; seconds: number }
  | { kind: "price" };

export type Viewer = { balance: number; subscribed: boolean | null };

export function rewardBlock(
  reward: LinkReward,
  viewer: Viewer,
  now: number,
): RewardBlock | null {
  if (reward.status !== "available") {
    return { kind: "status", status: reward.status };
  }
  if (reward.subOnly && viewer.subscribed === false) {
    return { kind: "subOnly" };
  }
  if ((reward.redeemedThisStream ?? 0) >= (reward.perUserLimit ?? Infinity)) {
    return { kind: "limit" };
  }
  const endsAt = reward.cooldownEndsAt
    ? Date.parse(reward.cooldownEndsAt)
    : Number.NaN;
  if (endsAt > now) {
    return { kind: "cooldown", seconds: Math.ceil((endsAt - now) / 1000) };
  }
  if (reward.cost > viewer.balance) return { kind: "price" };
  return null;
}
