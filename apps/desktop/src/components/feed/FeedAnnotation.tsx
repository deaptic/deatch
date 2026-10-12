import { type JSX, Show } from "solid-js";
import type { Density } from "../../lib/constants/density.ts";
import Timestamp from "../ui/Timestamp.tsx";

const LEADS: Record<Density, { box: string; spine: string }> = {
  compact: { box: "h-lh aspect-square mr-1", spine: "left-0 -right-0.5" },
  comfortable: {
    box: "w-(--chat-tile) self-stretch mr-3",
    spine: "left-1/2 -right-2",
  },
};

type Props = {
  density: Density;
  timestamp?: number;
  connector?: boolean;
  children: JSX.Element;
};

export default function FeedAnnotation(props: Props) {
  const lead = () => LEADS[props.density];
  return (
    <div class="flex items-center">
      <Show when={props.timestamp}>
        {(ts) => (
          <span class="invisible" aria-hidden="true">
            <Timestamp ts={ts()} variant="column" />
          </span>
        )}
      </Show>
      <Show when={props.connector || props.density === "comfortable"}>
        <span class={`${lead().box} shrink-0 relative`}>
          <Show when={props.connector}>
            <span
              class={`${lead().spine} absolute top-1/2 bottom-0 border-l-2 border-t-2 border-ink-faint rounded-tl-sm`}
            />
          </Show>
        </span>
      </Show>
      <div class="flex-1 min-w-0">{props.children}</div>
    </div>
  );
}
