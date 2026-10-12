import { Show } from "solid-js";
import { formatViewers } from "../../lib/format/stream.ts";

type Props = {
  viewers?: number;
  solid?: boolean;
};

export default function LivePill(props: Props) {
  return (
    <span
      class={`inline-flex items-center gap-1.5 h-5.5 pl-2 pr-2.5 rounded-full text-micro tabular-nums whitespace-nowrap ${
        props.solid ? "bg-live text-on-accent" : "bg-live/15 text-live"
      }`}
    >
      <span class="size-1.5 rounded-full bg-current" />
      Live
      <Show when={props.viewers !== undefined}>
        <span class="opacity-80">· {formatViewers(props.viewers!)}</span>
      </Show>
    </span>
  );
}
