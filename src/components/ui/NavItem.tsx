import { type JSX, Show } from "solid-js";

type Props = {
  label: string;
  icon?: JSX.Element;
  active: boolean;
  orientation?: "vertical" | "horizontal";
  onClick?: () => void;
};

export default function NavItem(props: Props) {
  const horizontal = () => props.orientation === "horizontal";
  return (
    <button
      type="button"
      aria-current={props.active ? "page" : undefined}
      title={props.label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => props.onClick?.()}
      class={`relative flex items-center gap-2.5 text-body font-semibold cursor-pointer transition-colors duration-snap ${
        horizontal()
          ? `h-control-lg px-3 shrink-0 whitespace-nowrap ${
            props.active ? "text-accent-ink" : "text-ink-soft hover:text-ink"
          }`
          : `h-control-md px-3 rounded-sm text-left ${
            props.active
              ? "bg-accent-soft text-accent-ink"
              : "text-ink-soft hover:bg-raised hover:text-ink"
          }`
      }`}
    >
      <Show when={props.icon}>
        <span class="shrink-0 [&>svg]:size-4">{props.icon}</span>
      </Show>
      <span class="min-w-0 truncate">{props.label}</span>
      <Show when={horizontal() && props.active}>
        <span class="absolute left-3 right-3 bottom-0 h-0.75 rounded-full bg-accent" />
      </Show>
    </button>
  );
}
