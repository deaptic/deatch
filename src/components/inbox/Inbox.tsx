import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { dismissOnOutside } from "../../lib/primitives/dismissOnOutside";
import InboxItem from "./InboxItem";
import { mentions, markAllMentionsRead } from "../../lib/stores/inbox";
import { captureFocusForRestore } from "../../lib/utils/focus";

type Props = {
  onClose: () => void;
  onJump: (channelId: string, messageId: string) => void;
};

export default function Inbox(props: Props) {
  captureFocusForRestore();
  let panelRef: HTMLDivElement | undefined;

  dismissOnOutside({
    ref: () => panelRef,
    onDismiss: props.onClose,
    ignoreSelector: "[data-inbox-toggle]",
  });

  return (
    <Portal>
      <div
        ref={panelRef}
        class="fixed top-12 right-2 z-40 w-96 max-w-[calc(100vw-1rem)] max-h-[min(70vh,600px)] bg-bg-dark border border-border-muted rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >
        <div class="flex items-center px-4 h-11 border-b border-border-muted shrink-0">
          <span class="text-text text-sm font-semibold flex-1">Mentions</span>
          <button
            onClick={markAllMentionsRead}
            class="text-text-muted hover:text-text text-xs cursor-pointer transition-colors"
          >
            Mark all read
          </button>
        </div>
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
      </div>
    </Portal>
  );
}
