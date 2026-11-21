import { type JSX, Show } from "solid-js";
import Badge from "../ui/Badge.tsx";
import EdgeMark from "../ui/EdgeMark.tsx";
import { createSideTip } from "../ui/createSideTip.tsx";
import TipLabel from "../ui/TipLabel.tsx";
import { appearanceRailExpanded } from "../../lib/stores/preferences.ts";
import { railRowHeight } from "../ui/rowHeight.ts";
import { onMiddleClick } from "../../lib/utils/middleClick.ts";
import { openMenuAt } from "../../lib/utils/contextMenu.ts";

export type SubTone = "soft" | "positive";

const SUB_TONES: Record<SubTone, string> = {
  soft: "text-ink-soft",
  positive: "text-positive",
};

type Props = {
  label: string;
  quiet?: boolean;
  sub?: string;
  subTone?: SubTone;
  trailing?: JSX.Element;
  tooltip?: JSX.Element;
  card?: JSX.Element;
  selected?: boolean;
  unread?: boolean;
  mentions?: number;
  dimmed?: boolean;
  revealOnHover?: boolean;
  ref?: (el: HTMLButtonElement) => void;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
  children: JSX.Element;
};

export default function RailRow(props: Props) {
  const expanded = appearanceRailExpanded;
  const tip = createSideTip(
    () => props.card ?? props.tooltip ?? <TipLabel>{props.label}</TipLabel>,
  );
  const hasMentions = () => (props.mentions ?? 0) > 0;

  return (
    <>
      <button
        type="button"
        ref={props.ref}
        aria-label={expanded() ? undefined : props.label}
        aria-current={props.selected ? "page" : undefined}
        onClick={props.onClick}
        onAuxClick={onMiddleClick(() => {
          if (!props.onMiddleClick) return;
          tip.hide();
          props.onMiddleClick();
        })}
        onMouseDown={(e) => e.preventDefault()}
        onContextMenu={(e) =>
          openMenuAt(
            e,
            props.onContextMenu &&
              ((x, y) => {
                tip.hide();
                props.onContextMenu?.(x, y);
              }),
          )
        }
        onMouseEnter={(e) => {
          if (props.card || !expanded()) tip.show(e.currentTarget);
        }}
        onMouseLeave={tip.hide}
        class={`group relative w-full ${railRowHeight()} flex items-center px-2 text-left cursor-pointer ${
          props.dimmed ? "opacity-40" : ""
        } ${
          props.revealOnHover
            ? "opacity-0 transition-opacity duration-quick group-hover/rail:opacity-100 focus-visible:opacity-100"
            : ""
        }`}
      >
        <EdgeMark
          mark={props.selected ? "selected" : props.unread ? "unread" : "none"}
        />
        <span
          class={`flex-1 min-w-0 h-full flex items-center gap-3 px-2 overflow-hidden rounded-md pressable group-active:pressed ${
            expanded() ? "group-hover:bg-raised" : ""
          }`}
        >
          <span class="relative shrink-0 flex">
            {props.children}
            <Show when={hasMentions() && !expanded()}>
              <span class="absolute -top-1 -right-1.5 z-10">
                <Badge count={props.mentions ?? 0} floating />
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
              <span
                class={`text-body font-semibold truncate ${
                  props.quiet ? "text-ink-soft" : "text-ink"
                }`}
              >
                {props.label}
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
            <Show when={expanded()}>
              <Show when={hasMentions()} fallback={props.trailing}>
                <Badge count={props.mentions ?? 0} />
              </Show>
            </Show>
          </span>
        </span>
      </button>
      {tip.view()}
    </>
  );
}
