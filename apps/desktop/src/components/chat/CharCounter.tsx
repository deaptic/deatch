import { Show } from "solid-js";

const SHOW_WITHIN = 99;

type Props = {
  value: () => string;
  max: number;
};

export default function CharCounter(props: Props) {
  const remaining = () => props.max - props.value().length;
  return (
    <Show when={remaining() <= SHOW_WITHIN}>
      <span
        class={`absolute right-3 -bottom-2 px-1 bg-surface text-micro tabular-nums pointer-events-none ${
          remaining() <= 0 ? "text-negative" : "text-ink-faint"
        }`}
      >
        {remaining()}
      </span>
    </Show>
  );
}
