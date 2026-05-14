import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import type { Channel } from "../../types";

type Props = {
  x: number;
  y: number;
  channel: Channel;
  live?: boolean;
};

function formatViewers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

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
        class="bg-bg-dark border border-border rounded-lg px-3 py-2 shadow-xl pointer-events-none z-50 min-w-40 max-w-xs w-max"
      >
        <p class="text-text text-sm font-semibold whitespace-nowrap truncate">
          {props.channel.user_name}
          <Show when={props.channel.game_name}>
            <span class="text-text-muted font-normal">
              {" "}
              - {props.channel.game_name}
            </span>
          </Show>
        </p>
        <Show when={props.channel.title}>
          <p class="text-text-muted text-xs mt-0.5 wrap-break-word">
            {props.channel.title}
          </p>
        </Show>
        <Show when={props.live && props.channel.viewer_count !== undefined}>
          <div class="flex items-center gap-1.5 mt-1">
            <div class="w-1.5 h-1.5 rounded-full bg-danger" />
            <span class="text-danger text-xs font-medium whitespace-nowrap">
              Live | {formatViewers(props.channel.viewer_count!)} viewers
            </span>
          </div>
        </Show>
      </div>
    </Portal>
  );
}
