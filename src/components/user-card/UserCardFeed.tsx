import { Show } from "solid-js";
import Feed from "../feed/Feed.tsx";
import type { FeedMessage } from "../../lib/types/index.ts";
import type { UserActions } from "../ui/userLink.ts";
import { t } from "../../lib/i18n/index.ts";

type Props = UserActions & {
  broadcasterId: string;
  messages: FeedMessage[];
  loading: boolean;
  onJumpToMessage?: (messageId: string) => void;
  onOpenChannel?: (channelId: string) => void;
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
              {t(
                props.loading
                  ? "USER_CARD_LOADING_MESSAGES"
                  : "USER_CARD_NO_MESSAGES",
              )}
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
            onUserContextMenu={props.onUserContextMenu}
            onOpenChannel={props.onOpenChannel}
            scrollClass="px-2 py-1 feed-meta"
          />
        </Show>
      </div>
    </div>
  );
}
