import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";

type Props = {
  avatar: string;
  name: string;
  game?: string;
  viewerCount?: number;
  status?: "live" | "self";
  selected?: boolean;
  unread?: number;
  dimmed?: boolean;
  square?: boolean;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
};

function formatViewers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function MenuSectionItem(props: Props) {
  const [tip, setTip] = createSignal<{ x: number; y: number } | null>(null);

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
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTip({ x: r.right + 8, y: r.top + r.height / 2 });
        }}
        onMouseLeave={() => setTip(null)}
        onContextMenu={(e) => {
          if (!props.onContextMenu) return;
          e.preventDefault();
          setTip(null);
          props.onContextMenu(e.clientX, e.clientY);
        }}
        style={{ opacity: props.dimmed ? 0.4 : 1 }}
        class={`relative w-full flex items-center justify-center transition-colors cursor-pointer ${
          props.square ? "px-2 py-3" : "p-2"
        } ${props.selected ? "" : "hover:bg-bg-light"}`}
      >
        <Show when={props.selected}>
          <div class="absolute left-0 top-1 bottom-1 w-1 bg-highlight rounded-r" />
        </Show>
        <div class="relative shrink-0">
          <img
            src={props.avatar || "https://static-cdn.jtvnw.net/user-default-pictures-uec5k4/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png"}
            alt={props.name}
            class="w-8 h-8 rounded-lg"
          />
          <Show when={props.status === "live"}>
            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-danger rounded-full border-2 border-bg" />
          </Show>
          <Show when={props.status === "self"}>
            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-bg" />
          </Show>
          <Show when={(props.unread ?? 0) > 0}>
            <div class="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-primary rounded-full border-2 border-bg flex items-center justify-center">
              <span class="text-[9px] font-bold text-text leading-none tabular-nums">
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
              class="bg-bg-dark border border-border rounded-lg px-3 py-2 shadow-xl pointer-events-none z-50 min-w-[160px] max-w-[260px]"
            >
              <p class="text-text text-sm font-semibold truncate">{props.name}</p>
              <Show when={props.game}>
                <p class="text-text-muted text-xs truncate mt-0.5">{props.game}</p>
              </Show>
              <Show when={props.viewerCount !== undefined}>
                <div class="flex items-center gap-1.5 mt-1">
                  <div class="w-1.5 h-1.5 rounded-full bg-danger" />
                  <span class="text-danger text-xs font-medium">{formatViewers(props.viewerCount!)} viewers</span>
                </div>
              </Show>
            </div>
          </Portal>
        )}
      </Show>
    </>
  );
}
