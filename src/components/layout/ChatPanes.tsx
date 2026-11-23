import { MessagesSquare } from "lucide-solid";
import { Show } from "solid-js";
import type { User } from "../../lib/types/index.ts";
import { selectedChannel, showExplore } from "../../lib/stores/view.ts";
import Chat from "../chat/Chat.tsx";
import ChannelHeader from "../chat/ChannelHeader.tsx";
import EmptyState from "../ui/EmptyState.tsx";
import Button from "../ui/Button.tsx";
import Boundary from "../ui/Boundary.tsx";
import { t } from "../../lib/i18n/index.ts";

type ChatPanesProps = {
  userLogin: string;
  onOpenChannel: (broadcasterId: string) => void;
  onJumpToMessage: (broadcasterId: string, messageId: string) => void;
};

function ChannelPane(props: ChatPanesProps & { channel: User }) {
  return (
    <div class="absolute inset-0 flex flex-col">
      <ChannelHeader
        channel={props.channel}
        onOpenChannel={props.onOpenChannel}
      />
      <Boundary label={t("FEED_BOUNDARY_ERROR")}>
        <Chat
          broadcasterId={props.channel.id}
          broadcasterLogin={props.channel.login}
          broadcasterName={props.channel.displayName}
          userLogin={props.userLogin}
          onOpenChannel={props.onOpenChannel}
          onJumpToMessage={props.onJumpToMessage}
        />
      </Boundary>
    </div>
  );
}

export default function ChatPanes(props: ChatPanesProps) {
  return (
    <div class="flex-1 min-h-0 flex flex-col relative">
      <Show
        when={selectedChannel()}
        fallback={
          <EmptyState
            icon={<MessagesSquare />}
            title={t("FEED_EMPTY")}
            body={t("FEED_EMPTY_DESCRIPTION")}
            action={
              <Button variant="accent" onClick={showExplore}>
                {t("FEED_EMPTY_EXPLORE_LABEL")}
              </Button>
            }
          />
        }
        keyed
      >
        {(ch) => <ChannelPane {...props} channel={ch} />}
      </Show>
    </div>
  );
}
