type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export default function Slider(props: Props) {
  return (
    <input
      type="range"
      aria-label={props.label}
      aria-valuetext={props.format(props.value)}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
      value={props.value}
      disabled={props.disabled}
      onInput={(e) => props.onChange(Number(e.currentTarget.value))}
      class="w-full accent-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}
