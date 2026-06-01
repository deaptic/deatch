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
      class={`absolute left-0 right-0 h-5 flex items-center justify-center z-10 text-text-muted hover:text-text cursor-pointer ${
        props.direction === "up"
          ? "top-0 bg-gradient-to-b from-bg-dark to-transparent"
          : "bottom-0 bg-gradient-to-t from-bg-dark to-transparent"
      }`}
    >
      {props.direction === "up"
        ? <ChevronUp class="size-3" />
        : <ChevronDown class="size-3" />}
    </button>
  );
}
