type Shape = "block" | "line" | "circle" | "card";

type Props = {
  shape?: Shape;
  class?: string;
};

const SHAPES: Record<Shape, string> = {
  block: "rounded-sm",
  line: "rounded-full",
  circle: "rounded-full",
  card: "rounded-lg",
};

export default function Skeleton(props: Props) {
  return (
    <div
      aria-hidden
      class={`bg-raised animate-pulse ${SHAPES[props.shape ?? "block"]} ${
        props.class ?? ""
      }`}
    />
  );
}
