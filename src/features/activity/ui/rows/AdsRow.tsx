import { t } from "../../../../shared/i18n/index.ts";
import type { AdSchedule } from "../../../../shared/types/index.ts";
import Button from "../../../../kit/Button.tsx";
import StripRow from "../../../../kit/StripRow.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";
import { untilMs } from "./countdown.ts";

export default function AdsRow(props: {
  schedule: AdSchedule;
  now: number;
  onSnooze: () => void;
}) {
  return (
    <StripRow
      icon={<ActivityIcon kind="ads" />}
      title={t("HEADER_AD_NEXT_STATUS", {
        time: untilMs(props.schedule.nextAdMs ?? 0, props.now),
      })}
      meta={t("HEADER_AD_SNOOZES_STATUS", {
        count: props.schedule.snoozeCount,
      })}
      actions={
        <Button
          variant="neutral"
          size="sm"
          disabled={props.schedule.snoozeCount === 0}
          onClick={() => props.onSnooze()}
        >
          {t("HEADER_AD_SNOOZE_LABEL")}
        </Button>
      }
    />
  );
}
