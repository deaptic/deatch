import { t } from "../../../lib/i18n/index.ts";
import * as activity from "../../../lib/services/activity.ts";
import Button from "../../ui/Button.tsx";
import ActivityRow from "../ActivityRow.tsx";
import { ActivityIcon } from "../activityIcons.tsx";

export default function ShieldRow(props: { broadcasterId: string }) {
  return (
    <ActivityRow
      icon={<ActivityIcon kind="shield" />}
      title={t("HEADER_SHIELD_ACTIVE_STATUS")}
      actions={
        <Button
          variant="neutral"
          size="sm"
          onClick={() => activity.setShield(props.broadcasterId, false)}
        >
          {t("HEADER_SHIELD_OFF_LABEL")}
        </Button>
      }
    />
  );
}
