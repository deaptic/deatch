import { type JSX, Show } from "solid-js";

type Tone = "negative" | "faint";

const TONES: Record<Tone, string> = {
  negative: "text-negative",
  faint: "text-ink-faint",
};

type Props = {
  tone: Tone;
  pulse: boolean;
  children: JSX.Element;
};

export default function PulseIcon(props: Props) {
  return (
    <span class={`relative grid place-items-center ${TONES[props.tone]}`}>
      <Show when={props.pulse}>
        <span
          aria-hidden
          class="absolute size-2 rounded-full bg-current animate-breathe"
        />
      </Show>
      <span class="relative grid">{props.children}</span>
    </span>
  );
}
