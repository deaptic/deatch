import { Show } from "solid-js";
import Feed from "../feed/Feed.tsx";
import type { FeedMessage, UserRef } from "../../lib/types/index.ts";

type Props = {
  broadcasterId: string;
  messages: FeedMessage[];
  loading: boolean;
  onJumpToMessage?: (messageId: string) => void;
  onShowUserCard?: (x: number, y: number, identity: Partial<UserRef>) => void;
};

export default function UserCardFeed(props: Props) {
  // Out of flow so the card's min-content height sees only --feed-min-h.
  return (
    <div class="relative flex-1 min-h-(--feed-min-h) text-(length:--chat-size)">
      <div class="absolute inset-0 flex flex-col">
        <Show
          when={props.messages.length > 0}
          fallback={
            <div class="flex-1 min-h-0 flex items-center justify-center text-ink-soft p-(--card-pad) text-center">
              {props.loading
                ? "Loading their messages…"
                : "Nothing from them in this channel yet."}
            </div>
          }
        >
          <Feed
            broadcasterId={props.broadcasterId}
            entries={props.messages}
            showName={false}
            showBadges={false}
            showToolbar={false}
            highlightMentions={false}
            showDivider={false}
            onJumpToMessage={props.onJumpToMessage}
            onShowUserCard={props.onShowUserCard}
            scrollClass="px-2 py-1 feed-meta"
          />
        </Show>
      </div>
    </div>
  );
}
