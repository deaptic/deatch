import { ChevronDown, ChevronUp } from "lucide-solid";

interface Props {
  direction: "up" | "down";
  onClick: () => void;
}

export default function ScrollChevron(props: Props) {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      class={`absolute left-0 right-0 h-5 flex items-center justify-center z-10 text-text-muted hover:text-text cursor-pointer ${
        props.direction === "up"
          ? "top-0 bg-gradient-to-b from-bg-dark to-transparent"
          : "bottom-0 bg-gradient-to-t from-bg-dark to-transparent"
      }`}
    >
      {props.direction === "up" ? (
        <ChevronUp class="w-3 h-3" />
      ) : (
        <ChevronDown class="w-3 h-3" />
      )}
    </button>
  );
}
