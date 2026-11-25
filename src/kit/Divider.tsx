type DividerVariant = "accent" | "tag";

const VARIANTS: Record<
  DividerVariant,
  { box: string; rule: string; label: string }
> = {
  accent: {
    box: "my-1.5",
    rule: "border-dotted border-accent",
    label: "text-xs text-accent-ink px-2",
  },
  tag: {
    box: "my-2",
    rule: "border-line-soft",
    label:
      "h-6 px-3 inline-flex items-center rounded-sm border border-line-soft text-sm font-semibold text-ink-soft",
  },
};

type Props =
  | { label: string; variant: DividerVariant }
  | { label?: undefined; vertical?: boolean; strong?: boolean; class?: string };

export default function Divider(props: Props) {
  if (!props.label) {
    const line = props as Extract<Props, { label?: undefined }>;
    return (
      <div
        aria-hidden
        class={`shrink-0 ${line.vertical ? "w-px h-4" : "h-px"} ${
          line.strong ? "bg-line" : "bg-line-soft"
        } ${line.class ?? ""}`}
      />
    );
  }
  const labelled = props as Extract<Props, { label: string }>;
  const variant = () => VARIANTS[labelled.variant];
  return (
    <div
      role="separator"
      class={`flex items-center gap-3 pl-3 select-none pointer-events-none ${variant().box}`}
    >
      <div class={`flex-1 border-t ${variant().rule}`} />
      <span class={variant().label}>{labelled.label}</span>
      <div class={`flex-1 border-t ${variant().rule}`} />
    </div>
  );
}
