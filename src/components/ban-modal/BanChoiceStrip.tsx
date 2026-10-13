import type { JSX } from "solid-js";
import { ShieldBan, ShieldCheck } from "lucide-solid";
import Segmented from "../ui/Segmented.tsx";
import {
  TIMEOUT_PRESETS,
  type TimeoutLabel,
} from "../../lib/constants/timeouts.ts";

// A preset label picks a timeout; "ban" and "unban" are the two ends.
export type BanChoice = "unban" | "ban" | TimeoutLabel;

/// Seconds for a timeout, null for a permanent ban.
export function secondsFor(choice: Exclude<BanChoice, "unban">): number | null {
  if (choice === "ban") return null;
  const preset = TIMEOUT_PRESETS.find((p) => p.label === choice);
  if (!preset) throw new Error(`unknown timeout preset: ${choice}`);
  return preset.seconds;
}

const OPTIONS: { value: BanChoice; label: string; icon?: JSX.Element }[] = [
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
