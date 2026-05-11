import { Show } from "solid-js";
import type { Mention } from "../../state/inbox";

const DEFAULT_AVATAR =
  "https://static-cdn.jtvnw.net/user-default-pictures-uec5k4/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png";

type Props = {
  mention: Mention;
  onClick: () => void;
};

function formatRelative(ms: number): string {
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function InboxItem(props: Props) {
  return (
    <button
      onClick={props.onClick}
      class={`relative w-full flex gap-3 px-4 py-3 cursor-pointer hover:bg-bg-light transition-colors text-left ${
        props.mention.unread ? "bg-primary/5" : ""
      }`}
    >
      <Show when={props.mention.unread}>
        <div class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      </Show>
      <img
        src={props.mention.chatterAvatar || DEFAULT_AVATAR}
        alt={props.mention.chatterName}
        class="w-9 h-9 rounded-lg shrink-0"
      />
      <div class="flex-1 min-w-0 flex flex-col gap-0.5">
        <div class="flex items-baseline gap-2">
          <span
            class="text-sm font-semibold truncate"
            style={{ color: props.mention.chatterColor || "var(--color-text)" }}
          >
            {props.mention.chatterName}
          </span>
          <span class="text-text-muted text-xs shrink-0 truncate">
            #{props.mention.channelLogin}
          </span>
          <span class="text-text-muted text-xs shrink-0 ml-auto">
            {formatRelative(props.mention.timestamp)}
          </span>
        </div>
        <p class="text-text-muted text-sm leading-snug line-clamp-2">
          {props.mention.message}
        </p>
      </div>
    </button>
  );
}
