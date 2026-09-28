import { Show } from "solid-js";

type Props = {
  value: () => string;
  max: number;
};

export default function CharCounter(props: Props) {
  const remaining = () => props.max - props.value().length;
  return (
    <Show when={props.value().length >= props.max * 0.8}>
      <span
        class={`text-micro tabular-nums ${
          remaining() <= 0 ? "text-negative" : "text-ink-faint"
        }`}
      >
        {remaining()}
      </span>
    </Show>
  );
}
