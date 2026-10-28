// Pure text for prediction events, kept apart from the listener so it can be
// tested without Tauri.

import { formatSpan } from "../format/duration.ts";
import { formatList } from "../format/list.ts";
import { t } from "../i18n/index.ts";
import type { NoticeText, RawPrediction } from "../types/index.ts";

type Outcome = RawPrediction["outcomes"][number];

function stake(o: Outcome): string {
  return t("PREDICTION_STAKE", {
    outcome: o.title,
    points: o.channel_points ?? 0,
    users: o.users ?? 0,
  });
}

export function predictionBegin(raw: RawPrediction): NoticeText {
  return {
    text: t("PREDICTION_BEGIN", {
      title: raw.title,
      duration: formatSpan(raw.started_at, raw.locks_at ?? raw.started_at),
    }),
    detail: t("PREDICTION_OUTCOMES", {
      outcomes: formatList(raw.outcomes.map((o) => o.title)),
    }),
  };
}

export function predictionLock(raw: RawPrediction): NoticeText {
  return {
    text: t("PREDICTION_LOCK", { title: raw.title }),
    detail: formatList(raw.outcomes.map(stake)),
  };
}

export function predictionEnd(raw: RawPrediction): NoticeText {
  const winner = raw.outcomes.find((o) => o.id === raw.winning_outcome_id);
  if (raw.status === "canceled" || !winner) {
    return { text: t("PREDICTION_CANCELED", { title: raw.title }) };
  }
  const pot = raw.outcomes.reduce((sum, o) => sum + (o.channel_points ?? 0), 0);
  return {
    text: t("PREDICTION_RESOLVED", { title: raw.title, outcome: winner.title }),
    detail: t("PREDICTION_PAYOUT", { points: pot, users: winner.users ?? 0 }),
  };
}
