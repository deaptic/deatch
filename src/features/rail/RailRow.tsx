import { type JSX, Show } from "solid-js";
import Badge from "../../kit/Badge.tsx";
import RowIndicator from "../../kit/RowIndicator.tsx";
import { createSideTip } from "../../kit/createSideTip.tsx";
import TipLabel from "../../kit/TipLabel.tsx";
import { appearanceRailExpanded } from "../preferences/index.ts";
import { RAIL_ROW_HEIGHT } from "../../kit/density.ts";
import { onMiddleClick } from "../../kit/middleClick.ts";
import { openMenuAt } from "../../kit/contextMenu.ts";

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
  card?: () => JSX.Element;
  selected?: boolean;
  unread?: boolean;
  mentions?: number;
  dimmed?: boolean;
  ref?: (el: HTMLButtonElement) => void;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
  children: JSX.Element;
};

export default function RailRow(props: Props) {
  const expanded = appearanceRailExpanded;
  const tip = createSideTip(
    () => props.card?.() ?? props.tooltip ?? <TipLabel>{props.label}</TipLabel>,
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
        class={`group relative w-full ${RAIL_ROW_HEIGHT} flex items-center px-2 text-left cursor-pointer ${
          props.dimmed ? "opacity-40" : ""
        }`}
      >
        <RowIndicator
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
