import { createSignal, type JSX, Show } from "solid-js";
import Tooltip from "./Tooltip.tsx";

type Props = {
  label: string;
  icon?: JSX.Element;
  active: boolean;
  orientation?: "vertical" | "horizontal";
  // Icon-only square; the label moves into a tooltip on hover.
  collapsed?: boolean;
  onClick?: () => void;
};

export default function NavItem(props: Props) {
  const horizontal = () => props.orientation === "horizontal";
  const [tip, setTip] = createSignal<{ x: number; y: number } | null>(null);

  const shape = () => {
    if (horizontal()) {
      return `h-control-lg px-3 shrink-0 whitespace-nowrap ${
        props.active ? "text-accent-ink" : "text-ink-soft hover:text-ink"
      }`;
    }
    const tone = props.active
      ? "bg-accent-soft text-accent-ink"
      : "text-ink-soft hover:bg-raised hover:text-ink";
    return props.collapsed
      ? `size-10 justify-center rounded-sm ${tone}`
      : `h-10 px-2.5 rounded-sm text-left ${tone}`;
  };

  return (
    <>
      <button
        type="button"
        aria-current={props.active ? "page" : undefined}
        aria-label={props.collapsed ? props.label : undefined}
        title={props.collapsed ? undefined : props.label}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => props.onClick?.()}
        onMouseEnter={(e) => {
          if (!props.collapsed) return;
          const r = e.currentTarget.getBoundingClientRect();
          setTip({ x: r.right + 8, y: r.top + r.height / 2 });
        }}
        onMouseLeave={() => setTip(null)}
        class={`relative flex items-center gap-2.5 text-body font-semibold cursor-pointer transition-colors duration-snap ${shape()}`}
      >
        <Show when={props.icon}>
          <span
            class={`shrink-0 ${
              horizontal() ? "[&>svg]:size-4" : "[&>svg]:size-5"
            }`}
          >
            {props.icon}
          </span>
        </Show>
        <Show when={!props.collapsed}>
          <span class="min-w-0 truncate">{props.label}</span>
        </Show>
        <Show when={horizontal() && props.active}>
          <span class="absolute left-3 right-3 bottom-0 h-0.75 rounded-full bg-accent" />
        </Show>
      </button>
      <Show when={tip()}>
        {(t) => (
          <Tooltip x={t().x} y={t().y}>
            <p class="font-semibold whitespace-nowrap">{props.label}</p>
          </Tooltip>
        )}
      </Show>
    </>
  );
}
