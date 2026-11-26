import { type JSX, Show } from "solid-js";
import Badge from "./Badge.tsx";
import RowIndicator from "./RowIndicator.tsx";
import { createSideTip } from "./createSideTip.tsx";
import TipLabel from "./TipLabel.tsx";
import { onMiddleClick } from "./middleClick.ts";
import { openMenuAt } from "./contextMenu.ts";
import Text from "./Text.tsx";

export type SubTone = "soft" | "positive";

type Props = {
  expanded: boolean;
  label: string;
  quiet?: boolean;
  sub?: string;
  subTone?: SubTone;
  trailing?: JSX.Element;
  tooltip?: JSX.Element;
  card?: () => JSX.Element;
  selected?: boolean;
  unread?: boolean;
  count?: number;
  dimmed?: boolean;
  ref?: (el: HTMLButtonElement) => void;
  onClick?: () => void;
  onMiddleClick?: () => void;
  onContextMenu?: (x: number, y: number) => void;
  children: JSX.Element;
};

export default function SideRow(props: Props) {
  const expanded = () => props.expanded;
  const tip = createSideTip(
    () => props.card?.() ?? props.tooltip ?? <TipLabel>{props.label}</TipLabel>,
  );
  const hasCount = () => (props.count ?? 0) > 0;

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
        onMouseOver={(e) => {
          const row = e.currentTarget;
          const inner = (e.target as Element).closest("[data-tip]");
          if (inner && inner !== row && row.contains(inner)) return tip.hide();
          if (props.card || !expanded()) tip.show(row);
        }}
        onMouseLeave={tip.hide}
        class={`group relative w-full h-row flex items-center px-2 text-left cursor-pointer ${
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
            <Show when={hasCount() && !expanded()}>
              <span class="absolute -top-1 -right-1 z-10 flex">
                <Badge count={props.count ?? 0} floating />
              </span>
            </Show>
          </span>
          <span
            aria-hidden={!expanded()}
            class={`flex-1 min-w-0 flex flex-col transition-opacity duration-settle ${
              expanded() ? "opacity-100" : "opacity-0"
            }`}
          >
            <span class="flex items-center gap-2 min-w-0">
              <Text
                size="md"
                bold
                truncate
                tone={props.quiet ? "soft" : "primary"}
                class="flex-1 min-w-0"
              >
                {props.label}
              </Text>
              <Show when={expanded()}>
                <Show when={hasCount()} fallback={props.trailing}>
                  <Badge count={props.count ?? 0} />
                </Show>
              </Show>
            </span>
            <Show when={props.sub}>
              <Text size="sm" truncate tone={props.subTone ?? "soft"}>
                {props.sub}
              </Text>
            </Show>
          </span>
        </span>
      </button>
      {tip.view()}
    </>
  );
}
