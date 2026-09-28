import type { JSX } from "solid-js";

type Props = {
  active: boolean;
  onClick: () => void;
  children: JSX.Element;
};

export default function SuggestionItem(props: Props) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={props.active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={props.onClick}
      class={`w-full flex items-center gap-3 min-h-control-md px-2.5 py-1.5 rounded-sm text-body text-left cursor-pointer transition-colors duration-snap ${
        props.active ? "bg-raised" : "hover:bg-raised"
      }`}
    >
      {props.children}
    </button>
  );
}
