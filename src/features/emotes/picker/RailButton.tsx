import type { JSX } from "solid-js";

export default function RailButton(props: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  children: JSX.Element;
}) {
  return (
    <button
      type="button"
      data-rail-id={props.id}
      aria-label={props.label}
      data-tip={props.label}
      data-tip-side="right"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => props.onClick()}
      class={`shrink-0 size-10 grid place-items-center rounded-md cursor-pointer pressable active:pressed transition-colors duration-snap [&>svg]:size-5 ${
        props.active ? "bg-raised text-ink" : "text-ink-soft hover:bg-raised"
      }`}
    >
      {props.children}
    </button>
  );
}
