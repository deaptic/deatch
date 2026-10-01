import { Volume2, VolumeOff } from "lucide-solid";
import { Show } from "solid-js";

type Props = {
  muted: boolean;
  onToggle: () => void;
};

export default function TabMuteBadge(props: Props) {
  const label = () => props.muted ? "Unmute browser tab" : "Mute browser tab";
  return (
    <button
      type="button"
      title={label()}
      aria-label={label()}
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
    </button>
  );
}
