import { createMemo, Show } from "solid-js";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { User } from "../../lib/api/twitch/users";
import { feedUserNickname } from "../../lib/stores/preferences";
import { feeds } from "../../lib/stores/feeds";
import type { FeedMessage } from "../../lib/types";
import BadgeBox from "../ui/BadgeBox";
import DisplayName from "../ui/DisplayName";
import PinIcon from "../icons/PinIcon";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";

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
      <div class="flex items-center gap-1.5 flex-1 min-w-0 text-lg leading-tight">
        <Show
          when={props.user}
          fallback={
            <span class="font-semibold text-text truncate min-w-0">
              {props.chatterId}
            </span>
          }
        >
          <DisplayName
            login={props.user!.login}
            displayName={props.user!.displayName}
            color={messageColor()}
            userId={props.chatterId}
            class="truncate min-w-0"
          />
        </Show>
        <BadgeBox
          badges={latestBadges()}
          channelBadges={channelBadges()}
          class="shrink-0"
        />
        <Show when={props.user && feedUserNickname(props.user!.login)}>
          <span class="text-text-muted/70 text-sm font-normal truncate min-w-0">
            ({props.user!.displayName})
          </span>
        </Show>
      </div>
      <button
        class="shrink-0 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-bg rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => props.user && openUrl(`https://twitch.tv/${props.user.login}`)}
        disabled={!props.user}
        title="Open channel on Twitch"
        aria-label="Open channel on Twitch"
      >
        <ExternalLinkIcon class="w-2.5 h-2.5" />
      </button>
      <button
        class={`shrink-0 w-8 h-8 flex items-center justify-center rounded transition-colors cursor-pointer ${
          props.pinned
            ? "text-text bg-highlight"
            : "text-text-muted hover:text-text hover:bg-bg"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={props.onTogglePin}
        title={props.pinned ? "Unpin" : "Pin"}
        aria-label={props.pinned ? "Unpin" : "Pin"}
      >
        <PinIcon class="w-3 h-3" filled={props.pinned} />
      </button>
    </div>
  );
}
