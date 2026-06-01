import { Minus, Plus } from "lucide-solid";

type Props = {
  label: string;
  onDecrement: () => void;
  onIncrement: () => void;
  size?: "sm" | "md";
};

export default function Stepper(props: Props) {
  const size = () => props.size ?? "sm";
  const btnClass = () =>
    size() === "md"
      ? "w-8 h-8 flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer rounded hover:bg-bg"
      : "w-6 h-6 flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer rounded hover:bg-bg";
  const iconClass = () => (size() === "md" ? "w-4 h-4" : "w-3.5 h-3.5");
  const labelClass = () =>
    size() === "md"
      ? "text-text text-sm tabular-nums w-8 text-center select-none"
      : "text-text text-xs tabular-nums w-6 text-center select-none";
  const gap = () => (size() === "md" ? "gap-2" : "gap-1");

  return (
    <div class={`flex items-center ${gap()}`}>
      <button
        onClick={props.onDecrement}
        class={btnClass()}
        aria-label="Decrease"
      >
        <Minus class={iconClass()} />
      </button>
      <span class={labelClass()}>{props.label}</span>
      <button
        onClick={props.onIncrement}
        class={btnClass()}
        aria-label="Increase"
      >
        <Plus class={iconClass()} />
      </button>
    </div>
  );
}
