import type {
  CharityCampaign,
  DonationAmount,
  Poll,
  Prediction,
  RawPoll,
  RawCampaignAmount,
  RawCharityCampaign,
  RawPrediction,
} from "../types/index.ts";

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
