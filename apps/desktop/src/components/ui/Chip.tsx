import { X } from "lucide-solid";

type Props = {
  label: string;
  title?: string;
  selected?: boolean;
  onRemove?: () => void;
};

export default function Chip(props: Props) {
  const tone = () =>
    props.selected
      ? "bg-accent-soft text-accent-ink"
      : "bg-raised text-ink-soft";
  const base = () =>
    `inline-flex items-center gap-1 h-control-sm px-3 rounded-full text-small font-semibold ${tone()}`;

  if (!props.onRemove) {
    return <span class={base()} title={props.title}>{props.label}</span>;
  }
  return (
    <button
      type="button"
      onClick={props.onRemove}
      title="Remove"
      class={`${base()} pr-2 cursor-pointer hover:text-ink hover:bg-overlay transition-colors duration-snap`}
    >
      {props.label}
      <X class="size-3.5" />
    </button>
  );
}
