type Props = {
  label: string;
  onDecrement: () => void;
  onIncrement: () => void;
};

export default function Stepper(props: Props) {
  return (
    <div class="flex items-center gap-1">
      <button
        onClick={props.onDecrement}
        class="w-6 h-6 flex items-center justify-center text-[#5c5c7a] hover:text-white transition-colors cursor-pointer rounded hover:bg-[#2d2d35]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="w-3.5 h-3.5"
        >
          <path d="M3 10a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10z" />
        </svg>
      </button>
      <span class="text-[#efeff1] text-xs tabular-nums w-6 text-center select-none">
        {props.label}
      </span>
      <button
        onClick={props.onIncrement}
        class="w-6 h-6 flex items-center justify-center text-[#5c5c7a] hover:text-white transition-colors cursor-pointer rounded hover:bg-[#2d2d35]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="w-3.5 h-3.5"
        >
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      </button>
    </div>
  );
}
