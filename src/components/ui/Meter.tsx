type Tone = "neutral" | "caution";

type Props = {
  value: number;
  max: number;
  label: string;
  tone?: Tone;
};

const FILL: Record<Tone, string> = {
  neutral: "bg-ink-soft",
  caution: "bg-caution",
};

export default function Meter(props: Props) {
  const percent = () =>
    props.max > 0 ? Math.min(100, (props.value / props.max) * 100) : 0;

  return (
    <div
      role="meter"
      aria-label={props.label}
      aria-valuemin={0}
      aria-valuemax={props.max}
      aria-valuenow={props.value}
      class="h-1.5 w-full rounded-full bg-raised overflow-hidden"
    >
      <div
        style={{ "--fill": `${percent()}%` }}
        class={`h-full w-(--fill) rounded-full ${
          FILL[props.tone ?? "neutral"]
        }`}
      />
    </div>
  );
}
