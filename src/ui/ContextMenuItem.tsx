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
      class={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[#2d2d35] cursor-pointer transition-colors ${props.danger ? "text-red-400 hover:text-red-300" : "text-[#efeff1]"}`}
      onClick={props.onClick}
    >
      <span>{props.label}</span>
      {props.icon}
    </button>
  );
}
