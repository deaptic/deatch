import { Show } from "solid-js";
import { selectedChannel } from "../../lib/stores/view.ts";
import Chat from "../chat/Chat.tsx";
import EmptyState from "./EmptyState.tsx";
import Boundary from "../ui/Boundary.tsx";

type ChatPanesProps = {
  userLogin: string;
  onJumpToMessage: (channelId: string, messageId: string) => void;
};

export default function ChatPanes(props: ChatPanesProps) {
  return (
    <main class="flex-1 overflow-hidden flex flex-col relative">
      <Show when={selectedChannel()} fallback={<EmptyState />} keyed>
        {(ch) => (
          <div class="absolute inset-0 flex flex-col">
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
    </main>
  );
}
