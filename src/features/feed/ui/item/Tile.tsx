import type { JSX } from "solid-js";

type Shape = "square" | "round" | "badge";

const SHAPES: Record<Shape, string> = {
  square: "size-(--chat-tile) rounded-sm",
  round: "size-(--chat-tile) rounded-full",
  badge: "size-feed-badge rounded-xs",
};

type Props = { color?: string; shape?: Shape; children: JSX.Element };

export default function Tile(props: Props) {
  return (
    <span
      aria-hidden="true"
      class={`shrink-0 grid place-items-center overflow-hidden select-none ${
        SHAPES[props.shape ?? "square"]
      } ${props.color ? "tint-tile text-(--tile)" : "bg-raised"}`}
      style={props.color ? { "--tile": props.color } : undefined}
    >
      {props.children}
    </span>
  );
}
