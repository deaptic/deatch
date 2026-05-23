import { createEffect } from "solid-js";
import type { Mention } from "../../state/inbox";
import { userCache } from "../../state/users";
import { getUsers } from "../../commands/twitch/users";

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
  createEffect(() => {
    const id = props.mention.chatterId;
    if (id) getUsers({ ids: [id] }, { silent: true }).catch(() => {});
  });

  const avatar = () =>
    userCache()[props.mention.chatterId]?.profileImageUrl || DEFAULT_AVATAR;

  return (
    <button
      onClick={props.onClick}
      class={`w-full flex gap-3 pl-4 pr-5 py-3 cursor-pointer hover:bg-bg transition-colors text-left border-l-4 ${
        props.mention.unread
          ? "bg-primary/10 hover:bg-primary/15 border-primary"
          : "border-transparent"
      }`}
    >
      <img
        src={avatar()}
        alt={props.mention.chatterName}
        class="w-11 h-11 rounded-lg shrink-0"
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
