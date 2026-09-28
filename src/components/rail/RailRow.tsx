import { createSignal, type JSX, Show } from "solid-js";
import Badge from "../ui/Badge.tsx";
import Tooltip from "../ui/Tooltip.tsx";
import { appearanceRailExpanded } from "../../lib/stores/preferences.ts";
import { POPOVER_TOGGLE } from "../../lib/primitives/dismissOnOutside.ts";

export type SubTone = "soft" | "live" | "positive" | "caution";

const SUB_TONES: Record<SubTone, string> = {
  soft: "text-ink-soft",
  live: "text-live",
  positive: "text-positive",
  caution: "text-caution",
};

type Props = {
  label: string;
  sub?: string;
  subTone?: SubTone;
  tooltip?: JSX.Element;
  selected?: boolean;
  unread?: boolean;
  mentions?: number;
  dimmed?: boolean;
  toggle?: boolean;
  ref?: (el: HTMLButtonElement) => void;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
  children: JSX.Element;
};

export default function RailRow(props: Props) {
  const expanded = appearanceRailExpanded;
  const [tip, setTip] = createSignal<{ x: number; y: number } | null>(null);
  const showDot = () => props.unread && !props.mentions;

  return (
    <>
      <button
        type="button"
        ref={props.ref}
        aria-current={props.selected ? "page" : undefined}
        {...(props.toggle ? { [POPOVER_TOGGLE]: "" } : {})}
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
        onContextMenu={(e) => {
          if (!props.onContextMenu) return;
          e.preventDefault();
          setTip(null);
          props.onContextMenu(e.clientX, e.clientY);
        }}
        onMouseEnter={(e) => {
          if (expanded()) return;
          const r = e.currentTarget.getBoundingClientRect();
          setTip({ x: r.right + 8, y: r.top + r.height / 2 });
        }}
        onMouseLeave={() => setTip(null)}
        class={`group relative w-full h-14 flex px-2 text-left cursor-pointer ${
          props.dimmed ? "opacity-40" : ""
        }`}
      >
        <span
          aria-hidden
          class={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-quick ease-out ${
            props.selected
              ? "h-full bg-ink"
              : props.unread
              ? "h-2 bg-ink-soft"
              : "h-0"
          }`}
        />
        <span class="flex-1 min-w-0 flex items-center gap-3 px-2 rounded-sm overflow-hidden transition-colors duration-snap group-hover:bg-raised">
          <span class="relative shrink-0 flex">
            {props.children}
            <Show when={(props.mentions ?? 0) > 0 && !expanded()}>
              <span class="absolute -top-1 -right-1.5 z-10">
                <Badge count={props.mentions!} floating />
              </span>
            </Show>
          </span>
          <span
            aria-hidden={!expanded()}
            class={`flex-1 min-w-0 flex items-center gap-3 transition-opacity duration-settle ${
              expanded() ? "opacity-100" : "opacity-0"
            }`}
          >
            <span class="flex-1 min-w-0 flex flex-col">
              <span class="flex items-center gap-1.5 text-body font-semibold text-ink truncate">
                <span class="truncate">{props.label}</span>
                <Show when={showDot()}>
                  <span class="size-1.5 rounded-full bg-ink shrink-0" />
                </Show>
              </span>
              <Show when={props.sub}>
                <span
                  class={`text-small truncate ${
                    SUB_TONES[props.subTone ?? "soft"]
                  }`}
                >
                  {props.sub}
                </span>
              </Show>
            </span>
            <Show when={expanded() && (props.mentions ?? 0) > 0}>
              <Badge count={props.mentions!} />
            </Show>
          </span>
        </span>
      </button>
      <Show when={tip() && props.tooltip}>
        <Tooltip x={tip()!.x} y={tip()!.y}>{props.tooltip}</Tooltip>
      </Show>
    </>
  );
}
