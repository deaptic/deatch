import { ChevronDown, ChevronUp } from "lucide-solid";

type Props = {
  direction: "up" | "down";
  onClick: () => void;
};

export default function ScrollChevron(props: Props) {
  return (
    <button
      type="button"
      aria-label={props.direction === "up" ? "Scroll up" : "Scroll down"}
      onClick={() => props.onClick()}
      class={`absolute inset-x-0 h-5 flex items-center justify-center z-10 bg-surface text-ink-faint hover:text-ink cursor-pointer ${
        props.direction === "up" ? "top-0" : "bottom-0"
      }`}
    >
      {props.direction === "up"
        ? <ChevronUp class="size-3.5" />
        : <ChevronDown class="size-3.5" />}
    </button>
  );
}
