type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  size?: "sm" | "md";
};

export default function Toggle(props: Props) {
  const size = () => props.size ?? "sm";
  const trackClass = () => (size() === "md" ? "w-11 h-6" : "w-8 h-4");
  const thumbSize = () => (size() === "md" ? "w-5 h-5" : "w-3 h-3");
  const thumbTranslate = () =>
    props.checked
      ? size() === "md"
        ? "translate-x-5"
        : "translate-x-4"
      : "translate-x-0";

  return (
    <button
      onClick={() => props.onChange(!props.checked)}
      class={`relative shrink-0 rounded-full transition-colors cursor-pointer ${trackClass()} ${
        props.checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        class={`absolute top-0.5 left-0.5 rounded-full bg-white transition-transform ${thumbSize()} ${thumbTranslate()}`}
      />
    </button>
  );
}
