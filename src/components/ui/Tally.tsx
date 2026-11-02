export type TallyMark = "selected" | "unread" | "none";

const MARKS: Record<TallyMark, string> = {
  selected: "h-full bg-accent",
  unread: "h-2 bg-ink-soft",
  none: "h-0",
};

export default function Tally(props: { mark: TallyMark }) {
  return (
    <span
      aria-hidden
      class={`absolute left-0 top-1/2 -translate-y-1/2 w-0.75 rounded-r-xs transition-all duration-quick ease-out ${
        MARKS[props.mark]
      }`}
    />
  );
}
