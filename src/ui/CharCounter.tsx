import { Show } from "solid-js";

type Props = {
  value: () => string;
  max: number;
  warnAt?: number;
  class?: string;
};

export default function CharCounter(props: Props) {
  const remaining = () => props.max - props.value().length;
  const threshold = () => props.warnAt ?? 100;
  return (
    <Show when={remaining() <= threshold()}>
      <span
        class={`text-xs font-medium tabular-nums ${
          remaining() <= 0 ? "text-danger" : "text-text-muted"
        } ${props.class ?? ""}`}
      >
        {remaining()}
      </span>
    </Show>
  );
}
