import { ShieldBan, ShieldCheck } from "lucide-solid";
import Segmented from "../../../kit/Segmented.tsx";
import { type BanChoice, TIMEOUT_PRESETS } from "../banDurations.ts";
import { t } from "../../../shared/i18n/index.ts";
import { formatDuration } from "../../../shared/format/duration.ts";

type Props = {
  value?: BanChoice;
  onChange: (choice: BanChoice) => void;
};

export default function BanChoiceStrip(props: Props) {
  return (
    <Segmented
      label={t("BAN_CHOICE_LABEL")}
      size="lg"
      value={props.value}
      options={[
        {
          value: "unban",
          label: t("BAN_UNBAN_LABEL"),
          icon: <ShieldCheck class="text-positive" />,
        },
        ...TIMEOUT_PRESETS.map((p) => ({
          value: p.label,
          label: formatDuration(p.seconds),
        })),
        {
          value: "ban",
          label: t("BAN_BAN_LABEL"),
          icon: <ShieldBan class="text-negative" />,
        },
      ]}
      onChange={props.onChange}
      fill
    />
  );
}
