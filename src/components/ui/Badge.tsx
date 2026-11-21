type Tone = "alert" | "accent";

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
  return (
    <span
      class={`enter-pop inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 rounded-full ${TONES[props.tone ?? "alert"]} text-on-accent text-micro font-bold tabular-nums leading-none ${
        props.floating ? "ring-2 ring-surface" : ""
      }`}
    >
      {props.count > 99 ? "99+" : props.count}
    </span>
  );
}
