export type RewardStatus = "available" | "paused" | "sold_out";

export type Reward = {
  id: string;
  title: string;
  prompt: string | null;
  cost: number;
  color: string | null;
  image: string | null;
  input: boolean;
  status: RewardStatus;
  cooldownEndsAt: string | null;
  perUserLimit: number | null;
  redeemedThisStream: number | null;
  subOnly: boolean;
};

export type DropProgress = {
  game: string;
  watched: number;
  required: number;
  reward: string | null;
  image: string | null;
};

export type ChannelReport = {
  channel: string;
  balance: number | null;
  bonusReady: boolean;
  subscribed: boolean | null;
  rewards: Reward[];
  drop: DropProgress | null;
  earnedAt: Record<string, string>;
};
