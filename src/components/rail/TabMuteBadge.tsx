import { Volume2, VolumeOff } from "lucide-solid";
import { Show } from "solid-js";

type Props = {
  muted: boolean;
  onToggle: () => void;
};

// A mouse shortcut on top of the row's own button; keyboard and screen
// readers reach the same toggle through the channel menu and Ctrl+M.
export default function TabMuteBadge(props: Props) {
  return (
    <span
      aria-hidden
      data-tip={props.muted ? "Unmute browser tab" : "Mute browser tab"}
      onClick={(e) => {
        e.stopPropagation();
        props.onToggle();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      class={`absolute -top-0.5 -right-0.5 size-4 rounded-full ring-2 ring-surface grid place-items-center cursor-pointer transition-colors duration-snap ${
        props.muted
          ? "bg-negative text-on-accent"
          : "bg-raised text-ink hover:bg-overlay"
      }`}
    >
      <Show when={props.muted} fallback={<Volume2 class="size-2" />}>
        <VolumeOff class="size-2" />
      </Show>
    </span>
  );
}
