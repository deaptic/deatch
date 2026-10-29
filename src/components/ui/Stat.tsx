import { type JSX, Show } from "solid-js";
import { createCopyable } from "./copyable.ts";

type Props = {
  icon: JSX.Element;
  value: string;
  truncate?: boolean;
  copy?: string;
};

export default function Stat(props: Props) {
  const copyable = createCopyable("text-ink-soft");

  return (
    <Show when={props.value}>
      <span
        class={`flex items-center gap-2 tabular-nums whitespace-nowrap ${
          props.truncate ? "min-w-0" : "shrink-0"
        } ${props.copy ? copyable.class() : "text-ink-soft"}`}
        data-tip={props.copy ? copyable.tip() : undefined}
        {...(props.copy && copyable.handlers(() => props.copy ?? ""))}
      >
        <span class="shrink-0 text-ink-faint [&>svg]:size-3.5">
          {props.icon}
        </span>
        <span class={props.truncate ? "truncate" : ""}>{props.value}</span>
      </span>
    </Show>
  );
}
