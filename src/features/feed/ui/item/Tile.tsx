import type { JSX } from "solid-js";

type Props = { color?: string; round?: boolean; children: JSX.Element };

export default function Tile(props: Props) {
  return (
    <span
      aria-hidden="true"
      class={`size-(--chat-tile) shrink-0 grid place-items-center overflow-hidden select-none ${
        props.round ? "rounded-full" : "rounded-sm"
      } ${props.color ? "bg-(--tile)/16 text-(--tile)" : "bg-raised"}`}
      style={props.color ? { "--tile": props.color } : undefined}
    >
      {props.children}
    </span>
  );
}
