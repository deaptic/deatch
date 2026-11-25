import { t } from "../../../../shared/i18n/index.ts";
import Button from "../../../../kit/Button.tsx";
import Banner from "../../../../kit/Banner.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";

export default function ShieldRow(props: { onTurnOff: () => void }) {
  return (
    <Banner
      icon={<ActivityIcon kind="shield" />}
      title={t("HEADER_SHIELD_ACTIVE_STATUS")}
      actions={
        <Button variant="neutral" size="sm" onClick={() => props.onTurnOff()}>
          {t("HEADER_SHIELD_OFF_LABEL")}
        </Button>
      }
    />
  );
}
