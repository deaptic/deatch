type Tone = "negative" | "accent";
import { Show } from "solid-js";

const TONES: Record<Tone, string> = {
  negative: "bg-negative",
  accent: "bg-accent",
};

type Props = {
  count: number;
  tone?: Tone;
  floating?: boolean;
};

export default function Badge(props: Props) {
  const label = () => (props.count > 99 ? "99+" : String(props.count));
  return (
    <Show when={label()} keyed>
      {(text) => (
        <span
          class={`animate-bump inline-flex items-center justify-center px-1 rounded-full ${TONES[props.tone ?? "negative"]} text-on-accent text-xs font-bold tabular-nums leading-none ${
            props.floating
              ? "min-w-5 h-5 ring-2 ring-surface"
              : "min-w-4.5 h-4.5"
          }`}
        >
          {text}
        </span>
      )}
    </Show>
  );
}
