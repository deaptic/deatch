type DividerVariant = "accent" | "pill";

const LOOKS: Record<
  DividerVariant,
  { box: string; rule: string; label: string }
> = {
  accent: {
    box: "my-1.5",
    rule: "border-dotted border-accent",
    label: "text-micro text-accent-ink px-2",
  },
  pill: {
    box: "my-2",
    rule: "border-line-soft",
    label:
      "h-6 px-3 inline-flex items-center rounded-full border border-line-soft text-small font-semibold text-ink-soft",
  },
};

/// A labelled rule across a list.
export default function Divider(props: {
  label: string;
  variant: DividerVariant;
}) {
  const look = () => LOOKS[props.variant];
  return (
    <div
      role="separator"
      class={`flex items-center gap-3 pl-3 select-none pointer-events-none ${look().box}`}
    >
      <div class={`flex-1 border-t ${look().rule}`} />
      <span class={look().label}>{props.label}</span>
      <div class={`flex-1 border-t ${look().rule}`} />
    </div>
  );
}
