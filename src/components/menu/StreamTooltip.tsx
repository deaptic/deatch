import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import type { Stream } from "../../lib/types/twitch/stream.ts";
import type { User } from "../../lib/types/twitch/user.ts";
import { formatViewers } from "../../lib/format/stream.ts";

type Props = {
  x: number;
  y: number;
  user: User;
  stream?: Stream;
};

export default function StreamTooltip(props: Props) {
  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          left: `${props.x}px`,
          top: `${props.y}px`,
          transform: "translateY(-50%)",
        }}
        class="bg-bg-dark border border-border-muted rounded-lg px-3 py-2 shadow-xl pointer-events-none z-50 min-w-40 max-w-xs w-max"
      >
        <p class="text-text text-sm font-semibold whitespace-nowrap truncate">
          {props.user.displayName}
          <Show when={props.stream?.game.name}>
            <span class="text-text-muted font-normal">
              {" "}
              - {props.stream!.game.name}
            </span>
          </Show>
        </p>
        <Show when={props.stream?.title}>
          <p class="text-text-muted text-xs mt-0.5 wrap-break-word">
            {props.stream!.title}
          </p>
        </Show>
        <Show when={props.stream}>
          <div class="flex items-center gap-1.5 mt-1">
            <div class="size-1.5 rounded-full bg-danger" />
            <span class="text-danger text-xs font-medium whitespace-nowrap">
              Live | {formatViewers(props.stream!.viewerCount)} viewers
            </span>
          </div>
        </Show>
      </div>
    </Portal>
  );
}
