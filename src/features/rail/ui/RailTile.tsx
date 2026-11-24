import type { JSX } from "solid-js";

export type TileTone = "accent" | "positive" | "caution";

const TONES: Record<TileTone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  positive: "bg-positive/15 text-positive",
  caution: "bg-caution/15 text-caution",
};

type Props = {
  active?: TileTone | false;
  children: JSX.Element;
};

export default function RailTile(props: Props) {
  return (
    <span
      class={`grid place-items-center size-10 rounded-xs transition-colors duration-snap [&>svg]:size-5 ${
        props.active
          ? TONES[props.active]
          : "bg-raised text-ink-soft group-hover:bg-overlay group-hover:text-ink"
      }`}
    >
      {props.children}
    </span>
  );
}
