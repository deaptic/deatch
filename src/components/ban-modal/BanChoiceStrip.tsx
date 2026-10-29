import { ShieldBan, ShieldCheck } from "lucide-solid";
import Segmented from "../ui/Segmented.tsx";
import {
  type BanChoice,
  TIMEOUT_PRESETS,
} from "../../lib/constants/timeouts.ts";
import { t } from "../../lib/i18n/index.ts";
import { formatDuration } from "../../lib/format/duration.ts";

type Props = {
  value?: BanChoice;
  onChange: (choice: BanChoice) => void;
};

export default function BanChoiceStrip(props: Props) {
  return (
    <Segmented
      label={t("BAN_CHOICE")}
      value={props.value}
      options={[
        {
          value: "unban",
          label: t("BAN_UNBAN"),
          icon: <ShieldCheck class="text-positive" />,
        },
        ...TIMEOUT_PRESETS.map((p) => ({
          value: p.label,
          label: formatDuration(p.seconds),
        })),
        {
          value: "ban",
          label: t("BAN_BAN"),
          icon: <ShieldBan class="text-negative" />,
        },
      ]}
      onChange={props.onChange}
      fill
    />
  );
}
