import type { JSX } from "solid-js";

type Props = {
  color?: string;
  round?: boolean;
  onClick?: (x: number, y: number) => void;
  children: JSX.Element;
};

export default function FeedTile(props: Props) {
  return (
    <span
      aria-hidden="true"
      class={`size-(--chat-tile) shrink-0 grid place-items-center overflow-hidden select-none ${
        props.round ? "rounded-full" : "rounded-sm"
      } ${props.color ? "bg-(--tile)/16 text-(--tile)" : "bg-raised"} ${
        props.onClick ? "cursor-pointer" : ""
      }`}
      style={props.color ? { "--tile": props.color } : undefined}
      onClick={(e) => props.onClick?.(e.clientX, e.clientY)}
    >
      {props.children}
    </span>
  );
}
