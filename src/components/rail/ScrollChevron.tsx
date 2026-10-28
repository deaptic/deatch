import { ChevronDown, ChevronUp } from "lucide-solid";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  direction: "up" | "down";
  onClick: () => void;
};

export default function ScrollChevron(props: Props) {
  return (
    <button
      type="button"
      aria-label={t(
        props.direction === "up" ? "RAIL_SCROLL_UP" : "RAIL_SCROLL_DOWN",
      )}
      onClick={() => props.onClick()}
      class={`absolute inset-x-0 h-5 flex items-center justify-center z-10 bg-surface text-ink-faint hover:text-ink cursor-pointer ${
        props.direction === "up" ? "top-0" : "bottom-0"
      }`}
    >
      {props.direction === "up" ? (
        <ChevronUp class="size-4" />
      ) : (
        <ChevronDown class="size-4" />
      )}
    </button>
  );
}
