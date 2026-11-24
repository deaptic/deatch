import { Volume2, VolumeOff } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";

type Props = {
  muted: boolean;
  onToggle: () => void;
};

export default function TabMuteBadge(props: Props) {
  return (
    <span
      aria-hidden
      data-tip={t(
        props.muted ? "RAIL_UNMUTE_TAB_LABEL" : "RAIL_MUTE_TAB_LABEL",
      )}
      onClick={(e) => {
        e.stopPropagation();
        props.onToggle();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      class={`absolute -top-1 -right-1 size-5 rounded-full ring-2 ring-surface grid place-items-center cursor-pointer transition-colors duration-snap ${
        props.muted
          ? "bg-surface text-negative hover:bg-raised"
          : "bg-surface text-positive hover:bg-raised"
      }`}
    >
      <Show
        when={props.muted}
        fallback={<Volume2 class="size-3.5 enter-swap" />}
      >
        <VolumeOff class="size-3.5 enter-swap" />
      </Show>
    </span>
  );
}
