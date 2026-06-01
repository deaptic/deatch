import type { JSX } from "solid-js";

type Props = {
  label: string;
  icon?: JSX.Element;
  danger?: boolean;
  onClick: () => void;
};

export default function ContextMenuItem(props: Props) {
  return (
    <button
      class={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-bg cursor-pointer transition-colors ${
        props.danger ? "text-danger" : "text-text"
      }`}
      onClick={props.onClick}
      title={props.label}
    >
      <span class="truncate min-w-0">{props.label}</span>
      <span class="shrink-0 flex items-center">{props.icon}</span>
    </button>
  );
}
