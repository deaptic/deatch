import { createMemo, Show } from "solid-js";
import { feeds } from "../../lib/stores/feeds.ts";
import type { FeedMessage } from "../../lib/types/index.ts";
import Feed from "../feed/Feed.tsx";

type Props = {
  chatterId: string;
  broadcasterId: string;
  onJumpToMessage?: (messageId: string) => void;
  onShowUserCard?: (
    x: number,
    y: number,
    identity: { userId?: string; login?: string },
  ) => void;
};

export default function UserCardFeed(props: Props) {
  const messages = createMemo<FeedMessage[]>(() => {
    const feed = feeds[props.broadcasterId];
    if (!feed) return [];
    return feed.messages.filter(
      (m): m is FeedMessage =>
        m.kind === "message" && m.chatter_user_id === props.chatterId,
    );
  });

  return (
    <Show
      when={messages().length > 0}
      fallback={
        <div class="flex-1 min-h-0 flex items-center justify-center text-text-muted text-sm p-3 text-center">
          No messages from this user in this channel yet.
        </div>
      }
    >
      <Feed
        broadcasterId={props.broadcasterId}
        filter={(item) =>
          item.kind === "message" && item.chatter_user_id === props.chatterId}
        showName={false}
        showBadges={false}
        showToolbar={false}
        showDivider={false}
        onJumpToMessage={props.onJumpToMessage}
        onShowUserCard={props.onShowUserCard}
        scrollClass="p-1 text-base"
      />
    </Show>
  );
}
