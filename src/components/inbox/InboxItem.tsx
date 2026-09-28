import type { Mention } from "../../lib/stores/inbox.ts";
import { resolveUser } from "../../lib/stores/channels.ts";
import Avatar from "../ui/Avatar.tsx";

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
  const channel = () =>
    resolveUser({
      id: props.mention.channelId,
      login: props.mention.channelLogin,
      displayName: props.mention.channelName,
    });

  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`w-full flex gap-3 items-start px-3 py-2.5 rounded-sm text-left cursor-pointer transition-colors duration-snap hover:bg-raised ${
        props.mention.unread ? "bg-accent-soft" : ""
      }`}
    >
      <Avatar
        src={channel().profileImageUrl}
        alt={props.mention.channelName}
        size={32}
      />
      <span class="flex-1 min-w-0 flex flex-col gap-0.5">
        <span class="flex items-baseline gap-1.5 text-small">
          <span
            class="font-semibold text-(--name) truncate"
            style={{
              "--name": props.mention.chatterColor || "var(--color-ink)",
            }}
          >
            {props.mention.chatterName}
          </span>
          <span class="text-ink-faint truncate">
            in {props.mention.channelName}
          </span>
          <span class="ml-auto shrink-0 text-ink-faint tabular-nums">
            {formatRelative(props.mention.timestamp)}
          </span>
        </span>
        <span class="text-body text-ink wrap-break-word line-clamp-2">
          {props.mention.message}
        </span>
      </span>
    </button>
  );
}
