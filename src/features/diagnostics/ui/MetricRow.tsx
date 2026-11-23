import { Show } from "solid-js";

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
    <div class="flex items-baseline gap-3 text-body">
      <span class="flex-1 min-w-0 truncate text-ink-soft">{props.label}</span>
      <Show when={props.detail}>
        <span class="text-small text-ink-soft tabular-nums">
          {props.detail}
        </span>
      </Show>
      <span class={`tabular-nums ${VALUE[props.tone ?? "default"]}`}>
        {props.value}
      </span>
    </div>
  );
}
