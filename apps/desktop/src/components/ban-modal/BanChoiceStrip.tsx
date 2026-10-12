import { ShieldBan, ShieldCheck } from "lucide-solid";
import Segmented from "../ui/Segmented.tsx";
import { TIMEOUT_PRESETS } from "../../lib/constants/timeouts.ts";

// A preset label picks a timeout; "ban" and "unban" are the two ends.
export type BanChoice = "unban" | "ban" | string;

export function secondsFor(choice: BanChoice): number | null {
  return TIMEOUT_PRESETS.find((p) => p.label === choice)?.seconds ?? null;
}

const OPTIONS = [
  {
    value: "unban",
    label: "Unban",
    icon: <ShieldCheck class="text-positive" />,
  },
  ...TIMEOUT_PRESETS.map((p) => ({ value: p.label, label: p.label })),
  { value: "ban", label: "Ban", icon: <ShieldBan class="text-negative" /> },
];

type Props = {
  value?: BanChoice;
  onChange: (choice: BanChoice) => void;
};

export default function BanChoiceStrip(props: Props) {
  return (
    <Segmented
      value={props.value}
      options={OPTIONS}
      onChange={props.onChange}
      fill
    />
  );
}
