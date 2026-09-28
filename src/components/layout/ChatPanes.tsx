import { MessagesSquare } from "lucide-solid";
import { Show } from "solid-js";
import { selectedChannel, showExplore } from "../../lib/stores/view.ts";
import Chat from "../chat/Chat.tsx";
import ChannelHeader from "../chat/ChannelHeader.tsx";
import EmptyState from "../ui/EmptyState.tsx";
import Button from "../ui/Button.tsx";
import Boundary from "../ui/Boundary.tsx";

type ChatPanesProps = {
  userLogin: string;
  onJumpToMessage: (channelId: string, messageId: string) => void;
};

export default function ChatPanes(props: ChatPanesProps) {
  return (
    <div class="flex-1 min-h-0 flex flex-col relative">
      <Show
        when={selectedChannel()}
        fallback={
          <EmptyState
            icon={<MessagesSquare />}
            title="Pick a channel"
            body="Choose one from the rail, or find something live."
            action={
              <Button variant="accent" onClick={showExplore}>
                Explore live channels
              </Button>
            }
          />
        }
        keyed
      >
        {(ch) => (
          <div class="absolute inset-0 flex flex-col">
            <ChannelHeader channel={ch} />
            <Boundary label="This channel hit an error">
              <Chat
                broadcasterId={ch.id}
                broadcasterLogin={ch.login}
                userLogin={props.userLogin}
                isActive
                onJumpToMessage={props.onJumpToMessage}
              />
            </Boundary>
          </div>
        )}
      </Show>
    </div>
  );
}
