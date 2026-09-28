import type { JSX } from "solid-js";

type Props = {
  label: string;
  icon?: JSX.Element;
  danger?: boolean;
  onClick: () => void;
};

export default function MenuItem(props: Props) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`w-full h-control-md flex items-center gap-2.5 px-2.5 rounded-sm text-body text-left cursor-pointer transition-colors duration-snap hover:bg-raised ${
        props.danger ? "text-negative" : "text-ink"
      }`}
    >
      <span
        class={`shrink-0 w-4 grid place-items-center [&>svg]:size-4 ${
          props.danger ? "" : "text-ink-soft"
        }`}
      >
        {props.icon}
      </span>
      <span class="truncate">{props.label}</span>
    </button>
  );
}
