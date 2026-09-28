import type { Mention } from "../../lib/stores/inbox.ts";

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
      type="button"
      onClick={props.onClick}
      class={`w-full flex gap-2.5 items-start pl-3 pr-2.5 py-2 rounded-sm border-l-3 text-left text-sm leading-normal cursor-pointer transition-colors duration-snap hover:bg-raised ${
        props.mention.unread
          ? "border-accent bg-accent-soft"
          : "border-transparent"
      }`}
    >
      <span class="shrink-0 text-ink-soft text-micro font-medium tabular-nums pt-0.5">
        {formatRelative(props.mention.timestamp)}
      </span>
      <span class="flex-1 min-w-0 wrap-break-word line-clamp-2 text-ink">
        <span
          class="font-semibold text-(--name)"
          style={{ "--name": props.mention.chatterColor || "var(--color-ink)" }}
        >
          {props.mention.chatterName}
        </span>
        <span class="text-ink-soft mr-1">:</span>
        <span>{props.mention.message}</span>
      </span>
    </button>
  );
}
