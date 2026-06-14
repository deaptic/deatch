import { createSignal, type JSX, Show } from "solid-js";
import Tooltip from "../ui/Tooltip.tsx";

type Props = {
  tooltip: JSX.Element;
  children: JSX.Element;
  selected?: boolean;
  unread?: boolean;
  mentions?: number;
  bar?: boolean;
  dimmed?: boolean;
  ref?: (el: HTMLButtonElement) => void;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
};

export default function MenuItem(props: Props) {
  const [tooltip, setTooltip] = createSignal<{ x: number; y: number } | null>(
    null,
  );

  return (
    <>
      <button
        type="button"
        ref={props.ref}
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
        onContextMenu={(e) => {
          if (!props.onContextMenu) return;
          e.preventDefault();
          setTooltip(null);
          props.onContextMenu(e.clientX, e.clientY);
        }}
        style={{ opacity: props.dimmed ? 0.4 : 1 }}
        class="relative w-full h-12 flex items-center justify-center"
      >
        <Show when={props.selected}>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-primary rounded-r-full" />
        </Show>
        <span
          class="peer relative shrink-0 cursor-pointer"
          onMouseEnter={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setTooltip({ x: r.right + 8, y: r.top + r.height / 2 });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          {props.children}
          <Show when={(props.mentions ?? 0) > 0}>
            <div class="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-danger rounded-full border-2 border-bg flex items-center justify-center">
              <span class="text-[10px] font-bold text-text leading-none tabular-nums">
                {props.mentions! > 99 ? "99+" : props.mentions}
              </span>
            </div>
          </Show>
        </span>
        <Show when={props.bar && !props.selected && props.unread}>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-1 bg-highlight rounded-r-full peer-hover:hidden" />
        </Show>
        <Show when={props.bar && !props.selected}>
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-highlight rounded-r-full hidden peer-hover:block" />
        </Show>
      </button>
      <Show when={tooltip()}>
        {(t) => (
          <Tooltip x={t().x} y={t().y}>
            {props.tooltip}
          </Tooltip>
        )}
      </Show>
    </>
  );
}
