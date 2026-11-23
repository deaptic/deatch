import { t } from "../../../shared/i18n/index.ts";
import { setChannelForm } from "../../navigation/index.ts";
import Button from "../../../kit/Button.tsx";
import ActivityRow from "../ui/ActivityRow.tsx";
import { ActivityIcon } from "../ui/ActivityIcon.tsx";

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
