import { For, Show } from "solid-js";
import InboxItem from "./InboxItem";
import { mentions, markAllMentionsRead } from "../../lib/stores/inbox";
import Panel from "../ui/Panel";

type Props = {
  onClose: () => void;
  onJump: (channelId: string, messageId: string) => void;
};

export default function Inbox(props: Props) {
  return (
    <Panel
      title="Mentions"
      onClose={props.onClose}
      ignoreSelector="[data-inbox-toggle]"
      sizeClass="w-96 max-w-[calc(100vw-1rem)] max-h-[min(70vh,600px)]"
      headerActions={
        <button
          onClick={markAllMentionsRead}
          class="text-text-muted hover:text-text text-xs cursor-pointer transition-colors"
        >
          Mark all read
        </button>
      }
    >
      <Show
        when={mentions().length > 0}
        fallback={
          <div class="flex-1 flex items-center justify-center px-6 py-10">
            <span class="text-text-muted text-sm">No mentions yet</span>
          </div>
        }
      >
        <div class="flex-1 min-h-0 overflow-y-auto">
          <For each={mentions()}>
            {(m) => (
              <InboxItem
                mention={m}
                onClick={() => {
                  props.onJump(m.channelId, m.messageId);
                  props.onClose();
                }}
              />
            )}
          </For>
        </div>
      </Show>
    </Panel>
  );
}
