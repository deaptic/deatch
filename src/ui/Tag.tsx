export default function Tag(props: { label: string }) {
  return (
    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-bg-light text-text-muted border border-border">
      {props.label}
    </span>
  );
}
