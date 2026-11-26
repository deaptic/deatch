import { asRecord, isFiniteNumber } from "../../shared/record.ts";

export type TwitchReward = {
  id: string;
  title: string;
  prompt?: string | null;
  cost: number;
  backgroundColor?: string | null;
  image?: { url2x?: string } | null;
  defaultImage?: { url2x?: string } | null;
  isUserInputRequired?: boolean;
  isPaused?: boolean;
  isInStock?: boolean;
  isEnabled?: boolean;
  isSubOnly?: boolean;
  pricingType?: string;
  cooldownExpiresAt?: string | null;
  maxPerUserPerStreamSetting?: {
    isEnabled?: boolean;
    maxPerUserPerStream?: number;
  } | null;
};

export type TwitchPoints = {
  channelLogin: string;
  channelID: string;
  balance: number;
  customRewards: TwitchReward[];
  userRedemptions?: {
    reward?: { id?: string } | null;
    userRedemptionsCurrentStream?: number | null;
  }[];
};

export type ClaimButton = {
  getClaim: () => unknown;
  onClick: () => void;
  props: { hidden?: boolean };
  state?: { error?: unknown } | null;
};

type Result = { data?: unknown };

export type Apollo = {
  mutate: (options: { mutation: object; variables: object }) => Promise<Result>;
  query: (options: { query: object; fetchPolicy: string }) => Promise<Result>;
};

export function isClaimButton(node: unknown): node is ClaimButton {
  const button = asRecord(node);
  return (
    typeof button.getClaim === "function" &&
    typeof button.onClick === "function" &&
    asRecord(button.props).claimCommunityPoints != null
  );
}

export function pointsOf(props: unknown): TwitchPoints | null {
  const value = asRecord(asRecord(props).value);
  const valid =
    value.isChannelPointsEnabled === true &&
    isFiniteNumber(value.balance) &&
    typeof value.channelLogin === "string" &&
    Array.isArray(value.customRewards);
  return valid ? (value as TwitchPoints) : null;
}

export function subscribedOf(props: unknown): boolean | null {
  const value = asRecord(asRecord(props).value);
  const keys = Object.keys(value);
  const only = keys.length === 1 && keys[0] === "isSubscribed";
  return only && typeof value.isSubscribed === "boolean"
    ? value.isSubscribed
    : null;
}

export function apolloOf(props: unknown): Apollo | null {
  const record = asRecord(props);
  const found = asRecord(record.client ?? asRecord(record.value).client);
  return typeof found.mutate === "function" ? (found as Apollo) : null;
}
