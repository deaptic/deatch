import type { JSX } from "solid-js";

export type TileTone = "accent" | "positive" | "caution";
type Size = "md" | "lg";

const TONES: Record<TileTone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  positive: "bg-positive/15 text-positive",
  caution: "bg-caution/15 text-caution",
};

const SIZES: Record<Size, string> = {
  md: "size-9 rounded-md [&>svg]:size-4.5",
  lg: "size-10 rounded-xs [&>svg]:size-5",
};

type Props = {
  active?: TileTone | false;
  size?: Size;
  children: JSX.Element;
};

export default function IconTile(props: Props) {
  return (
    <span
      class={`grid shrink-0 place-items-center transition-colors duration-snap ${
        SIZES[props.size ?? "lg"]
      } ${
        props.active
          ? TONES[props.active]
          : "bg-raised text-ink-soft group-hover:bg-overlay group-hover:text-ink"
      }`}
    >
      {props.children}
    </span>
  );
}
