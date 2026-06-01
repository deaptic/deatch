import { createSignal, onCleanup, onMount, Show, type JSX } from "solid-js";
import StreamTooltip from "./StreamTooltip";
import { streamForUserId } from "../../lib/stores/channels";
import type { User } from "../../lib/types/twitch/user";
import { useNavigationOptional } from "../ui/Navigation";
import { DEFAULT_AVATAR_URL } from "../../lib/constants";

const DEFAULT_AVATAR = DEFAULT_AVATAR_URL;

type Props = {
  channel: User;
  status?: "live" | "self";
  selected?: boolean;
  unread?: boolean;
  mentions?: number;
  dimmed?: boolean;
  square?: boolean;
  bottomRight?: JSX.Element;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
};

export default function MenuSectionItem(props: Props) {
  const [tooltip, setTooltip] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  const nav = useNavigationOptional();
  let btnRef!: HTMLButtonElement;

  onMount(() => {
    if (!nav) return;
    nav.register(btnRef, () => !!props.selected);
    onCleanup(() => nav.unregister(btnRef));
  });

  return (
    <>
      <button
        ref={btnRef}
        type="button"
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
        <Show when={props.selected && !nav}>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
        </Show>
        <Show when={!props.selected && props.unread}>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-1 bg-highlight rounded-r-full group-hover:hidden" />
        </Show>
        <Show when={!props.selected}>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-highlight rounded-r-full hidden group-hover:block" />
        </Show>
        <div class="relative shrink-0">
          <img
            src={props.channel?.profileImageUrl || DEFAULT_AVATAR}
            alt={props.channel?.displayName}
            class={`w-8 h-8 rounded-lg transition-opacity ${
              props.status || props.selected
                ? "opacity-100"
                : "opacity-50 group-hover:opacity-100"
            }`}
          />
          <Show when={(props.mentions ?? 0) > 0}>
            <div class="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-danger rounded-full border-2 border-bg flex items-center justify-center">
              <span class="text-[10px] font-bold text-text leading-none tabular-nums">
                {props.mentions! > 99 ? "99+" : props.mentions}
              </span>
            </div>
          </Show>
          {props.bottomRight}
        </div>
      </button>
      <Show when={tooltip()}>
        {(t) => (
          <StreamTooltip
            x={t().x}
            y={t().y}
            user={props.channel}
            stream={props.status === "live" ? streamForUserId(props.channel.id) : undefined}
          />
        )}
      </Show>
    </>
  );
}
