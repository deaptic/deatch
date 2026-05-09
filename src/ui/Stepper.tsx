import MinusIcon from "../icons/MinusIcon";
import PlusIcon from "../icons/PlusIcon";

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
      ? "w-8 h-8 flex items-center justify-center text-[#adadb8] hover:text-white transition-colors cursor-pointer rounded hover:bg-[#2d2d35]"
      : "w-6 h-6 flex items-center justify-center text-[#5c5c7a] hover:text-white transition-colors cursor-pointer rounded hover:bg-[#2d2d35]";
  const iconClass = () => (size() === "md" ? "w-4 h-4" : "w-3.5 h-3.5");
  const labelClass = () =>
    size() === "md"
      ? "text-[#efeff1] text-sm tabular-nums w-8 text-center select-none"
      : "text-[#efeff1] text-xs tabular-nums w-6 text-center select-none";
  const gap = () => (size() === "md" ? "gap-2" : "gap-1");

  return (
    <div class={`flex items-center ${gap()}`}>
      <button onClick={props.onDecrement} class={btnClass()} aria-label="Decrease">
        <MinusIcon class={iconClass()} />
      </button>
      <span class={labelClass()}>{props.label}</span>
      <button onClick={props.onIncrement} class={btnClass()} aria-label="Increase">
        <PlusIcon class={iconClass()} />
      </button>
    </div>
  );
}
