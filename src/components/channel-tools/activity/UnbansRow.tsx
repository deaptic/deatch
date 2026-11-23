import { t } from "../../../shared/i18n/index.ts";
import { setChannelForm } from "../../../lib/stores/ui.ts";
import Button from "../../../kit/Button.tsx";
import ActivityRow from "../ActivityRow.tsx";
import { ActivityIcon } from "../activityIcons.tsx";

export default function UnbansRow(props: { count: number }) {
  return (
    <ActivityRow
      icon={<ActivityIcon kind="unbans" />}
      title={t("HEADER_UNBAN_REQUESTS_STATUS", { count: props.count })}
      actions={
        <Button
          variant="neutral"
          size="sm"
          onClick={() => setChannelForm("unbans")}
        >
          {t("HEADER_REVIEW_LABEL")}
        </Button>
      }
    />
  );
}
