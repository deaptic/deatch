import { t } from "../../shared/i18n/index.ts";
import Segmented from "../../kit/Segmented.tsx";

export type Period = "day" | "week";

type Props = {
  value: Period;
  onChange: (period: Period) => void;
};

export default function PeriodSwitch(props: Props) {
  return (
    <Segmented
      label={t("HOME_PERIOD_LABEL")}
      value={props.value}
      options={[
        { value: "day", label: t("HOME_TODAY_LABEL") },
        { value: "week", label: t("HOME_THIS_WEEK_LABEL") },
      ]}
      onChange={props.onChange}
    />
  );
}
