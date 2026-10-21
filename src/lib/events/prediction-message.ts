// Pure text for prediction events, kept apart from the listener so it can be
// tested without Tauri.

import { formatSpan } from "../format/duration.ts";
import { formatList } from "../format/list.ts";
import { t } from "../i18n/index.ts";
import type { RawPrediction } from "../types/twitch/eventsub.ts";

type Outcome = RawPrediction["outcomes"][number];

function stake(o: Outcome): string {
  return t("PREDICTION_STAKE", {
    outcome: o.title,
    points: o.channel_points ?? 0,
    users: o.users ?? 0,
  });
}

export function predictionBegin(raw: RawPrediction): string {
  return t("PREDICTION_BEGIN", {
    title: raw.title,
    outcomes: formatList(raw.outcomes.map((o) => o.title)),
    duration: formatSpan(raw.started_at, raw.locks_at ?? raw.started_at),
  });
}

export function predictionLock(raw: RawPrediction): string {
  return t("PREDICTION_LOCK", {
    title: raw.title,
    stakes: formatList(raw.outcomes.map(stake)),
  });
}

export function predictionEnd(raw: RawPrediction): string {
  const winner = raw.outcomes.find((o) => o.id === raw.winning_outcome_id);
  if (raw.status === "canceled" || !winner) {
    return t("PREDICTION_CANCELED", { title: raw.title });
  }
  const pot = raw.outcomes.reduce((sum, o) => sum + (o.channel_points ?? 0), 0);
  return t("PREDICTION_RESOLVED", {
    title: raw.title,
    outcome: winner.title,
    points: pot,
    users: winner.users ?? 0,
  });
}
