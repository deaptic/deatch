import { type JSX, Show } from "solid-js";
import { createSideTip } from "./createSideTip.tsx";
import TipLabel from "./TipLabel.tsx";
import EdgeMark from "./EdgeMark.tsx";

type Props = {
  label: string;
  icon?: JSX.Element;
  active: boolean;
  orientation?: "vertical" | "horizontal";
  collapsed?: boolean;
  onClick?: () => void;
};

export default function NavItem(props: Props) {
  const tip = createSideTip(() => <TipLabel>{props.label}</TipLabel>);
  const tone = () =>
    props.active
      ? "text-ink [&>span:first-child]:text-accent-ink"
      : "text-ink-soft group-hover:text-ink";

  const icon = (size: string) => (
    <Show when={props.icon}>
      <span class={`shrink-0 ${size}`}>{props.icon}</span>
    </Show>
  );

  if (props.orientation === "horizontal") {
    return (
      <button
        type="button"
        aria-current={props.active ? "page" : undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => props.onClick?.()}
        class={`relative h-control-lg px-3 shrink-0 whitespace-nowrap flex items-center gap-2.5 text-body font-semibold cursor-pointer transition-colors duration-snap ${
          props.active ? "text-accent-ink" : "text-ink-soft hover:text-ink"
        }`}
      >
        {icon("[&>svg]:size-4")}
        <span class="min-w-0 truncate">{props.label}</span>
        <Show when={props.active}>
          <span class="absolute left-3 right-3 bottom-0 h-0.75 bg-accent" />
        </Show>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-current={props.active ? "page" : undefined}
        aria-label={props.collapsed ? props.label : undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => props.onClick?.()}
        onMouseEnter={(e) => {
          if (props.collapsed) tip.show(e.currentTarget);
        }}
        onMouseLeave={tip.hide}
        class="group relative w-full flex px-2 text-body font-semibold cursor-pointer"
      >
        <EdgeMark mark={props.active ? "selected" : "none"} />
        <span
          class={`flex-1 min-w-0 h-10 flex items-center gap-2.5 overflow-hidden text-left rounded-md pressable group-active:pressed ${
            props.collapsed ? "" : "group-hover:bg-raised"
          } ${props.collapsed ? "justify-center" : "px-2.5"} ${tone()}`}
        >
          {icon("[&>svg]:size-5")}
          <Show when={!props.collapsed}>
            <span class="min-w-0 truncate">{props.label}</span>
          </Show>
        </span>
      </button>
      {tip.view()}
    </>
  );
}
