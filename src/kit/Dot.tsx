import { Show } from "solid-js";

type Tone = "accent" | "negative" | "current";
type Size = "sm" | "md";

const TONES: Record<Tone, string> = {
  accent: "bg-accent",
  negative: "bg-negative",
  current: "bg-current",
};

const SIZES: Record<Size, string> = {
  sm: "size-1.5",
  md: "size-2",
};

type Props = {
  tone: Tone;
  size?: Size;
  pulse?: boolean;
};

export default function Dot(props: Props) {
  return (
    <span
      class={`relative inline-block shrink-0 rounded-full ${
        SIZES[props.size ?? "sm"]
      } ${TONES[props.tone]}`}
    >
      <Show when={props.pulse}>
        <span
          aria-hidden
          class={`absolute inset-0 rounded-full animate-breathe ${TONES[props.tone]}`}
        />
      </Show>
    </span>
  );
}
