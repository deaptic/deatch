type Props = {
  label: string;
  onRemove?: () => void;
};

export default function Chip(props: Props) {
  const base =
    "inline-flex items-center bg-primary/15 border border-primary/40 rounded-md px-2.5 py-1 text-sm font-medium text-text";
  if (!props.onRemove) {
    return <span class={base}>{props.label}</span>;
  }
  return (
    <button
      onClick={props.onRemove}
      title="Remove"
      class={`${base} cursor-pointer hover:bg-primary/30 hover:border-primary/70 transition-colors`}
    >
      {props.label}
    </button>
  );
}
