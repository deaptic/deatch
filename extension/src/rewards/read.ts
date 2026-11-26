import { channelFromPath } from "../shared/channel.ts";
import {
  asRecord,
  positiveNumber,
  stringOrNull,
  wholeNumber,
} from "../shared/record.ts";
import type {
  DropProgress,
  ChannelReport,
  Reward,
  RewardStatus,
} from "./types.ts";

const REWARD_STATUSES: ReadonlySet<unknown> = new Set<RewardStatus>([
  "available",
  "paused",
  "sold_out",
]);

const positiveWholeNumber = (value: unknown) =>
  positiveNumber(wholeNumber(value));

const TWITCH_IMAGES = "static-cdn.jtvnw.net";

function twitchImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === TWITCH_IMAGES
      ? value
      : null;
  } catch {
    return null;
  }
}

const isStatus = (value: unknown): value is RewardStatus =>
  REWARD_STATUSES.has(value);

export function readReward(value: unknown): Reward[] {
  const reward = asRecord(value);
  const { id, title, cost, status } = reward;
  if (typeof id !== "string" || typeof title !== "string") return [];
  if (!Number.isSafeInteger(cost) || (cost as number) < 0) return [];
  if (!isStatus(status)) return [];
  return [
    {
      id,
      title,
      prompt: stringOrNull(reward.prompt),
      cost: cost as number,
      color: stringOrNull(reward.color),
      image: twitchImage(reward.image),
      input: reward.input === true,
      status,
      cooldownEndsAt: stringOrNull(reward.cooldownEndsAt),
      perUserLimit: positiveWholeNumber(reward.perUserLimit),
      redeemedThisStream: wholeNumber(reward.redeemedThisStream),
      subOnly: reward.subOnly === true,
    },
  ];
}

function readDrop(value: unknown): DropProgress | null {
  const { game, watched, required, reward, image } = asRecord(value);
  if (typeof game !== "string") return null;
  const minutes = wholeNumber(watched);
  const needed = positiveWholeNumber(required);
  return minutes === null || needed === null
    ? null
    : {
        game,
        watched: minutes,
        required: needed,
        reward: stringOrNull(reward),
        image: twitchImage(image),
      };
}

const CHANNEL_ID = /^\d+$/;

function readEarnedAt(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(asRecord(value)).filter(
      (entry): entry is [string, string] =>
        CHANNEL_ID.test(entry[0]) && typeof entry[1] === "string",
    ),
  );
}

export function readReport(value: unknown): ChannelReport | null {
  const { channel, balance, bonusReady, subscribed, rewards, drop, earnedAt } =
    asRecord(value);
  const login =
    typeof channel === "string" ? channelFromPath(`/${channel}`) : null;
  const amount =
    balance === null || balance === undefined
      ? null
      : Number.isSafeInteger(balance)
        ? (balance as number)
        : undefined;
  if (!login || amount === undefined) return null;
  return {
    channel: login,
    balance: amount,
    bonusReady: bonusReady === true,
    subscribed: typeof subscribed === "boolean" ? subscribed : null,
    rewards: Array.isArray(rewards) ? rewards.flatMap(readReward) : [],
    drop: readDrop(drop),
    earnedAt: readEarnedAt(earnedAt),
  };
}
