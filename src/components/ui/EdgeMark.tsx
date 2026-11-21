export type EdgeMarkKind = "selected" | "unread" | "none";

const MARKS: Record<EdgeMarkKind, string> = {
  selected: "scale-y-100 bg-accent-ink",
  unread: "scale-y-20 bg-ink-soft group-hover:scale-y-50",
  none: "scale-y-20 opacity-0 bg-ink-soft group-hover:scale-y-50 group-hover:opacity-100",
};

export default function EdgeMark(props: { mark: EdgeMarkKind }) {
  return (
    <span
      aria-hidden
      class={`absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r-full transition duration-quick ease-out ${
        MARKS[props.mark]
      }`}
    />
  );
}
