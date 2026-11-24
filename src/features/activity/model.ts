import type {
  CharityCampaign,
  DonationAmount,
  Goal,
  HypeTrain,
  PinnedMessage,
  Poll,
  Prediction,
  UnbanRequest,
} from "../../shared/types/index.ts";
import type {
  RawPoll,
  RawCampaignAmount,
  RawCharityCampaign,
  RawGoal,
  RawHypeTrain,
  RawPrediction,
  RawUnbanRequestCreate,
} from "../../platform/twitch/eventsubPayloads.ts";

export function pollFrom(raw: RawPoll): Poll {
  return {
    id: raw.id,
    title: raw.title,
    choices: raw.choices.map((c) => ({
      id: c.id,
      title: c.title,
      votes: c.votes ?? 0,
    })),
    endsAt: raw.ends_at ?? raw.started_at,
  };
}

export function predictionFrom(raw: RawPrediction): Prediction {
  return {
    id: raw.id,
    title: raw.title,
    phase: raw.locks_at
      ? { kind: "open", locksAt: raw.locks_at }
      : { kind: "locked" },
    outcomes: raw.outcomes.map((o) => ({
      id: o.id,
      title: o.title,
      channelPoints: o.channel_points ?? 0,
      users: o.users ?? 0,
    })),
  };
}

function amountFrom(raw: RawCampaignAmount): DonationAmount {
  return {
    value: raw.value,
    decimalPlaces: raw.decimal_places,
    currency: raw.currency,
  };
}

export function charityFrom(raw: RawCharityCampaign): CharityCampaign {
  return {
    charityName: raw.charity_name,
    current: amountFrom(raw.current_amount),
    target: amountFrom(raw.target_amount),
  };
}

export function unbanRequestFrom(raw: RawUnbanRequestCreate): UnbanRequest {
  return {
    id: raw.id,
    user: {
      id: raw.user_id,
      login: raw.user_login,
      displayName: raw.user_name,
    },
    text: raw.text,
    createdAt: raw.created_at,
  };
}

export function withoutUnbanRequest(
  list: UnbanRequest[],
  id: string,
): UnbanRequest[] {
  return list.filter((r) => r.id !== id);
}

export function withUnbanRequest(
  list: UnbanRequest[],
  request: UnbanRequest,
): UnbanRequest[] {
  return [...withoutUnbanRequest(list, request.id), request];
}

export function goalFrom(raw: RawGoal): Goal {
  return {
    id: raw.id,
    kind: raw.type,
    description: raw.description,
    current: raw.current_amount,
    target: raw.target_amount,
  };
}

export function withGoal(list: Goal[], goal: Goal): Goal[] {
  const at = list.findIndex((g) => g.id === goal.id);
  return at < 0 ? [...list, goal] : list.with(at, goal);
}

export const RAID_DURATION_MS = 90_000;

export function secondsLeft(startedAt: number, now: number): number {
  return Math.max(0, Math.ceil((RAID_DURATION_MS - (now - startedAt)) / 1000));
}

export function isPinActive(pin: PinnedMessage, now: number): boolean {
  return pin.endsAt === null || Date.parse(pin.endsAt) > now;
}

export function hypeTrainFrom(raw: RawHypeTrain): HypeTrain | null {
  if (!raw.expires_at) return null;
  return {
    id: raw.id,
    level: raw.level,
    progress: raw.progress ?? 0,
    goal: raw.goal ?? 0,
    expiresAt: raw.expires_at,
  };
}
