import { t } from "../../../lib/i18n/index.ts";
import * as activity from "../../../lib/services/activity.ts";
import type { AdSchedule } from "../../../lib/types/index.ts";
import Button from "../../../kit/Button.tsx";
import ActivityRow from "../ActivityRow.tsx";
import { ActivityIcon } from "../activityIcons.tsx";
import { untilMs } from "./countdown.ts";

export default function AdsRow(props: {
  broadcasterId: string;
  schedule: AdSchedule;
}) {
  return (
    <ActivityRow
      icon={<ActivityIcon kind="ads" />}
      title={t("HEADER_AD_NEXT_STATUS", {
        time: untilMs(props.schedule.nextAdMs ?? 0),
      })}
      meta={t("HEADER_AD_SNOOZES_STATUS", {
        count: props.schedule.snoozeCount,
      })}
      actions={
        <Button
          variant="neutral"
          size="sm"
          disabled={props.schedule.snoozeCount === 0}
          onClick={() => activity.snoozeAd(props.broadcasterId)}
        >
          {t("HEADER_AD_SNOOZE_LABEL")}
        </Button>
      }
    />
  );
}
