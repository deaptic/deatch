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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class={iconClass()}>
          <path d="M3 10a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10z" />
        </svg>
      </button>
      <span class={labelClass()}>{props.label}</span>
      <button onClick={props.onIncrement} class={btnClass()} aria-label="Increase">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class={iconClass()}>
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      </button>
    </div>
  );
}
