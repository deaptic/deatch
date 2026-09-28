import { Pin } from "lucide-solid";
import { createMemo, Show } from "solid-js";
import IconButton from "../ui/IconButton.tsx";
import type { User } from "../../lib/api/twitch/users.ts";
import { feedUserNickname } from "../../lib/stores/preferences.ts";
import { feeds } from "../../lib/stores/feeds.ts";
import type { FeedMessage } from "../../lib/types/index.ts";
import BadgeBox from "../ui/BadgeBox.tsx";
import DisplayName from "../ui/DisplayName.tsx";

type Props = {
  chatterId: string;
  broadcasterId: string;
  user: User | null;
  pinned: boolean;
  onTogglePin: () => void;
};

export default function UserCardIdentity(props: Props) {
  const messages = createMemo<FeedMessage[]>(() => {
    const feed = feeds[props.broadcasterId];
    if (!feed) return [];
    return feed.messages.filter(
      (m): m is FeedMessage =>
        m.kind === "message" && m.chatter_user_id === props.chatterId,
    );
  });

  const messageColor = createMemo(() => messages().find((m) => m.color)?.color);
  const channelBadges = () => feeds[props.broadcasterId]?.badges ?? {};
  const latestBadges = createMemo(() => {
    const ms = messages();
    return ms[ms.length - 1]?.badges ?? [];
  });

  return (
    <div class="flex items-center gap-1 min-w-0">
      <div class="flex items-center gap-1.5 flex-1 min-w-0 text-title">
        <Show
          when={props.user}
          fallback={
            <span class="font-semibold text-ink truncate min-w-0">
              {props.chatterId}
            </span>
          }
        >
          <DisplayName
            login={props.user!.login}
            displayName={props.user!.displayName}
            color={messageColor()}
            userId={props.chatterId}
            truncate
          />
        </Show>
        <BadgeBox badges={latestBadges()} channelBadges={channelBadges()} />
        <Show when={props.user && feedUserNickname(props.user!.login)}>
          <span class="text-ink-faint text-small font-medium truncate min-w-0">
            ({props.user!.displayName})
          </span>
        </Show>
      </div>
      <IconButton
        label={props.pinned ? "Unpin card" : "Keep card open"}
        size="sm"
        pressed={props.pinned}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={props.onTogglePin}
      >
        <Pin class="size-4" fill={props.pinned ? "currentColor" : "none"} />
      </IconButton>
    </div>
  );
}
