// A running poll or prediction from its EventSub stage, in the same shape the
// backend returns for the one already running when a channel opens.

import type {
  Poll,
  Prediction,
  RawPoll,
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

/// Begin and progress carry when voting locks; the lock stage does not.
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
