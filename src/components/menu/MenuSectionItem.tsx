import { createSignal, Show } from "solid-js";
import StreamTooltip from "./StreamTooltip";
import type { Channel } from "../../types";

type Props = {
  channel: Channel;
  status?: "live" | "self";
  selected?: boolean;
  unread?: boolean;
  mentions?: number;
  dimmed?: boolean;
  square?: boolean;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
};

export default function MenuSectionItem(props: Props) {
  const [tooltip, setTooltip] = createSignal<{ x: number; y: number } | null>(null);

  return (
    <>
      <button
        onClick={props.onClick}
        onAuxClick={(e) => {
          if (e.button !== 1 || !props.onMiddleClick) return;
          e.preventDefault();
          setTooltip(null);
          props.onMiddleClick();
        }}
        onMouseDown={(e) => {
          if (e.button === 1) e.preventDefault();
        }}
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTooltip({ x: r.right + 8, y: r.top + r.height / 2 });
        }}
        onMouseLeave={() => setTooltip(null)}
        onContextMenu={(e) => {
          if (!props.onContextMenu) return;
          e.preventDefault();
          setTooltip(null);
          props.onContextMenu(e.clientX, e.clientY);
        }}
        style={{ opacity: props.dimmed ? 0.4 : 1 }}
        class={`group relative w-full flex items-center justify-center transition-colors cursor-pointer ${
          props.square ? "px-2 py-3" : "p-2"
        } ${props.selected ? "" : "hover:bg-bg"}`}
      >
        <Show when={props.selected}>
          <div class="absolute left-0 top-1 bottom-1 w-1 bg-highlight rounded-r" />
        </Show>
        <Show when={!props.selected && props.unread}>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-1 bg-highlight rounded-r group-hover:hidden" />
        </Show>
        <Show when={!props.selected}>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-highlight rounded-r hidden group-hover:block" />
        </Show>
        <div class="relative shrink-0">
          <img
            src={props.channel.profile_image_url || "https://static-cdn.jtvnw.net/user-default-pictures-uec5k4/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png"}
            alt={props.channel.user_name}
            class={`w-8 h-8 rounded-lg transition-opacity ${
              props.status || props.selected ? "opacity-100" : "opacity-50 group-hover:opacity-100"
            }`}
          />
          <Show when={(props.mentions ?? 0) > 0}>
            <div class="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-danger rounded-full border-2 border-bg flex items-center justify-center">
              <span class="text-[10px] font-bold text-text leading-none tabular-nums">
                {props.mentions! > 99 ? "99+" : props.mentions}
              </span>
            </div>
          </Show>
        </div>
      </button>
      <Show when={tooltip()}>
        {(t) => (
          <StreamTooltip x={t().x} y={t().y} channel={props.channel} live={props.status === "live"} />
        )}
      </Show>
    </>
  );
}
