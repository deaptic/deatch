import { Show } from "solid-js";
import { t } from "../../../../shared/i18n/index.ts";
import { formatViewers } from "../../../../shared/format/stream.ts";
import type {
  Prediction,
  PredictionEnd,
} from "../../../../shared/types/index.ts";
import Button from "../../../../kit/Button.tsx";
import ActivityRow from "../ActivityRow.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";
import OptionBars from "../OptionBars.tsx";
import { untilIso } from "./countdown.ts";

export default function PredictionRow(props: {
  prediction: Prediction;
  now: number;
  onEnd: (end: PredictionEnd) => void;
}) {
  const end = (e: PredictionEnd) => props.onEnd(e);
  const phase = () => props.prediction.phase;
  const options = () =>
    props.prediction.outcomes.map((o) => ({
      id: o.id,
      title: o.title,
      value: o.channelPoints,
      detail: t("HEADER_PREDICTION_POINTS_VALUE", {
        points: formatViewers(o.channelPoints),
      }),
    }));
  const meta = () => {
    const p = phase();
    return p.kind === "open"
      ? t("HEADER_PREDICTION_LOCKS_IN_STATUS", {
          time: untilIso(p.locksAt, props.now),
        })
      : t("HEADER_PICK_WINNER_LABEL");
  };

  return (
    <ActivityRow
      icon={<ActivityIcon kind="prediction" />}
      title={props.prediction.title}
      meta={meta()}
      actions={
        <>
          <Show when={phase().kind === "open"}>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => end({ kind: "lock" })}
            >
              {t("HEADER_LOCK_PREDICTION_LABEL")}
            </Button>
          </Show>
          <Button
            variant="neutral"
            size="sm"
            onClick={() => end({ kind: "cancel" })}
          >
            {t("HEADER_REFUND_PREDICTION_LABEL")}
          </Button>
        </>
      }
    >
      <OptionBars
        options={options()}
        action={
          phase().kind === "locked"
            ? (o) => (
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() =>
                    end({ kind: "resolve", winningOutcomeId: o.id })
                  }
                >
                  {t("HEADER_PICK_OUTCOME_LABEL")}
                </Button>
              )
            : undefined
        }
      />
    </ActivityRow>
  );
}
