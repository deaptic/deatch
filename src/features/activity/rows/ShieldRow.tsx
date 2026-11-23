import { t } from "../../../shared/i18n/index.ts";
import * as activity from "../store.ts";
import Button from "../../../kit/Button.tsx";
import ActivityRow from "../ui/ActivityRow.tsx";
import { ActivityIcon } from "../ui/ActivityIcon.tsx";

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
