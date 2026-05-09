type Props = {
  label: string;
  onRemove?: () => void;
};

export default function Chip(props: Props) {
  const base =
    "inline-flex items-center bg-[#9146ff]/15 border border-[#9146ff]/40 rounded-md px-2.5 py-1 text-sm font-medium text-white";
  if (!props.onRemove) {
    return <span class={base}>{props.label}</span>;
  }
  return (
    <button
      onClick={props.onRemove}
      title="Remove"
      class={`${base} cursor-pointer hover:bg-[#9146ff]/30 hover:border-[#9146ff]/70 transition-colors`}
    >
      {props.label}
    </button>
  );
}
