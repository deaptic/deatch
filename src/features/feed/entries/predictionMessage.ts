import { formatSpan } from "../../../shared/format/duration.ts";
import { formatList } from "../../../shared/format/list.ts";
import { t } from "../../../shared/i18n/index.ts";
import type { NoticeText, RawPrediction } from "../../../lib/types/index.ts";

type Outcome = RawPrediction["outcomes"][number];

function stake(o: Outcome): string {
  return t("FEED_PREDICTION_STAKE_VALUE", {
    outcome: o.title,
    points: o.channel_points ?? 0,
    users: o.users ?? 0,
  });
}

export function predictionBegin(raw: RawPrediction): NoticeText {
  return {
    text: t("FEED_PREDICTION_STARTED_LINE", {
      title: raw.title,
      duration: formatSpan(raw.started_at, raw.locks_at ?? raw.started_at),
    }),
    detail: t("FEED_PREDICTION_OUTCOMES_LINE", {
      outcomes: formatList(raw.outcomes.map((o) => o.title)),
    }),
  };
}

export function predictionLock(raw: RawPrediction): NoticeText {
  return {
    text: t("FEED_PREDICTION_LOCKED_LINE", { title: raw.title }),
    detail: formatList(raw.outcomes.map(stake)),
  };
}

export function predictionEnd(raw: RawPrediction): NoticeText {
  const winner = raw.outcomes.find((o) => o.id === raw.winning_outcome_id);
  if (raw.status === "canceled" || !winner) {
    return { text: t("FEED_PREDICTION_CANCELED_LINE", { title: raw.title }) };
  }
  const pot = raw.outcomes.reduce((sum, o) => sum + (o.channel_points ?? 0), 0);
  return {
    text: t("FEED_PREDICTION_RESOLVED_LINE", {
      title: raw.title,
      outcome: winner.title,
    }),
    detail: t("FEED_PREDICTION_PAYOUT_LINE", {
      points: pot,
      users: winner.users ?? 0,
    }),
  };
}
