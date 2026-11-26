import type { JSX } from "solid-js";

type Corner = "start" | "end";
type Tone = "positive" | "negative" | "accent";

const CORNERS: Record<Corner, string> = {
  start: "-left-1",
  end: "-right-1",
};

const TONES: Record<Tone, string> = {
  positive: "text-positive",
  negative: "text-negative",
  accent: "text-accent-ink",
};

type Props = {
  corner: Corner;
  tone: Tone;
  tip: string;
  onClick?: () => void;
  children: JSX.Element;
};

export default function AvatarBadge(props: Props) {
  const press = (event: MouseEvent, run?: () => void) => {
    if (!props.onClick) return;
    event.stopPropagation();
    run?.();
  };
  return (
    <span
      aria-hidden
      data-tip={props.tip}
      onClick={(e) => press(e, props.onClick)}
      onMouseDown={(e) => press(e)}
      class={`absolute -bottom-1 ${CORNERS[props.corner]} size-5 rounded-full ring-2 ring-surface bg-surface grid place-items-center ${TONES[props.tone]} ${
        props.onClick
          ? "cursor-pointer transition-colors duration-snap hover:bg-raised"
          : ""
      }`}
    >
      {props.children}
    </span>
  );
}
