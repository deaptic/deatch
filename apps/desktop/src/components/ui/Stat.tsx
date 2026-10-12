import { type JSX, Show } from "solid-js";
import { createCopied } from "../../lib/primitives/createCopied.ts";

type Props = {
  icon: JSX.Element;
  value: string;
  truncate?: boolean;
  copy?: string;
};

export default function Stat(props: Props) {
  const { copied, copy } = createCopied();

  return (
    <Show when={props.value}>
      <span
        class={`flex items-center gap-2 tabular-nums whitespace-nowrap transition-colors duration-snap ${
          props.truncate ? "min-w-0" : "shrink-0"
        } ${
          copied()
            ? "text-positive"
            : props.copy
            ? "text-ink-soft hover:text-ink"
            : "text-ink-soft"
        } ${props.copy ? "cursor-pointer" : ""}`}
        title={props.copy ? "Click to copy" : undefined}
        onClick={() => {
          if (props.copy) copy(props.copy);
        }}
      >
        <span class="shrink-0 text-ink-faint [&>svg]:size-3.5">
          {props.icon}
        </span>
        <span class={props.truncate ? "truncate" : ""}>{props.value}</span>
      </span>
    </Show>
  );
}
