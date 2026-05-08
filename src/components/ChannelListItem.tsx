import { Show } from "solid-js";

type Props = {
  avatar: string;
  channel: string;
  game: string;
  viewerCount?: number;
  isLive?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
};

function formatViewers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ChannelListItem(props: Props) {
  return (
    <button
      onClick={props.onClick}
      class={`w-full flex items-center gap-3 px-4 py-2 transition-colors cursor-pointer ${
        props.isSelected ? "bg-[#3d3d4a]" : "hover:bg-[#2d2d35]"
      }`}
    >
      <div class="relative shrink-0">
        <img
          src={props.avatar || "https://static-cdn.jtvnw.net/user-default-pictures-uec5k4/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png"}
          alt={props.channel}
          class="w-8 h-8 rounded-lg"
        />
        <Show when={props.isLive}>
          <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1f1f23]" />
        </Show>
      </div>
      <div class="flex-1 text-left min-w-0">
        <p class="text-white text-sm font-medium truncate leading-tight">{props.channel}</p>
        <p class="text-[#adadb8] text-xs truncate leading-tight">{props.game}</p>
      </div>
      <Show when={props.viewerCount !== undefined}>
        <span class="text-[#ff4040] text-xs font-medium shrink-0 group-hover:invisible">
          {formatViewers(props.viewerCount!)}
        </span>
      </Show>
    </button>
  );
}
