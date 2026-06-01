import { For, Show } from "solid-js";
import type { User } from "../../lib/types/twitch/user";
import { selectedChannel } from "../../lib/stores/channels";
import Chat from "../chat/Chat";
import EmptyState from "./EmptyState";

interface ChatPanesProps {
  channels: User[];
  userLogin: string;
  onJumpToMessage: (channelId: string, messageId: string) => void;
}

export default function ChatPanes(props: ChatPanesProps) {
  return (
    <main class="flex-1 overflow-hidden flex flex-col relative">
      <Show when={!selectedChannel()}>
        <EmptyState />
      </Show>
      <For each={props.channels}>
        {(ch) => {
          const isActive = () => selectedChannel()?.id === ch.id;
          return (
            <div
              class="absolute inset-0 flex flex-col"
              classList={{
                invisible: !isActive(),
                "pointer-events-none": !isActive(),
              }}
            >
              <Chat
                broadcasterId={ch.id}
                broadcasterLogin={ch.login}
                userLogin={props.userLogin}
                isActive={isActive()}
                onJumpToMessage={props.onJumpToMessage}
              />
            </div>
          );
        }}
      </For>
    </main>
  );
}
