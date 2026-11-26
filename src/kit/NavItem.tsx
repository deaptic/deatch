import { children, type JSX, Show } from "solid-js";
import RowIndicator from "./RowIndicator.tsx";

type Props = {
  label: string;
  icon?: JSX.Element;
  active: boolean;
  collapsed?: boolean;
  negative?: boolean;
  onClick?: () => void;
};

export default function NavItem(props: Props) {
  const tone = () => {
    if (props.negative) return "text-negative";
    return props.active
      ? "text-ink [&>span:first-child]:text-accent-ink"
      : "text-ink-soft group-hover:text-ink";
  };

  const iconEl = children(() => props.icon);
  const icon = (size: string) => (
    <Show when={iconEl.toArray().length}>
      <span class={`shrink-0 ${size}`}>{iconEl()}</span>
    </Show>
  );

  return (
    <>
      <button
        type="button"
        aria-current={props.active ? "page" : undefined}
        aria-label={props.collapsed ? props.label : undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => props.onClick?.()}
        data-tip={props.collapsed ? props.label : undefined}
        data-tip-side="right"
        class="group relative w-full flex px-2 text-base font-semibold cursor-pointer"
      >
        <RowIndicator mark={props.active ? "selected" : "none"} />
        <span
          class={`flex-1 min-w-0 h-control-lg px-2.5 flex items-center gap-2.5 overflow-hidden text-left rounded-md pressable group-active:pressed ${
            props.collapsed ? "" : "group-hover:bg-raised"
          } ${tone()}`}
        >
          {icon("[&>svg]:size-5")}
          <Show when={!props.collapsed}>
            <span class="min-w-0 truncate">{props.label}</span>
          </Show>
        </span>
      </button>
    </>
  );
}
