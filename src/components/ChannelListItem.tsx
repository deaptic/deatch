import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";

type Props = {
  avatar: string;
  channel: string;
  game: string;
  viewerCount?: number;
  isLive?: boolean;
  isSelected?: boolean;
  unread?: number;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
};

function formatViewers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ChannelListItem(props: Props) {
  const [tip, setTip] = createSignal<{ x: number; y: number } | null>(null);

  function onEnter(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTip({ x: rect.right + 8, y: rect.top + rect.height / 2 });
  }
  function onLeave() {
    setTip(null);
  }

  return (
    <>
      <button
        onClick={props.onClick}
        onAuxClick={(e) => {
          if (e.button !== 1 || !props.onMiddleClick) return;
          e.preventDefault();
          setTip(null);
          props.onMiddleClick();
        }}
        onMouseDown={(e) => {
          if (e.button === 1) e.preventDefault();
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onContextMenu={(e) => {
          if (!props.onContextMenu) return;
          e.preventDefault();
          setTip(null);
          props.onContextMenu(e.clientX, e.clientY);
        }}
        class={`w-full flex items-center justify-center p-2 transition-colors cursor-pointer ${
          props.isSelected ? "bg-[#3d3d4a]" : "hover:bg-[#2d2d35]"
        }`}
      >
        <div class="relative shrink-0">
          <img
            src={props.avatar || "https://static-cdn.jtvnw.net/user-default-pictures-uec5k4/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png"}
            alt={props.channel}
            class="w-8 h-8 rounded-lg"
          />
          <Show when={props.isLive}>
            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1f1f23]" />
          </Show>
          <Show when={(props.unread ?? 0) > 0}>
            <div class="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#9146ff] rounded-full border-2 border-[#1f1f23] flex items-center justify-center">
              <span class="text-[9px] font-bold text-white leading-none tabular-nums">
                {props.unread! > 99 ? "99+" : props.unread}
              </span>
            </div>
          </Show>
        </div>
      </button>
      <Show when={tip()}>
        {(t) => (
          <Portal>
            <div
              style={{ position: "fixed", left: `${t().x}px`, top: `${t().y}px`, transform: "translateY(-50%)" }}
              class="bg-[#0e0e10] border border-[#3d3d4a] rounded-lg px-3 py-2 shadow-xl pointer-events-none z-50 min-w-[160px] max-w-[260px]"
            >
              <p class="text-white text-sm font-semibold truncate">{props.channel}</p>
              <Show when={props.game}>
                <p class="text-[#adadb8] text-xs truncate mt-0.5">{props.game}</p>
              </Show>
              <Show when={props.viewerCount !== undefined}>
                <div class="flex items-center gap-1.5 mt-1">
                  <div class="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span class="text-[#ff4040] text-xs font-medium">{formatViewers(props.viewerCount!)} viewers</span>
                </div>
              </Show>
            </div>
          </Portal>
        )}
      </Show>
    </>
  );
}
