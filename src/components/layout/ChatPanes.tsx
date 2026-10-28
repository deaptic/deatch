import { MessagesSquare } from "lucide-solid";
import { Show } from "solid-js";
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
  onJumpToMessage: (
    broadcasterId: string,
    messageId: string,
    timestamp: number | null,
  ) => void;
};

export default function ChatPanes(props: ChatPanesProps) {
  return (
    <div class="flex-1 min-h-0 flex flex-col relative">
      <Show
        when={selectedChannel()}
        fallback={
          <EmptyState
            icon={<MessagesSquare />}
            title={t("LAYOUT_EMPTY_TITLE")}
            body={t("LAYOUT_EMPTY_BODY")}
            action={
              <Button variant="accent" onClick={showExplore}>
                {t("LAYOUT_EXPLORE")}
              </Button>
            }
          />
        }
        keyed
      >
        {(ch) => (
          <div class="absolute inset-0 flex flex-col">
            <ChannelHeader channel={ch} />
            <Boundary label={t("LAYOUT_CHANNEL_ERROR")}>
              <Chat
                broadcasterId={ch.id}
                broadcasterLogin={ch.login}
                broadcasterName={ch.displayName}
                userLogin={props.userLogin}
                onOpenChannel={props.onOpenChannel}
                onJumpToMessage={props.onJumpToMessage}
              />
            </Boundary>
          </div>
        )}
      </Show>
    </div>
  );
}
