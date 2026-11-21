type Tone = "alert" | "accent";
import { Show } from "solid-js";

const TONES: Record<Tone, string> = {
  alert: "bg-negative",
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
          class={`animate-bump inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full ${TONES[props.tone ?? "alert"]} text-on-accent text-micro font-bold tabular-nums leading-none ${
            props.floating ? "ring-2 ring-surface" : ""
          }`}
        >
          {text}
        </span>
      )}
    </Show>
  );
}
