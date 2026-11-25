import { type JSX, Show } from "solid-js";

type Props = {
  class?: string;
  count?: number;
  truncate?: boolean;
  children: JSX.Element;
};

export default function SectionTitle(props: Props) {
  return (
    <h2
      class={`text-heading text-ink ${
        props.count !== undefined ? "flex items-baseline gap-2" : ""
      } ${props.truncate ? "min-w-0 truncate" : ""} ${props.class ?? ""}`}
    >
      {props.children}
      <Show when={props.count}>
        <span class="text-body tabular-nums text-ink-faint">{props.count}</span>
      </Show>
    </h2>
  );
}
