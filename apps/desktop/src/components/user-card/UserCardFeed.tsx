import { Show } from "solid-js";
import Feed from "../feed/Feed.tsx";
import type { UserRef } from "../../lib/types/index.ts";

type Props = {
  chatterId: string;
  broadcasterId: string;
  hasMessages: boolean;
  onJumpToMessage?: (messageId: string) => void;
  onShowUserCard?: (x: number, y: number, identity: Partial<UserRef>) => void;
};

export default function UserCardFeed(props: Props) {
  return (
    <Show
      when={props.hasMessages}
      fallback={
        <div class="flex-1 min-h-0 flex items-center justify-center text-ink-soft text-body p-4 text-center">
          Nothing from them in this channel yet.
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
        highlightMentions={false}
        showDivider={false}
        onJumpToMessage={props.onJumpToMessage}
        onShowUserCard={props.onShowUserCard}
        scrollClass="px-2 py-1 text-small"
      />
    </Show>
  );
}
