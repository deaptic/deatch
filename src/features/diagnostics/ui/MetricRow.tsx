import { Show } from "solid-js";
import Text from "../../../kit/Text.tsx";

type Tone = "default" | "caution" | "negative";

type Props = {
  label: string;
  value: string;
  detail?: string;
  tone?: Tone;
};

const VALUE: Record<Tone, string> = {
  default: "text-ink",
  caution: "text-caution",
  negative: "text-negative",
};

export default function MetricRow(props: Props) {
  return (
    <div class="flex items-baseline gap-3 text-base">
      <Text truncate tone="soft" class="flex-1 min-w-0">
        {props.label}
      </Text>
      <Show when={props.detail}>
        <Text size="sm" tone="soft" tabular>
          {props.detail}
        </Text>
      </Show>
      <span class={`tabular-nums ${VALUE[props.tone ?? "default"]}`}>
        {props.value}
      </span>
    </div>
  );
}
