type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export default function Slider(props: Props) {
  return (
    <div class="flex items-center gap-3">
      <span class="text-body font-semibold tabular-nums min-w-8 text-right">
        {props.value}
      </span>
      <input
        type="range"
        aria-label={props.label}
        min={props.min}
        max={props.max}
        value={props.value}
        onInput={(e) => props.onChange(Number(e.currentTarget.value))}
        class="w-44 accent-accent cursor-pointer"
      />
    </div>
  );
}
