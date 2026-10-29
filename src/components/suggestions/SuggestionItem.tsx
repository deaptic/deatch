import type { JSX } from "solid-js";

type Props = {
  id: string;
  role: "option";
  "aria-selected": boolean;
  onHover: () => void;
  onClick: () => void;
  children: JSX.Element;
};

export default function SuggestionItem(props: Props) {
  return (
    <button
      type="button"
      id={props.id}
      role={props.role}
      aria-selected={props["aria-selected"]}
      onMouseDown={(e) => e.preventDefault()}
      onMouseMove={props.onHover}
      onClick={props.onClick}
      class={`w-full flex items-center gap-3 min-h-control-md px-2.5 py-1.5 rounded-sm text-body text-left cursor-pointer transition-colors duration-snap ${
        props["aria-selected"] ? "bg-raised" : ""
      }`}
    >
      {props.children}
    </button>
  );
}
